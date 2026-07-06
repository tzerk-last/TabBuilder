// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
const { BaseFrameworkGenerator } = require('../shared/BaseFrameworkGenerator');
const { RuntimeFacade } = require('../RuntimeFacade');
const { generateDevOpsFiles, writeDevOpsFiles } = require('../../devops/generator');
const { generateEnvExampleForFramework } = require('../../devops/EnvGenerator');
const { getGitignore } = require('../../templates/gitignore');
const { ASPNET_DOTNET_FRAMEWORK, ASPNET_DEFAULT_PORT } = require('../shared/versions');

function formatMissingTools(validation) {
  const tools = validation.missing
    .map((tool) => `${tool.name} (${tool.candidates.join(' / ')})`)
    .join(', ');
  const hint = validation.missing[0]?.installHint || '';
  return `No se encontraron las herramientas necesarias: ${tools}. ${hint}`.trim();
}

class AspNetOfficialGenerator extends BaseFrameworkGenerator {
  constructor(meta, runtime) {
    super(meta, runtime);
    this.runtime = runtime || new RuntimeFacade();
  }

  /** @param {import('../../types').ProjectConfig} config */
  async generate(config, deps = {}) {
    const runtime = deps.runtime || this.runtime || new RuntimeFacade({ logger: deps.logger });
    // Optional live-output sink for scaffold()/runDotnet() below — mirrors
    // BaseFrameworkGenerator.runOfficialGenerate(), which this class doesn't
    // call (it has its own prologue), so it's set here instead.
    this._onOutput = typeof deps.onOutput === 'function' ? deps.onOutput : null;
    const projectName = String(config.name || '').trim();
    const targetFolder = String(config.targetFolder || '').trim();
    const projectPath = path.join(targetFolder, projectName);
    const filesWritten = [];

    if (!projectName || !targetFolder) {
      return this.invalidConfigResult(projectPath);
    }

    const validation = runtime.environmentValidator.validateFrameworkTools(this.frameworkId, this.lang);
    if (!validation.ok) {
      return {
        success: false,
        projectPath,
        filesWritten,
        error: formatMissingTools(validation),
      };
    }

    try {
      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
      }

      await this.scaffold(runtime, projectPath, projectName);

      const readmePath = path.join(projectPath, 'README.md');
      if (!fs.existsSync(readmePath)) {
        fs.writeFileSync(readmePath, this.buildReadme(projectName), 'utf8');
        filesWritten.push('README.md');
      }

      const gitignorePath = path.join(projectPath, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        fs.writeFileSync(gitignorePath, getGitignore(this.lang), 'utf8');
        filesWritten.push('.gitignore');
      }

      // Update .env.example with database configuration
      const database = String(config.database || 'none').trim();
      const envContent = generateEnvExampleForFramework(this.frameworkId, projectName, database);
      if (envContent) {
        const envPath = path.join(projectPath, '.env.example');
        if (fs.existsSync(envPath)) {
          fs.writeFileSync(envPath, envContent, 'utf8');
        }
      }

      const devopsFiles = generateDevOpsFiles({
        projectName,
        lang: this.lang,
        port: ASPNET_DEFAULT_PORT,
        database,
        devops: String(config.devops || 'none').trim(),
      });
      const { written } = writeDevOpsFiles(devopsFiles, projectPath);
      filesWritten.push(...written);

      return {
        success: true,
        projectPath,
        filesWritten,
      };
    } catch (error) {
      return {
        success: false,
        projectPath,
        filesWritten: ['.'],
        error: this.errMsg(error),
      };
    }
  }

  /**
   * Runs `dotnet new <dotnetTemplate>` in projectPath. Subclasses with a
   * more elaborate scaffolding flow (e.g. Clean Architecture) override this.
   */
  async scaffold(runtime, projectPath, projectName) {
    const args = [
      'new',
      this.dotnetTemplate,
      '--framework',
      ASPNET_DOTNET_FRAMEWORK,
      '--name',
      projectName,
      '--output',
      '.',
      '--no-restore',
    ];

    const onOutput = this._onOutput;
    const result = await runtime.commandRunner.run(
      'dotnet',
      args,
      projectPath,
      (line) => { runtime.logger.info(line); if (onOutput) onOutput(line); },
    );

    if (!result.ok) {
      throw new Error(result.stderr.trim() || result.stdout.trim() || 'Error al ejecutar dotnet new.');
    }
  }

  /**
   * @param {Object} runtime
   * @param {string[]} args
   * @param {string} cwd
   */
  async runDotnet(runtime, args, cwd) {
    const onOutput = this._onOutput;
    const result = await runtime.commandRunner.run('dotnet', args, cwd, (line) => { runtime.logger.info(line); if (onOutput) onOutput(line); });
    if (!result.ok) {
      throw new Error(result.stderr.trim() || result.stdout.trim() || `dotnet ${args.join(' ')} failed.`);
    }
    return result;
  }

  /** @param {string} _projectName */
  buildReadme(_projectName) {
    throw new Error('buildReadme() debe implementarse en la subclase.');
  }
}

module.exports = { AspNetOfficialGenerator };
