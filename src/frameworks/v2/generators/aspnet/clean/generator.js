// @ts-check
'use strict';

/**
 * Generador independiente: **ASP.NET Core + Clean Architecture**.
 *
 * Produce EXCLUSIVAMENTE una solución Clean (Domain/Application/Infrastructure/
 * Web bajo `src/`). No escribe Controllers/Views/wwwroot en la raíz: esa es
 * estructura MVC y pertenece a otro generador. No depende de ningún blueprint.
 */

const { BaseGenerator } = require('../../../BaseGenerator');
const { FOLDERS, FILES, README } = require('./templates');

const { generateDevOpsFiles } = require('../../../../../devops/generator');
const { getGitignore } = require('../../../../../templates/gitignore');

class AspNetCleanGenerator extends BaseGenerator {
  constructor() {
    super({ frameworkId: 'aspnet', architectureId: 'clean', lang: 'csharp', port: 5000 });
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

module.exports = { AspNetCleanGenerator };
