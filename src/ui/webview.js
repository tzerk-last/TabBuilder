// @ts-check
'use strict';

const { FRAMEWORK_CATEGORIES, FRAMEWORKS, getFrameworkArchitectures, getEnabledDevops } = require('../frameworks/index');

/**
 * Serialises framework + category data for the webview script.
 * Icon is omitted — cards show only name, description and version.
 * @returns {string} JSON string
 */
function getFrameworkData() {
  const categories = FRAMEWORK_CATEGORIES.map(cat => ({
    ...cat,
    frameworks: cat.frameworks
      .map(id => {
        const fw = FRAMEWORKS[id];
        if (!fw || fw.enabled === false) return null;
        return {
          id: fw.id,
          name: fw.name,
          lang: fw.lang,
          description: fw.description,
          version: fw.version,
          architectures: getFrameworkArchitectures(id),
        };
      })
      .filter(Boolean),
  }))
  .filter(cat => cat.frameworks.length > 0);
  return JSON.stringify(categories);
}

/**
 * Returns the complete HTML for the webview panel.
 * @returns {string}
 */
function getWebviewContent() {
  const frameworkData = getFrameworkData();
  const devopsData    = JSON.stringify(getEnabledDevops());

  return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>TabBuilder</title>
<style>
:root {
  --bg:#0d0d12; --surface:#13131c; --surface2:#17172a;
  --line:#1e1e2a; --line2:#2a2a3a; --line3:#3a3a55;
  --txt:#e2e2e8; --muted:#7a7a8c; --dim:#52526a; --faint:#363650;
  --accent:#7c6af7; --accent2:#5b4fcf; --accent-dim:#1a1630;
  --ok:#6fcf97; --okbg:#0f2318; --okline:#1e4030;
  --err:#eb5757; --errbg:#2e1a1a; --errline:#5e2222;
  --warn:#f0b429;
  --r:10px; --r-sm:7px;
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--txt);min-height:100vh;font-size:13px;line-height:1.5}

/* ── Sticky top (header + step track) ─────────────────────── */
.sticky-top{position:sticky;top:0;z-index:30;background:var(--bg)}

