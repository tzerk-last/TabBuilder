// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
const { BaseFrameworkGenerator } = require('../BaseFrameworkGenerator');
const { RuntimeFacade } = require('../../RuntimeFacade');

function errMsg(error) {
  return error instanceof Error ? error.message : String(error);
}

class LaravelOfficialGenerator extends BaseFrameworkGenerator {
  constructor(meta, runtime) {
    super(meta, runtime);
    this.runtime = runtime || new RuntimeFacade();
    this.artisanCommand = null;
  }

  /** @param {import('../../types').ProjectConfig} config */
  async generate(config, deps = {}) {
    const runtime = deps.runtime || this.runtime || new RuntimeFacade({ logger: deps.logger });
    const projectName = String(config.name || '').trim();
    const targetFolder = String(config.targetFolder || '').trim();
    const projectPath = path.join(targetFolder, projectName);
    const filesWritten = [];

    if (!projectName || !targetFolder) {
      return {
        success: false,
        projectPath,
        filesWritten,
        error: 'Nombre de proyecto o carpeta de destino inválidos.',
      };
    }

    const validation = runtime.environmentValidator.validateFrameworkTools(this.frameworkId, this.lang);
    if (!validation.ok) {
      return {
        success: false,
        projectPath,
        filesWritten,
        error: validation.missing
          .map((tool) => `${tool.name} (${tool.candidates.join(' / ')})`)
          .join(', '),
      };
    }

    try {
      this.prepareProjectDirectory(projectPath);

      await this.runCommand(runtime, 'composer', [
        'create-project',
        'laravel/laravel',
        '.',
        '--prefer-dist',
        '--no-interaction',
      ], projectPath);

      if (this.artisanCommand) {
        await this.runCommand(runtime, 'php', ['artisan', this.artisanCommand, '--ansi'], projectPath);
      }

      return {
        success: true,
        projectPath,
        filesWritten,
      };
    } catch (error) {
      return {
        success: false,
        projectPath,
        filesWritten,
        error: errMsg(error),
      };
    }
  }

  prepareProjectDirectory(projectPath) {
    if (fs.existsSync(projectPath) && !fs.statSync(projectPath).isDirectory()) {
      throw new Error(`El directorio destino existe y no es una carpeta válida: ${projectPath}`);
    }

    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    const entries = fs.readdirSync(projectPath).filter((entry) => entry !== '.gitkeep');
    if (entries.length > 0) {
      throw new Error('El directorio destino debe estar vacío para generar el proyecto Laravel.');
    }
  }

  async runCommand(runtime, cmd, args, cwd) {
    const result = await runtime.commandRunner.run(cmd, args, cwd, (line) => runtime.logger.info(line));
    if (!result.ok) {
      throw new Error(result.stderr.trim() || result.stdout.trim() || `${cmd} ${args.join(' ')} falló.`);
    }
    return result;
  }
}

class LaravelMvcOfficialGenerator extends LaravelOfficialGenerator {
  constructor(runtime) {
    super({ frameworkId: 'laravel', architectureId: 'mvc', lang: 'php' }, runtime);
  }
}

class LaravelApiOfficialGenerator extends LaravelOfficialGenerator {
  constructor(runtime) {
    super({ frameworkId: 'laravel', architectureId: 'api', lang: 'php' }, runtime);
    this.artisanCommand = 'install:api';
  }
}

class LaravelCleanOfficialGenerator extends LaravelOfficialGenerator {
  constructor(runtime) {
    super({ frameworkId: 'laravel', architectureId: 'clean', lang: 'php' }, runtime);
  }
}

module.exports = {
  LaravelMvcOfficialGenerator,
  LaravelApiOfficialGenerator,
  LaravelCleanOfficialGenerator,
};
