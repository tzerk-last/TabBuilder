// @ts-check
'use strict';

const { BaseFrameworkGenerator } = require('../shared/BaseFrameworkGenerator');
const { RuntimeFacade } = require('../RuntimeFacade');

class LaravelOfficialGenerator extends BaseFrameworkGenerator {
  constructor(meta, runtime) {
    super(meta, runtime);
    this.runtime = runtime || new RuntimeFacade();
    this.artisanCommand = null;
  }

  /** @param {import('../../types').ProjectConfig} config */
  async generate(config, deps = {}) {
    return this.runOfficialGenerate(config, deps, async (runtime, projectPath) => {
      this.prepareProjectDirectory(projectPath, 'Laravel');

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
    });
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
