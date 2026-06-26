'use strict';

class ProgressReporter {
  constructor(onProgress = () => {}) {
    this._onProgress = onProgress;
  }

  /**
   * @param {string} stepId
   * @param {'running'|'done'|'warn'|'error'|'skip'} state
   * @param {string} [label]
   * @param {string} [detail]
   */
  report(stepId, state, label = '', detail = '') {
    this._onProgress({ stepId, state, label, detail });
  }

  start(stepId, label, detail = '') {
    this.report(stepId, 'running', label, detail);
  }

  done(stepId, label, detail = '') {
    this.report(stepId, 'done', label, detail);
  }

  warn(stepId, label, detail = '') {
    this.report(stepId, 'warn', label, detail);
  }

  error(stepId, label, detail = '') {
    this.report(stepId, 'error', label, detail);
  }

  skip(stepId, label = '', detail = '') {
    this.report(stepId, 'skip', label, detail);
  }
}

module.exports = { ProgressReporter };