// @ts-check
'use strict';

/**
 * Registro de combinaciones (Framework + Arquitectura) ya MIGRADAS al nuevo
 * sistema de generadores independientes de v4.
 *
 * Cada entrada mapea una clave "frameworkId/architectureId" a una función
 * `factory` perezosa que devuelve una INSTANCIA del generador concreto.
 * Se usa carga perezosa (require dentro de la función) para que añadir
 * generadores no incremente el coste de arranque ni acople este archivo a
 * módulos que aún no existen.
 *
 * ───────────────────────────────────────────────────────────────────────────
 * FASE 2: este registro contiene las combinaciones ya migradas al nuevo
 * sistema de generadores oficiales y runtime.
 *
 * Cuando `FrameworkFactory.has()` devuelve `true` para un combo, el
 * `projectBuilder` delega en el generador independiente y NO ejecuta el
 * flujo legacy. Esto permite migrar un framework de forma incremental sin
 * afectar a las combinaciones no migradas.
 *
 * Migrar un framework consiste en:
 *   1. crear su generador en `<framework>/<arch>/generator.js` (o
 *      `<framework>/generator.js` si comparte una sola clase base para sus
 *      arquitecturas), y
 *   2. añadir aquí una línea que lo registre.
 * Ningún otro archivo de la infraestructura necesita cambiar.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * @type {Record<string, () => import('./shared/BaseFrameworkGenerator').BaseFrameworkGenerator>}
 */
const REGISTRY = {
  // ── ASP.NET Core (Fase 2) ────────────────────────────────────────────────
  'aspnet/mvc': () => {
    const { AspNetMvcOfficialGenerator } = require('./aspnet/mvc/generator');
    return new AspNetMvcOfficialGenerator();
  },
  'aspnet/api': () => {
    const { AspNetApiOfficialGenerator } = require('./aspnet/api/generator');
    return new AspNetApiOfficialGenerator();
  },
  'aspnet/clean': () => {
    const { AspNetCleanOfficialGenerator } = require('./aspnet/clean/generator');
    return new AspNetCleanOfficialGenerator();
  },
  'laravel/mvc': () => {
    const { LaravelMvcOfficialGenerator } = require('./laravel/generator');
    return new LaravelMvcOfficialGenerator();
  },
  'laravel/api': () => {
    const { LaravelApiOfficialGenerator } = require('./laravel/generator');
    return new LaravelApiOfficialGenerator();
  },
  'laravel/clean': () => {
    const { LaravelCleanOfficialGenerator } = require('./laravel/generator');
    return new LaravelCleanOfficialGenerator();
  },
  'spring-boot/mvc': () => {
    const { SpringBootMvcOfficialGenerator } = require('./spring-boot/generator');
    return new SpringBootMvcOfficialGenerator();
  },
  'spring-boot/api': () => {
    const { SpringBootApiOfficialGenerator } = require('./spring-boot/generator');
    return new SpringBootApiOfficialGenerator();
  },
  'spring-boot/clean': () => {
    const { SpringBootCleanOfficialGenerator } = require('./spring-boot/generator');
    return new SpringBootCleanOfficialGenerator();
  },
};

module.exports = { REGISTRY };
