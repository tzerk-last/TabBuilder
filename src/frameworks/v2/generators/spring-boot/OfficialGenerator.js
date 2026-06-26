// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
const { URL } = require('url');
const { BaseFrameworkGenerator } = require('../BaseFrameworkGenerator');
const { RuntimeFacade } = require('../../RuntimeFacade');

function errMsg(error) {
  return error instanceof Error ? error.message : String(error);
}

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
    const runtime = deps.runtime || this.runtime || new RuntimeFacade({ logger: deps.logger });
    const projectName = String(config.name || '').trim();
    const targetFolder = String(config.targetFolder || '').trim();
    const projectPath = path.join(targetFolder, projectName);

    if (!projectName || !targetFolder) {
      return { success: false, projectPath, filesWritten: [], error: 'Nombre de proyecto o carpeta de destino inválidos.' };
    }

    const validation = runtime.environmentValidator.validateFrameworkTools(this.frameworkId, this.lang);
    if (!validation.ok) {
      return {
        success: false,
        projectPath,
        filesWritten: [],
        error: validation.missing.map((tool) => `${tool.name} (${tool.candidates.join(' / ')})`).join(', '),
      };
    }

    try {
      this.prepareProjectDirectory(projectPath);

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

      return { success: true, projectPath, filesWritten: [] };
    } catch (error) {
      return { success: false, projectPath, filesWritten: [], error: errMsg(error) };
    }
  }

  prepareProjectDirectory(projectPath) {
    if (fs.existsSync(projectPath) && !fs.statSync(projectPath).isDirectory()) {
      throw new Error(`El directorio destino existe y no es una carpeta válida: ${projectPath}`);
    }

    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    const entries = fs.readdirSync(projectPath).filter((name) => name !== '.gitkeep');
    if (entries.length > 0) {
      throw new Error('El directorio destino debe estar vacío para generar el proyecto Spring Boot.');
    }
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
      '21',
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
      javaVersion: '21',
      packaging: 'jar',
      dependencies: buildDependencyArgs(dependencies),
    });

    const springBootVersion = getSpringBootVersion(config);
    if (springBootVersion) {
      params.set('bootVersion', springBootVersion);
    }

    const url = `https://start.spring.io/starter.zip?${params.toString()}`;

    const zipPath = path.join(projectPath, 'starter.zip');
    if (runtime.commandRunner.probe('curl')) {
      await this.runCommand(runtime, 'curl', ['-L', url, '-o', zipPath], projectPath);
    } else if (runtime.commandRunner.probe('wget')) {
      await this.runCommand(runtime, 'wget', ['-O', zipPath, url], projectPath);
    } else {
      throw new Error('No se encontró curl ni wget para descargar el proyecto Spring Boot.');
    }

    await this.runCommand(runtime, 'unzip', ['-q', zipPath], projectPath);
    fs.rmSync(zipPath, { force: true });
  }

  async runCommand(runtime, cmd, args, cwd) {
    const result = await runtime.commandRunner.run(cmd, args, cwd, (line) => runtime.logger.info(line));
    if (!result.ok) {
      throw new Error(result.stderr.trim() || result.stdout.trim() || `${cmd} ${args.join(' ')} falló.`);
    }
    return result;
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
