'use strict';

/**
 * ArchitectureRegistry
 * --------------------
 * Registro ABIERTO de arquitecturas. Aplica el principio Open/Closed:
 * agregar una nueva arquitectura = llamar a `register(...)` con un blueprint nuevo.
 * NUNCA hay que modificar este archivo ni los existentes para extender el sistema.
 *
 * Un "blueprint" es un objeto que implementa el contrato ArchitectureBlueprint
 * (ver ./ArchitectureBlueprint.js). El registro no conoce los detalles de cada
 * arquitectura: solo las almacena y las localiza por id. (Inversión de dependencias:
 * el orquestador depende de la abstracción, no de cada blueprint concreto.)
 */
class ArchitectureRegistry {
  constructor() {
    /** @type {Map<string, import('./ArchitectureBlueprint').ArchitectureBlueprint>} */
    this._blueprints = new Map();
  }

  /**
   * Registra un blueprint de arquitectura.
   * @param {import('./ArchitectureBlueprint').ArchitectureBlueprint} blueprint
   */
  register(blueprint) {
    if (!blueprint || typeof blueprint.id !== 'string') {
      throw new Error('Blueprint inválido: requiere una propiedad "id".');
    }
    if (typeof blueprint.generate !== 'function') {
      throw new Error(`Blueprint "${blueprint.id}" debe implementar generate(ctx).`);
    }
    this._blueprints.set(blueprint.id, blueprint);
    return this;
  }

  /** @param {string} id */
  has(id) {
    return this._blueprints.has(id);
  }

  /** @param {string} id */
  get(id) {
    return this._blueprints.get(id) || null;
  }

  /** Lista de metadatos para poblar UI sin acoplarse a las clases concretas. */
  list() {
    return [...this._blueprints.values()].map((b) => ({
      id: b.id,
      name: b.name || b.id,
      description: b.description || '',
      supportedLangs: b.supportedLangs || [],
    }));
  }

  /**
   * Arquitecturas aplicables a un lenguaje/framework dado.
   * @param {string} lang
   */
  listForLang(lang) {
    return this.list().filter(
      (b) => !b.supportedLangs.length || b.supportedLangs.includes(lang)
    );
  }
}

module.exports = { ArchitectureRegistry };
