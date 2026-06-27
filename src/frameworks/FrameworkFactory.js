// @ts-check
'use strict';

/**
 * FrameworkFactory
 * ----------------
 * Único punto de resolución de generadores en el sistema v4.
 *
 * Dada una combinación (frameworkId, architectureId), decide si existe un
 * generador independiente migrado para ella y, en tal caso, lo instancia.
 *
 * Diseño clave para una migración incremental SIN regresiones:
 *
 *   - `has(framework, arch)` permite al `projectBuilder` preguntar primero
 *     "¿este combo ya está migrado?" y, si NO, caer limpiamente al flujo legacy.
 *     Así un framework migrado no afecta a los que todavía no lo están.
 *
 *   - `get(framework, arch)` devuelve la instancia migrada o lanza un error
 *     explícito si no existe (para usarse sólo cuando `has` ya confirmó).
 *
 *   - `resolve(framework, arch)` es la variante segura: devuelve la instancia
 *     o `null` sin lanzar.
 *
 * No contiene lógica específica de ningún framework: sólo consulta el `registry`.
 * No hay `switch` ni `if` por framework aquí; añadir combos es añadir entradas
 * al registro, no ramas a esta clase.
 */

const { REGISTRY } = require('./registry');

/**
 * Construye la clave canónica del registro a partir de la combinación.
 * Normaliza a minúsculas y recorta espacios para tolerar variaciones de la UI.
 * @param {string} frameworkId
 * @param {string} architectureId
 * @returns {string}
 */
function keyOf(frameworkId, architectureId) {
  const fw = String(frameworkId || '').trim().toLowerCase();
  const arch = String(architectureId || '').trim().toLowerCase();
  return `${fw}/${arch}`;
}

const FrameworkFactory = {
  /**
   * @param {string} frameworkId
   * @param {string} architectureId
   * @returns {boolean} true si existe un generador migrado para esta combinación.
   */
  has(frameworkId, architectureId) {
    return Object.prototype.hasOwnProperty.call(
      REGISTRY,
      keyOf(frameworkId, architectureId),
    );
  },

  /**
   * Devuelve la instancia del generador migrado, o lanza si no existe.
   * Usar sólo tras comprobar `has()`.
   * @param {string} frameworkId
   * @param {string} architectureId
   * @returns {import('./shared/BaseFrameworkGenerator').BaseFrameworkGenerator}
   */
  get(frameworkId, architectureId) {
    const key = keyOf(frameworkId, architectureId);
    const make = REGISTRY[key];
    if (typeof make !== 'function') {
      throw new Error(
        `No existe un generador migrado para la combinación "${key}". ` +
        `Comprueba con FrameworkFactory.has() antes de llamar a get().`,
      );
    }
    return make();
  },

  /**
   * Variante segura: devuelve la instancia migrada o `null` si no existe.
   * @param {string} frameworkId
   * @param {string} architectureId
   * @returns {import('./shared/BaseFrameworkGenerator').BaseFrameworkGenerator | null}
   */
  resolve(frameworkId, architectureId) {
    return this.has(frameworkId, architectureId)
      ? this.get(frameworkId, architectureId)
      : null;
  },

  /**
   * Lista de claves "framework/arch" actualmente migradas. Útil para depurar
   * y para que `projectBuilder` pueda registrar qué combos usan el camino nuevo.
   * @returns {string[]}
   */
  migratedCombos() {
    return Object.keys(REGISTRY).sort();
  },
};

module.exports = { FrameworkFactory, keyOf };
