'use strict';

const { spawn, spawnSync } = require('child_process');
const path = require('path');
const { CommandResult } = require('./CommandResult');
const { RuntimeLogger } = require('./Logger');

class CommandRunner {
  constructor(options = {}) {
    this.logger = options.logger || new RuntimeLogger();
    this._extraPaths = Array.isArray(options.extraPaths) ? options.extraPaths : [];
  }

  extraPaths() {
    if (process.platform === 'win32') return [];
    const home = process.env.HOME || '';
    return [
      '/usr/local/bin',
      '/usr/bin',
      '/opt/homebrew/bin',
      '/opt/homebrew/opt/python@3.13/bin',
      '/opt/homebrew/opt/python@3.12/bin',
      '/opt/homebrew/opt/python@3.11/bin',
      `${home}/.pyenv/shims`,
      `${home}/.pyenv/bin`,
      `${home}/.local/bin`,
      '/usr/local/opt/python@3/bin',
      ...this._extraPaths,
    ].filter(Boolean);
  }

  buildPath() {
    const sep = path.delimiter;
    const current = process.env.PATH || '';
    return [...new Set([...current.split(sep), ...this.extraPaths()].filter(Boolean))].join(sep);
  }

  buildEnv() {
    return { ...process.env, PATH: this.buildPath() };
  }

  probe(exe, args = ['--version'], timeoutMs = 6000) {
    const env = this.buildEnv();

    // args must be spawnSync's real 2nd positional parameter (an array) —
    // passing an options object there instead (as this used to) makes Node
    // silently discard args and run `exe` with none, which several CLIs
    // (node, python3, composer, php...) happily exit 0 for, yielding a
    // garbage "version" instead of failing loudly. shell:true lets Node
    // resolve platform-specific wrappers (.cmd/.bat on Windows) without any
    // manual command-string quoting.
    for (const shell of [false, true]) {
      try {
        const result = spawnSync(exe, args, { stdio: 'pipe', shell, timeout: timeoutMs, encoding: 'utf8', env });
        if (result && result.status === 0 && !result.error) {
          return (result.stdout || result.stderr || '').trim().split('\n')[0] || exe;
        }
      } catch (_) {
        // ignore and try the next form
      }
    }
    return null;
  }

  /**
   * Tries each candidate executable name in order and returns the first one
   * that probes successfully — the single, central place for "this tool may
   * be installed under different names depending on the OS/distro" (e.g.
   * python3/python). Pass `validate` when a successful probe isn't proof
   * enough on its own (e.g. a bare `python` that resolves to Python 2).
   * @param {string[]} candidates
   * @param {string[]} args
   * @param {number} [timeoutMs]
   * @param {(version: string) => boolean} [validate]
   * @returns {string|null} the resolved candidate name, or null if none matched
   */
  resolveExecutable(candidates, args = ['--version'], timeoutMs = 6000, validate = null) {
    for (const candidate of candidates || []) {
      const version = this.probe(candidate, args, timeoutMs);
      if (version && (!validate || validate(version))) return candidate;
    }
    return null;
  }

  run(cmd, args, cwd, onData = () => {}, env = null, timeoutMs = 5 * 60 * 1000, filterFn = null) {
    return new Promise((resolve) => {
      let settled = false;
      const settle = (result) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(result);
      };

      const effectiveEnv = env || this.buildEnv();
      const isWin = process.platform === 'win32';
      let child;

      try {
        child = spawn(cmd, args, {
          cwd,
          env: effectiveEnv,
          shell: isWin,
          stdio: ['ignore', 'pipe', 'pipe'],
        });
      } catch (err) {
        settle(new CommandResult({ ok: false, stdout: '', stderr: String(err), timedOut: false }));
        return;
      }

      let stdout = '';
      let stderr = '';

      const handleStream = (chunk, source) => {
        const text = chunk.toString();
        if (source === 'stdout') stdout += text;
        else stderr += text;
        for (const line of text.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          this.logger.cmd(cmd, `[${source}] ${trimmed}`);
          if (!filterFn || !filterFn(trimmed)) {
            onData(trimmed);
          }
        }
      };

      child.stdout.on('data', (data) => handleStream(data, 'stdout'));
      child.stderr.on('data', (data) => handleStream(data, 'stderr'));

      child.on('error', (err) => {
        this.logger.error(`spawn error [${cmd}]: ${err.message}`);
        settle(new CommandResult({ ok: false, stdout, stderr: err.message, timedOut: false }));
      });

      child.on('close', (code) => {
        settle(new CommandResult({ ok: code === 0, code, stdout, stderr, timedOut: false }));
      });

      const timer = setTimeout(() => {
        this.logger.warn(`Timeout (${timeoutMs}ms) killed: ${cmd} ${args.join(' ')}`);
        try { child.kill('SIGTERM'); } catch (_) { /* intentional */ }
        settle(new CommandResult({ ok: false, stdout, stderr: 'Tiempo de espera agotado.', timedOut: true }));
      }, timeoutMs);
    });
  }
}

module.exports = { CommandRunner };