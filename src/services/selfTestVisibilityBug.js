// @ts-check
'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY self-test harness for the webview-visibility investigation.
//
// Fully automated — no human clicking required. Drives real VS Code
// workbench commands to toggle the TabBuilder view's visibility around a
// REAL Laravel generation run through the actual extension pipeline
// (real buildProject() + real installDependencies(), real composer/php
// child processes), and logs every relevant event via diagLog so the
// evidence can be inspected from disk after the run.
//
// Two passes:
//   Run A ("hidden")  — view is hidden partway through the pipeline, proving
//                        (or disproving) that the terminal message is lost.
//   Run B ("visible")  — control: view stays visible the whole time, proving
//                        the bug is conditional on visibility, not general.
//
// Delete this file (and its registration in extension.js) once the root
// cause is confirmed and the fix is validated.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const os = require('os');
const path = require('path');
const vscode = require('vscode');
const { diagLog } = require('./diagLog');

/** @param {number} ms */
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

/**
 * @param {import('../commands/createProjectCommand').TabBuilderViewProvider} provider
 * @param {{ projectName: string, hideDuring: boolean }} opts
 */
async function runOnce(provider, { projectName, hideDuring }) {
  const targetFolder = fs.mkdtempSync(path.join(os.tmpdir(), 'tabbuilder-selftest-'));
  diagLog('selfTest:run:start', { projectName, hideDuring, targetFolder });

  // Mirror the user having the panel open before clicking "Generate project".
  await vscode.commands.executeCommand('tabbuilderView.focus');
  for (let i = 0; i < 20 && !provider._view; i++) await sleep(250);
  await sleep(500);

  const createMsg = {
    command: 'create',
    projectName,
    frameworkId: 'laravel',
    architectureId: 'mvc',
    database: 'none',
    devops: 'none',
    targetFolder,
  };

  // Fires the exact same entry point the real webview uses on "Generate
  // project" — runs the real pipeline, not a mock.
  const pipelinePromise = provider._onMessage(createMsg, provider._view);

  if (hideDuring) {
    await sleep(1500); // let `composer create-project` actually start
    diagLog('selfTest:run:hiding', { projectName });
    await vscode.commands.executeCommand('workbench.view.extensions');
  }

  await pipelinePromise;
  diagLog('selfTest:run:pipelinePromiseResolved', { projectName });

  await sleep(1000);

  if (hideDuring) {
    diagLog('selfTest:run:revealing', { projectName });
    await vscode.commands.executeCommand('tabbuilderView.focus');
    await sleep(1500);
  }

  diagLog('selfTest:run:end', { projectName });
}

/**
 * @param {import('../commands/createProjectCommand').TabBuilderViewProvider} provider
 */
async function runSelfTest(provider) {
  diagLog('selfTest:suite:start', {});
  try {
    await runOnce(provider, { projectName: 'SelfTestHidden', hideDuring: true });
    await runOnce(provider, { projectName: 'SelfTestVisible', hideDuring: false });
  } catch (err) {
    diagLog('selfTest:suite:error', { message: err instanceof Error ? err.message : String(err) });
  }
  diagLog('selfTest:suite:end', {});
}

module.exports = { runSelfTest };
