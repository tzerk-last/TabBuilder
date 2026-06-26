// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const os = require('os');
const { buildProject } = require('../../../../services/projectBuilder');

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

async function runTest() {
  const hasGit = commandExists('git', ['--version']);
  const hasSpring = commandExists('spring', ['--version']);
  const hasCurl = commandExists('curl', ['--version']);
  const hasWget = commandExists('wget', ['--version']);
  const hasUnzip = commandExists('unzip', ['-v']);
  const canGenerate = hasSpring || ((hasCurl || hasWget) && hasUnzip);

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
