'use strict';

const { BaseArchitecture } = require('../ArchitectureBlueprint');
const { getEmitter, srcPath } = require('../LanguageEmitters');

/**
 * MVC — Model / View / Controller.
 * Separación clásica en tres capas. Repositorio opcional para acceso a datos.
 */

// Referencia { name, layerPath } del servicio de saludo: es la MISMA
// identidad usada para generar el archivo de la interfaz, así el emitter
// deriva el import exacto en quien la implemente (P0-2).
const GREETING_REF = { name: 'IGreetingService', layerPath: 'Services' };

// Contrato del servicio de saludo, compartido entre la interfaz y su
// implementación concreta para que ambas no se desincronicen.
const GREETING_METHODS = [
  { name: 'greet', returnType: 'string', parameters: [] },
];

class MvcArchitecture extends BaseArchitecture {
  constructor() {
    super({
      id: 'mvc',
      name: 'MVC',
      description: 'Model-View-Controller: separación en modelos, vistas y controladores.',
      supportedLangs: ['csharp', 'java', 'php', 'python'],
    });
  }

  folders(ctx) {
    const e = getEmitter(ctx.framework);
    return ['Models', 'Views', 'Controllers', 'Services'].map((d) => `${e.base}/${d}`);
  }

  interfaces(ctx) {
    const e = getEmitter(ctx.framework);
    return {
      [srcPath(e, GREETING_REF.layerPath, GREETING_REF.name)]: e.iface(ctx, {
        name: GREETING_REF.name, layerPath: GREETING_REF.layerPath,
        methods: GREETING_METHODS,
      }),
    };
  }

  dtos(ctx) {
    const e = getEmitter(ctx.framework);
    return {
      [srcPath(e, 'Models', 'GreetingModel')]: e.dto(ctx, {
        name: 'GreetingModel', layerPath: 'Models',
        fields: [{ type: 'string', name: 'message' }],
      }),
    };
  }

  services(ctx) {
    const e = getEmitter(ctx.framework);
    return {
      [srcPath(e, 'Services', 'GreetingService')]: e.service(ctx, {
        name: 'GreetingService', layerPath: 'Services',
        iface: GREETING_REF.name,
        ifaceRef: GREETING_REF,
        ifaceMethods: GREETING_METHODS,
      }),
    };
  }
}

module.exports = { MvcArchitecture };
