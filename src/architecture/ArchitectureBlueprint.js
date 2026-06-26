'use strict';

/**
 * @typedef {Object} ArchitectureContext
 * @property {string} projectName   Nombre del proyecto (PascalCase / sin espacios).
 * @property {string} framework     Id del framework destino: 'aspnet'|'spring-boot'|'laravel'|'fastapi'|...
 * @property {string} lang          Lenguaje del framework: 'csharp'|'java'|'php'|'python'|...
 * @property {Object} [options]     Opciones libres por arquitectura (ej. nombre de agregado DDD).
 */

/**
 * @typedef {Object} ArchitectureBlueprint
 * @property {string} id                 Identificador único: 'mvc'|'clean'|'hexagonal'|'ddd'.
 * @property {string} name               Nombre legible.
 * @property {string} description        Descripción corta para la UI.
 * @property {string[]} supportedLangs   Lenguajes soportados (vacío = todos).
 * @property {(ctx: ArchitectureContext) => { folders: string[], files: Record<string,string> }} generate
 */

/**
 * BaseArchitecture
 * ----------------
 * Clase base opcional que implementa el patrón Template Method.
 * Cada arquitectura concreta hereda y rellena solo las piezas que le importan
 * (carpetas, interfaces, servicios, repos, DTOs, casos de uso, config).
 *
 * Principio de Responsabilidad Única: una subclase describe UNA arquitectura.
 * Principio de Sustitución de Liskov: cualquier subclase puede usarse donde se
 * espere un ArchitectureBlueprint sin romper al orquestador.
 *
 * El detalle "cómo se ve una interfaz/servicio/DTO en cada lenguaje" NO vive aquí:
 * se delega a un LanguageEmitter (Strategy), de modo que agregar un framework
 * nuevo tampoco obliga a tocar las arquitecturas.
 */
class BaseArchitecture {
  /**
   * @param {{ id:string, name:string, description:string, supportedLangs?:string[] }} meta
   */
  constructor(meta) {
    this.id = meta.id;
    this.name = meta.name;
    this.description = meta.description;
    this.supportedLangs = meta.supportedLangs || [];
  }

  /**
   * Template Method. Orquesta la generación en un orden fijo;
   * las subclases sobreescriben los "hooks" que necesiten.
   * @param {ArchitectureContext} ctx
   */
  generate(ctx) {
    const folders = this.folders(ctx);
    const files = {};
    const sections = [
      this.interfaces(ctx),
      this.dtos(ctx),
      this.repositories(ctx),
      this.services(ctx),
      this.useCases(ctx),
      this.config(ctx),
      this.entrypoint(ctx),
    ];
    for (const section of sections) {
      if (section) Object.assign(files, section);
    }
    return { folders, files };
  }

  // ── Hooks (todos opcionales; por defecto no aportan nada) ──────────────────
  /** @returns {string[]} */
  folders(_ctx) { return []; }
  /** @returns {Record<string,string>|null} */
  interfaces(_ctx) { return null; }
  dtos(_ctx) { return null; }
  repositories(_ctx) { return null; }
  services(_ctx) { return null; }
  useCases(_ctx) { return null; }
  config(_ctx) { return null; }
  entrypoint(_ctx) { return null; }
}

module.exports = { BaseArchitecture };
