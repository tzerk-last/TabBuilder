// @ts-check
'use strict';

const fs   = require('fs');
const path = require('path');
const { logger } = require('./logger');
const { getFramework } = require('../frameworks/index');
const { generateDevOpsFiles, writeDevOpsFiles } = require('../devops/generator');
const { generateEnvExampleForFramework } = require('../devops/EnvGenerator');
const { generateReadme } = require('../templates/readme');
const { getGitignore } = require('../templates/gitignore');
const { FrameworkFactory } = require('../frameworks/FrameworkFactory');

/**
 * @typedef {Object} BuildResult
 * @property {boolean}  success
 * @property {string}   projectPath
 * @property {string[]} filesWritten
 * @property {string}   [error]        — user-facing, no stack trace
 * @property {string}   [failedAt]     — which step failed (for rollback prompt)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Low-level file helpers — each throws on failure so we catch centrally
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {string} content
 * @param {string} projectName
 */
function resolve(content, projectName) {
  return content.replaceAll('{PROJECT_NAME}', projectName);
}

/**
 * @param {string} dirPath
 * @param {string} label  (for error messages)
 */
function ensureDir(dirPath, label) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (err) {
    throw new Error(`No fue posible crear el directorio "${label}".\n\nMotivo: ${err.message}`);
  }
}

/**
 * @param {string} filePath
 * @param {string} content
 */
function writeFile(filePath, content) {
  const rel = path.basename(filePath);
  try {
    fs.writeFileSync(filePath, content, 'utf-8');
  } catch (err) {
    throw new Error(`No fue posible crear el archivo "${rel}".\n\nMotivo: ${err.message}`);
  }
}

/**
 * Updates .env.example content based on selected database.
 * Non-fatal — logs warnings if fails.
 * @param {string} projectPath
 * @param {string} frameworkId
 * @param {string} projectName
 * @param {string} database
 */
function updateEnvExample(projectPath, frameworkId, projectName, database) {
  try {
    const envPath = path.join(projectPath, '.env.example');
    if (!fs.existsSync(envPath)) {
      return; // No .env.example to update
    }

    if (database === 'none') {
      return; // No database selected, keep template default
    }

    const envContent = generateEnvExampleForFramework(frameworkId, projectName, database);
    if (!envContent) {
      return; // Framework not supported, keep default
    }

    fs.writeFileSync(envPath, envContent, 'utf-8');
    logger.debug(`Updated .env.example for ${frameworkId} with database: ${database}`);
  } catch (err) {
    // Non-fatal — don't break the build
    logger.warn(`Could not update .env.example: ${err.message}`);
  }
}

/**
 * @param {string} projectPath
 */
function patchNestJsPackageJson(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!fs.existsSync(packageJsonPath)) return;

  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  pkg.scripts = pkg.scripts || {};
  pkg.scripts.lint = 'eslint "{src,apps,libs,test}/**/*.ts" --fix';

  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
  JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
}

// ─────────────────────────────────────────────────────────────────────────────
// Rollback helper
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deletes a directory tree. Non-throwing — logs failures to Output Channel.
 * @param {string} dirPath
 */
