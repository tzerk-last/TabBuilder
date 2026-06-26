// @ts-check
'use strict';

const { FRAMEWORK_CATEGORIES, FRAMEWORKS, getFrameworkArchitectures, getEnabledDevops } = require('../frameworks/index');

/**
 * Serialises framework + category data for the webview script.
 * @returns {string} JSON string
 */
function getFrameworkData() {
  const categories = FRAMEWORK_CATEGORIES.map(cat => ({
    ...cat,
    frameworks: cat.frameworks
      .map(id => {
        const fw = FRAMEWORKS[id];
        if (!fw) return null;
        // Causa raíz del bug MVP: la UI debe mostrar SOLO frameworks habilitados.
        // Los deshabilitados (enabled:false) permanecen en el código pero no se
        // serializan hacia el WebView.
        if (fw.enabled === false) return null;
        return { id: fw.id, name: fw.name, icon: fw.icon, lang: fw.lang,
                 description: fw.description, version: fw.version,
                 architectures: getFrameworkArchitectures(id) };
      })
      .filter(Boolean),
  }))
  // Las categorías que quedan sin frameworks habilitados no se muestran.
  .filter(cat => cat.frameworks.length > 0);
  return JSON.stringify(categories);
}

/**
 * Returns the complete HTML for the webview panel.
 * @returns {string}
 */
