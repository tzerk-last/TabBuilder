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
 *   1. crear su generador en `generators/<framework>/<arch>/generator.js`, y
 *   2. añadir aquí una línea que lo registre.
 * Ningún otro archivo de la infraestructura necesita cambiar.
 * ───────────────────────────────────────────────────────────────────────────
 *
 * Formato de futura entrada (ejemplo, NO activo todavía):
 *
 *   'aspnet/mvc': () => {
 *     const { AspNetMvcGenerator } = require('./generators/aspnet/mvc/generator');
 *     return new AspNetMvcGenerator();
 *   },
 *
 * @type {Record<string, () => import('./BaseGenerator').BaseGenerator>}
 */
const REGISTRY = {
  // ── ASP.NET Core (Fase 2) ────────────────────────────────────────────────
  'aspnet/mvc': () => {
    const { AspNetMvcOfficialGenerator } = require('./generators/aspnet/mvc/OfficialGenerator');
    return new AspNetMvcOfficialGenerator();
  },
  'aspnet/api': () => {
    const { AspNetApiOfficialGenerator } = require('./generators/aspnet/api/OfficialGenerator');
    return new AspNetApiOfficialGenerator();
  },
  'aspnet/clean': () => {
    const { AspNetCleanOfficialGenerator } = require('./generators/aspnet/clean/OfficialGenerator');
    return new AspNetCleanOfficialGenerator();
  },
  'laravel/mvc': () => {
    const { LaravelMvcOfficialGenerator } = require('./generators/laravel/OfficialGenerator');
    return new LaravelMvcOfficialGenerator();
  },
  'laravel/api': () => {
    const { LaravelApiOfficialGenerator } = require('./generators/laravel/OfficialGenerator');
    return new LaravelApiOfficialGenerator();
  },
  'laravel/clean': () => {
    const { LaravelCleanOfficialGenerator } = require('./generators/laravel/OfficialGenerator');
    return new LaravelCleanOfficialGenerator();
  },
  'spring-boot/mvc': () => {
    const { SpringBootMvcOfficialGenerator } = require('./generators/spring-boot/OfficialGenerator');
    return new SpringBootMvcOfficialGenerator();
  },
  'spring-boot/api': () => {
    const { SpringBootApiOfficialGenerator } = require('./generators/spring-boot/OfficialGenerator');
    return new SpringBootApiOfficialGenerator();
  },
  'spring-boot/clean': () => {
    const { SpringBootCleanOfficialGenerator } = require('./generators/spring-boot/OfficialGenerator');
    return new SpringBootCleanOfficialGenerator();
  },
};

module.exports = { REGISTRY };
