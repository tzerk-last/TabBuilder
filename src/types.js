// @ts-check
'use strict';

/**
 * @typedef {Object} FrameworkTemplate
 * @property {string} id
 * @property {string} name
 * @property {string} icon
 * @property {'java'|'python'|'csharp'|'php'|'js'} lang
 * @property {string} description
 * @property {string} version
 * @property {number} port
 * @property {boolean} [enabled=true]     — false = no mostrar en UI
 * @property {string[]} [templates]       — IDs de templates soportados: ['mvc','api','standard']
 * @property {string[]} [architectures]   — IDs de arquitecturas soportadas: ['standard','clean']
 * @property {string[]} folders
 * @property {Record<string, string>} files
 */

/**
 * @typedef {Object} FrameworkCategory
 * @property {string} id
 * @property {string} label
 * @property {string} badge
 * @property {string[]} frameworks
 */

/**
 * @typedef {'none'|'docker'|'kubernetes'|'github-actions'|'azure-pipelines'} DevOpsOption
 */

/**
 * @typedef {Object} ProjectConfig
 * @property {string} name
 * @property {string} frameworkId
 * @property {string} [templateId]        — 'mvc', 'api', 'standard'
 * @property {string} architectureId
 * @property {string} database
 * @property {DevOpsOption} devops
 * @property {string} targetFolder
 */

/**
 * @typedef {Object} BuildResult
 * @property {boolean} success
 * @property {string} projectPath
 * @property {string[]} filesWritten
 * @property {string} [error]
 */

module.exports = {};
