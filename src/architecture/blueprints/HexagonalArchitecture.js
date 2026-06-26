'use strict';

const { BaseArchitecture } = require('../ArchitectureBlueprint');
const { getEmitter, srcPath } = require('../LanguageEmitters');

/**
 * Hexagonal Architecture (Ports & Adapters).
 * El núcleo de dominio expone PUERTOS (interfaces). Los ADAPTADORES (driving:
 * controllers/CLI; driven: persistencia/APIs externas) implementan o consumen
 * esos puertos. El dominio es agnóstico de toda tecnología.
 */

// Referencia { name, layerPath } de cada puerto: es la MISMA identidad usada
// para generar el archivo de la interfaz, así que cualquier emitter puede
// derivar de aquí el namespace/package/use-path exacto y emitir el import
// correcto en quien la consuma (P0-2).
const INPUT_PORT_REF = { name: 'IManageEntityPort', layerPath: 'Domain/Ports/Input' };
const OUTPUT_PORT_REF = { name: 'IEntityPersistencePort', layerPath: 'Domain/Ports/Output' };

// Tipos de dominio referenciados como parámetro/retorno en los puertos.
// Se generan como clases reales en Domain/Model para que NINGÚN tipo lógico
// quede sin un archivo físico que lo respalde (requisito de consistencia).
const ENTITY_REF = { name: 'Entity', layerPath: 'Domain/Model' };
const COMMAND_REF = { name: 'Command', layerPath: 'Domain/Model' };

// Contrato de cada puerto, definido UNA vez y reutilizado tanto para generar
// la interfaz como para generar los stubs de sus implementaciones (servicio
// y adaptador de persistencia). Evita que interfaz e implementación se
// desincronicen entre sí.
const INPUT_PORT_METHODS = [
  { name: 'handle', returnType: 'void', async: true, parameters: [{ name: 'command', type: 'Command' }] },
];
const OUTPUT_PORT_METHODS = [
  { name: 'persist', returnType: 'void', async: true, parameters: [{ name: 'entity', type: 'Entity' }] },
  { name: 'findById', returnType: 'Entity', nullableReturn: true, async: true, parameters: [{ name: 'id', type: 'Id' }] },
];

class HexagonalArchitecture extends BaseArchitecture {
  constructor() {
    super({
      id: 'hexagonal',
      name: 'Hexagonal Architecture',
      description: 'Ports & Adapters: dominio aislado, puertos de entrada/salida y adaptadores intercambiables.',
      supportedLangs: ['csharp', 'java', 'php', 'python'],
    });
  }

  folders(ctx) {
    const e = getEmitter(ctx.framework);
    return [
      'Domain/Model',
      'Domain/Ports/Input',
      'Domain/Ports/Output',
      'Application/Services',
      'Adapters/Input/Rest',
      'Adapters/Output/Persistence',
      'Config',
    ].map((d) => `${e.base}/${d}`);
  }

  interfaces(ctx) {
    const e = getEmitter(ctx.framework);
    return {
      // Tipos de dominio referenciados por los puertos: generados primero
      // para que CommandRef/EntityRef apunten siempre a un archivo real.
      [srcPath(e, ENTITY_REF.layerPath, ENTITY_REF.name)]: e.domainType(ctx, {
        name: ENTITY_REF.name, layerPath: ENTITY_REF.layerPath,
      }),
      [srcPath(e, COMMAND_REF.layerPath, COMMAND_REF.name)]: e.domainType(ctx, {
        name: COMMAND_REF.name, layerPath: COMMAND_REF.layerPath,
      }),
      // Puerto de entrada (driving)
      [srcPath(e, INPUT_PORT_REF.layerPath, INPUT_PORT_REF.name)]: e.iface(ctx, {
        name: INPUT_PORT_REF.name, layerPath: INPUT_PORT_REF.layerPath,
        methods: INPUT_PORT_METHODS,
        refs: [COMMAND_REF],
      }),
      // Puerto de salida (driven)
      [srcPath(e, OUTPUT_PORT_REF.layerPath, OUTPUT_PORT_REF.name)]: e.iface(ctx, {
        name: OUTPUT_PORT_REF.name, layerPath: OUTPUT_PORT_REF.layerPath,
        methods: OUTPUT_PORT_METHODS,
        refs: [ENTITY_REF],
      }),
    };
  }

  services(ctx) {
    const e = getEmitter(ctx.framework);
    // El servicio de aplicación implementa el puerto de entrada y depende del de salida.
    return {
      [srcPath(e, 'Application/Services', 'EntityService')]: e.service(ctx, {
        name: 'EntityService', layerPath: 'Application/Services',
        iface: INPUT_PORT_REF.name,
        ifaceRef: INPUT_PORT_REF,
        ifaceMethods: INPUT_PORT_METHODS,
        deps: [{ type: OUTPUT_PORT_REF.name, field: 'persistence', ref: OUTPUT_PORT_REF }],
        typeRefs: [COMMAND_REF],
      }),
    };
  }

  repositories(ctx) {
    const e = getEmitter(ctx.framework);
    // Adaptador de salida que implementa el puerto de persistencia.
    return {
      [srcPath(e, 'Adapters/Output/Persistence', 'EntityPersistenceAdapter')]: e.repo(ctx, {
        name: 'EntityPersistenceAdapter', layerPath: 'Adapters/Output/Persistence',
        iface: OUTPUT_PORT_REF.name,
        ifaceRef: OUTPUT_PORT_REF,
        ifaceMethods: OUTPUT_PORT_METHODS,
        typeRefs: [ENTITY_REF],
      }),
    };
  }
}

module.exports = { HexagonalArchitecture };