function getWebviewContent() {
  const frameworkData = getFrameworkData();
  const devopsData = JSON.stringify(getEnabledDevops());

  return /* html */ `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Framework Project Builder</title>
<style>
:root {
  --bg:#0d0d12; --surface:#13131c; --surface2:#16161f;
  --line:#1e1e2a; --line2:#2a2a3a;
  --txt:#e2e2e8; --muted:#888; --dim:#555; --faint:#444;
  --accent:#7c6af7; --accent2:#5b4fcf;
  --ok:#6fcf97; --okbg:#1a2e1a; --okline:#2e5030;
  --err:#eb5757; --errbg:#2e1a1a; --errline:#5e2222;
  --warn:#f0b429;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--txt);min-height:100vh;font-size:13px}

/* ── Wizard bar ────────────────────────────────────────── */
.wiz-bar{display:flex;align-items:center;padding:10px 14px;border-bottom:1px solid var(--line);background:var(--bg);position:sticky;top:0;z-index:20;gap:4px;overflow-x:auto}
.wiz-step{display:flex;align-items:center;gap:5px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.4px;color:var(--faint);padding:4px 6px;border-radius:6px;cursor:default;white-space:nowrap;transition:color .2s}
.wiz-step .dot{width:16px;height:16px;border-radius:50%;background:var(--surface);border:1px solid var(--line2);display:flex;align-items:center;justify-content:center;font-size:9px;flex-shrink:0;transition:all .2s}
.wiz-step.active{color:var(--accent)}.wiz-step.active .dot{background:var(--accent);color:#fff;border-color:var(--accent)}
.wiz-step.done{color:var(--ok);cursor:pointer}.wiz-step.done .dot{background:var(--okbg);color:var(--ok);border-color:var(--okline)}
.wiz-sep{flex:1;min-width:8px;height:1px;background:var(--line)}

/* ── Layout ────────────────────────────────────────────── */
.main-layout{display:grid;grid-template-columns:1fr;gap:0;padding:14px}
@media(min-width:540px){.main-layout{grid-template-columns:1fr 210px;gap:14px}}
.step-panel{display:none}
.step-panel.active{display:block;animation:fadein .2s ease}
@keyframes fadein{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.step-title{font-size:15px;font-weight:700;color:#fff;margin-bottom:3px}
.step-sub{font-size:11px;color:var(--dim);margin-bottom:14px;line-height:1.5}

/* ── Framework cards ────────────────────────────────────── */
.cat-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);margin:12px 0 6px;display:flex;align-items:center;gap:6px}
.cat-label::after{content:'';flex:1;height:1px;background:var(--line)}
.fw-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:4px}
.fw-card{background:var(--surface);border:2px solid var(--line);border-radius:9px;padding:10px;cursor:pointer;transition:all .15s;position:relative}
.fw-card:hover{border-color:var(--accent);background:var(--surface2)}
.fw-card.selected{border-color:var(--accent);background:#15142a}
.fw-card.selected::after{content:'✓';position:absolute;top:6px;right:7px;background:var(--accent);color:#fff;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700}
.fw-card .fc-icon{font-size:18px;display:block;line-height:1}
.fw-card .fc-name{font-size:11px;font-weight:700;color:#ddd;margin-top:5px}
.fw-card .fc-desc{font-size:9px;color:var(--dim);margin-top:3px;line-height:1.4}
.fw-card .fc-ver{font-size:9px;color:var(--faint);margin-top:4px}

/* ── Option rows ────────────────────────────────────────── */
.opt-row{display:flex;align-items:flex-start;gap:10px;background:var(--surface);border:1px solid var(--line);border-radius:8px;padding:11px 12px;cursor:pointer;transition:all .15s;margin-bottom:8px}
.opt-row:hover{border-color:#3a3a55}.opt-row.selected{border-color:var(--accent);background:#15142a}
.opt-row .or-icon{font-size:16px;width:20px;text-align:center;flex-shrink:0;margin-top:1px;color:var(--muted)}
.opt-row.selected .or-icon{color:var(--accent)}
.opt-row .or-name{font-size:12px;font-weight:700;color:#ddd}
.opt-row .or-desc{font-size:10px;color:var(--dim);margin-top:2px;line-height:1.5}

/* ── Fields ─────────────────────────────────────────────── */
.field-label{display:block;font-size:10px;font-weight:700;color:#666;text-transform:uppercase;letter-spacing:.6px;margin-bottom:5px}
.field-input{width:100%;background:var(--surface);border:1px solid var(--line2);border-radius:7px;padding:9px 12px;color:var(--txt);font-size:13px;outline:none;transition:border-color .2s;margin-bottom:12px}
.field-input:focus{border-color:var(--accent)}
.folder-picker{background:var(--surface);border:2px dashed var(--line2);border-radius:7px;padding:10px 12px;cursor:pointer;display:flex;align-items:center;gap:9px;transition:all .2s;margin-bottom:12px}
.folder-picker:hover{border-color:var(--accent);background:var(--surface2)}
.folder-picker.has-path{border-style:solid;border-color:#3a3a55}
.fp-icon{font-size:18px;flex-shrink:0}
.fp-label{font-size:10px;color:var(--dim);font-weight:700;text-transform:uppercase}
.fp-value{font-size:11px;color:var(--muted);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.folder-picker.has-path .fp-value{color:var(--accent)}

/* ── Toasts ─────────────────────────────────────────────── */
.toast{display:none;margin-top:4px;padding:9px 12px;border-radius:7px;font-size:11px;line-height:1.5;white-space:pre-wrap}
.toast.info{display:block;background:#1a2440;border:1px solid #2a4070;color:#7ab4f8}
.toast.ok{display:block;background:var(--okbg);border:1px solid var(--okline);color:var(--ok)}
.toast.err{display:block;background:var(--errbg);border:1px solid var(--errline);color:var(--err)}

/* ── Buttons ─────────────────────────────────────────────── */
.wiz-nav{display:flex;justify-content:space-between;gap:8px;margin-top:16px}
.btn{padding:9px 16px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:all .2s;border:none;display:flex;align-items:center;gap:6px}
.btn-ghost{background:transparent;border:1px solid var(--line2);color:var(--muted)}
.btn-ghost:hover:not(:disabled){background:var(--surface)}
.btn-ghost:disabled{opacity:.35;cursor:not-allowed}
.btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;flex:1;justify-content:center}
.btn-primary:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px)}
.btn-primary:disabled{background:#1a1a28;color:#333;cursor:not-allowed}
.btn-success{background:linear-gradient(135deg,#1a7c6a,#157060);color:#fff;flex:1;justify-content:center}
.btn-success:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px)}
.btn-success:disabled{background:#1a1a28;color:#333;cursor:not-allowed}

/* ── Sidebar preview ─────────────────────────────────────── */
.prev-card{background:var(--surface);border:1px solid var(--line);border-radius:9px;padding:12px 13px;position:static}
@media(min-width:540px){.prev-card{position:sticky;top:54px}}
.prev-card h4{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);margin-bottom:9px}
.kv{display:flex;justify-content:space-between;align-items:center;font-size:11px;padding:4px 0;border-bottom:1px solid var(--line);gap:8px}
.kv:last-of-type{border-bottom:none}
.kv .k{color:var(--faint)}
.kv .v{font-weight:700;color:#ccc;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:120px}

/* ── Summary file tree ────────────────────────────────────── */
.tree{background:var(--bg);border:1px solid var(--line);border-radius:7px;padding:9px 11px;margin-top:10px;font-family:'JetBrains Mono','Fira Code',monospace;font-size:10px;line-height:1.7;color:var(--dim);white-space:pre;overflow-x:auto;max-height:220px;overflow-y:auto}
.tree .t-root{color:#ddd;font-weight:700}
.tree .t-file{color:var(--accent)}

/* ── Progress panel ─────────────────────────────────────────
   Shown during generation. Each pipeline step shows as a row.
   ─────────────────────────────────────────────────────────── */
.progress-panel{padding:4px 0}
.progress-step{display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:8px;margin-bottom:6px;background:var(--surface);border:1px solid var(--line);font-size:12px;transition:border-color .3s}
.progress-step.running{border-color:var(--accent)}
.progress-step.done{border-color:var(--okline);background:var(--okbg)}
.progress-step.error{border-color:var(--errline);background:var(--errbg)}
.progress-step.skip{opacity:.4}
.progress-step.warn{border-color:var(--warn);background:#2a2200}
.ps-icon{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0}
.progress-step.running .ps-icon{background:var(--accent);color:#fff;animation:spin 1s linear infinite}
.progress-step.done   .ps-icon{background:var(--okbg);color:var(--ok);border:1px solid var(--okline)}
.progress-step.error  .ps-icon{background:var(--errbg);color:var(--err);border:1px solid var(--errline)}
.progress-step.warn   .ps-icon{background:#2a2200;color:var(--warn);border:1px solid var(--warn)}
.progress-step.skip   .ps-icon{background:var(--surface2);color:var(--dim);border:1px solid var(--line2)}
.progress-step.pending .ps-icon{background:var(--surface2);color:var(--dim);border:1px solid var(--line2)}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.ps-label{flex:1;color:#ccc}
.progress-step.done  .ps-label{color:var(--ok)}
.progress-step.error .ps-label{color:var(--err)}
.progress-step.warn  .ps-label{color:var(--warn)}
.ps-detail{font-size:9px;color:var(--dim);margin-top:1px}

/* Install log — scrollable terminal-like output */
.install-log{background:#080810;border:1px solid var(--line2);border-radius:6px;padding:8px 10px;margin-top:8px;font-family:'JetBrains Mono','Fira Code',monospace;font-size:10px;color:#888;max-height:120px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;display:none}
.install-log.visible{display:block}
.log-line{color:#666;line-height:1.5}
.log-step{color:var(--accent);font-weight:700}

/* ── Done screen ─────────────────────────────────────────── */
.done-screen{text-align:center;padding:28px 14px}
.done-badge{display:inline-block;background:var(--okbg);border:1px solid var(--okline);color:var(--ok);font-size:10px;font-weight:700;padding:3px 10px;border-radius:12px;letter-spacing:.5px;text-transform:uppercase;margin-bottom:14px}
.done-circle{width:56px;height:56px;border-radius:50%;background:var(--okbg);border:1px solid var(--okline);color:var(--ok);display:flex;align-items:center;justify-content:center;font-size:26px;margin:0 auto 10px;animation:pop .4s cubic-bezier(.2,.8,.3,1.4)}
@keyframes pop{0%{transform:scale(0)}100%{transform:scale(1)}}
.done-title{font-size:15px;font-weight:700;color:#fff;margin-bottom:4px}
.done-sub{font-size:11px;color:var(--dim);margin-bottom:20px;word-break:break-all}
.done-actions{display:flex;flex-direction:column;gap:8px}
</style>
</head>
<body>

<!-- Wizard step bar -->
<div class="wiz-bar" id="wizBar">
  <div class="wiz-step active" data-step="0" onclick="goToStep(0)"><span class="dot">1</span>Framework</div>
  <div class="wiz-sep"></div>
  <div class="wiz-step" data-step="1" onclick="goToStep(1)"><span class="dot">2</span>Tipo de proyecto</div>
  <div class="wiz-sep"></div>
  <div class="wiz-step" data-step="2" onclick="goToStep(2)"><span class="dot">3</span>Base de datos</div>
  <div class="wiz-sep"></div>
  <div class="wiz-step" data-step="3" onclick="goToStep(3)"><span class="dot">4</span>DevOps</div>
  <div class="wiz-sep"></div>
  <div class="wiz-step" data-step="4" onclick="goToStep(4)"><span class="dot">5</span>Resumen</div>
</div>

<div class="main-layout">
<div id="stepContainer">

  <!-- ── Step 1: Framework ──────────────────────────────── -->
  <div class="step-panel active" id="step-0">
    <div class="step-title">Selecciona un framework</div>
    <div class="step-sub">Elige el framework y la carpeta donde se creará el proyecto.</div>

    <label class="field-label" for="projectName">Nombre del proyecto</label>
    <input class="field-input" id="projectName" type="text" placeholder="MiProyecto"
      autocomplete="off" spellcheck="false" oninput="onNameChange()"/>

    <label class="field-label">Carpeta destino</label>
    <div class="folder-picker" id="folderPicker" onclick="pickFolder()">
      <span class="fp-icon">📂</span>
      <div>
        <div class="fp-label">Seleccionar carpeta</div>
        <div class="fp-value" id="folderValue">Sin seleccionar</div>
      </div>
    </div>

    <div id="frameworkList"></div>

    <div class="toast" id="toast-0"></div>
    <div class="wiz-nav">
      <button class="btn btn-ghost" disabled>← Anterior</button>
      <button class="btn btn-primary" id="next-0" onclick="nextStep()" disabled>Siguiente →</button>
    </div>
  </div>

  <!-- ── Step 2: Architecture ───────────────────────────── -->
  <div class="step-panel" id="step-1">
    <div class="step-title">Tipo de proyecto</div>
    <div class="step-sub">Elige el tipo de proyecto que quieres generar.</div>

    <div id="archList"></div>

    <div class="wiz-nav">
      <button class="btn btn-ghost" onclick="prevStep()">← Anterior</button>
      <button class="btn btn-primary" onclick="nextStep()">Siguiente →</button>
    </div>
  </div>

  <!-- ── Step 3: Database ───────────────────────────────── -->
  <div class="step-panel" id="step-2">
    <div class="step-title">Base de datos</div>
    <div class="step-sub">Configura la integración de base de datos (opcional).</div>

    <div class="opt-row selected" data-db="none"       onclick="selectDb(this,'none')">      <span class="or-icon">⬜</span><div><div class="or-name">Sin base de datos</div>    <div class="or-desc">Sin configuración adicional de DB.</div></div></div>
    <div class="opt-row"          data-db="postgresql" onclick="selectDb(this,'postgresql')"><span class="or-icon">🐘</span><div><div class="or-name">PostgreSQL</div>             <div class="or-desc">Relacional robusta. Recomendada para producción.</div></div></div>
    <div class="opt-row"          data-db="mysql"      onclick="selectDb(this,'mysql')">      <span class="or-icon">🐬</span><div><div class="or-name">MySQL / MariaDB</div>       <div class="or-desc">Relacional de alta compatibilidad.</div></div></div>
    <div class="opt-row"          data-db="sqlite"     onclick="selectDb(this,'sqlite')">     <span class="or-icon">📦</span><div><div class="or-name">SQLite</div>                 <div class="or-desc">Embebida. Perfecta para desarrollo local.</div></div></div>
    <div class="opt-row"          data-db="mongodb"    onclick="selectDb(this,'mongodb')">    <span class="or-icon">🍃</span><div><div class="or-name">MongoDB</div>               <div class="or-desc">NoSQL orientada a documentos.</div></div></div>

    <div class="wiz-nav">
      <button class="btn btn-ghost" onclick="prevStep()">← Anterior</button>
      <button class="btn btn-primary" onclick="nextStep()">Siguiente →</button>
    </div>
  </div>

  <!-- ── Step 4: DevOps ─────────────────────────────────── -->
  <div class="step-panel" id="step-3">
    <div class="step-title">Configuración DevOps</div>
    <div class="step-sub">Los archivos se crearán automáticamente junto con el proyecto.</div>

    <div id="devopsList"></div>

    <div class="wiz-nav">
      <button class="btn btn-ghost" onclick="prevStep()">← Anterior</button>
      <button class="btn btn-primary" onclick="nextStep()">Ver resumen →</button>
    </div>
  </div>

  <!-- ── Step 5: Summary ────────────────────────────────── -->
  <div class="step-panel" id="step-4">
    <div class="step-title">Resumen del proyecto</div>
    <div class="step-sub">Revisa la configuración. Las dependencias se instalarán automáticamente.</div>

    <div style="background:var(--surface);border:1px solid var(--line);border-radius:9px;padding:12px 13px;margin-bottom:14px">
      <div class="kv"><span class="k">Proyecto</span>     <span class="v" id="sum-name">—</span></div>
      <div class="kv"><span class="k">Framework</span>    <span class="v" id="sum-fw">—</span></div>
      <div class="kv"><span class="k">Tipo de proyecto</span> <span class="v" id="sum-arch">—</span></div>
      <div class="kv"><span class="k">Base de datos</span><span class="v" id="sum-db">—</span></div>
      <div class="kv"><span class="k">DevOps</span>       <span class="v" id="sum-devops">—</span></div>
      <div class="kv"><span class="k">Ruta</span>         <span class="v" id="sum-path" style="font-size:10px">—</span></div>
    </div>

    <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:var(--muted);margin-bottom:6px">Vista previa</div>
    <div class="tree" id="sum-tree">Selecciona un framework.</div>

    <div class="toast" id="toast-4"></div>

    <div class="wiz-nav">
      <button class="btn btn-ghost" id="btnBack" onclick="prevStep()">← Anterior</button>
      <button class="btn btn-success" id="btnGenerate" onclick="generate()">✦ Generar proyecto</button>
    </div>
  </div>

  <!-- ── Generating screen ──────────────────────────────── -->
  <div class="step-panel" id="step-generating">
    <div class="step-title">Generando proyecto</div>
    <div class="step-sub" id="gen-subtitle">Instalando dependencias automáticamente…</div>

    <div class="progress-panel" id="progressPanel"></div>

    <!-- Live install log -->
    <div class="install-log" id="installLog"></div>

    <div class="toast" id="toast-gen"></div>
  </div>

  <!-- ── Done screen ────────────────────────────────────── -->
  <div class="step-panel" id="step-done">
    <div class="done-screen">
      <div class="done-circle" id="done-circle">✓</div>
      <div class="done-badge" id="done-badge">Ready to Run</div>
      <div class="done-title" id="done-title">Proyecto generado correctamente</div>
      <div class="done-sub" id="done-path"></div>
      <!-- Warning box shown when install failed but project exists -->
      <div id="done-warning" style="display:none;background:#2a2200;border:1px solid var(--warn);border-radius:8px;padding:10px 12px;margin-bottom:16px;text-align:left">
        <div style="font-size:11px;font-weight:700;color:var(--warn);margin-bottom:6px">⚠ Dependencias no instaladas</div>
        <div id="done-warning-text" style="font-size:10px;color:#c8a848;line-height:1.6;white-space:pre-wrap"></div>
        <div id="done-manual-cmd" style="display:none;margin-top:8px;background:#1a1200;border-radius:5px;padding:7px 10px;font-family:'JetBrains Mono','Fira Code',monospace;font-size:10px;color:#f0b429"></div>
      </div>
      <div class="done-actions">
        <button class="btn btn-primary" onclick="openProject()">📂 Abrir proyecto</button>
        <button class="btn btn-ghost"   onclick="openFolder()">🗂 Abrir carpeta</button>
        <button class="btn btn-ghost"   onclick="resetWizard()" style="margin-top:4px">✦ Crear otro proyecto</button>
      </div>
    </div>
  </div>

</div><!-- /stepContainer -->

<!-- Sidebar -->
<div id="sidebar" style="display:none">
  <div class="prev-card">
    <h4>Configuración actual</h4>
    <div class="kv"><span class="k">Proyecto</span> <span class="v" id="sb-name"><em style="color:var(--faint);font-style:normal">—</em></span></div>
    <div class="kv"><span class="k">Framework</span><span class="v" id="sb-fw"><em style="color:var(--faint);font-style:normal">—</em></span></div>
    <div class="kv"><span class="k">Tipo</span>    <span class="v" id="sb-arch"><em style="color:var(--faint);font-style:normal">—</em></span></div>
    <div class="kv"><span class="k">DB</span>       <span class="v" id="sb-db"><em style="color:var(--faint);font-style:normal">—</em></span></div>
    <div class="kv"><span class="k">DevOps</span>  <span class="v" id="sb-devops"><em style="color:var(--faint);font-style:normal">—</em></span></div>
  </div>
</div>
</div><!-- /main-layout -->

<script>
// ── State ──────────────────────────────────────────────────
const state = {
  currentStep: 0,
  maxStep: 0,
  projectName: '',
  targetFolder: '',
  frameworkId: '',
  frameworkName: '',
  architectureId: 'mvc',
  database: 'none',
  devops: 'none',
  generatedPath: '',
  categories: ${frameworkData},
  devopsOptions: ${devopsData},
  archOptions: [],
  skipArch: false,
};

const ARCH_LABELS = { mvc:'MVC', clean:'Clean Architecture', api:'API', standard:'Standard', hexagonal:'Hexagonal', ddd:'DDD' };
const DB_LABELS   = { none:'Sin DB', postgresql:'PostgreSQL', mysql:'MySQL', sqlite:'SQLite', mongodb:'MongoDB' };
const DO_LABELS   = { none:'Ninguno', docker:'Docker', kubernetes:'Kubernetes', 'github-actions':'GitHub Actions', 'azure-pipelines':'Azure Pipelines' };

const vscode = acquireVsCodeApi();

// ── Pipeline steps definition ──────────────────────────────
const PIPELINE_STEPS = [
  { id: 'structure', label: 'Creando estructura…',         icon: '📁' },
  { id: 'devops',    label: 'Configurando DevOps…',        icon: '⚙️' },
  { id: 'install',   label: 'Instalando dependencias…',    icon: '📦' },
  { id: 'verify',    label: 'Verificando proyecto…',       icon: '✓' },
];

// ── Framework list ─────────────────────────────────────────
function renderFrameworks() {
  const container = document.getElementById('frameworkList');
  container.innerHTML = '';
  state.categories.forEach(cat => {
    const lbl = document.createElement('div');
    lbl.className = 'cat-label';
    lbl.textContent = cat.label;
    container.appendChild(lbl);
    const grid = document.createElement('div');
    grid.className = 'fw-grid';
    cat.frameworks.forEach(fw => {
      const card = document.createElement('div');
      card.className = 'fw-card' + (state.frameworkId === fw.id ? ' selected' : '');
      card.dataset.id = fw.id;
      card.innerHTML = \`<span class="fc-icon">\${fw.icon}</span><div class="fc-name">\${fw.name}</div><div class="fc-desc">\${fw.description}</div><div class="fc-ver">\${fw.version}</div>\`;
      card.addEventListener('click', () => selectFramework(fw.id, fw.name));
      grid.appendChild(card);
    });
    container.appendChild(grid);
  });
}

// ── Selection handlers ─────────────────────────────────────
function selectFramework(id, name) {
  state.frameworkId = id;
  state.frameworkName = name;
  document.querySelectorAll('.fw-card').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(\`.fw-card[data-id="\${id}"]\`);
  if (card) card.classList.add('selected');
  // Tipos de proyecto propios del framework. El catálogo siempre devuelve la
  // lista completa; aquí decidimos si mostrar el paso o no.
  const fwObj = findFw(id);
  state.archOptions = (fwObj && fwObj.architectures) || [];
  // Regla: si hay un único tipo de proyecto, se selecciona automáticamente y
  // NO se muestra el paso. Solo se muestra cuando hay más de una opción.
  state.skipArch = state.archOptions.length <= 1;
  if (state.archOptions.length >= 1) {
    // Si el tipo actual no es válido para este framework, ajustar al primero.
    if (!state.archOptions.some(a => a.id === state.architectureId)) {
      state.architectureId = state.archOptions[0].id;
    }
  }
  if (state.skipArch && state.archOptions.length === 1) {
    state.architectureId = state.archOptions[0].id;
  }
  renderArchitectures();
  checkStep0CanAdvance();
  updateSidebar();
}

// Busca el objeto framework (con sus architectures) dentro de las categorías.
function findFw(id) {
  for (const cat of state.categories) {
    const f = cat.frameworks.find(fw => fw.id === id);
    if (f) return f;
  }
  return null;
}

// ── Architecture list (metadata-driven, mismo markup que el original) ──────
function renderArchitectures() {
  const container = document.getElementById('archList');
  if (!container) return;
  container.innerHTML = '';
  const opts = state.archOptions || [];
  opts.forEach(a => {
    const row = document.createElement('div');
    row.className = 'opt-row' + (state.architectureId === a.id ? ' selected' : '');
    row.dataset.arch = a.id;
    row.addEventListener('click', () => selectArch(row, a.id));
    row.innerHTML = \`<span class="or-icon">\${a.icon}</span><div><div class="or-name">\${a.name}</div><div class="or-desc">\${a.desc}</div></div>\`;
    container.appendChild(row);
  });
}

// ── DevOps list (metadata-driven, mismo markup que el original) ────────────
function renderDevops() {
  const container = document.getElementById('devopsList');
  if (!container) return;
  container.innerHTML = '';
  (state.devopsOptions || []).forEach(d => {
    const row = document.createElement('div');
    row.className = 'opt-row' + (state.devops === d.id ? ' selected' : '');
    row.dataset.devops = d.id;
    row.addEventListener('click', () => selectDevops(row, d.id));
    row.innerHTML = \`<span class="or-icon">\${d.icon}</span><div><div class="or-name">\${d.name}</div><div class="or-desc">\${d.desc}</div></div>\`;
    container.appendChild(row);
  });
}
function selectArch(el, id) {
  state.architectureId = id;
  document.querySelectorAll('.opt-row[data-arch]').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
  updateSidebar();
}
function selectDb(el, id) {
  state.database = id;
  document.querySelectorAll('.opt-row[data-db]').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
  updateSidebar();
}
function selectDevops(el, id) {
  state.devops = id;
  document.querySelectorAll('.opt-row[data-devops]').forEach(r => r.classList.remove('selected'));
  el.classList.add('selected');
  updateSidebar();
}

// ── Step 0 validation ──────────────────────────────────────
function onNameChange() {
  state.projectName = document.getElementById('projectName').value.trim();
  checkStep0CanAdvance();
  updateSidebar();
}
function checkStep0CanAdvance() {
  const ok = state.projectName.length >= 2
    && /^[a-zA-Z][a-zA-Z0-9_.]*$/.test(state.projectName)
    && state.frameworkId !== ''
    && state.targetFolder !== '';
  document.getElementById('next-0').disabled = !ok;
}
function pickFolder() { vscode.postMessage({ command: 'pickFolder' }); }

// ── Wizard navigation ──────────────────────────────────────
function nextStep() {
  if (state.currentStep === 0 && !canAdvanceStep0()) return;
  let next = state.currentStep + 1;
  // Los frameworks frontend no preguntan arquitectura: se salta el paso 1.
  if (next === 1 && state.skipArch) next = 2;
  if (next <= 4) showStep(next);
}
function prevStep() {
  let prev = state.currentStep - 1;
  if (prev === 1 && state.skipArch) prev = 0;
  if (prev >= 0) showStep(prev);
}
function goToStep(n) {
  if (n === 1 && state.skipArch) return;
  if (n <= state.maxStep) showStep(n);
}
function showStep(n) {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(\`step-\${n}\`).classList.add('active');
  document.querySelectorAll('.wiz-step').forEach((s, i) => {
    s.classList.remove('active', 'done');
    if (i === n) s.classList.add('active');
    else if (i < n) s.classList.add('done');
  });
  state.currentStep = n;
  if (n > state.maxStep) state.maxStep = n;
  if (n === 4) updateSummary();
  document.getElementById('sidebar').style.display = (n >= 1 && n < 5) ? 'block' : 'none';
}
function canAdvanceStep0() {
  if (!state.projectName || !/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(state.projectName)) {
    showToast('toast-0', 'err', 'Nombre inválido. Solo letras, números, puntos y guiones bajos, comenzando por letra.');
    return false;
  }
  if (!state.targetFolder) { showToast('toast-0', 'err', 'Debes seleccionar una carpeta destino.'); return false; }
  if (!state.frameworkId)  { showToast('toast-0', 'err', 'Debes seleccionar un framework.'); return false; }
  return true;
}

// ── Summary ────────────────────────────────────────────────
function updateSummary() {
  setText('sum-name',   state.projectName || '—');
  setText('sum-fw',     state.frameworkName || '—');
  setText('sum-arch',   ARCH_LABELS[state.architectureId] || state.architectureId);
  setText('sum-db',     DB_LABELS[state.database] || state.database);
  setText('sum-devops', DO_LABELS[state.devops] || state.devops);
  setText('sum-path',   state.targetFolder ? state.targetFolder + '/' + state.projectName : '—');
  document.getElementById('sum-tree').innerHTML = buildTreePreview();
}
function buildTreePreview() {
  if (!state.frameworkId) return 'Selecciona un framework.';
  const name = state.projectName || 'MiProyecto';
  const lines = [\`<span class="t-root">\${name}/</span>\`];
  ['README.md', '.gitignore', '.env.example'].forEach(f =>
    lines.push(\`├─ <span class="t-file">\${f}</span>\`));
  if (state.devops === 'docker')    { lines.push('├─ <span class="t-file">Dockerfile</span>'); lines.push('├─ <span class="t-file">docker-compose.yml</span>'); }
  if (state.devops === 'kubernetes'){ lines.push('├─ <span class="t-file">Dockerfile</span>'); lines.push('├─ <span class="t-file">k8s/</span>'); }
  if (state.devops === 'github-actions')  lines.push('├─ <span class="t-file">.github/workflows/ci.yml</span>');
  if (state.devops === 'azure-pipelines') lines.push('├─ <span class="t-file">azure-pipelines.yml</span>');
  lines.push('└─ <span class="t-file">src/ (estructura del framework)</span>');
  return lines.join('\\n');
}

// ── Sidebar ────────────────────────────────────────────────
function updateSidebar() {
  setText('sb-name',   state.projectName || '—');
  setText('sb-fw',     state.frameworkName || '—');
  setText('sb-arch',   ARCH_LABELS[state.architectureId] || '—');
  setText('sb-db',     DB_LABELS[state.database] || '—');
  setText('sb-devops', DO_LABELS[state.devops] || '—');
}

// ── Generate ───────────────────────────────────────────────
function generate() {
  document.getElementById('btnGenerate').disabled = true;
  document.getElementById('btnBack').disabled = true;

  // Switch to generating screen
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('step-generating').classList.add('active');
  document.getElementById('sidebar').style.display = 'none';

  // Render pending pipeline steps
  renderProgress();

  vscode.postMessage({
    command: 'create',
    projectName:    state.projectName,
    frameworkId:    state.frameworkId,
    architectureId: state.architectureId,
    database:       state.database,
    devops:         state.devops,
    targetFolder:   state.targetFolder,
  });
}

// ── Progress pipeline ──────────────────────────────────────
const stepStates = {}; // id -> 'pending'|'running'|'done'|'error'|'skip'

function renderProgress() {
  const panel = document.getElementById('progressPanel');
  panel.innerHTML = '';
  PIPELINE_STEPS.forEach(step => {
    stepStates[step.id] = 'pending';
    const row = document.createElement('div');
    row.className = 'progress-step pending';
    row.id = \`ps-\${step.id}\`;
    row.innerHTML = \`
      <div class="ps-icon">·</div>
      <div style="flex:1">
        <div class="ps-label">\${step.label}</div>
        <div class="ps-detail" id="psd-\${step.id}"></div>
      </div>
    \`;
    panel.appendChild(row);
  });
}

function updateProgressStep(id, state_, detailText) {
  const row = document.getElementById(\`ps-\${id}\`);
  if (!row) return;
  const icons = { running:'↻', done:'✓', error:'✗', warn:'⚠', skip:'—', pending:'·' };
  row.className = \`progress-step \${state_}\`;
  row.querySelector('.ps-icon').textContent = icons[state_] || '·';
  if (detailText !== undefined) {
    const det = document.getElementById(\`psd-\${id}\`);
    if (det) det.textContent = detailText;
  }
}

function updateInstallStep(label, detail) {
  // Update the install row label with the current sub-step
  const row = document.getElementById('ps-install');
  if (row) {
    row.querySelector('.ps-label').textContent = label;
    const det = document.getElementById('psd-install');
    if (det && detail) det.textContent = detail;
  }
}

// ── Install log ────────────────────────────────────────────
let logBuffer = [];
let logFlushTimer = null;

function appendLog(line) {
  logBuffer.push(line);
  if (!logFlushTimer) {
    logFlushTimer = setTimeout(flushLog, 80);
  }
}
function flushLog() {
  logFlushTimer = null;
  if (!logBuffer.length) return;
  const log = document.getElementById('installLog');
  log.classList.add('visible');
  const frag = document.createDocumentFragment();
  logBuffer.forEach(line => {
    const el = document.createElement('div');
    el.className = 'log-line';
    el.textContent = line;
    frag.appendChild(el);
  });
  logBuffer = [];
  log.appendChild(frag);
  // Auto-scroll
  log.scrollTop = log.scrollHeight;
  // Trim to 200 lines
  const lines = log.querySelectorAll('.log-line');
  if (lines.length > 200) {
    for (let i = 0; i < lines.length - 200; i++) lines[i].remove();
  }
}

// ── Done ───────────────────────────────────────────────────
function showDone(projectPath, opts) {
  state.generatedPath = projectPath;
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('step-done').classList.add('active');
  document.getElementById('sidebar').style.display = 'none';
  document.querySelectorAll('.wiz-step').forEach(s => { s.classList.remove('active'); s.classList.add('done'); });
  setText('done-path', projectPath);

  const hasWarning = opts && opts.warning;

  if (hasWarning) {
    // Project generated but deps not installed
    const circle = document.getElementById('done-circle');
    const badge  = document.getElementById('done-badge');
    const title  = document.getElementById('done-title');
    if (circle) { circle.style.background = '#2a2200'; circle.style.color = 'var(--warn)'; circle.style.borderColor = 'var(--warn)'; }
    if (badge)  { badge.textContent = 'Parcialmente listo'; badge.style.background = '#2a2200'; badge.style.color = 'var(--warn)'; badge.style.borderColor = 'var(--warn)'; }
    if (title)  { title.textContent = 'Proyecto generado correctamente'; }

    const warnBox  = document.getElementById('done-warning');
    const warnText = document.getElementById('done-warning-text');
    const manualEl = document.getElementById('done-manual-cmd');
    if (warnBox)  warnBox.style.display = 'block';
    if (warnText) warnText.textContent = opts.warning;
    if (manualEl && opts.manualCmd) {
      manualEl.style.display = 'block';
      manualEl.textContent = '$ ' + opts.manualCmd;
    }
  }
}
function openProject() { vscode.postMessage({ command: 'openProject', path: state.generatedPath }); }
function openFolder()  { vscode.postMessage({ command: 'openFolder',  path: state.generatedPath }); }

// ── Reset ──────────────────────────────────────────────────
function resetWizard() {
  Object.assign(state, { currentStep:0, maxStep:0, frameworkId:'', frameworkName:'', architectureId:'mvc', database:'none', devops:'none', generatedPath:'', archOptions:[], skipArch:false });
  document.getElementById('projectName').value = '';
  state.projectName = '';
  document.getElementById('archList').innerHTML = '';
  document.querySelectorAll('.opt-row[data-db]').forEach(r => { r.classList.remove('selected'); if (r.dataset.db==='none') r.classList.add('selected'); });
  renderDevops();
  document.getElementById('installLog').innerHTML = '';
  document.getElementById('installLog').classList.remove('visible');
  document.getElementById('btnGenerate').disabled = false;
  document.getElementById('btnBack').disabled = false;
  renderFrameworks();
  showStep(0);
  updateSidebar();
  document.getElementById('next-0').disabled = true;
}

// ── Utilities ──────────────────────────────────────────────
function showToast(id, type, text) {
  const el = document.getElementById(id);
  if (!el) return;
  el.className = \`toast \${type}\`;
  el.textContent = text;
}
function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ── Message handler ────────────────────────────────────────
window.addEventListener('message', e => {
  const msg = e.data;
  switch (msg.command) {

    case 'folderSelected':
      state.targetFolder = msg.path;
      document.getElementById('folderPicker').classList.add('has-path');
      document.getElementById('folderValue').textContent = msg.path;
      checkStep0CanAdvance();
      updateSidebar();
      break;

    // Named pipeline step state update
    case 'step':
      updateProgressStep(msg.id, msg.state, msg.detail || '');
      if (msg.label) {
        const row = document.getElementById(\`ps-\${msg.id}\`);
        if (row) row.querySelector('.ps-label').textContent = msg.label;
      }
      break;

    // Sub-step label update within install step
    case 'installStep':
      updateProgressStep('install', 'running', msg.detail || '');
      updateInstallStep(msg.label, msg.detail);
      break;

    // Raw install output line
    case 'installLog':
      appendLog(msg.line);
      break;

    // All steps done — full success
    case 'success':
      PIPELINE_STEPS.forEach(s => {
        if (stepStates[s.id] !== 'error' && stepStates[s.id] !== 'warn')
          updateProgressStep(s.id, 'done');
      });
      setTimeout(() => showDone(msg.path), 600);
      break;

    // Project generated but install failed — soft warning
    case 'successWithWarning':
      setTimeout(() => showDone(msg.path, { warning: msg.warning, manualCmd: msg.manualCmd }), 600);
      break;

    // Fatal error — unblock UI
    case 'error':
      showToast('toast-gen', 'err', msg.text);
      document.getElementById('btnGenerate').disabled = false;
      document.getElementById('btnBack').disabled = false;
      // Add back button inside generating screen if not already there
      if (!document.getElementById('step-generating').querySelector('.wiz-nav')) {
        const nav = document.createElement('div');
        nav.className = 'wiz-nav';
        nav.style.marginTop = '12px';
        nav.innerHTML = '<button class="btn btn-ghost" onclick="prevStep()">← Volver al resumen</button>';
        document.getElementById('step-generating').appendChild(nav);
      }
      break;
  }
});

// ── Override prevStep inside generating screen ─────────────
const _origPrevStep = prevStep;
function prevStep() {
  if (document.getElementById('step-generating').classList.contains('active')) {
    showStep(4); // back to summary
    document.getElementById('sidebar').style.display = 'block';
    document.getElementById('btnGenerate').disabled = false;
    document.getElementById('btnBack').disabled = false;
  } else {
    _origPrevStep();
  }
}

// ── Init ───────────────────────────────────────────────────
renderFrameworks();
renderDevops();
updateSidebar();
</script>
</body>
</html>`;
}

module.exports = { getWebviewContent };
