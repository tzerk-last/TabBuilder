// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Validates a project name.
 * Returns null if valid, or an error message string if invalid.
 * @param {string} name
 * @returns {string | null}
 */
function validateProjectName(name) {
  if (!name || name.trim() === '') {
    return 'El nombre del proyecto no puede estar vacío.';
  }

  const trimmed = name.trim();

  if (trimmed.length < 2) {
    return 'El nombre debe tener al menos 2 caracteres.';
  }

  if (trimmed.length > 64) {
    return 'El nombre no puede superar 64 caracteres.';
  }

  if (!/^[a-zA-Z]/.test(trimmed)) {
    return 'El nombre debe comenzar con una letra.';
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(trimmed)) {
    return 'El nombre solo puede contener letras, números, puntos y guiones bajos.';
  }

  const reserved = ['con', 'prn', 'aux', 'nul', 'com1', 'lpt1', 'node_modules', 'dist', 'build'];
  if (reserved.includes(trimmed.toLowerCase())) {
    return `"${trimmed}" es un nombre reservado del sistema.`;
  }

  return null;
}

/**
 * Checks whether a target directory already has a folder with the given project name.
 * @param {string} targetFolder
 * @param {string} projectName
 * @returns {boolean}
 */
function projectExists(targetFolder, projectName) {
  const projectPath = path.join(targetFolder, projectName);
  return fs.existsSync(projectPath);
}

/**
 * Validates all project configuration fields.
 * Returns null if valid, or an array of error messages if invalid.
 * @param {{ name: string, frameworkId: string, targetFolder: string }} config
 * @returns {string[] | null}
 */
function validateProjectConfig(config) {
  const errors = [];

  const nameError = validateProjectName(config.name);
  if (nameError) errors.push(nameError);

  if (!config.frameworkId) {
    errors.push('Debes seleccionar un framework.');
  }

  if (!config.targetFolder || config.targetFolder.trim() === '') {
    errors.push('Debes seleccionar una carpeta destino.');
  }

  if (errors.length > 0) return errors;

  if (projectExists(config.targetFolder, config.name)) {
    return [`Ya existe una carpeta llamada "${config.name}" en la ruta seleccionada.`];
  }

  return null;
}

module.exports = { validateProjectName, projectExists, validateProjectConfig };
