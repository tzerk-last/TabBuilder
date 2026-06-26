'use strict';

class CommandResult {
  /**
   * @param {Object} options
   * @param {boolean} options.ok
   * @param {number|null} [options.code]
   * @param {string} [options.stdout]
   * @param {string} [options.stderr]
   * @param {boolean} [options.timedOut]
   */
  constructor({ ok, code = null, stdout = '', stderr = '', timedOut = false }) {
    this.ok = Boolean(ok);
    this.code = code === undefined ? null : code;
    this.stdout = String(stdout || '');
    this.stderr = String(stderr || '');
    this.timedOut = Boolean(timedOut);
  }

  get output() {
    return [this.stdout, this.stderr].filter(Boolean).join('\n');
  }

  toJSON() {
    return {
      ok: this.ok,
      code: this.code,
      stdout: this.stdout,
      stderr: this.stderr,
      timedOut: this.timedOut,
    };
  }
}

module.exports = { CommandResult };