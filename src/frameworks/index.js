// @ts-check
'use strict';

const { JAVA_FRAMEWORKS } = require('./java');
const { PYTHON_FRAMEWORKS } = require('./python');
const { CSHARP_FRAMEWORKS } = require('./csharp');
const { PHP_FRAMEWORKS } = require('./php');
const { JS_FRAMEWORKS } = require('./js');

/**
 * All available framework templates, keyed by their ID.
 * @type {Record<string, import('../types').FrameworkTemplate>}
 */
const FRAMEWORKS = {
  ...JAVA_FRAMEWORKS,
  ...PYTHON_FRAMEWORKS,
  ...CSHARP_FRAMEWORKS,
  ...PHP_FRAMEWORKS,
  ...JS_FRAMEWORKS,
};

/**
 * Framework categories for UI grouping.
 * @type {import('../types').FrameworkCategory[]}
 */
const FRAMEWORK_CATEGORIES = [
  {
    id: 'java',
    label: 'Java',
    badge: 'badge-java',
    frameworks: ['spring-boot', 'quarkus', 'micronaut'],
  },
  {
    id: 'python',
    label: 'Python',
    badge: 'badge-python',
    frameworks: ['django', 'fastapi', 'flask', 'litestar'],
  },
  {
    id: 'csharp',
    label: 'C# / .NET',
    badge: 'badge-csharp',
    frameworks: ['aspnet', 'blazor'],
  },
  {
    id: 'php',
    label: 'PHP',
    badge: 'badge-php',
    frameworks: ['laravel', 'symfony'],
  },
  {
    id: 'js',
    label: 'JavaScript / TypeScript',
    badge: 'badge-js',
    frameworks: ['nextjs', 'react-vite', 'nestjs', 'express', 'vue-vite', 'sveltekit', 'astro', 'nuxt3', 'hono', 'angular'],
  },
];

/**
 * Catálogo de TIPOS DE PROYECTO para la UI. Fuente única de verdad: el WebView
 * renderiza únicamente los que tengan enabled:true. Los deshabilitados
 * permanecen en el código (no se borran) pero no aparecen en la interfaz.
 *
 * Nota de modelo: "API" y "Standard" NO son arquitecturas: son tipos de
 * proyecto. MVC y Clean también se modelan aquí como tipos de proyecto para
 * unificar el paso del asistente ("Tipo de proyecto"). Hexagonal y DDD quedan
 * deshabilitados.
 * @type {Array<{id:string,name:string,icon:string,desc:string,enabled:boolean}>}
 */
const PROJECT_TYPE_CATALOG = [
  { id: 'mvc',       name: 'MVC',                          icon: '🗂', desc: 'Model-View-Controller. Aplicación web con vistas renderizadas en el servidor.', enabled: true },
  { id: 'api',       name: 'API',                          icon: '🔌', desc: 'Servicio API REST sin capa de vistas. Ideal para backends y microservicios.',   enabled: true },
  { id: 'clean',     name: 'Clean Architecture',           icon: '🧅', desc: 'Capas con inversión de dependencias. Excelente para proyectos escalables.',     enabled: true },
  { id: 'standard',  name: 'Standard',                     icon: '📦', desc: 'Estructura estándar del framework.',                                            enabled: true },
  { id: 'hexagonal', name: 'Hexagonal (Ports & Adapters)', icon: '⬡', desc: 'Aísla el dominio de la infraestructura. Muy testeable y flexible.',              enabled: false },
  { id: 'ddd',       name: 'Domain-Driven Design (DDD)',   icon: '🏛', desc: 'Modela el dominio del negocio. Ideal para sistemas complejos.',                  enabled: false },
];

// Alias de compatibilidad: algunos módulos pueden seguir importando el nombre
// anterior. Apunta al mismo catálogo para no romper require existentes.
const ARCHITECTURE_CATALOG = PROJECT_TYPE_CATALOG;

/**
 * Catálogo de opciones DEVOPS para la UI. Misma regla: solo enabled:true se muestra.
 * @type {Array<{id:string,name:string,icon:string,desc:string,enabled:boolean}>}
 */
