// @ts-check
'use strict';

const vscode = require('vscode');

const { getWebviewContent }                    = require('../ui/webview');
const { buildProject, offerRollback }          = require('../services/projectBuilder');
const { installDependencies, requiresInstall } = require('../services/dependencyInstaller');
const { validateProjectConfig }                = require('../utils/validation');
const { getFramework }                         = require('../frameworks/index');
const { logger }                               = require('../services/logger');

/**
 * Webview view provider for the "Crear Proyecto" panel. Owns the webview
 * lifecycle and routes its messages into the build/install services — the
 * webview itself (./ui/webview.js) only renders HTML and posts/receives
 * messages, it has no business logic.
 */
class FrameworkBuilderViewProvider {
  /**
   * @param {vscode.Uri} extensionUri
   * @param {vscode.ExtensionContext} context
   */
  constructor(extensionUri, context) {
    this._extensionUri = extensionUri;
    this._context = context;
    /** @type {vscode.WebviewView | null} */
    this._view = null;
  }

  /** @param {vscode.WebviewView} webviewView */
  resolveWebviewView(webviewView) {
    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = getWebviewContent();
    webviewView.webview.onDidReceiveMessage(msg => this._onMessage(msg, webviewView));
  }

  /**
   * Routes all messages from the webview.
   * @param {Record<string, any>} msg
   * @param {vscode.WebviewView} view
   */
  async _onMessage(msg, view) {
    const post = /** @param {object} p */ (p) => view.webview.postMessage(p);

    switch (msg.command) {
      case 'pickFolder': await this._handlePickFolder(post); break;
      case 'create':     await this._handleCreate(msg, post); break;
      case 'openProject':
        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(msg.path), false);
        break;
      case 'openFolder':
        vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(msg.path));
        break;
    }
  }

  /** @param {(p: object) => void} post */
  async _handlePickFolder(post) {
    try {
      const selected = await vscode.window.showOpenDialog({
        canSelectFolders: true, canSelectFiles: false, openLabel: 'Seleccionar carpeta destino',
      });
      if (selected && selected.length > 0) {
        post({ command: 'folderSelected', path: selected[0].fsPath });
      }
    } catch (err) {
      logger.error(`pickFolder failed: ${err}`);
    }
  }

  /**
   * Full project creation pipeline.
   * ┌──────────────────────────────────────────────────────────┐
   * │ 1. Validate inputs                                       │
   * │ 2. Build file structure  (fatal on failure + rollback)   │
   * │ 3. Install dependencies  (non-fatal — soft warn)         │
   * │ 4. Signal done                                           │
   * └──────────────────────────────────────────────────────────┘
   *
   * The outer try/finally guarantees the webview is ALWAYS unblocked,
   * even if something unexpected throws at any point.
   *
   * @param {Record<string, any>} msg
   * @param {(p: object) => void} post
   */
  async _handleCreate(msg, post) {
    const { projectName, frameworkId, templateId, architectureId, database, devops, targetFolder } = msg;

    // ── Guard: ensure webview is always freed at the end ─────────────────────
    let succeeded = false;
    let buildPath  = '';

    try {
      // ── 1. Validate ─────────────────────────────────────────────────────────
      const errors = validateProjectConfig({ name: projectName, frameworkId, targetFolder });
      if (errors) {
        post({ command: 'error', text: errors.join('\n') });
        return;
      }

      const framework = getFramework(frameworkId);
      if (!framework) {
        post({ command: 'error', text: `Framework "${frameworkId}" no encontrado.` });
        return;
      }

      logger.startSession(projectName, frameworkId);

      // ── 2. Create file structure ─────────────────────────────────────────────
      post({ command: 'step', id: 'structure', label: 'Creando estructura…', state: 'running' });

      const buildResult = await buildProject({
        name: projectName, frameworkId,
        templateId:     templateId || 'standard',
        architectureId: architectureId || 'standard',
        database:       database        || 'none',
        devops:         devops          || 'none',
        targetFolder,
      });

      if (!buildResult.success) {
        post({ command: 'step', id: 'structure', state: 'error' });
        post({ command: 'error', text: buildResult.error || 'Error al crear el proyecto.' });

        // Offer rollback if any files were created before the failure
        if (buildResult.filesWritten.length > 0) {
          await offerRollback(buildResult.projectPath);
        }
        return;
      }

      buildPath = buildResult.projectPath;
      post({ command: 'step', id: 'structure', state: 'done' });

      const devopsState = (devops && devops !== 'none') ? 'done' : 'skip';
      post({ command: 'step', id: 'devops', label: 'Configurando DevOps…', state: devopsState });

      // ── 3. Install dependencies (non-fatal) ──────────────────────────────────
      if (requiresInstall(framework.lang)) {
        post({ command: 'step', id: 'install', label: 'Instalando dependencias…', state: 'running' });

        const installResult = await installDependencies({
          projectPath: buildResult.projectPath,
          projectName,
          lang:        framework.lang,
          frameworkId,
          onStep:   (label, detail) => post({ command: 'installStep', label, detail: detail || '' }),
          onOutput: (line)          => post({ command: 'installLog', line }),
        });

        if (!installResult.ok) {
          // Installation failure is non-fatal — project already exists on disk
          logger.warn(`Dependency install failed (non-fatal): ${installResult.error}`);
          post({ command: 'step', id: 'install', state: 'warn' });
          post({ command: 'step', id: 'verify',  state: 'skip' });

          succeeded = true;   // project IS on disk
          post({
            command: 'successWithWarning',
            path:    buildResult.projectPath,
            warning: installResult.error || 'No fue posible instalar las dependencias.',
            manualCmd: installResult.manualCmd || '',
          });
          return;
        }

        post({ command: 'step', id: 'install', state: 'done' });
      } else {
        post({ command: 'step', id: 'install', state: 'skip' });
      }

      // ── 4. Done ──────────────────────────────────────────────────────────────
      post({ command: 'step', id: 'verify', label: 'Verificando proyecto…', state: 'done' });
      succeeded = true;
      post({ command: 'success', path: buildResult.projectPath });

    } catch (unexpected) {
      // ── Absolute safety net ───────────────────────────────────────────────
      // This catches bugs in our own code — synchronous throws, bad references, etc.
      // The webview MUST be unblocked regardless.
      const msg_ = unexpected instanceof Error ? unexpected.message : String(unexpected);
      logger.error(`Unhandled exception in _handleCreate: ${msg_}`);

      post({
        command: 'error',
        text: `Error inesperado:\n${msg_}\n\nRevisa el Output Channel "Framework Project Builder" para más detalles.`,
      });

      // Offer rollback if we had started creating files
      if (!succeeded && buildPath) {
        try { await offerRollback(buildPath); } catch (_) { /* intentional */ }
      }
    }
  }
}

module.exports = { FrameworkBuilderViewProvider };
