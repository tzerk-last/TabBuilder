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
    vscode.window.registerWebviewViewProvider('tabbuilderView', provider),
    vscode.commands.registerCommand('tabbuilder.createProject', () => {
      vscode.commands.executeCommand('tabbuilderView.focus');
    }),
    // Dispose the Output Channel on deactivation
    { dispose: () => logger.dispose() },
  );
}

function deactivate() {
  logger.info('TabBuilder deactivated');
}

module.exports = { activate, deactivate };
