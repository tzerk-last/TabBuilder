// @ts-check
'use strict';

// ─────────────────────────────────────────────────────────────────────────────
// TEMPORARY diagnostic instrumentation for the webview-visibility investigation.
// Writes structured, timestamped JSON-line events to a file so they can be
// inspected outside of VS Code (the Output Channel is not readable headlessly).
// Gated by TABBUILDER_DIAG_LOG — a no-op unless that env var is set, so it
// never runs in a normal user install. Delete this file + call sites once the
// root cause is confirmed and the fix is validated.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');

const LOG_PATH = process.env.TABBUILDER_DIAG_LOG || '';
let seq = 0;

/**
 * @param {string} event
 * @param {Record<string, any>} [data]
 */
function diagLog(event, data = {}) {
  if (!LOG_PATH) return;
  seq += 1;
  const line = JSON.stringify({ seq, t: Date.now(), iso: new Date().toISOString(), event, ...data });
  try {
    fs.appendFileSync(LOG_PATH, line + '\n');
  } catch (_) {
    // best-effort diagnostic only — must never break the extension
  }
}

module.exports = { diagLog, LOG_PATH };
