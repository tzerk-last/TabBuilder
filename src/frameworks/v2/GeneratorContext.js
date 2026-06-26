// @ts-check
'use strict';

/**
 * GeneratorContext
 * ----------------
 * Objeto de contexto que se pasa a cada generador independiente.
 *
 * Su responsabilidad es DOBLE:
 *   1. Normalizar el `ProjectConfig` que llega de la WebView a una forma
 *      estable y predecible (mismos nombres de campos para todos los generadores).
 *   2. Centralizar las operaciones de escritura y reemplazo de placeholders,
 *      de modo que ningún generador concreto tenga que conocer `fs` ni `path`
 *      directamente. Así la lógica de I/O vive en UN solo lugar.
 *
 * IMPORTANTE (Fase 1): esta clase NO se conecta todavía al flujo real.
 * Es infraestructura inerte. El `projectBuilder` legacy sigue siendo el único
 * camino activo hasta que un combo concreto se migre en una fase posterior.
 *
 * Las operaciones de filesystem se inyectan (parámetro `io`) para que la infra
 * sea testeable con un doble en memoria y para no acoplarla a un módulo de I/O
 * concreto del proyecto. Si no se inyecta, se usa un adaptador por defecto
 * basado en `fs`/`path` equivalente al que usa el builder actual.
 */

const path = require('path');
const fs = require('fs');

/**
 * Adaptador de I/O por defecto. Replica el comportamiento de `ensureDir` /
 * `writeFile` del `projectBuilder` actual para no cambiar la semántica.
 * @type {{ ensureDir: (abs: string) => void, writeFile: (abs: string, content: string) => void, exists: (abs: string) => boolean }}
 */
const DEFAULT_IO = {
  ensureDir(abs) {
    fs.mkdirSync(abs, { recursive: true });
  },
  writeFile(abs, content) {
    fs.writeFileSync(abs, content, 'utf8');
  },
  exists(abs) {
    return fs.existsSync(abs);
  },
};

class GeneratorContext {
  /**
   * @param {import('../../types').ProjectConfig} config  Config crudo de la WebView.
   * @param {Object} [deps]
   * @param {typeof DEFAULT_IO} [deps.io]      Adaptador de filesystem (inyectable para tests).
   * @param {{ info: Function, warn: Function, error: Function, debug: Function }} [deps.logger]
   */
  constructor(config, deps = {}) {
    const cfg = config || /** @type {any} */ ({});

    // ── Campos normalizados (forma estable para todos los generadores) ───────
    /** @type {string} */
    this.projectName = String(cfg.name || '').trim();
    /** @type {string} */
    this.frameworkId = String(cfg.frameworkId || '').trim();
    /** @type {string} */
    this.architectureId = String(cfg.architectureId || 'none').trim() || 'none';
    /** @type {string} */
    this.database = String(cfg.database || 'none').trim() || 'none';
    /** @type {string} */
    this.devops = String(cfg.devops || 'none').trim() || 'none';
    /** @type {string} */
    this.targetFolder = String(cfg.targetFolder || '').trim();

    // Ruta raíz del proyecto a generar. Misma fórmula que el builder actual.
    /** @type {string} */
    this.projectPath = this.targetFolder
      ? path.join(this.targetFolder, this.projectName)
      : '';

    // Acumulador de rutas escritas (relativas a projectPath), igual que
    // `filesWritten` del builder actual, para mantener el contrato BuildResult.
    /** @type {string[]} */
    this.filesWritten = [];

    // ── Dependencias inyectables ─────────────────────────────────────────────
    this._io = deps.io || DEFAULT_IO;
    this._logger = deps.logger || {
      info() {}, warn() {}, error() {}, debug() {},
    };
  }

  /**
   * Reemplaza los placeholders soportados dentro de un texto.
   * Hoy el único placeholder del proyecto es `{PROJECT_NAME}`; se centraliza
   * aquí para que añadir nuevos en el futuro sea un cambio en un solo sitio.
   * @param {string} text
   * @returns {string}
   */
  applyPlaceholders(text) {
    if (typeof text !== 'string' || text.length === 0) return text || '';
    return text.replaceAll('{PROJECT_NAME}', this.projectName);
  }

  /**
   * Crea un directorio (recursivo) relativo al proyecto.
   * @param {string} relDir  Ruta relativa a projectPath. '' o '.' = raíz.
   */
  ensureDir(relDir) {
    const rel = this.applyPlaceholders(relDir || '');
    const abs = rel && rel !== '.' ? path.join(this.projectPath, rel) : this.projectPath;
    this._io.ensureDir(abs);
  }

  /**
   * Escribe un archivo, aplicando placeholders tanto a la ruta como al contenido,
   * creando los directorios intermedios y registrando la ruta en filesWritten.
   * @param {string} relPath   Ruta relativa a projectPath.
   * @param {string} content   Contenido (se le aplican placeholders).
   * @returns {string} la ruta relativa efectivamente escrita.
   */
  writeFile(relPath, content) {
    const rel = this.applyPlaceholders(relPath);
    const abs = path.join(this.projectPath, rel);
    this._io.ensureDir(path.dirname(abs));
    this._io.writeFile(abs, this.applyPlaceholders(content || ''));
    this.filesWritten.push(rel);
    this._logger.debug(`  wrote: ${rel}`);
    return rel;
  }

  /**
   * ¿Existe ya un archivo en la ruta relativa dada? Útil para respetar archivos
   * generados por un paso previo (p. ej. no pisar un README propio del template).
   * @param {string} relPath
   * @returns {boolean}
   */
  exists(relPath) {
    const rel = this.applyPlaceholders(relPath);
    return this._io.exists(path.join(this.projectPath, rel));
  }

  /** @returns {{ info: Function, warn: Function, error: Function, debug: Function }} */
  get logger() {
    return this._logger;
  }
}

module.exports = { GeneratorContext, DEFAULT_IO };
