// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
const { URLSearchParams } = require('url');
const { BaseFrameworkGenerator } = require('../shared/BaseFrameworkGenerator');
const { RuntimeFacade } = require('../RuntimeFacade');
const { SPRING_BOOT_JAVA_VERSION } = require('../shared/versions');

function normalizeArtifactId(projectName) {
  return String(projectName || 'app')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'app';
}

function normalizePackageName(projectName) {
  const safe = String(projectName || 'app')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  return safe ? `com.example.${safe}` : 'com.example.app';
}

function getProjectConfiguration(architectureId) {
  const type = String(architectureId || '').trim().toLowerCase();
  return {
    dependencies: type === 'mvc' ? ['web', 'thymeleaf'] : ['web'],
  };
}

function getDependencies(architectureId) {
  return getProjectConfiguration(architectureId).dependencies;
}

function buildDependencyArgs(dependencies) {
  return dependencies.join(',');
}

function getSpringBootVersion(config) {
  const version = String(config.bootVersion || config.springBootVersion || '').trim();
  return version || null;
}

function isDirectoryEmpty(dirPath) {
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) return false;
  const entries = fs.readdirSync(dirPath).filter((entry) => entry !== '.gitkeep');
  return entries.length === 0;
}

function removeEmptyApiResourceDirs(projectPath) {
  const base = path.join(projectPath, 'src', 'main', 'resources');
  const templatesDir = path.join(base, 'templates');
  const staticDir = path.join(base, 'static');

  if (fs.existsSync(templatesDir) && fs.existsSync(staticDir)) {
    if (isDirectoryEmpty(templatesDir) && isDirectoryEmpty(staticDir)) {
      fs.rmdirSync(templatesDir);
      fs.rmdirSync(staticDir);
    }
  }
}

class SpringBootOfficialGenerator extends BaseFrameworkGenerator {
  constructor(meta, runtime) {
    super(meta, runtime);
    this.runtime = runtime || new RuntimeFacade();
  }

  /** @param {import('../../types').ProjectConfig} config */
  async generate(config, deps = {}) {
    return this.runOfficialGenerate(config, deps, async (runtime, projectPath, projectName) => {
      this.prepareProjectDirectory(projectPath, 'Spring Boot');

      const buildTool = this.resolveBuildTool(runtime);
      if (!buildTool) {
        throw new Error('No se encontró un constructor de proyecto compatible (Maven o Gradle).');
      }

      const dependencies = getDependencies(this.architectureId);
      if (runtime.commandRunner.probe('spring')) {
        await this.generateWithSpringCli(runtime, projectName, projectPath, buildTool, dependencies, config);
      } else {
        await this.generateWithInitializr(runtime, projectName, projectPath, buildTool, dependencies, config);
      }

      if (this.architectureId === 'api') {
        removeEmptyApiResourceDirs(projectPath);
      }
    });
  }

  resolveBuildTool(runtime) {
    if (runtime.commandRunner.probe('mvn')) return 'maven';
    if (runtime.commandRunner.probe('gradle')) return 'gradle';
    return 'maven';
  }

  async generateWithSpringCli(runtime, projectName, projectPath, buildTool, dependencies, config) {
    const artifactId = normalizeArtifactId(projectName);
    const packageName = normalizePackageName(projectName);
    const args = [
      'init',
      '--build',
      buildTool,
      '--java-version',
      SPRING_BOOT_JAVA_VERSION,
      '--dependencies',
      buildDependencyArgs(dependencies),
      '--groupId',
      'com.example',
      '--artifactId',
      artifactId,
      '--name',
      projectName,
      '--package-name',
      packageName,
    ];

    const springBootVersion = getSpringBootVersion(config);
    if (springBootVersion) {
      args.push('--boot-version', springBootVersion);
    }

    args.push('--force', '.');
    await this.runCommand(runtime, 'spring', args, projectPath);
  }

  async generateWithInitializr(runtime, projectName, projectPath, buildTool, dependencies, config) {
    const artifactId = normalizeArtifactId(projectName);
    const packageName = normalizePackageName(projectName);
    const type = buildTool === 'maven' ? 'maven-project' : 'gradle-project';
    const params = new URLSearchParams({
      type,
      language: 'java',
      baseDir: '.',
      groupId: 'com.example',
      artifactId,
      name: projectName,
      packageName,
      javaVersion: SPRING_BOOT_JAVA_VERSION,
      packaging: 'jar',
      dependencies: buildDependencyArgs(dependencies),
    });

    const springBootVersion = getSpringBootVersion(config);
    if (springBootVersion) {
      params.set('bootVersion', springBootVersion);
    }

    // start.spring.io's own documented usage guide recommends `.tgz`
    // (tar+gzip) over `.zip` for scripted/automated clients — verified: it's
    // a real, live endpoint (Content-Disposition: starter.tar.gz), and `tar`
    // extracts it natively on Windows 10/11, macOS AND every mainstream
    // Linux distro. `.zip` only works on Windows/macOS, whose `tar` happens
    // to be bsdtar (libarchive) — GNU tar, the default on Debian/Ubuntu/
    // Mint/WSL2, cannot extract ZIP at all (confirmed empirically: `tar:
    // This does not look like a tar archive`).
    const url = `https://start.spring.io/starter.tgz?${params.toString()}`;

    if (!runtime.commandRunner.probe('tar')) {
      throw new Error(
        'No se encontró "tar", necesario para generar proyectos Spring Boot mediante Spring Initializr ' +
        '(start.spring.io). "tar" viene incluido en Windows 10/11, macOS y la mayoría de distribuciones ' +
        'Linux; si tu sistema no lo tiene, instálalo con su gestor de paquetes.',
      );
    }

    const archivePath = path.join(projectPath, 'starter.tar.gz');
    if (runtime.commandRunner.probe('curl')) {
      await this.runCommand(runtime, 'curl', ['-L', url, '-o', archivePath], projectPath);
    } else if (runtime.commandRunner.probe('wget')) {
      await this.runCommand(runtime, 'wget', ['-O', archivePath, url], projectPath);
    } else {
      throw new Error('No se encontró curl ni wget para descargar el proyecto Spring Boot.');
    }

    // GNU tar (Debian/Ubuntu/Mint) emits a harmless warning for a
    // libarchive-specific metadata key it doesn't recognize; extraction
    // still succeeds (exit code 0, all files present — verified). Filter
    // only that exact, known-benign line — anything else from tar still
    // surfaces normally, including real errors.
    const isKnownBenignTarWarning = (line) => /Ignoring unknown extended header keyword ['"]LIBARCHIVE\./i.test(line);
    await this.runCommand(runtime, 'tar', ['-xzf', archivePath], projectPath, isKnownBenignTarWarning);
    fs.rmSync(archivePath, { force: true });
  }
}

class SpringBootMvcOfficialGenerator extends SpringBootOfficialGenerator {
  constructor(runtime) {
    super({ frameworkId: 'spring-boot', architectureId: 'mvc', lang: 'java' }, runtime);
  }
}

class SpringBootApiOfficialGenerator extends SpringBootOfficialGenerator {
  constructor(runtime) {
    super({ frameworkId: 'spring-boot', architectureId: 'api', lang: 'java' }, runtime);
  }
}

class SpringBootCleanOfficialGenerator extends SpringBootOfficialGenerator {
  constructor(runtime) {
    super({ frameworkId: 'spring-boot', architectureId: 'clean', lang: 'java' }, runtime);
  }
}

module.exports = {
  SpringBootMvcOfficialGenerator,
  SpringBootApiOfficialGenerator,
  SpringBootCleanOfficialGenerator,
};
