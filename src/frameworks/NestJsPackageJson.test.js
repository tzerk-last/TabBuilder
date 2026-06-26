// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { buildProject } = require('../services/projectBuilder');

const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabbuilder-nest-test-'));
const targetFolder = tmpdir;

function cleanup() {
  try {
    fs.rmSync(targetFolder, { recursive: true, force: true });
    console.log('Cleanup complete:', targetFolder);
  } catch (err) {
    console.error('Cleanup failed:', err.message);
  }
}

function commandExists(cmd, args = ['--version']) {
  const result = spawnSync(cmd, args, { stdio: 'ignore' });
  return result && result.status === 0;
}

async function runTest() {
  const hasNpm = commandExists('npm');
  if (!hasNpm) {
    console.warn('Skipping NestJS test: npm not available.');
    cleanup();
    return;
  }

  const projectFolder = path.join(targetFolder, 'nestjs');
  fs.mkdirSync(projectFolder, { recursive: true });

  const result = await buildProject({
    name: 'TabBuilderNest',
    frameworkId: 'nestjs',
    architectureId: 'api',
    database: 'none',
    devops: 'none',
    targetFolder: projectFolder,
  });

  console.log('Build result:', JSON.stringify(result, null, 2));
  if (!result.success) {
    throw new Error(`NestJS generation failed: ${result.error}`);
  }

  const packageJsonPath = path.join(result.projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error('Expected package.json to exist after NestJS generation.');
  }

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  if (!pkg.scripts || pkg.scripts.lint !== 'eslint "{src,apps,libs,test}/**/*.ts" --fix') {
    throw new Error(
      `Unexpected lint script in generated package.json: ${JSON.stringify(pkg.scripts, null, 2)}`,
    );
  }

  const installResult = spawnSync('npm', ['install', '--no-audit', '--no-fund'], {
    cwd: result.projectPath,
    stdio: 'inherit',
  });

  if (installResult.status !== 0) {
    throw new Error('npm install failed for generated NestJS project.');
  }

  cleanup();
}

runTest().catch((err) => {
  console.error(err.message);
  cleanup();
  process.exit(1);
});
