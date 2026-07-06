// @ts-check
'use strict';

const { spawn, spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const { logger } = require('./logger');

// ─────────────────────────────────────────────────────────────────────────────
// Runtime detection
// ─────────────────────────────────────────────────────────────────────────────

/** @returns {string[]} */
function extraPaths() {
  if (process.platform === 'win32') return [];
  const home = process.env.HOME || '';
  return [
    '/usr/local/bin', '/usr/bin', '/opt/homebrew/bin',
    '/opt/homebrew/opt/python@3.13/bin',
    '/opt/homebrew/opt/python@3.12/bin',
    '/opt/homebrew/opt/python@3.11/bin',
    `${home}/.pyenv/shims`, `${home}/.pyenv/bin`,
    `${home}/.local/bin`, '/usr/local/opt/python@3/bin',
  ].filter(Boolean);
}

/** @returns {string} */
function buildPath() {
  const sep  = path.delimiter;
  const curr = process.env.PATH || '';
  return [...new Set([...curr.split(sep), ...extraPaths()].filter(Boolean))].join(sep);
}

/** @returns {NodeJS.ProcessEnv} */
function buildEnv() {
  return { ...process.env, PATH: buildPath() };
}

/**
 * Synchronous command probe. Returns version string or null.
 * @param {string} exe
 * @param {string[]} [args]
 * @returns {string|null}
 */
function probe(exe, args = ['--version']) {
  const env = buildEnv();
  for (const shell of [false, true]) {
    try {
      const r = spawnSync(exe, args, {
        stdio: 'pipe', shell, timeout: 6000, encoding: 'utf8', env,
      });
      if (r.status === 0 && !r.error) {
        return (r.stdout || r.stderr || '').trim().split('\n')[0] || exe;
      }
    } catch (_) {
      // ignore: try next option
    }
  }
  return null;
}

/**
 * Resolves the best available Python 3 executable, or null if absent.
 * @returns {string|null}
 */
function findPython() {
  for (const candidate of ['python3', 'python']) {
    const v = probe(candidate, ['--version']);
    if (v && /python\s*3/i.test(v)) return candidate;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Noise filter — suppress verbose technical lines from subprocess output
// ─────────────────────────────────────────────────────────────────────────────

/** Lines matching any of these patterns are logged to Output Channel only. */
const NOISE_PATTERNS = [
  /Retrying\s+\(/i,
  /WARNING:\s+Retrying/i,
  /urllib3/i,
  /HTTPSConnection/i,
  /Retry\(total=/i,
  /DEPRECATION:/i,
  /\[notice\]/i,
  /pip install --upgrade pip/i,
  /new release of pip/i,
  /^\s*$/, // blank lines
];

/**
 * Returns true if a line should be suppressed from the user-facing log.
 * @param {string} line
 * @returns {boolean}
 */
function isNoiseLine(line) {
  return NOISE_PATTERNS.some(p => p.test(line));
}

// ─────────────────────────────────────────────────────────────────────────────
// Network error classifier
// ─────────────────────────────────────────────────────────────────────────────

/** @param {string} raw  Combined stdout+stderr from a failed run */
function classifyNetworkError(raw) {
  if (/name or service not known|nodename nor servname|temporary failure in name resolution|could not resolve host/i.test(raw))
    return 'dns';
  if (/connection timed out|timed out|read timeout|connection timeout/i.test(raw))
    return 'timeout';
  if (/connection refused|network is unreachable|no route to host|enetunreach/i.test(raw))
    return 'unreachable';
  if (/ssl\b|certificate/i.test(raw))
    return 'ssl';
  if (/proxy|407 proxy/i.test(raw))
    return 'proxy';
  if (/403 forbidden|401 unauthorized/i.test(raw))
    return 'auth';
  if (/could not find a version|no matching distribution|package not found/i.test(raw))
    return 'notfound';
  if (/enotfound|econnrefused|econnreset|etimedout/i.test(raw))
    return 'network';
  return null;
}

/**
 * Returns a user-friendly network error message.
 * @param {string} networkType
 * @returns {string}
 */
function networkErrorMessage(networkType, _installCmd) {
  const msgs = {
    dns:         'No se pudo resolver el servidor de paquetes (DNS).',
    timeout:     'La conexión tardó demasiado tiempo (timeout).',
    unreachable: 'El servidor de paquetes no es accesible desde esta red.',
    ssl:         'Error de certificado SSL al conectar al servidor de paquetes.',
    proxy:       'Error de proxy. Verifica la configuración de red.',
    auth:        'Error de autenticación con el servidor de paquetes.',
    notfound:    'No se encontraron algunos paquetes en el repositorio.',
    network:     'Error de red al descargar las dependencias.',
  };
  return msgs[networkType] || 'Error de red al descargar las dependencias.';
}

// ─────────────────────────────────────────────────────────────────────────────
// Async process runner
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} RunResult
 * @property {boolean} ok
 * @property {number|null} code
 * @property {string} stdout
 * @property {string} stderr
 * @property {boolean} timedOut
 */

/**
 * Spawns a process, streams filtered output, resolves exactly once.
 *
 * Design guarantees:
 *  - Promise resolves exactly once (resolved flag).
 *  - Timeout clears itself after first resolve to avoid leaking the handle.
 *  - error and close events both guard against double-resolve.
 *  - onData receives filtered lines only; raw lines go to Output Channel.
 *
 * @param {string}                  cmd
 * @param {string[]}                args
 * @param {string}                  cwd
 * @param {(line: string) => void}  onData   filtered lines for the UI log
 * @param {NodeJS.ProcessEnv}       [env]
 * @param {number}                  [timeoutMs]  default 5 min
 * @returns {Promise<RunResult>}
 */
function run(cmd, args, cwd, onData, env, timeoutMs = 5 * 60 * 1000) {
  return new Promise((resolve) => {
    let settled = false;
    /** @param {RunResult} result */
    const settle = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };

    const effectiveEnv = env || buildEnv();
    const isWin = process.platform === 'win32';

    let child;
    try {
      child = spawn(cmd, args, {
        cwd,
        env: effectiveEnv,
        shell: isWin,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (spawnErr) {
      settle({ ok: false, code: null, stdout: '', stderr: String(spawnErr), timedOut: false });
      return;
    }

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (d) => {
      const chunk = d.toString();
      stdout += chunk;
      chunk.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        logger.cmd(cmd, trimmed);
        if (!isNoiseLine(trimmed)) onData(trimmed);
      });
    });

    child.stderr.on('data', (d) => {
      const chunk = d.toString();
      stderr += chunk;
      chunk.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        logger.cmd(cmd, `[stderr] ${trimmed}`);
        if (!isNoiseLine(trimmed)) onData(trimmed);
      });
    });

    child.on('error', (err) => {
      logger.error(`spawn error [${cmd}]: ${err.message}`);
      settle({ ok: false, code: null, stdout, stderr: err.message, timedOut: false });
    });

    child.on('close', (code) => {
      settle({ ok: code === 0, code, stdout, stderr, timedOut: false });
    });

    const timer = setTimeout(() => {
      logger.warn(`Timeout (${timeoutMs}ms) killed: ${cmd} ${args.join(' ')}`);
      try { child.kill('SIGTERM'); } catch (_) { /* intentional */ }
      settle({ ok: false, code: null, stdout, stderr: 'Tiempo de espera agotado.', timedOut: true });
    }, timeoutMs);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-flight check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {{ name: string, installHint: string }} MissingTool
 * @typedef {{ id: string, name: string, available: boolean, version: string|null, installHint: string }} CheckedTool
 * @typedef {{ ok: boolean, missing: MissingTool[], checked: CheckedTool[] }} PreflightResult
 */

/** @type {Record<string, { name: string, installHint: string }>} */
const TOOL_META = {
  node:     { name: 'Node.js',    installHint: 'https://nodejs.org' },
  npm:      { name: 'npm',        installHint: 'Incluido con Node.js — reinstala Node.js' },
  python:   { name: 'Python 3',   installHint: 'https://python.org/downloads' },
  dotnet:   { name: '.NET SDK',   installHint: 'https://dotnet.microsoft.com/download' },
  java:     { name: 'Java (JDK)', installHint: 'https://adoptium.net' },
  mvn:      { name: 'Maven',      installHint: 'https://maven.apache.org/download.cgi' },
  composer: { name: 'Composer',   installHint: 'https://getcomposer.org/download' },
  php:      { name: 'PHP 8',      installHint: 'https://www.php.net/downloads' },
};

/**
 * Synchronously checks that required tools are installed.
 * @param {'java'|'python'|'csharp'|'php'|'js'} lang
 * @param {string} frameworkId
 * @returns {PreflightResult}
 */
function preflight(lang, frameworkId) {
  const missing = [];
  const checked = [];

  // Records the outcome of a probe() call already made — no extra spawns,
  // same call count as before this function grew a `checked` field.
  /** @param {keyof typeof TOOL_META} id @param {string|null} version */
  const record = (id, version) => {
    checked.push({ id, name: TOOL_META[id].name, available: Boolean(version), version: version || null, installHint: TOOL_META[id].installHint });
    return Boolean(version);
  };

  switch (lang) {
    case 'js':
      if (!record('node', probe('node'))) missing.push(TOOL_META.node);
      if (!record('npm', probe('npm')))   missing.push(TOOL_META.npm);
      break;
    case 'python': {
      const exe = findPython();
      // findPython() already re-probes internally to validate it's really
      // Python 3; re-reading its version here is one more probe of the
      // resolved exe, purely for display — findPython() itself is unchanged.
      const version = exe ? probe(exe) : null;
      if (!record('python', version)) missing.push(TOOL_META.python);
      break;
    }
    case 'csharp':
      if (!record('dotnet', probe('dotnet'))) missing.push(TOOL_META.dotnet);
      break;
    case 'java':
      if (!record('java', probe('java'))) missing.push(TOOL_META.java);
      if (['spring-boot', 'quarkus', 'micronaut'].includes(frameworkId)) {
        if (!record('mvn', probe('mvn'))) missing.push(TOOL_META.mvn);
      }
      break;
    case 'php':
      if (!record('php', probe('php'))) missing.push(TOOL_META.php);
      if (['laravel', 'symfony'].includes(frameworkId)) {
        if (!record('composer', probe('composer'))) missing.push(TOOL_META.composer);
      }
      break;
  }

  return { ok: missing.length === 0, missing, checked };
}

// ─────────────────────────────────────────────────────────────────────────────
// Install strategies
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} InstallContext
 * @property {string} projectPath
 * @property {string} projectName
 * @property {string} frameworkId
 * @property {(step: string, detail?: string) => void} onStep
 * @property {(line: string) => void} onOutput
 */

/**
 * @typedef {Object} InstallResult
 * @property {boolean}  ok
 * @property {string}   [error]       - user-facing message (no stack trace)
 * @property {string}   [manualCmd]   - command user can run to install manually
 * @property {boolean}  [isNetwork]   - true when failure was a network issue
 */

/**
 * Returns platform-specific manual commands for Python dependency installation.
 * @returns {string}
 */
function formatPythonManualCommands() {
  const macLinux = [
    'python3 -m venv venv',
    'source venv/bin/activate',
    'pip install -r requirements.txt',
  ].join('\n');

  const windows = [
    'python -m venv venv',
    'venv\\Scripts\\activate',
    'pip install -r requirements.txt',
  ].join('\n');

  return `macOS/Linux:\n${macLinux}\n\nWindows:\n${windows}`;
}

/**
 * Parses pip output and returns a package-level failure if present.
 * @param {string} raw
 * @returns {{package: string, reason: string}|null}
 */
function parsePipPackageFailure(raw) {
  const lines = raw.split('\n');
  for (const line of lines) {
    let match = line.match(/Could not find a version that satisfies the requirement\s+([^\s]+)/i);
    if (match) {
      return { package: match[1], reason: line.trim() };
    }
    match = line.match(/No matching distribution found for\s+([^\s]+)/i);
    if (match) {
      return { package: match[1], reason: line.trim() };
    }
  }
  return null;
}

/**
 * Classifies a RunResult and builds an InstallResult for failures.
 * @param {string} cmd
 * @param {RunResult} result
 * @param {string} manualCmd
 * @returns {InstallResult}
 */
function failResult(cmd, result, manualCmd) {
  const raw = (result.stderr + '\n' + result.stdout).trim();
  const networkType = classifyNetworkError(raw);

  if (result.timedOut) {
    return {
      ok: false,
      isNetwork: true,
      manualCmd,
      error: `La instalación tardó demasiado tiempo.\n\nComando ejecutado:\n${cmd}\n\nPuedes instalar las dependencias manualmente:\n\n${formatPythonManualCommands()}`,
    };
  }

  if (networkType) {
    return {
      ok: false,
      isNetwork: true,
      manualCmd,
      error: `${networkErrorMessage(networkType, manualCmd)}\n\nComando ejecutado:\n${cmd}\n\nPuedes instalar las dependencias manualmente:\n\n${formatPythonManualCommands()}`,
    };
  }

  const pipFailure = parsePipPackageFailure(raw);
  if (pipFailure) {
    return {
      ok: false,
      isNetwork: false,
      manualCmd,
      error: `Paquete con error:\n${pipFailure.package}\n\nMotivo:\n${pipFailure.reason}\n\nComando ejecutado:\n${cmd}\n\nSalida de pip:\n${raw}\n\nPuedes instalar las dependencias manualmente:\n${formatPythonManualCommands()}`,
    };
  }

  // Real install failure — show last 6 lines of output, no stack traces
  const relevant = raw.split('\n')
    .filter(l => l.trim() && !isNoiseLine(l))
    .slice(-6)
    .join('\n');

  return {
    ok: false,
    isNetwork: false,
    manualCmd,
    error: relevant
      ? `No fue posible instalar las dependencias.\n\nMotivo:\n${relevant}\n\nComando ejecutado:\n${cmd}\n\nManual install commands:\n${formatPythonManualCommands()}`
      : `No fue posible instalar las dependencias.\n\nComando ejecutado:\n${cmd}\n\nManual install commands:\n${formatPythonManualCommands()}`,
  };
}

// ── Node.js ──────────────────────────────────────────────────────────────────

/**
 * @param {InstallContext} ctx
 * @returns {Promise<InstallResult>}
 */
async function installNode(ctx) {
  const { projectPath, onStep, onOutput } = ctx;
  const manualCmd = 'npm install';

  if (!fs.existsSync(path.join(projectPath, 'package.json'))) {
    return { ok: false, error: 'No se encontró package.json.', manualCmd };
  }

  onStep('Instalando dependencias Node.js…', 'npm install');
  const t = Date.now();

  const result = await run('npm', ['install', '--prefer-offline'], projectPath, onOutput);
  logger.step('npm install', t, result.ok);

  if (!result.ok) return failResult('npm install', result, manualCmd);

  onStep('Dependencias instaladas ✓');
  return { ok: true };
}

// ── Python ───────────────────────────────────────────────────────────────────

/**
 * @param {InstallContext} ctx
 * @returns {Promise<InstallResult>}
 */
async function installPython(ctx) {
  const { projectPath, frameworkId, onStep, onOutput } = ctx;

  const pyExe = findPython();
  if (!pyExe) {
    return {
      ok: false,
      error: 'No se encontró Python 3. Instálalo desde https://python.org/downloads',
      manualCmd: 'python3 -m pip install -r requirements.txt',
    };
  }

  // Ensure requirements.txt
  const reqPath = path.join(projectPath, 'requirements.txt');
  if (!fs.existsSync(reqPath)) {
    onStep('Generando requirements.txt…');
    fs.writeFileSync(reqPath, defaultRequirements(frameworkId), 'utf-8');
    logger.info(`Created requirements.txt for ${frameworkId}`);
  }

  // 1. Create virtual environment
  onStep('Creando entorno virtual…', `${pyExe} -m venv venv`);
  let t = Date.now();
  const venvResult = await run(pyExe, ['-m', 'venv', 'venv'], projectPath, onOutput);
  logger.step('venv create', t, venvResult.ok);

  if (!venvResult.ok) {
    const manualCmd = `${pyExe} -m venv venv && ${pyExe} -m pip install -r requirements.txt`;
    return failResult(`${pyExe} -m venv`, venvResult, manualCmd);
  }

  // 2. Resolve venv Python (use it for pip to guarantee correct venv)
  const isWin = process.platform === 'win32';
  const venvPython = isWin
    ? path.join(projectPath, 'venv', 'Scripts', 'python.exe')
    : path.join(projectPath, 'venv', 'bin', 'python');

  const pipExe = fs.existsSync(venvPython) ? venvPython : pyExe;
  const manualCmd = process.platform === 'win32'
    ? 'python -m venv venv && python -m pip install -r requirements.txt'
    : 'python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt';

  // 3. Install requirements (no pip upgrade — just install)
  const pipCommand = `${pipExe} -m pip install -r requirements.txt`;
  onStep('Instalando dependencias…', pipCommand);
  logger.info(`Executing pip command: ${pipCommand}`);
  t = Date.now();
  const installResult = await run(
    pipExe,
    ['-m', 'pip', 'install', '-r', 'requirements.txt', '--no-warn-script-location'],
    projectPath,
    onOutput,
  );
  logger.step('pip install', t, installResult.ok);

  if (!installResult.ok) return failResult('pip install', installResult, manualCmd);

  onStep('Dependencias instaladas ✓');
  return { ok: true };
}

// ── .NET ─────────────────────────────────────────────────────────────────────

/**
 * @param {InstallContext} ctx
 * @returns {Promise<InstallResult>}
 */
async function installDotnet(ctx) {
  const { projectPath, onStep, onOutput } = ctx;
  const manualCmd = 'dotnet restore';

  onStep('Restaurando paquetes NuGet…', 'dotnet restore');
  const t = Date.now();
  const result = await run('dotnet', ['restore', '--verbosity', 'minimal'], projectPath, onOutput);
  logger.step('dotnet restore', t, result.ok);

  if (!result.ok) return failResult('dotnet restore', result, manualCmd);

  onStep('Paquetes NuGet restaurados ✓');
  return { ok: true };
}

// ── Java / Maven ──────────────────────────────────────────────────────────────

/**
 * @param {InstallContext} ctx
 * @returns {Promise<InstallResult>}
 */
async function installJava(ctx) {
  const { projectPath, onStep, onOutput } = ctx;
  const isWin = process.platform === 'win32';

  // Prefer Maven wrapper if present
  const wrapperFile = isWin ? 'mvnw.cmd' : 'mvnw';
  const wrapperExists = fs.existsSync(path.join(projectPath, wrapperFile));
  const mvn = wrapperExists ? (isWin ? 'mvnw.cmd' : './mvnw') : 'mvn';
  const manualCmd = `${mvn} dependency:resolve`;

  onStep('Descargando dependencias Maven…', `${mvn} dependency:resolve`);
  const t = Date.now();
  const result = await run(
    mvn, ['dependency:resolve', '-q', '--no-transfer-progress'],
    projectPath, onOutput,
  );
  logger.step('mvn dependency:resolve', t, result.ok);

  if (!result.ok) {
    // Maven exits non-zero on some warnings — only fail on BUILD FAILURE
    const combined = result.stderr + result.stdout;
    if (!combined.includes('BUILD FAILURE')) {
      logger.warn('Maven exited non-zero without BUILD FAILURE — treating as OK');
      onStep('Dependencias Maven resueltas ✓');
      return { ok: true };
    }
    return failResult(mvn, result, manualCmd);
  }

  onStep('Dependencias Maven resueltas ✓');
  return { ok: true };
}

// ── PHP / Composer ────────────────────────────────────────────────────────────

/**
 * @param {InstallContext} ctx
 * @returns {Promise<InstallResult>}
 */
async function installPhp(ctx) {
  const { projectPath, frameworkId, onStep, onOutput } = ctx;
  const manualCmd = 'composer install';

  onStep('Instalando dependencias PHP…', 'composer install');
  let t = Date.now();
  const installResult = await run(
    'composer',
    ['install', '--no-interaction', '--prefer-dist', '--optimize-autoloader'],
    projectPath, onOutput,
  );
  logger.step('composer install', t, installResult.ok);

  if (!installResult.ok) return failResult('composer install', installResult, manualCmd);

  // Laravel-specific: copy .env + generate app key
  if (frameworkId === 'laravel') {
    const envExample = path.join(projectPath, '.env.example');
    const envFile    = path.join(projectPath, '.env');

    if (fs.existsSync(envExample) && !fs.existsSync(envFile)) {
      try {
        fs.copyFileSync(envExample, envFile);
        logger.info('Copied .env.example → .env');
        onStep('Configurando .env…');
      } catch (e) {
        logger.warn(`Could not copy .env.example: ${e}`);
      }
    }

    onStep('Generando clave de aplicación…', 'php artisan key:generate');
    t = Date.now();
    const keyResult = await run('php', ['artisan', 'key:generate', '--ansi'], projectPath, onOutput);
    logger.step('key:generate', t, keyResult.ok);
    // Non-fatal: log and continue
    if (!keyResult.ok) {
      logger.warn('key:generate failed (non-fatal) — user can run it manually');
    }
  }

  onStep('Dependencias PHP instaladas ✓');
  return { ok: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Default requirements fallback
// ─────────────────────────────────────────────────────────────────────────────

/** @param {string} frameworkId @returns {string} */
function defaultRequirements(frameworkId) {
  const map = {
    fastapi:  'fastapi>=0.115\nuvicorn[standard]>=0.30\npython-dotenv>=1.0\nhttpx>=0.27\n',
    django:   'django>=5.1\ngunicorn>=22.0\npython-dotenv>=1.0\n',
    flask:    'flask>=3.1\ngunicorn>=22.0\npython-dotenv>=1.0\n',
    litestar: 'litestar[standard]>=2.12\nuvicorn[standard]>=0.30\npydantic>=2.0\npython-dotenv>=1.0\n',
  };
  return map[frameworkId] || 'python-dotenv>=1.0\n';
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} InstallerOptions
 * @property {string}  projectPath
 * @property {string}  projectName
 * @property {'java'|'python'|'csharp'|'php'|'js'} lang
 * @property {string}  frameworkId
 * @property {(step: string, detail?: string) => void} onStep
 * @property {(line: string) => void} onOutput
 */

/**
 * Installs project dependencies.
 *
 * Never throws. Always returns an InstallResult.
 * Network failures produce { ok: false, isNetwork: true } so the caller
 * can degrade gracefully (show manual command, not a fatal error).
 *
 * @param {InstallerOptions} opts
 * @returns {Promise<InstallResult>}
 */
async function installDependencies(opts) {
  const { lang, frameworkId, projectPath, projectName, onStep, onOutput } = opts;

  try {
    // Pre-flight
    onStep('Verificando herramientas…');
    const check = preflight(lang, frameworkId);
    if (!check.ok) {
      const list = check.missing.map(t => `  • ${t.name}  →  ${t.installHint}`).join('\n');
      logger.warn(`Preflight failed: ${check.missing.map(t => t.name).join(', ')}`);
      return {
        ok: false,
        isNetwork: false,
        error: `Herramientas requeridas no encontradas:\n\n${list}\n\nInstálalas y vuelve a intentarlo.`,
      };
    }

    const ctx = { projectPath, projectName, frameworkId, onStep, onOutput };

    switch (lang) {
      case 'js':     return await installNode(ctx);
      case 'python': return await installPython(ctx);
      case 'csharp': return await installDotnet(ctx);
      case 'java':   return await installJava(ctx);
      case 'php':    return await installPhp(ctx);
      default:       return { ok: true };
    }
  } catch (err) {
    // Absolute safety net — should never reach here, but guarantees no hanging Promise
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`installDependencies unexpected throw: ${msg}`);
    return {
      ok: false,
      isNetwork: false,
      error: `Error inesperado durante la instalación:\n${msg}`,
    };
  }
}

/**
 * @param {'java'|'python'|'csharp'|'php'|'js'} lang
 * @returns {boolean}
 */
function requiresInstall(lang) {
  return ['js', 'python', 'csharp', 'java', 'php'].includes(lang);
}

module.exports = { installDependencies, requiresInstall, preflight, findPython };
