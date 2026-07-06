// @ts-check
'use strict';

const vscode = require('vscode');

const { getWebviewContent }                          = require('../ui/webview');
const { buildProject, offerRollback }                = require('../services/projectBuilder');
const { installDependencies, requiresInstall, preflight } = require('../services/dependencyInstaller');
const { validateProjectConfig }                      = require('../utils/validation');
const { getFramework }                               = require('../frameworks/index');
const { FrameworkFactory }                           = require('../frameworks/FrameworkFactory');
const { RuntimeFacade }                              = require('../frameworks/RuntimeFacade');
const { logger }                                     = require('../services/logger');
const { diagLog }                                    = require('../services/diagLog'); // TEMP: instrumentation, see diagLog.js

// Curated subset of ToolDetector.TOOL_DEFINITIONS shown in the always-on
// System Status panel — informational, independent of any single framework.
const SYSTEM_STATUS_TOOLS = ['git', 'node', 'npm', 'python', 'php', 'composer', 'java', 'mvn', 'dotnet', 'docker'];

/**
 * Webview view provider for the TabBuilder panel. Owns the webview
 * lifecycle and routes its messages into the build/install services — the
 * webview itself (./ui/webview.js) only renders HTML and posts/receives
 * messages, it has no business logic.
 */
class TabBuilderViewProvider {
  /**
   * @param {vscode.Uri} extensionUri
   * @param {vscode.ExtensionContext} context
   */
  constructor(extensionUri, context) {
    this._extensionUri = extensionUri;
    this._context = context;
    /** @type {vscode.WebviewView | null} */
    this._view = null;
    this._resolveCount = 0; // TEMP: instrumentation — counts resolveWebviewView() calls
    /** @type {RuntimeFacade | null} */
    this._runtime = null;
    // Last terminal message ('success' | 'successWithWarning' | 'error') for
    // the in-flight/last generation. postMessage() is silently dropped while
    // the webview is hidden (a VS Code guarantee, confirmed in an earlier
    // investigation), so if that happens the webview never learns the
    // pipeline finished. Replayed once the view becomes visible again.
    /** @type {Record<string, any> | null} */
    this._lastTerminalMessage = null;
    // Reentrancy guard: a second 'create' message overlapping an in-flight
    // one (e.g. a stale/duplicate send) would run two pipelines concurrently
    // against the same post()/webview, interleaving their step/log messages.
    this._generating = false;
  }

  /**
   * Lazily-constructed, reused RuntimeFacade for read-only tool detection
   * (System Status panel, Preflight check). Never used for the actual
   * generation pipeline — buildProject()/installDependencies() keep
   * constructing their own runtime exactly as before.
   * @returns {RuntimeFacade}
   */
  _getRuntime() {
    if (!this._runtime) this._runtime = new RuntimeFacade({ logger });
    return this._runtime;
  }

