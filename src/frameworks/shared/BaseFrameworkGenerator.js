'use strict';

const fs = require('fs');
const path = require('path');
const { RuntimeFacade } = require('../RuntimeFacade');

/**
 * BaseFrameworkGenerator
 * ----------------------
 * Base class for future official-generator adapters.
 *
 * It defines the contract that each framework adapter must implement, plus
 * the small set of helpers that were copy-pasted identically across the
 * Laravel/Spring Boot/ASP.NET official generators (error formatting, running
 * a shell command, and the generate() prologue that validates the project
 * name/folder and required tools before delegating to framework-specific
 * scaffolding).
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
  async generate(_config) {
    throw new Error('generate() must be implemented by subclasses');
  }

  /** @param {unknown} error */
  errMsg(error) {
    return error instanceof Error ? error.message : String(error);
  }

  /** @param {string} projectPath */
  invalidConfigResult(projectPath) {
    return {
      success: false,
      projectPath,
      filesWritten: [],
      error: 'Nombre de proyecto o carpeta de destino inválidos.',
    };
  }

  /**
   * Shared generate() prologue/epilogue: parses name/targetFolder, validates
   * required tools, then delegates the actual scaffolding to `build`. Used
   * by official generators (Laravel, Spring Boot) that don't track
   * individual filesWritten themselves.
   * @param {import('../../types').ProjectConfig} config
   * @param {Object} deps
   * @param {(runtime: Object, projectPath: string, projectName: string) => Promise<void>} build
   */
  async runOfficialGenerate(config, deps, build) {
    const runtime = deps.runtime || this.runtime || new RuntimeFacade({ logger: deps.logger });
    const projectName = String(config.name || '').trim();
    const targetFolder = String(config.targetFolder || '').trim();
    const projectPath = path.join(targetFolder, projectName);

    if (!projectName || !targetFolder) {
      return this.invalidConfigResult(projectPath);
    }

    const validation = runtime.environmentValidator.validateFrameworkTools(this.frameworkId, this.lang);
    if (!validation.ok) {
      return {
        success: false,
        projectPath,
        filesWritten: [],
        error: validation.missing.map((tool) => `${tool.name} (${tool.candidates.join(' / ')})`).join(', '),
      };
    }

    try {
      await build(runtime, projectPath, projectName);
      return { success: true, projectPath, filesWritten: [] };
    } catch (error) {
      return { success: false, projectPath, filesWritten: [], error: this.errMsg(error) };
    }
  }

  /**
   * @param {string} projectPath
   * @param {string} frameworkLabel Used verbatim in the "must be empty" error message.
   */
  prepareProjectDirectory(projectPath, frameworkLabel) {
    if (fs.existsSync(projectPath) && !fs.statSync(projectPath).isDirectory()) {
      throw new Error(`El directorio destino existe y no es una carpeta válida: ${projectPath}`);
    }

    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    const entries = fs.readdirSync(projectPath).filter((entry) => entry !== '.gitkeep');
    if (entries.length > 0) {
      throw new Error(`El directorio destino debe estar vacío para generar el proyecto ${frameworkLabel}.`);
    }
  }

  /**
   * @param {Object} runtime
   * @param {string} cmd
   * @param {string[]} args
   * @param {string} cwd
   * @param {(line: string) => boolean} [filterFn] Optional — lines matching
   *   this predicate are logged to the Output Channel only, not surfaced to
   *   the caller's onData/UI stream. Existing callers that don't pass it are
   *   unaffected (behaves exactly as before).
   */
  async runCommand(runtime, cmd, args, cwd, filterFn = null) {
    const result = await runtime.commandRunner.run(cmd, args, cwd, (line) => runtime.logger.info(line), null, undefined, filterFn);
    if (!result.ok) {
      throw new Error(result.stderr.trim() || result.stdout.trim() || `${cmd} ${args.join(' ')} falló.`);
    }
    return result;
  }
}

module.exports = { BaseFrameworkGenerator };