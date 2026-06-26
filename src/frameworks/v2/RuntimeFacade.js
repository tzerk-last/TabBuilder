'use strict';

const { CommandRunner, RuntimeLogger, ToolDetector, EnvironmentValidator, ProgressReporter } = require('./runtime');

class RuntimeFacade {
  constructor(options = {}) {
    const logger = options.logger || new RuntimeLogger(options.loggerDelegate || {});
    this.commandRunner = new CommandRunner({ logger, extraPaths: options.extraPaths });
    this.toolDetector = new ToolDetector(this.commandRunner, logger);
    this.environmentValidator = new EnvironmentValidator(this.toolDetector);
    this.progressReporter = options.progressReporter || new ProgressReporter(options.onProgress || (() => {}));
    this.logger = logger;
  }
}

module.exports = { RuntimeFacade };