  /** @param {vscode.WebviewView} webviewView */
  resolveWebviewView(webviewView) {
    this._resolveCount += 1;
    // TEMP: instrumentation — point (1): confirms whether/when VS Code
    // (re)constructs the webview context.
    diagLog('resolveWebviewView', { resolveCount: this._resolveCount, visible: webviewView.visible });

    this._view = webviewView;
    webviewView.webview.options = { enableScripts: true };
    webviewView.webview.html = getWebviewContent();
    webviewView.webview.onDidReceiveMessage(msg => this._onMessage(msg, webviewView));

    // TEMP: instrumentation — point (2)/(4): visibility transitions, to
    // correlate hidden/visible windows with lost messages.
    webviewView.onDidChangeVisibility(() => {
      diagLog('visibilityChange', { visible: webviewView.visible, resolveCount: this._resolveCount });
      if (webviewView.visible && this._lastTerminalMessage) {
        // The view can be disposed (not just hidden) between the visibility
        // check above and this call (e.g. user right-click > uncheck), in
        // which case postMessage() throws per the VS Code API contract.
        try {
          webviewView.webview.postMessage(this._lastTerminalMessage);
        } catch (err) {
          logger.warn(`postMessage (terminal replay) failed: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    });
    webviewView.onDidDispose(() => {
      diagLog('dispose', { resolveCount: this._resolveCount });
    });
  }

  /**
   * Routes all messages from the webview.
   * @param {Record<string, any>} msg
   * @param {vscode.WebviewView} view
   */
  async _onMessage(msg, view) {
    // TEMP: instrumentation — point (5): the webview acks every message it
    // actually receives and processes (see webview.js). If a 'success' is
    // posted but no matching ack ever arrives, the message never reached a
    // live listener.
    if (msg.command === 'debugAck') {
      diagLog('webviewAck', { original: msg.original, webviewTs: msg.ts, latencyMs: Date.now() - msg.ts, visible: view.visible });
      return;
    }

    const TERMINAL_COMMANDS = new Set(['success', 'successWithWarning', 'error']);
    const post = /** @param {object} p */ (p) => {
      if (TERMINAL_COMMANDS.has(p.command)) this._lastTerminalMessage = p;

      const sentAt = Date.now();
      const visibleAtSend = view.visible;
      // TEMP: instrumentation — point (3): postMessage() returns a
      // Thenable<boolean> that VS Code resolves to `false` when the message
      // could not be delivered (e.g. hidden webview). The original code
      // never read this value — we now log it without changing behavior.
      diagLog('postMessage:send', { command: p.command, visible: visibleAtSend, sentAt });
      // The view can be disposed between messages (e.g. the user right-click
      // > unchecks the webview while a generation/install is streaming
      // output) — postMessage() throws in that case per the VS Code API
      // contract. This must never bubble up and abort the pipeline.
      let thenable;
      try {
        thenable = view.webview.postMessage(p);
      } catch (err) {
        logger.warn(`postMessage (${p.command}) failed: ${err instanceof Error ? err.message : String(err)}`);
        return Promise.resolve(false);
      }
      Promise.resolve(thenable).then(delivered => {
        diagLog('postMessage:result', {
          command: p.command, delivered, visibleAtSend, visibleNow: view.visible,
          latencyMs: Date.now() - sentAt,
        });
      });
      return thenable;
    };

    switch (msg.command) {
      case 'pickFolder':         await this._handlePickFolder(post); break;
      case 'create':              await this._handleCreate(msg, post); break;
      case 'checkSystemStatus':   await this._handleCheckSystemStatus(post); break;
      case 'checkRequirements':   await this._handleCheckRequirements(msg, post); break;
      case 'openProject':
        // .then(undefined, ...) instead of try/catch: executeCommand can
        // reject (e.g. the folder was deleted after generation finished) —
        // previously unhandled, which surfaces as an "unhandled rejection"
        // in the extension host for no user-visible reason.
        vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(msg.path), false)
          .then(undefined, (err) => logger.warn(`openProject failed: ${err}`));
        break;
      case 'openFolder':
        vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(msg.path))
          .then(undefined, (err) => logger.warn(`openFolder failed: ${err}`));
        break;
    }
  }

  /**
   * Always-on System Status panel — probes a curated, framework-independent
   * set of tools and streams results in as they resolve (rather than one
   * blocking batch) so the extension host stays responsive to other
   * messages between each spawnSync probe.
   * Read-only: never used by the generation pipeline itself.
   * @param {(p: object) => void} post
   */
  async _handleCheckSystemStatus(post) {
    const runtime = this._getRuntime();
    const tools = SYSTEM_STATUS_TOOLS.map((id) => {
      const meta = runtime.toolDetector.getToolMetadata(id);
      return { id, name: meta.name, available: false, version: null, installHint: meta.installHint, pending: true };
    });

    post({ command: 'systemStatus', environment: { os: process.platform, tools: [...tools] } });

    for (let i = 0; i < SYSTEM_STATUS_TOOLS.length; i++) {
      await new Promise((resolve) => setImmediate(resolve));
      const result = runtime.toolDetector.detect(SYSTEM_STATUS_TOOLS[i]);
      tools[i] = {
        id: result.id, name: result.name, available: result.available,
        version: result.version, installHint: result.installHint, pending: false,
      };
      post({ command: 'systemStatus', environment: { os: process.platform, tools: [...tools] } });
    }
  }

  /**
   * Preflight check for the exact framework/architecture combo the user is
   * about to generate. Routes to whichever check buildProject() would use
   * for that combo (v4 generators → EnvironmentValidator; legacy templates
   * → dependencyInstaller.preflight()) — same routing decision
   * FrameworkFactory.has() already makes in projectBuilder.js, not a new
   * rule. Read-only: buildProject()/installDependencies() still run their
   * own checks exactly as before; this only previews the outcome earlier.
   * @param {Record<string, any>} msg
   * @param {(p: object) => void} post
   */
  async _handleCheckRequirements(msg, post) {
    const project = msg.project || {};
    const framework = getFramework(project.frameworkId);

    // Echoed back verbatim — lets the webview tell a stale response (from a
    // request superseded by a later one, e.g. user went back and re-checked
    // a different framework before the first reply arrived) apart from the
    // current one. Purely additive to the message shape; this function's
    // own routing/checking logic is unchanged.
    const requestId = msg.requestId;

    if (!framework) {
      post({ command: 'requirementsResult', requestId, project, ok: false, environment: { tools: [] } });
      return;
    }

    const result = FrameworkFactory.has(project.frameworkId, project.architectureId)
      ? this._getRuntime().environmentValidator.validateFrameworkTools(project.frameworkId, framework.lang)
      : preflight(framework.lang, project.frameworkId);

    post({
      command: 'requirementsResult',
      requestId,
      project,
      ok: result.ok,
      environment: { tools: result.checked },
    });
  }

  /** @param {(p: object) => void} post */
  async _handlePickFolder(post) {
    try {
      const selected = await vscode.window.showOpenDialog({
        canSelectFolders: true, canSelectFiles: false, openLabel: 'Selecciona la carpeta de destino',
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
    if (this._generating) {
      post({ command: 'error', text: 'Ya hay una generación en curso. Espera a que termine antes de iniciar otra.' });
      return;
    }
    this._generating = true;

    const { projectName, frameworkId, templateId, architectureId, database, devops, targetFolder } = msg;

    diagLog('pipeline:start', { projectName, frameworkId }); // TEMP: instrumentation
    this._lastTerminalMessage = null; // starting a new run — drop any stale terminal message from a previous one

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
        post({ command: 'error', text: `No se encontró el framework "${frameworkId}".` });
        return;
      }

      logger.startSession(projectName, frameworkId);

      // ── 2. Create file structure ─────────────────────────────────────────────
      post({ command: 'step', id: 'structure', label: 'Creando la estructura del proyecto…', state: 'running' });

      const buildResult = await buildProject({
        name: projectName, frameworkId,
        templateId:     templateId || 'standard',
        architectureId: architectureId || 'standard',
        database:       database        || 'none',
        devops:         devops          || 'none',
        targetFolder,
      }, {
        // Same message shape already used by the install-phase onOutput
        // below — v4 generators (Laravel/Spring Boot/ASP.NET) run real
        // commands (composer/curl/tar/dotnet) here, previously silent to
        // the "Ver detalles" panel.
        onOutput: (line) => post({ command: 'installLog', line }),
      });

      if (!buildResult.success) {
        post({ command: 'step', id: 'structure', state: 'error' });
        post({ command: 'error', text: buildResult.error || 'No se pudo crear el proyecto.' });

        // Offer rollback if any files were created before the failure
        if (buildResult.filesWritten.length > 0) {
          await offerRollback(buildResult.projectPath);
        }
        return;
      }

      buildPath = buildResult.projectPath;
      diagLog('pipeline:buildProject:resolved', { success: buildResult.success, projectPath: buildResult.projectPath }); // TEMP
      post({ command: 'step', id: 'structure', state: 'done' });

      const devopsState = (devops && devops !== 'none') ? 'done' : 'skip';
      post({ command: 'step', id: 'devops', label: 'Configurando archivos de DevOps…', state: devopsState });

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

        diagLog('pipeline:installDependencies:resolved', { ok: installResult.ok }); // TEMP

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
      post({ command: 'step', id: 'verify', label: 'Verificando el proyecto…', state: 'done' });
      succeeded = true;
      diagLog('pipeline:done', { projectPath: buildResult.projectPath }); // TEMP
      post({ command: 'success', path: buildResult.projectPath });

    } catch (unexpected) {
      // ── Absolute safety net ───────────────────────────────────────────────
      // This catches bugs in our own code — synchronous throws, bad references, etc.
      // The webview MUST be unblocked regardless.
      const msg_ = unexpected instanceof Error ? unexpected.message : String(unexpected);
      logger.error(`Unhandled exception in _handleCreate: ${msg_}`);

      post({
        command: 'error',
        text: `Ocurrió un error inesperado:\n${msg_}\n\nRevisa el canal de salida "TabBuilder" para más detalles.`,
      });

      // Offer rollback if we had started creating files
      if (!succeeded && buildPath) {
        try { await offerRollback(buildPath); } catch (_) { /* intentional */ }
      }
    } finally {
      this._generating = false;
    }
  }
}

module.exports = { TabBuilderViewProvider };
