// @ts-check
'use strict';

const vscode = require('vscode');

const { FrameworkBuilderViewProvider } = require('./commands/createProjectCommand');
const { logger } = require('./services/logger');

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  logger.info('TabBuilder activated');

  const provider = new FrameworkBuilderViewProvider(context.extensionUri, context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('frameworkBuilderView', provider),
    vscode.commands.registerCommand('framework-builder.createProject', () => {
      vscode.commands.executeCommand('frameworkBuilderView.focus');
    }),
    // Dispose the Output Channel on deactivation
    { dispose: () => logger.dispose() },
  );
}

function deactivate() {
  logger.info('TabBuilder deactivated');
}

module.exports = { activate, deactivate };