/* ── App header ─────────────────────────────────────────────── */
.tb-header{padding:16px 28px 12px;border-bottom:1px solid var(--line)}
.tb-inner{max-width:1060px;margin:0 auto}
.tb-name{font-size:15px;font-weight:800;color:#fff;letter-spacing:-.3px}
.tb-sub{font-size:10.5px;color:var(--dim);margin-top:2px}

/* ── Step track ─────────────────────────────────────────────── */
.wiz-track{padding:14px 28px;border-bottom:1px solid var(--line);background:var(--bg)}
.wiz-inner{max-width:1060px;margin:0 auto;display:flex;align-items:flex-start}
.wiz-node{display:flex;flex-direction:column;align-items:center;gap:6px;cursor:default;flex-shrink:0}
.wiz-node.clickable{cursor:pointer}
.wiz-circle{width:26px;height:26px;border-radius:50%;border:2px solid var(--line2);background:var(--surface);color:var(--dim);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;transition:all .22s}
.wiz-circle.active{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 0 0 3px var(--accent-dim)}
.wiz-circle.done{background:var(--ok);border-color:var(--ok);color:var(--okbg)}
.wiz-label{font-size:9px;color:var(--dim);text-align:center;white-space:nowrap;font-weight:600;letter-spacing:.3px;text-transform:uppercase;transition:color .22s}
.wiz-label.active{color:var(--accent)}
.wiz-label.done{color:var(--ok)}
.wiz-seg{flex:1;height:1px;background:var(--line2);margin-top:12px;min-width:10px;transition:background .22s}
.wiz-seg.done{background:var(--ok)}
@media(max-width:480px){
  .wiz-label{display:none}
  .wiz-circle{width:22px;height:22px;font-size:9px}
  .wiz-seg{margin-top:10px}
  .wiz-track{padding:10px 16px}
  .tb-header{padding:12px 16px 10px}
}

/* ── Main layout ───────────────────────────────────────────── */
.main-layout{display:grid;grid-template-columns:1fr;gap:0;padding:28px 28px 40px;max-width:1060px;margin:0 auto;width:100%}
@media(min-width:520px){.main-layout{grid-template-columns:1fr 244px;gap:28px}}
@media(max-width:480px){.main-layout{padding:20px 16px 32px}}

/* ── Step panels ───────────────────────────────────────────── */
.step-panel{display:none}
.step-panel.active{display:block;animation:fadein .2s ease}
@keyframes fadein{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:none}}
.step-title{font-size:17px;font-weight:700;color:#fff;margin-bottom:5px;letter-spacing:-.2px}
.step-sub{font-size:11.5px;color:var(--muted);margin-bottom:26px;line-height:1.65}

/* ── Framework grid & cards ────────────────────────────────── */
.cat-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:var(--muted);margin:24px 0 10px;display:flex;align-items:center;gap:8px}
.cat-label::after{content:'';flex:1;height:1px;background:var(--line)}
.cat-label:first-child{margin-top:0}
.fw-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:4px}
@media(max-width:440px){.fw-grid{grid-template-columns:1fr}}
.fw-card{background:var(--surface);border:1.5px solid var(--line2);border-radius:var(--r);padding:14px 16px 13px;cursor:pointer;transition:border-color .15s,background .15s,box-shadow .15s;position:relative;overflow:hidden}
.fw-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;border-radius:3px 0 0 3px;transition:background .15s}
.fw-card:hover{border-color:var(--line3);background:var(--surface2)}
.fw-card.selected{border-color:var(--accent);background:var(--accent-dim)}
.fw-card.selected::before{background:var(--accent)}
.fc-name{font-size:12.5px;font-weight:700;color:#e4e4f0}
.fc-desc{font-size:10px;color:var(--muted);margin-top:5px;line-height:1.5}
.fc-ver{font-size:9px;color:var(--faint);margin-top:6px;font-family:'JetBrains Mono','Fira Code',monospace;letter-spacing:.2px}

/* ── Option rows ───────────────────────────────────────────── */
.opt-row{background:var(--surface);border:1.5px solid var(--line2);border-radius:var(--r);padding:13px 16px 13px 19px;cursor:pointer;transition:border-color .15s,background .15s;margin-bottom:10px;position:relative;overflow:hidden}
.opt-row::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:background .15s}
.opt-row:hover{border-color:var(--line3);background:var(--surface2)}
.opt-row.selected{border-color:var(--accent);background:var(--accent-dim)}
.opt-row.selected::before{background:var(--accent)}
.or-name{font-size:12.5px;font-weight:700;color:#dde}
.or-desc{font-size:10.5px;color:var(--muted);margin-top:4px;line-height:1.55}

/* ── Fields ────────────────────────────────────────────────── */
.field-label{display:block;font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.7px;margin-bottom:7px}
.field-input{width:100%;background:var(--surface);border:1.5px solid var(--line2);border-radius:var(--r-sm);padding:10px 13px;color:var(--txt);font-size:13px;outline:none;transition:border-color .18s,box-shadow .18s;margin-bottom:22px}
.field-input::placeholder{color:var(--faint)}
.field-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-dim)}
.folder-picker{background:var(--surface);border:1.5px dashed var(--line2);border-radius:var(--r-sm);padding:12px 14px;cursor:pointer;display:flex;align-items:center;transition:border-color .18s,background .18s;margin-bottom:26px;min-height:52px}
.folder-picker:hover{border-color:var(--accent);background:var(--surface2)}
.folder-picker.has-path{border-style:solid;border-color:var(--line3)}
.fp-label{font-size:10px;color:var(--dim);font-weight:700;text-transform:uppercase;letter-spacing:.4px}
.fp-value{font-size:11px;color:var(--muted);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.folder-picker.has-path .fp-value{color:var(--accent)}

/* ── Toasts ─────────────────────────────────────────────────── */
.toast{display:none;margin-top:6px;padding:10px 13px;border-radius:var(--r-sm);font-size:11px;line-height:1.5;white-space:pre-wrap}
.toast.info{display:block;background:#1a2440;border:1px solid #2a4070;color:#7ab4f8}
.toast.ok{display:block;background:var(--okbg);border:1px solid var(--okline);color:var(--ok)}
.toast.err{display:block;background:var(--errbg);border:1px solid var(--errline);color:var(--err)}

/* ── Navigation ─────────────────────────────────────────────── */
.wiz-nav{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:30px;padding-top:20px;border-top:1px solid var(--line)}
.btn{padding:9px 20px;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;transition:all .18s;border:none;display:inline-flex;align-items:center;gap:6px;letter-spacing:.1px;white-space:nowrap}
.btn-ghost{background:transparent;border:1.5px solid var(--line2);color:var(--muted)}
.btn-ghost:hover:not(:disabled){background:var(--surface);border-color:var(--line3);color:var(--txt)}
.btn-ghost:disabled{opacity:.3;cursor:not-allowed}
.btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;flex:1;justify-content:center}
.btn-primary:hover:not(:disabled){filter:brightness(1.12);transform:translateY(-1px)}
.btn-primary:disabled{background:var(--surface2);color:var(--faint);cursor:not-allowed;filter:none;transform:none}
.btn-success{background:linear-gradient(135deg,#1c8870,#157060);color:#fff;flex:1;justify-content:center}
.btn-success:hover:not(:disabled){filter:brightness(1.12);transform:translateY(-1px)}
.btn-success:disabled{background:var(--surface2);color:var(--faint);cursor:not-allowed;filter:none;transform:none}

/* ── Sidebar ─────────────────────────────────────────────────── */
.prev-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:16px 18px;position:static}
@media(min-width:520px){.prev-card{position:sticky;top:16px}}
.prev-card h4{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--dim);margin-bottom:12px}
.kv{display:flex;justify-content:space-between;align-items:baseline;font-size:11px;padding:6px 0;border-bottom:1px solid var(--line);gap:8px}
.kv:last-of-type{border-bottom:none}
.kv .k{color:var(--dim);flex-shrink:0;font-size:10.5px}
.kv .v{font-weight:700;color:#c0c0d0;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px}

/* ── Summary block ───────────────────────────────────────────── */
.sum-block{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:18px 20px;margin-bottom:20px}
.sum-section-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.7px;color:var(--dim);margin-bottom:14px}
.tree{background:var(--bg);border:1px solid var(--line);border-radius:var(--r-sm);padding:11px 14px;margin-top:4px;font-family:'JetBrains Mono','Fira Code',monospace;font-size:10px;line-height:1.75;color:var(--dim);white-space:pre;overflow-x:auto;max-height:200px;overflow-y:auto}
.tree .t-root{color:#ddd;font-weight:700}
.tree .t-file{color:var(--accent)}

/* ── Progress panel ─────────────────────────────────────────── */
.progress-panel{padding:4px 0}
.progress-step{display:flex;align-items:center;gap:14px;padding:12px 16px;border-radius:var(--r);margin-bottom:8px;background:var(--surface);border:1px solid var(--line);font-size:12px;transition:border-color .25s,background .25s}
.progress-step.running{border-color:var(--accent);background:var(--accent-dim)}
.progress-step.done{border-color:var(--okline);background:var(--okbg)}
.progress-step.error{border-color:var(--errline);background:var(--errbg)}
.progress-step.skip{opacity:.35}
.progress-step.warn{border-color:var(--warn);background:#1a1200}
.ps-icon{width:20px;height:20px;border-radius:50%;flex-shrink:0;border:2px solid var(--line2);background:var(--surface2);transition:all .25s}
.progress-step.running .ps-icon{background:var(--accent);border-color:var(--accent);animation:spin 1s linear infinite}
.progress-step.done    .ps-icon{background:var(--ok);border-color:var(--ok)}
.progress-step.error   .ps-icon{background:var(--err);border-color:var(--err)}
.progress-step.warn    .ps-icon{background:var(--warn);border-color:var(--warn)}
.progress-step.skip    .ps-icon{background:var(--surface2);border-color:var(--line2)}
@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}
.ps-label{flex:1;color:#b8b8cc;font-size:12px}
.progress-step.running .ps-label{color:var(--txt)}
.progress-step.done    .ps-label{color:var(--ok)}
.progress-step.error   .ps-label{color:var(--err)}
.progress-step.warn    .ps-label{color:var(--warn)}
.ps-detail{font-size:9.5px;color:var(--dim);margin-top:2px}

/* Install log */
.install-log{background:#050510;border:1px solid var(--line2);border-radius:6px;padding:8px 12px;margin-top:10px;font-family:'JetBrains Mono','Fira Code',monospace;font-size:10px;color:var(--muted);max-height:130px;overflow-y:auto;white-space:pre-wrap;word-break:break-all;display:none}
.install-log.visible{display:block}
.log-line{color:#48485e;line-height:1.55}

/* ── Done screen ─────────────────────────────────────────────── */
.done-screen{padding:32px 0 8px}
.done-badge{display:inline-block;background:var(--okbg);border:1px solid var(--okline);color:var(--ok);font-size:10px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:.6px;text-transform:uppercase;margin-bottom:12px}
.done-title{font-size:19px;font-weight:700;color:#fff;margin-bottom:22px;letter-spacing:-.3px}
.done-meta{background:var(--surface);border:1px solid var(--line);border-radius:var(--r);padding:16px 18px;margin-bottom:20px}
.done-row{display:flex;justify-content:space-between;align-items:baseline;padding:7px 0;border-bottom:1px solid var(--line);gap:12px}
.done-row:last-child{border-bottom:none}
.done-key{color:var(--muted);flex-shrink:0;font-size:10.5px}
.done-val{font-weight:700;color:#c8c8dc;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px;font-size:11.5px}
.done-warn-box{background:#1a1200;border:1px solid #3a2800;border-radius:var(--r);padding:14px 16px;margin-bottom:20px}
.done-warn-title{font-size:11px;font-weight:700;color:var(--warn);margin-bottom:6px}
.done-warn-text{font-size:10.5px;color:#b09040;line-height:1.6;white-space:pre-wrap}
.done-manual{margin-top:10px;background:#100c00;border-radius:5px;padding:7px 10px;font-family:'JetBrains Mono','Fira Code',monospace;font-size:10px;color:#f0b429;display:none}
.done-actions{display:flex;flex-direction:column;gap:8px}
.done-actions .btn{justify-content:center}
</style>
</head>
<body>

<!-- Sticky header + step track -->
<div class="sticky-top">
  <div class="tb-header">
    <div class="tb-inner">
      <div class="tb-name">TabBuilder</div>
      <div class="tb-sub">Build production-ready projects in seconds.</div>
    </div>
  </div>
  <div class="wiz-track">
    <div class="wiz-inner" id="wizInner">
      <div class="wiz-node" data-step="0" onclick="goToStep(0)">
        <div class="wiz-circle active">1</div>
        <div class="wiz-label active">Framework</div>
      </div>
      <div class="wiz-seg"></div>
      <div class="wiz-node" data-step="1" onclick="goToStep(1)">
        <div class="wiz-circle">2</div>
        <div class="wiz-label">Project type</div>
      </div>
      <div class="wiz-seg"></div>
      <div class="wiz-node" data-step="2" onclick="goToStep(2)">
        <div class="wiz-circle">3</div>
        <div class="wiz-label">Database</div>
      </div>
      <div class="wiz-seg"></div>
      <div class="wiz-node" data-step="3" onclick="goToStep(3)">
        <div class="wiz-circle">4</div>
        <div class="wiz-label">DevOps</div>
      </div>
      <div class="wiz-seg"></div>
      <div class="wiz-node" data-step="4" onclick="goToStep(4)">
        <div class="wiz-circle">5</div>
        <div class="wiz-label">Summary</div>
      </div>
    </div>
  </div>
</div>

<div class="main-layout">
<div id="stepContainer">

  <!-- ── Step 1: Framework ──────────────────────────────────── -->
  <div class="step-panel active" id="step-0">
    <div class="step-title">Select a framework</div>
    <div class="step-sub">Choose your technology, then set the project name and destination folder.</div>

    <label class="field-label" for="projectName">Project name</label>
    <input class="field-input" id="projectName" type="text" placeholder="MyProject"
      autocomplete="off" spellcheck="false" oninput="onNameChange()"/>

    <label class="field-label">Destination folder</label>
    <div class="folder-picker" id="folderPicker" onclick="pickFolder()">
      <div>
        <div class="fp-label">Select folder</div>
        <div class="fp-value" id="folderValue">No folder selected</div>
      </div>
    </div>

    <div id="frameworkList"></div>

    <div class="toast" id="toast-0"></div>
    <div class="wiz-nav">
      <button class="btn btn-ghost" disabled>← Back</button>
      <button class="btn btn-primary" id="next-0" onclick="nextStep()" disabled>Next →</button>
    </div>
  </div>

  <!-- ── Step 2: Architecture ───────────────────────────────── -->
  <div class="step-panel" id="step-1">
    <div class="step-title">Project type</div>
    <div class="step-sub">Choose the architecture pattern for your project.</div>
    <div id="archList"></div>
    <div class="wiz-nav">
      <button class="btn btn-ghost" onclick="prevStep()">← Back</button>
      <button class="btn btn-primary" onclick="nextStep()">Next →</button>
    </div>
  </div>

  <!-- ── Step 3: Database ───────────────────────────────────── -->
  <div class="step-panel" id="step-2">
    <div class="step-title">Database</div>
    <div class="step-sub">Configure database integration (optional).</div>
    <div class="opt-row selected" data-db="none"       onclick="selectDb(this,'none')">       <div class="or-name">No database</div>    <div class="or-desc">No additional database configuration.</div></div>
    <div class="opt-row"          data-db="postgresql" onclick="selectDb(this,'postgresql')"> <div class="or-name">PostgreSQL</div>     <div class="or-desc">Robust relational database. Recommended for production.</div></div>
    <div class="opt-row"          data-db="mysql"      onclick="selectDb(this,'mysql')">      <div class="or-name">MySQL / MariaDB</div><div class="or-desc">High-compatibility relational database.</div></div>
    <div class="opt-row"          data-db="sqlite"     onclick="selectDb(this,'sqlite')">     <div class="or-name">SQLite</div>         <div class="or-desc">Embedded. Perfect for local development.</div></div>
    <div class="opt-row"          data-db="mongodb"    onclick="selectDb(this,'mongodb')">    <div class="or-name">MongoDB</div>        <div class="or-desc">Document-oriented NoSQL database.</div></div>
    <div class="wiz-nav">
      <button class="btn btn-ghost" onclick="prevStep()">← Back</button>
      <button class="btn btn-primary" onclick="nextStep()">Next →</button>
    </div>
  </div>

  <!-- ── Step 4: DevOps ─────────────────────────────────────── -->
  <div class="step-panel" id="step-3">
    <div class="step-title">DevOps configuration</div>
    <div class="step-sub">Select infrastructure files to generate alongside your project.</div>
    <div id="devopsList"></div>
    <div class="wiz-nav">
      <button class="btn btn-ghost" onclick="prevStep()">← Back</button>
      <button class="btn btn-primary" onclick="nextStep()">Review summary →</button>
    </div>
  </div>

  <!-- ── Step 5: Summary ────────────────────────────────────── -->
  <div class="step-panel" id="step-4">
    <div class="step-title">Review and generate</div>
    <div class="step-sub">Confirm your configuration. Dependencies will be installed automatically.</div>

    <div class="sum-block">
      <div class="sum-section-label">Configuration</div>
      <div class="kv"><span class="k">Project</span>      <span class="v" id="sum-name">—</span></div>
      <div class="kv"><span class="k">Framework</span>    <span class="v" id="sum-fw">—</span></div>
      <div class="kv"><span class="k">Project type</span> <span class="v" id="sum-arch">—</span></div>
      <div class="kv"><span class="k">Database</span>     <span class="v" id="sum-db">—</span></div>
      <div class="kv"><span class="k">DevOps</span>       <span class="v" id="sum-devops">—</span></div>
      <div class="kv"><span class="k">Location</span>     <span class="v" id="sum-path" style="font-size:10px">—</span></div>
      <div class="sum-section-label" style="margin-top:18px">Structure preview</div>
      <div class="tree" id="sum-tree">Select a framework to see a preview.</div>
    </div>

    <div class="toast" id="toast-4"></div>
    <div class="wiz-nav">
      <button class="btn btn-ghost" id="btnBack" onclick="prevStep()">← Back</button>
      <button class="btn btn-success" id="btnGenerate" onclick="generate()">Generate project →</button>
    </div>
  </div>

  <!-- ── Generating screen ──────────────────────────────────── -->
  <div class="step-panel" id="step-generating">
    <div class="step-title">Generating project</div>
    <div class="step-sub" id="gen-subtitle">Setting up your project…</div>
    <div class="progress-panel" id="progressPanel"></div>
    <div class="install-log" id="installLog"></div>
    <div class="toast" id="toast-gen"></div>
  </div>

  <!-- ── Done screen ────────────────────────────────────────── -->
  <div class="step-panel" id="step-done">
    <div class="done-screen">
      <div class="done-badge" id="done-badge">Project created</div>
      <div class="done-title" id="done-title">Project Created Successfully</div>

      <div class="done-meta">
        <div class="done-row"><span class="done-key">Framework</span>    <span class="done-val" id="done-fw">—</span></div>
        <div class="done-row"><span class="done-key">Architecture</span> <span class="done-val" id="done-arch">—</span></div>
        <div class="done-row"><span class="done-key">Location</span>     <span class="done-val" id="done-path">—</span></div>
        <div class="done-row"><span class="done-key">Generated in</span> <span class="done-val" id="done-time">—</span></div>
      </div>

      <div id="done-warning" class="done-warn-box" style="display:none">
        <div class="done-warn-title">Dependencies not installed</div>
        <div id="done-warning-text" class="done-warn-text"></div>
        <div id="done-manual-cmd" class="done-manual"></div>
      </div>

      <div class="done-actions">
        <button class="btn btn-primary" onclick="openProject()">Open Project</button>
        <button class="btn btn-ghost"   onclick="openFolder()">Open Folder</button>
        <button class="btn btn-ghost"   onclick="resetWizard()" style="margin-top:4px">Create Another Project</button>
      </div>
    </div>
  </div>

</div><!-- /stepContainer -->

<!-- Sidebar -->
<div id="sidebar" style="display:none">
  <div class="prev-card">
    <h4>Configuration</h4>
    <div class="kv"><span class="k">Project</span>  <span class="v" id="sb-name"><em style="color:var(--faint);font-style:normal">—</em></span></div>
    <div class="kv"><span class="k">Framework</span><span class="v" id="sb-fw"><em style="color:var(--faint);font-style:normal">—</em></span></div>
    <div class="kv"><span class="k">Type</span>     <span class="v" id="sb-arch"><em style="color:var(--faint);font-style:normal">—</em></span></div>
    <div class="kv"><span class="k">DB</span>       <span class="v" id="sb-db"><em style="color:var(--faint);font-style:normal">—</em></span></div>
    <div class="kv"><span class="k">DevOps</span>  <span class="v" id="sb-devops"><em style="color:var(--faint);font-style:normal">—</em></span></div>
  </div>
</div>
</div><!-- /main-layout -->

<script>
// ── State ───────────────────────────────────────────────────
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
const DB_LABELS   = { none:'None', postgresql:'PostgreSQL', mysql:'MySQL', sqlite:'SQLite', mongodb:'MongoDB' };
const DO_LABELS   = { none:'None', docker:'Docker', kubernetes:'Docker + Kubernetes', 'github-actions':'GitHub Actions', 'azure-pipelines':'Azure Pipelines' };

const ARCH_DESCS = {
  mvc:      'Model-View-Controller. Web application with server-rendered views.',
  api:      'REST API service without a view layer. Ideal for backends and microservices.',
  clean:    'Layered architecture with dependency inversion. Excellent for scalable projects.',
  standard: 'Standard framework structure.',
};
const DO_NAMES = {
  none:             'None',
  docker:           'Docker',
  kubernetes:       'Docker + Kubernetes',
  'github-actions': 'GitHub Actions',
  'azure-pipelines':'Azure Pipelines',
};
const DO_DESCS = {
  none:             'No additional infrastructure files.',
  docker:           'Dockerfile, docker-compose.yml and .dockerignore.',
  kubernetes:       'Dockerfile + k8s manifests (deployment, service, ingress…).',
  'github-actions': 'CI/CD pipeline in .github/workflows/ci.yml.',
  'azure-pipelines':'azure-pipelines.yml with test and Docker stages.',
};

const vscode = acquireVsCodeApi();

// ── Pipeline steps ──────────────────────────────────────────
const PIPELINE_STEPS = [
  { id: 'structure', label: 'Creating project structure…' },
  { id: 'devops',    label: 'Configuring DevOps files…' },
  { id: 'install',   label: 'Installing dependencies…' },
  { id: 'verify',    label: 'Verifying project…' },
];

// ── Framework list ──────────────────────────────────────────
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
      card.innerHTML = \`<div class="fc-name">\${fw.name}</div><div class="fc-desc">\${fw.description}</div><div class="fc-ver">\${fw.version}</div>\`;
      card.addEventListener('click', () => selectFramework(fw.id, fw.name));
      grid.appendChild(card);
    });
    container.appendChild(grid);
  });
}

// ── Selection handlers ──────────────────────────────────────
function selectFramework(id, name) {
  state.frameworkId   = id;
  state.frameworkName = name;
  document.querySelectorAll('.fw-card').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(\`.fw-card[data-id="\${id}"]\`);
  if (card) card.classList.add('selected');
  const fwObj = findFw(id);
  state.archOptions = (fwObj && fwObj.architectures) || [];
  state.skipArch    = state.archOptions.length <= 1;
  if (state.archOptions.length >= 1) {
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

function findFw(id) {
  for (const cat of state.categories) {
    const f = cat.frameworks.find(fw => fw.id === id);
    if (f) return f;
  }
  return null;
}

// ── Architecture list ───────────────────────────────────────
function renderArchitectures() {
  const container = document.getElementById('archList');
  if (!container) return;
  container.innerHTML = '';
  (state.archOptions || []).forEach(a => {
    const row = document.createElement('div');
    row.className = 'opt-row' + (state.architectureId === a.id ? ' selected' : '');
    row.dataset.arch = a.id;
    row.addEventListener('click', () => selectArch(row, a.id));
    const desc = ARCH_DESCS[a.id] || a.desc;
    row.innerHTML = \`<div class="or-name">\${a.name}</div><div class="or-desc">\${desc}</div>\`;
    container.appendChild(row);
  });
}

// ── DevOps list ─────────────────────────────────────────────
function renderDevops() {
  const container = document.getElementById('devopsList');
  if (!container) return;
  container.innerHTML = '';
  (state.devopsOptions || []).forEach(d => {
    const row = document.createElement('div');
    row.className = 'opt-row' + (state.devops === d.id ? ' selected' : '');
    row.dataset.devops = d.id;
    row.addEventListener('click', () => selectDevops(row, d.id));
    const dname = DO_NAMES[d.id] || d.name;
    const ddesc = DO_DESCS[d.id] || d.desc;
    row.innerHTML = \`<div class="or-name">\${dname}</div><div class="or-desc">\${ddesc}</div>\`;
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

// ── Step 0 validation ───────────────────────────────────────
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

// ── Wizard navigation ───────────────────────────────────────
function nextStep() {
  if (state.currentStep === 0 && !canAdvanceStep0()) return;
  let next = state.currentStep + 1;
  if (next === 1 && state.skipArch) next = 2;
  if (next <= 4) showStep(next);
}

function prevStep() {
  if (document.getElementById('step-generating').classList.contains('active')) {
    showStep(4);
    document.getElementById('sidebar').style.display = 'block';
    document.getElementById('btnGenerate').disabled = false;
    document.getElementById('btnBack').disabled = false;
  } else {
    let prev = state.currentStep - 1;
    if (prev === 1 && state.skipArch) prev = 0;
    if (prev >= 0) showStep(prev);
  }
}

function goToStep(n) {
  if (n === 1 && state.skipArch) return;
  if (n <= state.maxStep) showStep(n);
}

function showStep(n) {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById(\`step-\${n}\`).classList.add('active');

  const nodes = document.querySelectorAll('.wiz-node');
  const segs  = document.querySelectorAll('.wiz-seg');
  nodes.forEach((node, i) => {
    const circle = node.querySelector('.wiz-circle');
    const label  = node.querySelector('.wiz-label');
    circle.classList.remove('active', 'done');
    label.classList.remove('active', 'done');
    node.classList.remove('clickable');
    if (i === n) {
      circle.classList.add('active');
      label.classList.add('active');
    } else if (i < n) {
      circle.classList.add('done');
      label.classList.add('done');
      node.classList.add('clickable');
    }
  });
  segs.forEach((seg, i) => seg.classList.toggle('done', i < n));

  state.currentStep = n;
  if (n > state.maxStep) state.maxStep = n;
  if (n === 0) checkStep0CanAdvance();
  if (n === 4) updateSummary();
  document.getElementById('sidebar').style.display = (n >= 1 && n < 5) ? 'block' : 'none';
}

function canAdvanceStep0() {
  if (!state.projectName || !/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(state.projectName)) {
    showToast('toast-0', 'err', 'Invalid name. Use letters, numbers, dots and underscores, starting with a letter.');
    return false;
  }
  if (!state.targetFolder) { showToast('toast-0', 'err', 'Please select a destination folder.'); return false; }
  if (!state.frameworkId)  { showToast('toast-0', 'err', 'Please select a framework.'); return false; }
  return true;
}

// ── Summary ─────────────────────────────────────────────────
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
  if (!state.frameworkId) return 'Select a framework to see a preview.';
  const name = state.projectName || 'MyProject';
  const lines = [\`<span class="t-root">\${name}/</span>\`];
  ['README.md', '.gitignore', '.env.example'].forEach(f =>
    lines.push(\`├─ <span class="t-file">\${f}</span>\`));
  if (state.devops === 'docker')          { lines.push('├─ <span class="t-file">Dockerfile</span>'); lines.push('├─ <span class="t-file">docker-compose.yml</span>'); }
  if (state.devops === 'kubernetes')      { lines.push('├─ <span class="t-file">Dockerfile</span>'); lines.push('├─ <span class="t-file">k8s/</span>'); }
  if (state.devops === 'github-actions')  lines.push('├─ <span class="t-file">.github/workflows/ci.yml</span>');
  if (state.devops === 'azure-pipelines') lines.push('├─ <span class="t-file">azure-pipelines.yml</span>');
  lines.push('└─ <span class="t-file">src/ (framework structure)</span>');
  return lines.join('\\n');
}

// ── Sidebar ─────────────────────────────────────────────────
function updateSidebar() {
  setText('sb-name',   state.projectName || '—');
  setText('sb-fw',     state.frameworkName || '—');
  setText('sb-arch',   ARCH_LABELS[state.architectureId] || '—');
  setText('sb-db',     DB_LABELS[state.database] || '—');
  setText('sb-devops', DO_LABELS[state.devops] || '—');
}

// ── Generate ────────────────────────────────────────────────
let genStartTime = 0;

function generate() {
  genStartTime = Date.now();
  document.getElementById('btnGenerate').disabled = true;
  document.getElementById('btnBack').disabled = true;
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('step-generating').classList.add('active');
  document.getElementById('sidebar').style.display = 'none';
  renderProgress();
  vscode.postMessage({
    command:        'create',
    projectName:    state.projectName,
    frameworkId:    state.frameworkId,
    architectureId: state.architectureId,
    database:       state.database,
    devops:         state.devops,
    targetFolder:   state.targetFolder,
  });
}

// ── Progress pipeline ───────────────────────────────────────
const stepStates = {};

function renderProgress() {
  const panel = document.getElementById('progressPanel');
  panel.innerHTML = '';
  PIPELINE_STEPS.forEach(step => {
    stepStates[step.id] = 'pending';
    const row = document.createElement('div');
    row.className = 'progress-step pending';
    row.id = \`ps-\${step.id}\`;
    row.innerHTML = \`
      <div class="ps-icon"></div>
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
  row.className = \`progress-step \${state_}\`;
  stepStates[id] = state_;
  if (detailText !== undefined) {
    const det = document.getElementById(\`psd-\${id}\`);
    if (det) det.textContent = detailText;
  }
}

function updateInstallStep(label, detail) {
  const row = document.getElementById('ps-install');
  if (row) {
    row.querySelector('.ps-label').textContent = label;
    const det = document.getElementById('psd-install');
    if (det && detail) det.textContent = detail;
  }
}

// ── Install log ─────────────────────────────────────────────
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
  log.scrollTop = log.scrollHeight;
  const lines = log.querySelectorAll('.log-line');
  if (lines.length > 200) {
    for (let i = 0; i < lines.length - 200; i++) lines[i].remove();
  }
}

// ── Done ────────────────────────────────────────────────────
function showDone(projectPath, opts) {
  state.generatedPath = projectPath;
  const elapsed = genStartTime ? ((Date.now() - genStartTime) / 1000).toFixed(1) + 's' : '—';

  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('step-done').classList.add('active');
  document.getElementById('sidebar').style.display = 'none';

  document.querySelectorAll('.wiz-circle').forEach(c => { c.classList.remove('active'); c.classList.add('done'); });
  document.querySelectorAll('.wiz-label').forEach(l  => { l.classList.remove('active');  l.classList.add('done'); });
  document.querySelectorAll('.wiz-seg').forEach(s    => s.classList.add('done'));

  setText('done-fw',   state.frameworkName || '—');
  setText('done-arch', ARCH_LABELS[state.architectureId] || state.architectureId);
  setText('done-path', projectPath);
  setText('done-time', elapsed);

  if (opts && opts.warning) {
    const badge = document.getElementById('done-badge');
    const title = document.getElementById('done-title');
    if (badge) { badge.textContent = 'Partially ready'; badge.style.background = '#1a1200'; badge.style.color = 'var(--warn)'; badge.style.borderColor = '#3a2800'; }
    if (title) { title.textContent = 'Project generated with warnings'; }
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

// ── Reset ───────────────────────────────────────────────────
function resetWizard() {
  Object.assign(state, {
    currentStep:0, maxStep:0, frameworkId:'', frameworkName:'',
    architectureId:'mvc', database:'none', devops:'none',
    generatedPath:'', archOptions:[], skipArch:false,
  });
  genStartTime = 0;
  document.getElementById('projectName').value = '';
  state.projectName = '';
  document.getElementById('archList').innerHTML = '';
  document.querySelectorAll('.opt-row[data-db]').forEach(r => {
    r.classList.remove('selected');
    if (r.dataset.db === 'none') r.classList.add('selected');
  });
  renderDevops();
  document.getElementById('installLog').innerHTML = '';
  document.getElementById('installLog').classList.remove('visible');
  document.getElementById('btnGenerate').disabled = false;
  document.getElementById('btnBack').disabled = false;
  const badge = document.getElementById('done-badge');
  const title = document.getElementById('done-title');
  if (badge) { badge.textContent = 'Project created'; badge.style.background = ''; badge.style.color = ''; badge.style.borderColor = ''; }
  if (title) { title.textContent = 'Project Created Successfully'; }
  const warnBox = document.getElementById('done-warning');
  if (warnBox) warnBox.style.display = 'none';
  renderFrameworks();
  showStep(0);
  updateSidebar();
  document.getElementById('next-0').disabled = true;
}

// ── Utilities ───────────────────────────────────────────────
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

// ── Message handler ─────────────────────────────────────────
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

    case 'step':
      updateProgressStep(msg.id, msg.state, msg.detail || '');
      if (msg.label) {
        const row = document.getElementById(\`ps-\${msg.id}\`);
        if (row) row.querySelector('.ps-label').textContent = msg.label;
      }
      break;

    case 'installStep':
      updateProgressStep('install', 'running', msg.detail || '');
      updateInstallStep(msg.label, msg.detail);
      break;

    case 'installLog':
      appendLog(msg.line);
      break;

    case 'success':
      PIPELINE_STEPS.forEach(s => {
        if (stepStates[s.id] !== 'error' && stepStates[s.id] !== 'warn')
          updateProgressStep(s.id, 'done');
      });
      setTimeout(() => showDone(msg.path), 600);
      break;

    case 'successWithWarning':
      setTimeout(() => showDone(msg.path, { warning: msg.warning, manualCmd: msg.manualCmd }), 600);
      break;

    case 'error':
      showToast('toast-gen', 'err', msg.text);
      document.getElementById('btnGenerate').disabled = false;
      document.getElementById('btnBack').disabled = false;
      if (!document.getElementById('step-generating').querySelector('.wiz-nav')) {
        const nav = document.createElement('div');
        nav.className = 'wiz-nav';
        nav.style.marginTop = '16px';
        nav.innerHTML = '<button class="btn btn-ghost" onclick="prevStep()">← Back to summary</button>';
        document.getElementById('step-generating').appendChild(nav);
      }
      break;
  }
});

// ── Init ────────────────────────────────────────────────────
renderFrameworks();
renderDevops();
updateSidebar();
</script>
</body>
</html>`;
}

module.exports = { getWebviewContent };
