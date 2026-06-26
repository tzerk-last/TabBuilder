// @ts-check
'use strict';

let vscode = null;
try {
  vscode = require('vscode');
} catch (err) {
  // Running outside VS Code (tests, scripts) - fall back to console.
}

/**
 * Singleton Output Channel logger.
 * All internal diagnostics go here — nothing raw reaches the user.
 */
class Logger {
  constructor() {
    /** @type {vscode.OutputChannel | null} */
    this._channel = null;
    /** @type {number} */
    this._sessionStart = 0;
  }

  /** @returns {vscode.OutputChannel} */
  get channel() {
    if (vscode && vscode.window) {
      if (!this._channel) {
        this._channel = vscode.window.createOutputChannel('Framework Project Builder');
      }
      return this._channel;
    }
    return null;
  }

  /** Writes a timestamped line to the output channel or console. */
  _write(level, msg) {
    const elapsed = this._sessionStart
      ? `+${((Date.now() - this._sessionStart) / 1000).toFixed(1)}s`
      : new Date().toISOString().slice(11, 23);
    const line = `[${elapsed}] [${level}] ${msg}`;
    if (this.channel) {
      this.channel.appendLine(line);
    } else {
      console.log(line);
    }
  }

  /** Marks the start of a new generation session. */
  startSession(projectName, frameworkId) {
    this._sessionStart = Date.now();
    this.channel.appendLine('');
    this.channel.appendLine('─'.repeat(60));
    this.channel.appendLine(`  TabBuilder — generando: ${projectName} (${frameworkId})`);
    this.channel.appendLine(`  ${new Date().toLocaleString()}`);
    this.channel.appendLine('─'.repeat(60));
  }

  /** @param {string} msg */
  info(msg)  { this._write('INFO ', msg); }

  /** @param {string} msg */
  warn(msg)  { this._write('WARN ', msg); }

  /** @param {string} msg */
  error(msg) { this._write('ERROR', msg); }

  /** @param {string} msg */
  debug(msg) { this._write('DEBUG', msg); }

  /**
   * Logs a raw output line from a subprocess.
   * @param {string} cmd
   * @param {string} line
   */
  cmd(cmd, line) { this._write('CMD  ', `[${cmd}] ${line}`); }

  /**
   * Logs a completed step with elapsed time.
   * @param {string} step
   * @param {number} startMs
   * @param {boolean} ok
   */
  step(step, startMs, ok) {
    const ms = Date.now() - startMs;
    this._write(ok ? 'STEP ' : 'FAIL ', `${step} (${ms}ms) → ${ok ? 'OK' : 'FAILED'}`);
  }

  dispose() {
    if (this._channel) {
      this._channel.dispose();
      this._channel = null;
    }
  }
}

const logger = new Logger();

module.exports = { logger };
