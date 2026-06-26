'use strict';

/**
 * BaseFrameworkGenerator
 * ----------------------
 * Base class for future official-generator adapters.
 *
 * It defines the contract that each framework adapter must implement.
 *
 * Phase 1: this file is a stable interface for the migration pipeline.
 */
class BaseFrameworkGenerator {
  /**
   * @param {Object} meta
   * @param {string} meta.frameworkId
   * @param {string} meta.architectureId
   * @param {string} meta.lang
   * @param {Object} runtime
   */
  constructor(meta, runtime) {
    this.frameworkId = String(meta.frameworkId || '').trim();
    this.architectureId = String(meta.architectureId || 'standard').trim();
    this.lang = String(meta.lang || '').trim();
    this.runtime = runtime;
  }

  /**
   * Determines whether this adapter supports the requested configuration.
   * @param {import('../../types').ProjectConfig} config
   * @returns {boolean}
   */
  supports(config) {
    return config.frameworkId === this.frameworkId;
  }

  /**
   * Executes the official generator and returns a result compatible with the
   * existing build pipeline.
   * @param {import('../../types').ProjectConfig} config
   * @returns {Promise<import('../../types').BuildResult>}
   */
  async generate(config) {
    throw new Error('generate() must be implemented by subclasses');
  }
}

module.exports = { BaseFrameworkGenerator };