function deleteTree(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      logger.info(`Rollback: deleted ${dirPath}`);
    }
  } catch (err) {
    logger.error(`Rollback failed for ${dirPath}: ${err}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the complete project on disk.
 *
 * Never throws. All internal errors are caught and returned as BuildResult.
 * Caller is responsible for offering rollback when result.success === false
 * and result.projectPath exists on disk.
 *
 * @param {import('../types').ProjectConfig} config
 * @param {{ onOutput?: (line: string) => void }} [deps] Optional live-output
 *   sink forwarded to v4 generators (Laravel/Spring Boot/ASP.NET) so their
 *   real scaffolding commands (composer/curl/tar/dotnet) can stream output
 *   to the caller's UI. Omitting it keeps the exact previous behavior.
 * @returns {Promise<BuildResult>}
 */
async function buildProject(config, deps = {}) {
  const { name: projectName, frameworkId, architectureId, database, devops, targetFolder } = config;

  const framework = getFramework(frameworkId);
  if (!framework) {
    return { success: false, projectPath: '', filesWritten: [], error: `Framework "${frameworkId}" no encontrado.` };
  }

  // ── v4: generadores independientes ───────────────────────────────────────
  // Si la combinación (framework + arquitectura) ya fue migrada al nuevo
  // sistema, se delega íntegramente en su generador propio y NO se ejecuta el
  // flujo legacy (template + blueprint). Esto elimina la mezcla de estructuras.
  // Los combos aún no migrados siguen por el flujo legacy intacto.
  if (FrameworkFactory.has(frameworkId, architectureId)) {
    logger.info(`Using v4 generator for "${frameworkId}/${architectureId}"`);
    const generator = FrameworkFactory.get(frameworkId, architectureId);
    const result = await generator.generate(config, { logger, onOutput: deps.onOutput });
    if (!result.success) {
      return result;
    }

    const projectPath = result.projectPath || path.join(targetFolder, projectName);
    const filesWritten = Array.isArray(result.filesWritten) ? [...result.filesWritten] : [];
    let failedAt = '';

    try {
      // Update .env.example with database configuration (before architecture/devops steps)
      updateEnvExample(projectPath, frameworkId, projectName, database);

      // Architecture step is optional and additive. It may create extra files for
      // clean/api architectures without changing the core Laravel scaffolding.
      if (architectureId && architectureId !== 'mvc' && architectureId !== 'none') {
        try {
          const arch = require('../architecture/index');
          if (arch && typeof arch.ArchitectureFactory === 'function') {
            const factory = new arch.ArchitectureFactory();
            const plan = factory.create(architectureId, {
              projectName,
              framework: frameworkId,
              lang: framework.lang,
              options: { database: database || null },
            });
            const res = arch.writeArchitectureFiles(plan, projectPath);
            if (res && Array.isArray(res.written)) filesWritten.push(...res.written);
            logger.info(`Architecture "${architectureId}" applied: ${res?.written?.length ?? 0} files`);
          }
        } catch (archErr) {
          logger.warn(`Architecture step skipped (${architectureId}): ${archErr.message}`);
        }
      }

      // DevOps files are optional and additive; do not override existing files.
      if (devops && devops !== 'none') {
        try {
          failedAt = `archivos DevOps (${devops})`;
          const devopsFiles = generateDevOpsFiles({
            projectName,
            lang: framework.lang,
            port: framework.port,
            database: database || 'none',
            devops,
          });
          const { written } = writeDevOpsFiles(devopsFiles, projectPath);
          filesWritten.push(...written);
          logger.info(`DevOps "${devops}": ${written.length} written`);
        } catch (devopsErr) {
          logger.warn(`DevOps step failed (${devops}): ${devopsErr.message}`);
        }
      }

      try {
        failedAt = 'README.md';
        const readmePath = path.join(projectPath, 'README.md');
        if (!fs.existsSync(readmePath)) {
          const readme = generateReadme(projectName, frameworkId, architectureId, database, devops);
          fs.writeFileSync(readmePath, readme);
          filesWritten.push('README.md');
        }
      } catch (readmeErr) {
        logger.warn(`README.md skipped: ${readmeErr.message}`);
      }

      try {
        failedAt = '.gitignore';
        const gitignorePath = path.join(projectPath, '.gitignore');
        if (!fs.existsSync(gitignorePath)) {
          fs.writeFileSync(gitignorePath, getGitignore(framework.lang));
          filesWritten.push('.gitignore');
        }
      } catch (giErr) {
        logger.warn(`.gitignore skipped: ${giErr.message}`);
      }

      return { success: true, projectPath, filesWritten };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      logger.error(`Build failed at "${failedAt}": ${msg}`);
      return {
        success: false,
        projectPath,
        filesWritten,
        failedAt,
        error: msg,
      };
    }
  }

  const projectPath = path.join(targetFolder, projectName);
  const filesWritten = [];
  let failedAt = '';

  logger.info(`Building project: ${projectName} (${frameworkId}) → ${projectPath}`);
  logger.info(`Architecture: ${architectureId}, DB: ${database}, DevOps: ${devops}`);

  try {
    // ── 1. Root directory ────────────────────────────────────────────────────
    failedAt = 'directorio raíz';
    ensureDir(projectPath, projectName);

    // ── 2. Framework subdirectories ──────────────────────────────────────────
    failedAt = 'estructura de carpetas';
    for (const folder of framework.folders) {
      const rel = resolve(folder, projectName);
      ensureDir(path.join(projectPath, rel), rel);
    }

    // ── 3. Framework files ───────────────────────────────────────────────────
    failedAt = 'archivos del framework';
    for (const [filePath, rawContent] of Object.entries(framework.files)) {
      const relPath  = resolve(filePath, projectName);
      const fullPath = path.join(projectPath, relPath);
      ensureDir(path.dirname(fullPath), path.dirname(relPath));
      writeFile(fullPath, resolve(rawContent || '', projectName));
      filesWritten.push(relPath);
      logger.debug(`  wrote: ${relPath}`);
    }

    if (frameworkId === 'nestjs') {
      patchNestJsPackageJson(projectPath);
    }

    // ── 3b. Update .env.example with database configuration ───────────────────
    updateEnvExample(projectPath, frameworkId, projectName, database);

    // ── 4. Architecture patterns (optional, additive, never fatal) ───────────
    if (architectureId && architectureId !== 'mvc' && architectureId !== 'none') {
      try {
        const arch = require('../architecture/index');
        if (arch && typeof arch.ArchitectureFactory === 'function') {
          const factory = new arch.ArchitectureFactory();
          const plan = factory.create(architectureId, {
            projectName, framework: frameworkId, lang: framework.lang,
            options: { database: database || null },
          });
          const res = arch.writeArchitectureFiles(plan, projectPath);
          if (res && Array.isArray(res.written)) filesWritten.push(...res.written);
          logger.info(`Architecture "${architectureId}" applied: ${res?.written?.length ?? 0} files`);
        }
      } catch (archErr) {
        // Optional step — log and continue, never fail the build
        logger.warn(`Architecture step skipped (${architectureId}): ${archErr.message}`);
      }
    }

    // ── 5. DevOps files (optional, additive, never fatal) ───────────────────
    if (devops && devops !== 'none') {
      try {
        failedAt = `archivos DevOps (${devops})`;
        const devopsFiles = generateDevOpsFiles({
          projectName, lang: framework.lang, port: framework.port, database: database || 'none', devops,
        });
        const { written, skipped } = writeDevOpsFiles(devopsFiles, projectPath);
        filesWritten.push(...written);
        logger.info(`DevOps "${devops}": ${written.length} written, ${skipped.length} skipped`);
      } catch (devopsErr) {
        logger.warn(`DevOps step failed (${devops}): ${devopsErr.message}`);
        // Non-fatal: project is still usable without DevOps files
      }
    }

    // ── 6. README ────────────────────────────────────────────────────────────
    try {
      failedAt = 'README.md';
      const readmePath = path.join(projectPath, 'README.md');
      if (!fs.existsSync(readmePath)) {
        const readme = generateReadme(projectName, frameworkId, architectureId, database, devops);
        writeFile(readmePath, readme);
        filesWritten.push('README.md');
      }
    } catch (readmeErr) {
      // Non-fatal
      logger.warn(`README.md skipped: ${readmeErr.message}`);
    }

    // ── 7. .gitignore ────────────────────────────────────────────────────────
    try {
      failedAt = '.gitignore';
      const gitignorePath = path.join(projectPath, '.gitignore');
      if (!fs.existsSync(gitignorePath)) {
        writeFile(gitignorePath, getGitignore(framework.lang));
        filesWritten.push('.gitignore');
      }
    } catch (giErr) {
      // Non-fatal
      logger.warn(`.gitignore skipped: ${giErr.message}`);
    }

    logger.info(`Build complete: ${filesWritten.length} files written`);
    return { success: true, projectPath, filesWritten };

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Build failed at "${failedAt}": ${msg}`);
    return {
      success: false,
      projectPath,
      filesWritten,
      failedAt,
      error: msg,
    };
  }
}

/**
 * Offers the user a rollback (delete partial files) after a failed build.
 * @param {string} projectPath
 */
async function offerRollback(projectPath) {
  if (!projectPath || !fs.existsSync(projectPath)) return;

  const vscode = require('vscode');
  const choice = await vscode.window.showWarningMessage(
    'La generación no pudo completarse. ¿Deseas eliminar los archivos creados parcialmente?',
    { modal: true },
    'Eliminar archivos',
    'Conservar archivos',
  );

  if (choice === 'Eliminar archivos') {
    deleteTree(projectPath);
    logger.info(`Rollback completed: ${projectPath}`);
  } else {
    logger.info(`Rollback declined by user: ${projectPath}`);
  }
}

module.exports = { buildProject, offerRollback };
