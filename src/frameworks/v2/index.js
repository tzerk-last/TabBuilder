// @ts-check
'use strict';

/**
 * Punto de entrada público de la infraestructura de generadores v4.
 *
 * Reexporta las piezas que el resto del proyecto necesitará consumir cuando
 * comience la migración incremental (a partir de la Fase 2). Importar desde
 * aquí evita acoplar a los consumidores con las rutas internas de cada módulo.
 *
 * FASE 1: nadie importa este index todavía. Existe para fijar la superficie
 * pública de la infra de forma estable desde el inicio.
 */

const { FrameworkFactory, keyOf } = require('./FrameworkFactory');
const { BaseGenerator } = require('./BaseGenerator');
const { GeneratorContext } = require('./GeneratorContext');
const { BaseFrameworkGenerator } = require('./generators/BaseFrameworkGenerator');
const { RuntimeFacade } = require('./RuntimeFacade');
const { CommandResult, CommandRunner, RuntimeLogger, ToolDetector, EnvironmentValidator, ProgressReporter } = require('./runtime');

module.exports = {
  FrameworkFactory,
  BaseGenerator,
  GeneratorContext,
  BaseFrameworkGenerator,
  RuntimeFacade,
  CommandResult,
  CommandRunner,
  RuntimeLogger,
  ToolDetector,
  EnvironmentValidator,
  ProgressReporter,
  keyOf,
};
