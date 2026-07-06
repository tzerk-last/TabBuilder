// @ts-check
'use strict';

const vscode = require('vscode');

const { TabBuilderViewProvider } = require('./commands/createProjectCommand');
const { logger } = require('./services/logger');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  logger.info('TabBuilder activated');

  const provider = new TabBuilderViewProvider(context.extensionUri, context);

  context.subscriptions.push(
    // retainContextWhenHidden: without it, VS Code destroys the webview's JS
    // context whenever the view is hidden (e.g. user switches sidebar icons
    // during a long-running Laravel composer install) and rebuilds it from
    // scratch when shown again — silently losing the in-progress wizard
    // state. See TabBuilderViewProvider._lastTerminalMessage for the other
    // half of this fix (replaying the final message once the view is
    // visible again, since postMessage() is a no-op on a hidden webview
    // even with this flag set). Root cause confirmed with real evidence in
    // an earlier investigation; this reapplies the fix designed then.
    vscode.window.registerWebviewViewProvider('tabbuilderView', provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    vscode.commands.registerCommand('tabbuilder.createProject', () => {
      vscode.commands.executeCommand('tabbuilderView.focus');
    }),
    // Dispose the Output Channel on deactivation
    { dispose: () => logger.dispose() },
  );

  // TEMP: self-test harness for the webview-visibility investigation.
  // Only active when TABBUILDER_SELFTEST=1 is set on the process env — never
  // runs in a normal install. Remove alongside selfTestVisibilityBug.js and
  // diagLog.js once the root cause is confirmed and the fix is validated.
  if (process.env.TABBUILDER_SELFTEST === '1') {
    const { runSelfTest } = require('./services/selfTestVisibilityBug');
    context.subscriptions.push(
      vscode.commands.registerCommand('tabbuilder.selfTestVisibilityBug', () => runSelfTest(provider)),
    );
    setTimeout(() => vscode.commands.executeCommand('tabbuilder.selfTestVisibilityBug'), 2000);
  }
}

function deactivate() {
  logger.info('TabBuilder deactivated');
}

module.exports = { activate, deactivate };
