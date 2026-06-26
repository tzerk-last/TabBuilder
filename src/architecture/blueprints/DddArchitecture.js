'use strict';

const { BaseArchitecture } = require('../ArchitectureBlueprint');
const { getEmitter, srcPath } = require('../LanguageEmitters');

/**
 * Domain-Driven Design (DDD) táctico.
 * Organiza por capas estratégicas con bloques tácticos: Aggregates, Entities,
 * Value Objects, Domain Events, Repositories (interfaces en dominio), Application
 * Services / Command Handlers, e Infrastructure como implementación.
 */

// Referencia { name, layerPath } del repositorio de agregados: es la MISMA
// identidad usada para generar el archivo de la interfaz, así el emitter
// deriva el import exacto en quien la consuma (P0-2).
const REPOSITORY_REF = { name: 'IAggregateRepository', layerPath: 'Domain/Repositories' };

// Tipo de dominio referenciado como parámetro/retorno del repositorio. Se
// genera como clase real en Domain/Aggregates (carpeta que esta arquitectura
// ya reserva) para que la referencia NUNCA apunte a un tipo inexistente.
const AGGREGATE_REF = { name: 'Aggregate', layerPath: 'Domain/Aggregates' };

// Contrato del repositorio de agregados, compartido entre la interfaz y su
// implementación concreta para que ambas no se desincronicen.
const REPOSITORY_METHODS = [
  { name: 'findById', returnType: 'Aggregate', nullableReturn: true, parameters: [{ name: 'id', type: 'Id' }] },
  { name: 'add', returnType: 'void', parameters: [{ name: 'aggregate', type: 'Aggregate' }] },
];

class DddArchitecture extends BaseArchitecture {
  constructor() {
    super({
      id: 'ddd',
      name: 'Domain Driven Design',
      description: 'DDD táctico: agregados, value objects, eventos de dominio, repositorios y servicios de aplicación.',
      supportedLangs: ['csharp', 'java', 'php', 'python'],
    });
  }

  folders(ctx) {
    const e = getEmitter(ctx.framework);
    return [
      'Domain/Aggregates',
      'Domain/Entities',
      'Domain/ValueObjects',
      'Domain/Events',
      'Domain/Repositories',
      'Application/Commands',
      'Application/Queries',
      'Application/Services',
      'Infrastructure/Persistence',
      'Infrastructure/Config',
    ].map((d) => `${e.base}/${d}`);
  }

  interfaces(ctx) {
    const e = getEmitter(ctx.framework);
    return {
      // Tipo de dominio referenciado por el repositorio: generado primero
      // para que AGGREGATE_REF apunte siempre a un archivo real.
      [srcPath(e, AGGREGATE_REF.layerPath, AGGREGATE_REF.name)]: e.domainType(ctx, {
        name: AGGREGATE_REF.name, layerPath: AGGREGATE_REF.layerPath,
      }),
      // El repositorio se declara en el DOMINIO (DIP).
      [srcPath(e, REPOSITORY_REF.layerPath, REPOSITORY_REF.name)]: e.iface(ctx, {
        name: REPOSITORY_REF.name, layerPath: REPOSITORY_REF.layerPath,
        methods: REPOSITORY_METHODS,
        refs: [AGGREGATE_REF],
      }),
    };
  }

  dtos(ctx) {
    const e = getEmitter(ctx.framework);
    // Value Object como "DTO inmutable".
    return {
      [srcPath(e, 'Domain/ValueObjects', 'EntityId')]: e.dto(ctx, {
        name: 'EntityId', layerPath: 'Domain/ValueObjects',
        fields: [{ type: 'string', name: 'value' }],
      }),
    };
  }

  repositories(ctx) {
    const e = getEmitter(ctx.framework);
    return {
      [srcPath(e, 'Infrastructure/Persistence', 'AggregateRepository')]: e.repo(ctx, {
        name: 'AggregateRepository', layerPath: 'Infrastructure/Persistence',
        iface: REPOSITORY_REF.name,
        ifaceRef: REPOSITORY_REF,
        ifaceMethods: REPOSITORY_METHODS,
        typeRefs: [AGGREGATE_REF],
      }),
    };
  }

  useCases(ctx) {
    const e = getEmitter(ctx.framework);
    return {
      [srcPath(e, 'Application/Commands', 'CreateAggregateHandler')]: e.useCase(ctx, {
        name: 'CreateAggregateHandler', layerPath: 'Application/Commands',
      }),
    };
  }

  services(ctx) {
    const e = getEmitter(ctx.framework);
    return {
      [srcPath(e, 'Application/Services', 'AggregateAppService')]: e.service(ctx, {
        name: 'AggregateAppService', layerPath: 'Application/Services',
        deps: [{ type: REPOSITORY_REF.name, field: 'repository', ref: REPOSITORY_REF }],
      }),
    };
  }

  config(ctx) {
    const e = getEmitter(ctx.framework);
    return {
      [srcPath(e, 'Infrastructure/Config', 'ServiceRegistration')]: e.service(ctx, {
        name: 'ServiceRegistration', layerPath: 'Infrastructure/Config',
      }),
    };
  }
}

module.exports = { DddArchitecture };
