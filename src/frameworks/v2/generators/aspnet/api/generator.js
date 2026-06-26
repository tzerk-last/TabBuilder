// @ts-check
'use strict';

/**
 * Generador independiente: **ASP.NET Core + API** (Web API).
 *
 * Produce EXCLUSIVAMENTE un proyecto Web API (equivalente a `dotnet new webapi`).
 * Sin vistas ni wwwroot. No comparte estructura con MVC ni Clean ni con ningún
 * blueprint. Toda su estructura vive en `./templates`.
 */

const { BaseGenerator } = require('../../../BaseGenerator');
const { FOLDERS, FILES, README } = require('./templates');

const { generateDevOpsFiles } = require('../../../../../devops/generator');
const { getGitignore } = require('../../../../../templates/gitignore');

class AspNetApiGenerator extends BaseGenerator {
  constructor() {
    super({ frameworkId: 'aspnet', architectureId: 'api', lang: 'csharp', port: 5000 });
  }

  /** @param {import('../../../GeneratorContext').GeneratorContext} ctx */
  structure(ctx) {
    for (const folder of FOLDERS) ctx.ensureDir(folder);
  }

  /** @param {import('../../../GeneratorContext').GeneratorContext} ctx */
  files(ctx) {
    for (const [rel, content] of Object.entries(FILES)) {
      ctx.writeFile(rel, content);
    }
  }

  /** @param {import('../../../GeneratorContext').GeneratorContext} ctx */
  devops(ctx) {
    if (ctx.devops === 'none') return;
    const files = generateDevOpsFiles({
      projectName: ctx.projectName,
      lang: this.lang,
      port: this.port,
      devops: ctx.devops,
    });
    for (const [rel, content] of Object.entries(files || {})) {
      if (!ctx.exists(rel)) ctx.writeFile(rel, content);
    }
  }

  /** @param {import('../../../GeneratorContext').GeneratorContext} ctx */
  readme(ctx) {
    if (!ctx.exists('README.md')) ctx.writeFile('README.md', README(ctx.projectName));
    if (!ctx.exists('.gitignore')) ctx.writeFile('.gitignore', getGitignore(this.lang));
  }
}

module.exports = { AspNetApiGenerator };
