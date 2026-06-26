'use strict';

const { RuntimeLogger } = require('./Logger');

const TOOL_DEFINITIONS = {
  node:     { command: ['node', '--version'], name: 'Node.js', installHint: 'https://nodejs.org' },
  npm:      { command: ['npm', '--version'], name: 'npm', installHint: 'Incluido con Node.js — reinstala Node.js' },
  pnpm:     { command: ['pnpm', '--version'], name: 'pnpm', installHint: 'https://pnpm.io/installation' },
  npx:      { command: ['npx', '--version'], name: 'npx', installHint: 'Incluido con npm — reinstala Node.js' },
  git:      { command: ['git', '--version'], name: 'Git', installHint: 'https://git-scm.com/downloads' },
  python:   { command: ['python3', '--version'], name: 'Python 3', installHint: 'https://python.org/downloads' },
  uv:       { command: ['uv', '--version'], name: 'uv', installHint: 'https://github.com/encode/uv' },
  dotnet:   { command: ['dotnet', '--version'], name: '.NET SDK', installHint: 'https://dotnet.microsoft.com/download' },
  java:     { command: ['java', '--version'], name: 'Java (JDK)', installHint: 'https://adoptium.net' },
  mvn:      { command: ['mvn', '--version'], name: 'Maven', installHint: 'https://maven.apache.org/download.cgi' },
  gradle:   { command: ['gradle', '--version'], name: 'Gradle', installHint: 'https://gradle.org/install/' },
  composer: { command: ['composer', '--version'], name: 'Composer', installHint: 'https://getcomposer.org/download' },
  php:      { command: ['php', '--version'], name: 'PHP', installHint: 'https://www.php.net/downloads' },
  ng:       { command: ['ng', '--version'], name: 'Angular CLI', installHint: 'https://angular.io/cli' },
  nest:     { command: ['nest', '--version'], name: 'Nest CLI', installHint: 'https://docs.nestjs.com/cli/overview' },
};

class ToolDetector {
  /**
   * @param {Object} commandRunner
   * @param {Object} [logger]
   */
  constructor(commandRunner, logger = null) {
    this.commandRunner = commandRunner;
    this.logger = logger || new RuntimeLogger();
  }

  /**
   * @param {string} toolId
   * @returns {import('./ToolDetector').ToolMetadata}
   */
  getToolMetadata(toolId) {
    const metadata = TOOL_DEFINITIONS[toolId];
    if (!metadata) {
      throw new Error(`Tool '${toolId}' is not defined in ToolDetector.`);
    }
    return metadata;
  }

  /**
   * @param {string} toolId
   * @returns {{ id: string, name: string, installHint: string, available: boolean, version: string | null }}
   */
  detect(toolId) {
    const metadata = this.getToolMetadata(toolId);
    const version = this.commandRunner.probe(metadata.command[0], metadata.command.slice(1));
    const available = Boolean(version);
    this.logger.debug(`ToolDetector.detect(${toolId}) => ${available ? version : 'not found'}`);
    return {
      id: toolId,
      name: metadata.name,
      installHint: metadata.installHint,
      available,
      version,
    };
  }

  /**
   * @param {string[]} toolIds
   * @returns {Array<{ id: string, name: string, installHint: string, available: boolean, version: string | null }>}
   */
  detectMany(toolIds) {
    return toolIds.map((toolId) => this.detect(toolId));
  }

  /**
   * @param {string[]} candidates
   * @returns {{ id: string, name: string, installHint: string, available: boolean, version: string | null } | null}
   */
  detectAny(candidates) {
    for (const toolId of candidates) {
      const result = this.detect(toolId);
      if (result.available) return result;
    }
    return null;
  }
}

module.exports = { ToolDetector, TOOL_DEFINITIONS };