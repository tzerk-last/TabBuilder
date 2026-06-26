// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
const { BaseFrameworkGenerator } = require('../BaseFrameworkGenerator');
const { RuntimeFacade } = require('../../RuntimeFacade');
const { generateDevOpsFiles, writeDevOpsFiles } = require('../../../../devops/generator');
const { getGitignore } = require('../../../../templates/gitignore');

const DEFAULT_DOTNET_FRAMEWORK = 'net8.0';
const DEFAULT_PORT = 5000;

function errMsg(error) {
  return error instanceof Error ? error.message : String(error);
}

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
        error: formatMissingTools(validation),
      };
    }

    try {
      if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
      }

      const args = [
        'new',
        this.dotnetTemplate,
        '--framework',
        DEFAULT_DOTNET_FRAMEWORK,
        '--name',
        projectName,
        '--output',
        '.',
        '--no-restore',
      ];

      const result = await runtime.commandRunner.run(
        'dotnet',
        args,
        projectPath,
        (line) => runtime.logger.info(line),
      );

      if (!result.ok) {
        return {
          success: false,
          projectPath,
          filesWritten: ['.'],
          error: result.stderr.trim() || result.stdout.trim() || 'Error al ejecutar dotnet new.',
        };
      }

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

      const devopsFiles = generateDevOpsFiles({
        projectName,
        lang: this.lang,
        port: DEFAULT_PORT,
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
        error: errMsg(error),
      };
    }
  }

  /** @param {string} projectName */
  buildReadme(projectName) {
    throw new Error('buildReadme() debe implementarse en la subclase.');
  }
}

module.exports = { AspNetOfficialGenerator };
