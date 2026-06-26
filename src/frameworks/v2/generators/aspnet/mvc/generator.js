// @ts-check
'use strict';

/**
 * Generador independiente: **ASP.NET Core + MVC**.
 *
 * Produce EXCLUSIVAMENTE un proyecto MVC (equivalente a `dotnet new mvc`).
 * No comparte estructura con el generador Clean ni con ningún blueprint.
 * Toda su estructura vive en `./templates`.
 */

const { BaseGenerator } = require('../../../BaseGenerator');
const { FOLDERS, FILES, README } = require('./templates');

// Helpers PUROS reutilizables (no son blueprints de arquitectura): generan
// DevOps y gitignore a nivel de lenguaje. Reusarlos no reintroduce mezcla
// de estructuras de arquitectura.
const { generateDevOpsFiles } = require('../../../../../devops/generator');
const { getGitignore } = require('../../../../../templates/gitignore');

class AspNetMvcGenerator extends BaseGenerator {
  constructor() {
    super({ frameworkId: 'aspnet', architectureId: 'mvc', lang: 'csharp', port: 5000 });
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

module.exports = { AspNetMvcGenerator };