const DEVOPS_CATALOG = [
  { id: 'none',            name: 'Ninguno',              icon: '⬜', desc: 'Sin archivos de infraestructura adicionales.',                       enabled: true },
  { id: 'docker',          name: 'Docker',               icon: '🐳', desc: 'Dockerfile, docker-compose.yml y .dockerignore.',                    enabled: true },
  { id: 'kubernetes',      name: 'Docker + Kubernetes',  icon: '☸️', desc: 'Dockerfile + manifiestos k8s (deployment, service, ingress…).',      enabled: true },
  { id: 'github-actions',  name: 'GitHub Actions',       icon: '🐙', desc: 'Pipeline CI/CD en .github/workflows/ci.yml.',                        enabled: true },
  { id: 'azure-pipelines', name: 'Azure Pipelines',      icon: '☁️', desc: 'azure-pipelines.yml con etapas de test y Docker.',                   enabled: false },
];

/**
 * Tipos de proyecto soportados por cada framework (solo ids; el catálogo decide
 * nombre/visibilidad). Si un framework tiene un solo tipo, el asistente lo
 * selecciona automáticamente y NO muestra el paso "Tipo de proyecto".
 * @type {Record<string, string[]>}
 */
const FRAMEWORK_PROJECT_TYPES = {
  // Backend con varios tipos
  'aspnet':      ['mvc', 'api', 'clean'],
  'spring-boot': ['mvc', 'api', 'clean'],
  'laravel':     ['mvc', 'api', 'clean'],
  // Backend de un solo tipo (API) → el paso se salta
  'fastapi':     ['api'],
  'express':     ['api'],
  'nestjs':      ['api'],
  // Frontend / Full-stack de un solo tipo (standard) → el paso se salta
  'react-vite':  ['standard'],
  'vue-vite':    ['standard'],
  'angular':     ['standard'],
  'nextjs':      ['standard'],
  'django':      ['standard'],
};

// Alias de compatibilidad con el nombre anterior del mapa.
const FRAMEWORK_ARCHITECTURES = FRAMEWORK_PROJECT_TYPES;

/**
 * Tipos de proyecto (habilitados) que un framework ofrece, ya resueltos a
 * objetos de catálogo listos para la UI. Devuelve SIEMPRE la lista completa
 * (incluso si es de un solo elemento); es el asistente quien decide ocultar el
 * paso cuando hay un único tipo.
 * @param {string} id
 * @returns {Array<{id:string,name:string,icon:string,desc:string}>}
 */
function getFrameworkProjectTypes(id) {
  const ids = FRAMEWORK_PROJECT_TYPES[id] || ['standard'];
  const byId = new Map(PROJECT_TYPE_CATALOG.filter(a => a.enabled).map(a => [a.id, a]));
  return ids
    .map(tid => byId.get(tid))
    .filter(Boolean)
    .map(a => ({ id: a.id, name: a.name, icon: a.icon, desc: a.desc }));
}

// Alias de compatibilidad: nombre anterior, misma salida (lista completa de
// tipos). Antes devolvía [] para frontend; ahora devuelve su tipo único.
const getFrameworkArchitectures = getFrameworkProjectTypes;

/** Opciones DevOps habilitadas, listas para la UI. */
function getEnabledDevops() {
  return DEVOPS_CATALOG.filter(d => d.enabled)
    .map(d => ({ id: d.id, name: d.name, icon: d.icon, desc: d.desc }));
}

/**
 * Returns the framework template for the given ID.
 * @param {string} id
 * @returns {import('../types').FrameworkTemplate | undefined}
 */
function getFramework(id) {
  return FRAMEWORKS[id];
}

/**
 * Returns all framework IDs that support more than one project type
 * (i.e. the wizard shows the "Tipo de proyecto" step for them).
 * @returns {string[]}
 */
function getArchitectureCompatibleFrameworks() {
  return Object.keys(FRAMEWORK_PROJECT_TYPES).filter(
    (id) => (FRAMEWORK_PROJECT_TYPES[id] || []).length > 1,
  );
}

module.exports = {
  FRAMEWORKS,
  FRAMEWORK_CATEGORIES,
  PROJECT_TYPE_CATALOG,
  ARCHITECTURE_CATALOG,
  DEVOPS_CATALOG,
  FRAMEWORK_PROJECT_TYPES,
  FRAMEWORK_ARCHITECTURES,
  getFramework,
  getFrameworkProjectTypes,
  getFrameworkArchitectures,
  getEnabledDevops,
  getArchitectureCompatibleFrameworks,
};
