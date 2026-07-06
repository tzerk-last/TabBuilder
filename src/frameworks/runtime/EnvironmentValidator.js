'use strict';

const FRAMEWORK_TOOL_REQUIREMENTS = {
  aspnet:      [['dotnet'], ['git']],
  'react-vite': [['node'], ['npm'], ['git']],
  'vue-vite':   [['node'], ['npm'], ['git']],
  nextjs:       [['node'], ['npm'], ['git']],
  express:      [['node'], ['npm'], ['git']],
  nestjs:       [['node'], ['npm'], ['git']],
  angular:      [['node'], ['npm'], ['git'], ['ng']],
  laravel:      [['php'], ['composer'], ['git']],
  symfony:      [['php'], ['composer'], ['git']],
  'spring-boot': [['java'], ['git'], ['curl', 'wget', 'spring'], ['tar', 'spring']],
  quarkus:      [['java'], ['mvn', 'gradle'], ['git']],
  micronaut:    [['java'], ['mvn', 'gradle'], ['git']],
  fastapi:      [['uv', 'python'], ['git']],
  django:       [['python'], ['git']],
  flask:        [['python'], ['git']],
  litestar:     [['python'], ['git']],
};

const LANGUAGE_TOOL_REQUIREMENTS = {
  js:      [['node'], ['npm'], ['git']],
  python:  [['python'], ['git']],
  csharp:  [['dotnet'], ['git']],
  java:    [['java'], ['git']],
  php:     [['php'], ['git']],
};

class EnvironmentValidator {
  /**
   * @param {import('./ToolDetector').ToolDetector} toolDetector
   */
  constructor(toolDetector) {
    this.toolDetector = toolDetector;
  }

  /**
   * @param {string} frameworkId
   * @param {string} [language]
   * @returns {{
   *   ok: boolean,
   *   missing: Array<{ name: string, installHint: string, candidates: string[] }>,
   *   checked: Array<{ id: string, name: string, available: boolean, version: string|null, installHint: string, candidates: string[] }>,
   * }}
   */
  validateFrameworkTools(frameworkId, language = '') {
    const requirements = FRAMEWORK_TOOL_REQUIREMENTS[frameworkId] || LANGUAGE_TOOL_REQUIREMENTS[language] || [];
    const missing = [];
    const checked = [];

    for (const alternatives of requirements) {
      // Manual loop (not .some()) so we stop probing at the first available
      // candidate — same short-circuit behavior as before, same number of
      // detect() calls for every existing caller. `checked` is built from
      // whichever candidate actually settled the requirement, not from
      // probing every alternative unconditionally.
      let found = null;
      for (const toolId of alternatives) {
        const result = this.toolDetector.detect(toolId);
        if (result.available) { found = result; break; }
      }

      const fallbackTool = alternatives[0];
      const metadata = this.toolDetector.getToolMetadata(fallbackTool);
      checked.push({
        id: fallbackTool,
        name: found ? found.name : metadata.name,
        available: Boolean(found),
        version: found ? found.version : null,
        installHint: metadata.installHint,
        candidates: alternatives,
      });

      if (!found) {
        missing.push({
          name: metadata.name,
          installHint: metadata.installHint,
          candidates: alternatives,
        });
      }
    }

    return { ok: missing.length === 0, missing, checked };
  }
}

module.exports = { EnvironmentValidator };