'use strict';

const { RuntimeLogger } = require('./Logger');

const TOOL_DEFINITIONS = {
  node:     { command: ['node', '--version'], name: 'Node.js', installHint: 'https://nodejs.org' },
  npm:      { command: ['npm', '--version'], name: 'npm', installHint: 'Incluido con Node.js — reinstala Node.js' },
  pnpm:     { command: ['pnpm', '--version'], name: 'pnpm', installHint: 'https://pnpm.io/installation' },
  npx:      { command: ['npx', '--version'], name: 'npx', installHint: 'Incluido con npm — reinstala Node.js' },
  git:      { command: ['git', '--version'], name: 'Git', installHint: 'https://git-scm.com/downloads' },
  // Python's executable name isn't fixed across platforms: python.org's
  // Windows installer only registers `python`, most POSIX distros/Homebrew
  // only register `python3`. Same fallback strategy (and the same "is this
  // actually Python 3" guard) as dependencyInstaller.js's findPython() —
  // centralized here via CommandRunner.resolveExecutable() so the project
  // doesn't grow a second, divergent implementation.
  python:   { candidates: ['python3', 'python'], args: ['--version'], validate: (v) => /python\s*3/i.test(v), name: 'Python 3', installHint: 'https://python.org/downloads' },
  uv:       { command: ['uv', '--version'], name: 'uv', installHint: 'https://github.com/encode/uv' },
  dotnet:   { command: ['dotnet', '--version'], name: '.NET SDK', installHint: 'https://dotnet.microsoft.com/download' },
  curl:     { command: ['curl', '--version'], name: 'curl', installHint: 'https://curl.se/download.html' },
  wget:     { command: ['wget', '--version'], name: 'wget', installHint: 'https://www.gnu.org/software/wget/' },
  unzip:    { command: ['unzip', '-v'], name: 'unzip', installHint: 'Instala unzip con tu gestor de paquetes' },
  // Used by Spring Boot's Initializr fallback (starter.tgz) instead of unzip:
  // tar comes preinstalled on Windows 10/11, macOS and every mainstream
  // Linux distro, unlike unzip (absent on stock Windows) or GNU tar's ZIP
  // support (nonexistent — verified empirically, GNU tar can't read .zip).
  tar:      { command: ['tar', '--version'], name: 'tar', installHint: 'Incluido en Windows 10/11, macOS y la mayoría de distribuciones Linux — instálalo con el gestor de paquetes de tu sistema si falta' },
  spring:   { command: ['spring', '--version'], name: 'Spring CLI', installHint: 'https://spring.io/tools' },
  java:     { command: ['java', '--version'], name: 'Java (JDK)', installHint: 'https://adoptium.net' },
  mvn:      { command: ['mvn', '--version'], name: 'Maven', installHint: 'https://maven.apache.org/download.cgi' },
  gradle:   { command: ['gradle', '--version'], name: 'Gradle', installHint: 'https://gradle.org/install/' },
  composer: { command: ['composer', '--version'], name: 'Composer', installHint: 'https://getcomposer.org/download' },
  php:      { command: ['php', '--version'], name: 'PHP', installHint: 'https://www.php.net/downloads' },
  ng:       { command: ['ng', '--version'], name: 'Angular CLI', installHint: 'https://angular.io/cli' },
  nest:     { command: ['nest', '--version'], name: 'Nest CLI', installHint: 'https://docs.nestjs.com/cli/overview' },
  // Informational only (System Status panel) — no framework generator in
  // this codebase actually depends on Docker, devops/generator.js only
  // writes Dockerfile/docker-compose.yml templates to disk. Like every
  // other entry here, this confirms the CLI responds, not that the daemon
  // is running (`docker info`'s first line isn't a usable version string,
  // and would report "unavailable" whenever Docker Desktop just isn't
  // started yet, which is a distinct, expected state — not "not installed").
  docker:   { command: ['docker', '--version'], name: 'Docker', installHint: 'https://www.docker.com/products/docker-desktop' },
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

    // Tools with a single, fixed executable name use `command: [exe, ...args]`.
    // Tools whose executable name varies by platform (currently: python) use
    // `candidates`/`args`/`validate` and get resolved via the same central
    // multi-candidate strategy in CommandRunner.resolveExecutable().
    let exe, args;
    if (metadata.candidates) {
      exe = this.commandRunner.resolveExecutable(metadata.candidates, metadata.args, undefined, metadata.validate);
      args = metadata.args;
    } else {
      [exe, ...args] = metadata.command;
    }

    const version = exe ? this.commandRunner.probe(exe, args) : null;
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