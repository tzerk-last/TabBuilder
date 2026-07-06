// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const os = require('os');
const { buildProject } = require('../../services/projectBuilder');
const { SpringBootMvcOfficialGenerator } = require('./generator');

const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabbuilder-spring-test-'));
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

/**
 * Fast, network-free check: generateWithInitializr() must build a
 * starter.tgz URL and extract it with `tar -xzf`, never starter.zip/unzip.
 * Uses a mock commandRunner (same pattern as the runtime tests) so it runs
 * deterministically regardless of what's installed on the host.
 */
async function testInitializrUsesTgzNotZip() {
  const calls = [];
  const mockRuntime = {
    commandRunner: {
      probe: (exe) => (exe === 'curl' || exe === 'tar' ? `${exe} (mock)` : null),
      run: async (cmd, args) => {
        calls.push({ cmd, args });
        return { ok: true, code: 0, stdout: '', stderr: '' };
      },
    },
    logger: { info: () => {}, cmd: () => {} },
  };

  const generator = new SpringBootMvcOfficialGenerator(mockRuntime);
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tabbuilder-spring-tgz-unit-'));
  await generator.generateWithInitializr(mockRuntime, 'UnitTgzTest', tmp, 'maven', ['web'], {});
  fs.rmSync(tmp, { recursive: true, force: true });

  const curlCall = calls.find((c) => c.cmd === 'curl');
  if (!curlCall) throw new Error('Expected curl to be invoked to download the Initializr archive.');
  const url = curlCall.args.find((a) => typeof a === 'string' && a.includes('start.spring.io'));
  if (!url || !url.includes('starter.tgz')) {
    throw new Error(`Expected curl URL to use starter.tgz, got: ${curlCall.args.join(' ')}`);
  }
  if (url.includes('starter.zip')) {
    throw new Error('starter.zip must no longer be used.');
  }

  const tarCall = calls.find((c) => c.cmd === 'tar');
  if (!tarCall) throw new Error('Expected tar to be invoked to extract the archive.');
  if (!tarCall.args.includes('-xzf')) {
    throw new Error(`Expected tar to be called with -xzf, got: ${tarCall.args.join(' ')}`);
  }
  if (calls.some((c) => c.cmd === 'unzip')) {
    throw new Error('unzip must no longer be invoked.');
  }

  console.log('testInitializrUsesTgzNotZip: OK');
}

/**
 * Real, end-to-end check against the live start.spring.io/starter.tgz
 * endpoint for BOTH build tools. Calls generateWithInitializr() directly
 * (bypassing resolveBuildTool()'s host-dependent mvn/gradle detection) so
 * both paths are exercised regardless of what's installed on the test
 * machine — only git/curl-or-wget/tar are required, same as real usage.
 */
async function testInitializrArchiveExtraction() {
  const hasCurl = commandExists('curl', ['--version']);
  const hasWget = commandExists('wget', ['--version']);
  const hasTar = commandExists('tar', ['--version']);
  if (!(hasCurl || hasWget) || !hasTar) {
    console.warn('Skipping testInitializrArchiveExtraction: curl/wget or tar missing.');
    return;
  }

  const cases = [
    { buildTool: 'maven', expectedFile: 'pom.xml' },
    { buildTool: 'gradle', expectedFile: 'build.gradle' },
  ];

  for (const { buildTool, expectedFile } of cases) {
    const projectFolder = path.join(targetFolder, `tgz-${buildTool}`);
    fs.mkdirSync(projectFolder, { recursive: true });

    const generator = new SpringBootMvcOfficialGenerator();
    await generator.generateWithInitializr(generator.runtime, `TgzTest${buildTool}`, projectFolder, buildTool, ['web'], {});

    const buildFile = path.join(projectFolder, expectedFile);
    if (!fs.existsSync(buildFile)) {
      throw new Error(`starter.tgz (${buildTool}): expected ${expectedFile} after extraction.`);
    }
    if (fs.existsSync(path.join(projectFolder, 'starter.tar.gz')) || fs.existsSync(path.join(projectFolder, 'starter.zip'))) {
      throw new Error(`starter.tgz (${buildTool}): archive file was not cleaned up after extraction.`);
    }
    console.log(`testInitializrArchiveExtraction (${buildTool}): OK`);
  }
}

async function runTest() {
  const hasGit = commandExists('git', ['--version']);
  const hasSpring = commandExists('spring', ['--version']);
  const hasCurl = commandExists('curl', ['--version']);
  const hasWget = commandExists('wget', ['--version']);
  const hasTar = commandExists('tar', ['--version']);
  const canGenerate = hasSpring || ((hasCurl || hasWget) && hasTar);

  await testInitializrUsesTgzNotZip();
  await testInitializrArchiveExtraction();

  if (!hasGit || !canGenerate) {
    console.warn('Skipping Spring Boot test: required tools missing.');
    cleanup();
    return;
  }

  const configs = [
    { name: 'mvc', architectureId: 'mvc' },
    { name: 'api', architectureId: 'api' },
    { name: 'clean', architectureId: 'clean' },
  ];

  for (const config of configs) {
    const projectFolder = path.join(targetFolder, config.name);
    fs.mkdirSync(projectFolder, { recursive: true });
    const result = await buildProject({ name: 'TabBuilderSpring', frameworkId: 'spring-boot', architectureId: config.architectureId, database: 'none', devops: 'none', targetFolder: projectFolder });
    console.log(`Test ${config.name}:`, JSON.stringify(result, null, 2));
    if (!result.success) {
      throw new Error(`Spring Boot ${config.name} generation failed: ${result.error}`);
    }
    const generatedPom = path.join(result.projectPath, 'pom.xml');
    if (!fs.existsSync(generatedPom)) {
      throw new Error(`Expected pom.xml after Spring Boot ${config.name} generation.`);
    }

    if (config.name === 'mvc') {
      const pomContent = fs.readFileSync(generatedPom, 'utf-8');
      if (!pomContent.includes('spring-boot-starter-thymeleaf')) {
        throw new Error('Expected Thymeleaf dependency in MVC Spring Boot project.');
      }
    }

    if (config.name === 'api') {
      const templatesPath = path.join(result.projectPath, 'src/main/resources/templates');
      const staticPath = path.join(result.projectPath, 'src/main/resources/static');
      const templatesEmpty = fs.existsSync(templatesPath) && fs.readdirSync(templatesPath).filter((n) => n !== '.gitkeep').length === 0;
      const staticEmpty = fs.existsSync(staticPath) && fs.readdirSync(staticPath).filter((n) => n !== '.gitkeep').length === 0;
      if (templatesEmpty && staticEmpty) {
        if (fs.existsSync(templatesPath) || fs.existsSync(staticPath)) {
          throw new Error('Empty API resource directories should be removed when both templates and static are empty.');
        }
      }
    }

    if (config.name === 'clean') {
      const domainEntity = path.join(result.projectPath, 'src/main/java/com/example/app/Domain/Entities/Entity.java');
      if (!fs.existsSync(domainEntity)) {
        throw new Error('Expected Clean Architecture domain entity to be generated.');
      }
      if (!fs.existsSync(generatedPom)) {
        throw new Error('Expected pom.xml to remain present after Clean Spring Boot generation.');
      }
    }
  }

  cleanup();
}

runTest().catch((err) => {
  console.error(err.message);
  cleanup();
  process.exit(1);
});
