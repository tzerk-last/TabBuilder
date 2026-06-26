'use strict';

const fs = require('fs');
const path = require('path');

const { ArchitectureRegistry } = require('./ArchitectureRegistry');
const { getEmitter } = require('./LanguageEmitters');

const { MvcArchitecture } = require('./blueprints/MvcArchitecture');
const { CleanArchitecture } = require('./blueprints/CleanArchitecture');
const { HexagonalArchitecture } = require('./blueprints/HexagonalArchitecture');
const { DddArchitecture } = require('./blueprints/DddArchitecture');

/**
 * Registro por defecto. ÚNICO lugar donde se enumeran las arquitecturas built-in.
 * Para añadir una arquitectura futura: crear su blueprint en ./blueprints y
 * registrarla aquí (o desde fuera con `registry.register(...)`). Nada más cambia.
 */
const defaultRegistry = new ArchitectureRegistry()
  .register(new MvcArchitecture())
  .register(new CleanArchitecture())
  .register(new HexagonalArchitecture())
  .register(new DddArchitecture());

/**
 * Frameworks que actualmente tienen emitter de arquitecturas avanzadas.
 * (El resto del builder sigue funcionando con su flujo de plantillas planas.)
 */
const ARCHITECTURE_FRAMEWORKS = ['aspnet', 'spring-boot', 'laravel', 'fastapi'];

/**
 * ArchitectureFactory (patrón Factory Method).
 * Resuelve el blueprint pedido y produce el plan de generación
 * (carpetas + archivos), validando que el framework tenga emitter.
 */
class ArchitectureFactory {
  /** @param {ArchitectureRegistry} [registry] */
  constructor(registry = defaultRegistry) {
    this._registry = registry;
  }

  /** Metadatos para poblar la UI. */
  available() {
    return this._registry.list();
  }

  availableForFramework(framework) {
    if (!ARCHITECTURE_FRAMEWORKS.includes(framework)) return [];
    return this._registry.list();
  }

  /**
   * Crea el plan de la arquitectura para un framework concreto.
   * @param {string} architectureId
   * @param {{ projectName:string, framework:string, lang?:string, options?:object }} ctx
   * @returns {{ folders:string[], files:Record<string,string> }}
   */
  create(architectureId, ctx) {
    const blueprint = this._registry.get(architectureId);
    if (!blueprint) {
      throw new Error(
        `Arquitectura "${architectureId}" no registrada. ` +
        `Disponibles: ${this.available().map((a) => a.id).join(', ')}.`
      );
    }
    // Falla temprano si el framework no tiene emitter (mensaje claro).
    getEmitter(ctx.framework);
    return blueprint.generate(ctx);
  }
}

/**
 * Escribe el plan en disco. Misma convención (no sobreescribe) y misma forma de
 * retorno { written, skipped } que devopsBuilder.writeDevOpsFiles, para encajar
 * sin sorpresas con el resto de la extensión.
 */
function writeArchitectureFiles(plan, targetPath) {
  const written = [];
  const skipped = [];

  for (const folder of plan.folders || []) {
    const dir = path.join(targetPath, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  for (const [filePath, content] of Object.entries(plan.files || {})) {
    const fullPath = path.join(targetPath, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (fs.existsSync(fullPath)) {
      skipped.push(filePath);
    } else {
      fs.writeFileSync(fullPath, content, 'utf-8');
      written.push(filePath);
    }
  }

  return { written, skipped };
}

module.exports = {
  ArchitectureFactory,
  ArchitectureRegistry,
  defaultRegistry,
  writeArchitectureFiles,
  ARCHITECTURE_FRAMEWORKS,
};
