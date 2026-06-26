'use strict';

class RuntimeLogger {
  constructor(delegate = {}) {
    this._delegate = {
      info: delegate.info || (() => {}),
      warn: delegate.warn || (() => {}),
      error: delegate.error || (() => {}),
      debug: delegate.debug || (() => {}),
      cmd: delegate.cmd || (() => {}),
      step: delegate.step || (() => {}),
    };
  }

  info(msg) { this._delegate.info(msg); }
  warn(msg) { this._delegate.warn(msg); }
  error(msg) { this._delegate.error(msg); }
  debug(msg) { this._delegate.debug(msg); }
  cmd(cmd, line) { this._delegate.cmd(cmd, line); }
  step(step, startMs, ok) { this._delegate.step(step, startMs, ok); }
}

module.exports = { RuntimeLogger };