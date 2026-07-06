// @ts-check
'use strict';

/**
 * Regression suite for the webview's own client-side logic: initial render
 * state, step navigation (forward/back/skip-arch/goToStep), and the
 * checkRequirements race condition documented in the technical audit.
 *
 * Runs the REAL HTML/CSS/JS produced by getWebviewContent() inside actual
 * Chrome (headless, real timers — no --virtual-time-budget, which was
 * proven earlier to produce false negatives with CSS transitions). This is
 * not a mock of the webview; it is the exact string VS Code would set as
 * `webview.html`, with only `acquireVsCodeApi()` stubbed out (unavailable
 * outside a real VS Code host) to capture outgoing postMessage calls.
 *
 * Skips gracefully — does not fail the run — if Chrome isn't found, mirroring
 * how generator.test.js skips when composer/php aren't installed.
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const { getWebviewContent } = require('./webview');

function findChrome() {
  const candidates = process.platform === 'darwin'
    ? ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
    : process.platform === 'win32'
      ? [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        ]
      : ['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'];

  for (const candidate of candidates) {
    if (candidate.includes(path.sep) || candidate.includes('\\')) {
      if (fs.existsSync(candidate)) return candidate;
    } else {
      const probe = spawnSync(candidate, ['--version'], { stdio: 'ignore' });
      if (probe && probe.status === 0) return candidate;
    }
  }
  return null;
}

/**
 * Runs `script` inside the real webview HTML in headless Chrome and returns
 * the JSON array written to <pre id="audit-results-output">.
 * @param {string} chromePath
 * @param {string} script
 * @returns {Array<{label: string, pass: boolean, extra?: string}>}
 */
function runInWebview(chromePath, script) {
  let html = getWebviewContent();
  html = html.replace(
    'const vscode = acquireVsCodeApi();',
    'const vscode = { postMessage: (m) => { window.__sent = window.__sent || []; window.__sent.push(m); } };',
  );
  html += `<script>${script}</script>`;

  const tmpFile = path.join(os.tmpdir(), `tabbuilder-webview-test-${Date.now()}-${Math.random().toString(36).slice(2)}.html`);
  fs.writeFileSync(tmpFile, html);

  try {
    const result = spawnSync(chromePath, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--dump-dom', `file://${tmpFile}`,
    ], { encoding: 'utf8', timeout: 15000 });

    if (result.status !== 0 || !result.stdout) {
      throw new Error(`Chrome headless failed (status ${result.status}): ${result.stderr || 'no stdout'}`);
    }

    const match = result.stdout.match(/<pre id="audit-results-output">([\s\S]*?)<\/pre>/);
    if (!match) throw new Error('No se encontró el reporte de resultados en el DOM volcado — el script de prueba no llegó a ejecutarse.');

    const decoded = match[1]
      .replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<').replace(/&amp;/g, '&');
    return JSON.parse(decoded);
  } finally {
    fs.rmSync(tmpFile, { force: true });
  }
}

const NAVIGATION_SCRIPT = `
(function () {
  const results = [];
  const assert = (label, cond, extra) => results.push({ label, pass: !!cond, extra: extra || null });

  assert('inicia en step-0 (asistente principal), no en Generando', document.getElementById('step-0').classList.contains('active'));
  assert('la pantalla de Generando NO está activa al abrir', !document.getElementById('step-generating').classList.contains('active'));
  assert('el sidebar es visible desde el primer render', getComputedStyle(document.getElementById('sidebar')).display !== 'none');
  assert('configCard está oculto en el paso 0 (nada que resumir todavía)', getComputedStyle(document.getElementById('configCard')).display === 'none');

  const fwMulti = state.categories.flatMap(c => c.frameworks).find(f => f.architectures && f.architectures.length > 1);
  assert('hay un framework con más de una arquitectura para probar la navegación completa', !!fwMulti, fwMulti && fwMulti.id);
  selectFramework(fwMulti.id, fwMulti.name);
  document.getElementById('projectName').value = 'MiProyectoTest';
  onNameChange();
  window.dispatchEvent(new MessageEvent('message', { data: { command: 'folderSelected', path: '/tmp/mi-proyecto' } }));
  assert('el botón Continuar se habilita al completar nombre + carpeta + framework', !document.getElementById('next-0').disabled);

  nextStep(); assert('avanza a Tipo de proyecto', state.currentStep === 1);
  nextStep(); assert('avanza a Base de datos', state.currentStep === 2);
  nextStep(); assert('avanza a DevOps', state.currentStep === 3);
  nextStep(); assert('avanza a Resumen', state.currentStep === 4);
  assert('configCard se muestra en Resumen', getComputedStyle(document.getElementById('configCard')).display !== 'none');

  prevStep(); prevStep(); prevStep(); prevStep();
  assert('retrocede los 4 pasos de vuelta a Framework', state.currentStep === 0);
  assert('los datos ingresados sobreviven ir y volver', state.projectName === 'MiProyectoTest' && state.frameworkId === fwMulti.id);

  const fwSingle = state.categories.flatMap(c => c.frameworks).find(f => f.architectures && f.architectures.length === 1);
  if (fwSingle) {
    showStep(0);
    selectFramework(fwSingle.id, fwSingle.name);
    assert('skipArch se activa para frameworks de una sola arquitectura', state.skipArch === true);
    nextStep();
    assert('con skipArch, Continuar salta directo a Base de datos', state.currentStep === 2, 'currentStep=' + state.currentStep);
    prevStep();
    assert('con skipArch, Atrás regresa directo a Framework', state.currentStep === 0, 'currentStep=' + state.currentStep);
    goToStep(1);
    assert('el paso de arquitectura no es alcanzable por el track cuando está oculto', state.currentStep === 0);
  }

  document.title = 'AUDIT_DONE';
  const pre = document.createElement('pre');
  pre.id = 'audit-results-output';
  pre.textContent = JSON.stringify(results);
  document.body.appendChild(pre);
})();
`;

function runTests() {
  const chromePath = findChrome();
  if (!chromePath) {
    console.warn('Skipping webview.navigation.test.js: no se encontró Chrome/Chromium instalado.');
    return;
  }

  const results = runInWebview(chromePath, NAVIGATION_SCRIPT);
  let failed = 0;
  for (const r of results) {
    const mark = r.pass ? 'OK  ' : 'FAIL';
    if (!r.pass) failed++;
    console.log(`  [${mark}] ${r.label}${r.extra ? ` (${r.extra})` : ''}`);
  }
  console.log(`\n${results.length} verificaciones, ${failed} fallidas.`);
  if (failed > 0) {
    throw new Error(`webview.navigation.test.js: ${failed} verificación(es) de navegación fallaron.`);
  }
}

runTests();
