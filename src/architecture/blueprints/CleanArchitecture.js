'use strict';

const { BaseArchitecture } = require('../ArchitectureBlueprint');
const { getEmitter, srcPath } = require('../LanguageEmitters');

/**
 * Clean Architecture (Uncle Bob).
 * Capas concéntricas: Domain (entidades) <- Application (casos de uso, puertos)
 * <- Infrastructure (adaptadores) <- Presentation. Las dependencias apuntan
 * hacia adentro; el dominio no conoce frameworks (Inversión de Dependencias).
 */

// Referencia { name, layerPath } del repositorio: es la MISMA identidad usada
// para generar el archivo de la interfaz, así el emitter deriva el import
// exacto en quien la implemente (P0-2).
const REPOSITORY_REF = { name: 'IEntityRepository', layerPath: 'Domain/Interfaces' };

// Tipo de dominio referenciado como parámetro/retorno del repositorio. Se
// genera como clase real en Domain/Entities (carpeta que esta arquitectura
// ya reserva) para que la referencia NUNCA apunte a un tipo inexistente.
const ENTITY_REF = { name: 'Entity', layerPath: 'Domain/Entities' };

// Contrato del repositorio, compartido entre la interfaz y su implementación
// concreta para que ambas no se desincronicen.
const REPOSITORY_METHODS = [
  { name: 'getById', returnType: 'Entity', nullableReturn: true, parameters: [{ name: 'id', type: 'Id' }] },
  { name: 'save', returnType: 'void', parameters: [{ name: 'entity', type: 'Entity' }] },
];

class CleanArchitecture extends BaseArchitecture {
  constructor() {
    super({
      id: 'clean',
      name: 'Clean Architecture',
      description: 'Capas Domain / Application / Infrastructure / Presentation con dependencias hacia el dominio.',
      supportedLangs: ['csharp', 'java', 'php', 'python'],
    });
  }

  folders(ctx) {
    const e = getEmitter(ctx.framework);
    return [
      'Domain/Entities', 'Domain/Interfaces',
      'Application/UseCases', 'Application/DTOs', 'Application/Interfaces',
      'Infrastructure/Repositories', 'Infrastructure/Config',
      'Presentation/Controllers',
    ].map((d) => `${e.base}/${d}`);
  }

  interfaces(ctx) {
    const e = getEmitter(ctx.framework);
    return {
      // Tipo de dominio referenciado por el repositorio: generado primero
      // para que ENTITY_REF apunte siempre a un archivo real.
      [srcPath(e, ENTITY_REF.layerPath, ENTITY_REF.name)]: e.domainType(ctx, {
        name: ENTITY_REF.name, layerPath: ENTITY_REF.layerPath,
      }),
      [srcPath(e, REPOSITORY_REF.layerPath, REPOSITORY_REF.name)]: e.iface(ctx, {
        name: REPOSITORY_REF.name, layerPath: REPOSITORY_REF.layerPath,
        methods: REPOSITORY_METHODS,
        refs: [ENTITY_REF],
      }),
    };
  }

  dtos(ctx) {
    const e = getEmitter(ctx.framework);
    return {
      [srcPath(e, 'Application/DTOs', 'EntityDto')]: e.dto(ctx, {
        name: 'EntityDto', layerPath: 'Application/DTOs',
      }),
    };
  }

  repositories(ctx) {
    const e = getEmitter(ctx.framework);
    return {
      [srcPath(e, 'Infrastructure/Repositories', 'EntityRepository')]: e.repo(ctx, {
        name: 'EntityRepository', layerPath: 'Infrastructure/Repositories',
        iface: REPOSITORY_REF.name,
        ifaceRef: REPOSITORY_REF,
        ifaceMethods: REPOSITORY_METHODS,
        typeRefs: [ENTITY_REF],
      }),
    };
  }

  useCases(ctx) {
    const e = getEmitter(ctx.framework);
    return {
      [srcPath(e, 'Application/UseCases', 'GetEntityUseCase')]: e.useCase(ctx, {
        name: 'GetEntityUseCase', layerPath: 'Application/UseCases',
      }),
    };
  }

  config(ctx) {
    const e = getEmitter(ctx.framework);
    return {
      [srcPath(e, 'Infrastructure/Config', 'DependencyInjection')]: e.service(ctx, {
        name: 'DependencyInjection', layerPath: 'Infrastructure/Config',
      }),
    };
  }
}

module.exports = { CleanArchitecture };
