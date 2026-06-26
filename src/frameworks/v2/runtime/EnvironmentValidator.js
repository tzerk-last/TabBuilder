'use strict';

const { ToolDetector } = require('./ToolDetector');

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
  'spring-boot': [['java'], ['mvn', 'gradle'], ['git']],
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
   * @param {ToolDetector} toolDetector
   */
  constructor(toolDetector) {
    this.toolDetector = toolDetector;
  }

  /**
   * @param {string} frameworkId
   * @param {string} [language]
   * @returns {{ ok: boolean, missing: Array<{ name: string, installHint: string, candidates: string[] }> }}
   */
  validateFrameworkTools(frameworkId, language = '') {
    const requirements = FRAMEWORK_TOOL_REQUIREMENTS[frameworkId] || LANGUAGE_TOOL_REQUIREMENTS[language] || [];
    const missing = [];

    for (const alternatives of requirements) {
      const available = alternatives.some((toolId) => {
        const result = this.toolDetector.detect(toolId);
        return result.available;
      });

      if (!available) {
        const fallbackTool = alternatives[0];
        const metadata = this.toolDetector.getToolMetadata(fallbackTool);
        missing.push({
          name: metadata.name,
          installHint: metadata.installHint,
          candidates: alternatives,
        });
      }
    }

    return { ok: missing.length === 0, missing };
  }
}

module.exports = { EnvironmentValidator };