// @ts-check
'use strict';

/**
 * BaseGenerator
 * -------------
 * Clase base de TODOS los generadores independientes (uno por combinación
 * Framework + Arquitectura). Define el ESQUELETO del proceso de generación
 * (patrón Template Method) y deja que cada subclase rellene únicamente los
 * pasos que le competen.
 *
 * Filosofía del rediseño v4:
 *   - No hay blueprint genérico compartido.
 *   - Cada generador concreto conoce SU propia estructura.
 *   - `BaseGenerator` no impone carpetas ni archivos: sólo ordena los pasos y
 *     garantiza el contrato de salida (BuildResult) y el manejo de errores.
 *
 * Pasos del pipeline (en orden). Todos tienen una implementación por defecto
 * que NO hace nada (no-op), de modo que un generador concreto sólo sobreescribe
 * lo que necesita. Esto evita "ifs gigantes": la variación vive en las clases,
 * no en condicionales.
 *
 *   1. structure(ctx)     → crear carpetas propias
 *   2. files(ctx)         → crear archivos propios (con placeholders)
 *   3. devops(ctx)        → generar Dockerfile / CI propios de la combinación
 *   4. readme(ctx)        → generar README propio
 *   5. dependencies(ctx)  → instalar dependencias si corresponde (async)
 *
 * IMPORTANTE (Fase 1): no existe ninguna subclase todavía. Esta clase es
 * infraestructura inerte; nada del flujo actual la instancia. Las subclases
 * concretas se crearán al migrar cada framework en fases posteriores.
 */

const { GeneratorContext } = require('./GeneratorContext');

class BaseGenerator {
  /**
   * @param {Object} [meta]  Metadatos declarativos de la combinación.
   * @param {string} [meta.frameworkId]
   * @param {string} [meta.architectureId]
   * @param {string} [meta.lang]
   * @param {number} [meta.port]
   */
  constructor(meta = {}) {
    /** @type {string} */
    this.frameworkId = meta.frameworkId || '';
    /** @type {string} */
    this.architectureId = meta.architectureId || '';
    /** @type {string} */
    this.lang = meta.lang || '';
    /** @type {number|undefined} */
    this.port = meta.port;
  }

  // ── Pasos sobreescribibles (no-op por defecto) ─────────────────────────────

  /**
   * Crea las carpetas propias de la combinación.
   * @param {GeneratorContext} _ctx
   * @returns {void|Promise<void>}
   */
  structure(_ctx) {}

  /**
   * Crea los archivos propios de la combinación.
   * @param {GeneratorContext} _ctx
   * @returns {void|Promise<void>}
   */
  files(_ctx) {}

  /**
   * Genera los archivos de DevOps propios (Dockerfile, CI, etc.).
   * Debe respetar `ctx.devops` ('none' = no generar nada).
   * @param {GeneratorContext} _ctx
   * @returns {void|Promise<void>}
   */
  devops(_ctx) {}

  /**
   * Genera el README propio de la combinación.
   * @param {GeneratorContext} _ctx
   * @returns {void|Promise<void>}
   */
  readme(_ctx) {}

  /**
   * Instala dependencias si corresponde. Por defecto no hace nada; los
   * generadores que lo necesiten (Node, etc.) lo sobreescriben. Este paso
   * es deliberadamente el último y se considera NO fatal por el orquestador
   * de fases superiores (igual que el flujo actual).
   * @param {GeneratorContext} _ctx
   * @returns {void|Promise<void>}
   */
  dependencies(_ctx) {}

  // ── Orquestación (no sobreescribir salvo necesidad real) ───────────────────

  /**
   * Ejecuta el pipeline completo y devuelve un BuildResult compatible con el
   * que produce el `projectBuilder` actual, para no romper a quien lo consume.
   *
   * El manejo de errores imita al builder legacy: si un paso estructural falla,
   * se devuelve `success:false` con la ruta y los archivos escritos hasta el
   * momento, para que el llamador pueda ofrecer rollback. Los pasos opcionales
   * (devops, readme, dependencies) no son fatales.
   *
   * @param {import('../../types').ProjectConfig} config
   * @param {Object} [deps]  Dependencias inyectables hacia el GeneratorContext.
   * @returns {Promise<import('../../types').BuildResult & { failedAt?: string }>}
   */
  async generate(config, deps = {}) {
    const ctx = new GeneratorContext(config, deps);
    let failedAt = '';

    try {
      // ── Pasos estructurales (fatales) ───────────────────────────────────────
      failedAt = 'directorio raíz';
      ctx.ensureDir('');

      failedAt = 'estructura de carpetas';
      await this.structure(ctx);

      failedAt = 'archivos del framework';
      await this.files(ctx);

      // ── Pasos opcionales (no fatales) ───────────────────────────────────────
      try {
        failedAt = 'archivos DevOps';
        await this.devops(ctx);
      } catch (e) {
        ctx.logger.warn(`DevOps step failed (non-fatal): ${errMsg(e)}`);
      }

      try {
        failedAt = 'README.md';
        await this.readme(ctx);
      } catch (e) {
        ctx.logger.warn(`README step failed (non-fatal): ${errMsg(e)}`);
      }

      try {
        failedAt = 'instalación de dependencias';
        await this.dependencies(ctx);
      } catch (e) {
        ctx.logger.warn(`Dependencies step failed (non-fatal): ${errMsg(e)}`);
      }

      ctx.logger.info(`Build complete: ${ctx.filesWritten.length} files written`);
      return {
        success: true,
        projectPath: ctx.projectPath,
        filesWritten: ctx.filesWritten,
      };
    } catch (err) {
      const msg = errMsg(err);
      ctx.logger.error(`Build failed at "${failedAt}": ${msg}`);
      return {
        success: false,
        projectPath: ctx.projectPath,
        filesWritten: ctx.filesWritten,
        failedAt,
        error: msg,
      };
    }
  }
}

/**
 * @param {unknown} e
 * @returns {string}
 */
function errMsg(e) {
  return e instanceof Error ? e.message : String(e);
}

module.exports = { BaseGenerator };
