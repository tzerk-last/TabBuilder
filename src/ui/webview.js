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
 * Static, build-time copy for the webview shell. Centralized here (not
 * scattered through the HTML) so the full text of the interface can be
 * reviewed and edited in one place. Dynamic copy (validation messages,
 * per-selection labels, toasts) lives in the browser-side script, in its
 * own clearly-marked section, for the same reason.
 */
const COPY = {
  brandName: 'TabBuilder',
  brandTagline: 'Crea proyectos listos para producción en segundos.',

  steps: ['Framework', 'Tipo de proyecto', 'Base de datos', 'DevOps', 'Resumen'],

  step0Title: 'Elige un framework',
  step0Sub: 'Selecciona la tecnología con la que vas a trabajar y dónde quieres crear tu proyecto.',
  projectNameLabel: 'Nombre del proyecto',
  folderLabel: 'Carpeta de destino',
  folderHint: 'Selecciona una carpeta',
  folderEmpty: 'Ninguna carpeta seleccionada',

  step1Title: 'Tipo de proyecto',
  step1Sub: 'Elige el patrón de arquitectura para tu proyecto.',

  step2Title: 'Base de datos',
  step2Sub: 'Configura la integración con una base de datos. Este paso es opcional.',

  step3Title: 'Configuración de DevOps',
  step3Sub: 'Elige los archivos de infraestructura que se generarán junto con tu proyecto.',

  step4Title: 'Revisa y genera tu proyecto',
  step4Sub: 'Confirma la configuración. Las dependencias se instalarán automáticamente.',
  configTitle: 'Configuración',
  structurePreview: 'Vista previa de la estructura',
  treeEmpty: 'Elige un framework para ver una vista previa.',

  preflightTitle: 'Verificando tu entorno de desarrollo',
  preflightSub: 'Nos aseguramos de que tengas todo lo necesario antes de comenzar.',
  preflightChecking: 'Verificando requisitos…',

  generatingTitle: 'Generando tu proyecto',
  generatingSub: 'Preparando todo — esto solo tomará un momento…',

  doneFramework: 'Framework', doneArch: 'Arquitectura', doneLocation: 'Ubicación', doneTime: 'Tiempo de generación',

  btnBack: '← Atrás',
  btnContinue: 'Continuar →',
  btnReviewSummary: 'Ver resumen →',
  btnGenerate: 'Generar proyecto →',
  btnStartGeneration: 'Comenzar generación →',
  btnOpenProject: 'Abrir proyecto',
  btnOpenFolder: 'Abrir carpeta',
  btnCreateAnother: 'Crear otro proyecto',
  btnBackToSummary: '← Volver al resumen',
};

/**
 * Returns the complete HTML for the webview panel.
 * @returns {string}
 */
function getWebviewContent() {
  const frameworkData = getFrameworkData();
  const devopsData    = JSON.stringify(getEnabledDevops());

  return /* html */ `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${COPY.brandName}</title>
<style>
:root {
  --bg:#0d0d12; --surface:#13131c; --surface2:#17172a;
  --line:#1e1e2a; --line2:#2a2a3a; --line3:#3a3a55;
  --txt:#e2e2e8; --muted:#7a7a8c; --dim:#52526a; --faint:#363650;
  --accent:#7c6af7; --accent2:#5b4fcf; --accent-dim:#1a1630;
  --ok:#6fcf97; --okbg:#0f2318; --okline:#1e4030;
  --err:#eb5757; --errbg:#2e1a1a; --errline:#5e2222;
  --warn:#f0b429; --warnbg:#241c05; --warnline:#3a2800;
  --r:10px; --r-sm:7px; --r-lg:14px;

  /* ── Type scale — 6 levels, reused everywhere. No size is created for a
     single component; every text element maps to one of these. ───────── */
  --fs-h1:19px;       /* Título principal */
  --fs-h2:12.5px;     /* Subtítulo */
  --fs-section:10px;  /* Título de sección */
  --fs-body:13px;     /* Texto principal */
  --fs-body-sm:11px;  /* Texto secundario */
  --fs-caption:9.5px; /* Caption */

  /* ── Spacing scale ─────────────────────────────────────────────────── */
  --sp-1:4px; --sp-2:8px; --sp-3:12px; --sp-4:16px; --sp-5:24px; --sp-6:32px;

  --ease:cubic-bezier(.16,.84,.44,1);
}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:var(--bg);color:var(--txt);min-height:100vh;font-size:var(--fs-body-sm);line-height:1.6}
:focus{outline:none}
:focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:5px}
@media (prefers-reduced-motion: reduce){ *{animation-duration:.001ms !important;transition-duration:.001ms !important} }

/* ── Sticky top (header + step track) ─────────────────────── */
.sticky-top{position:sticky;top:0;z-index:30;background:var(--bg)}

/* ── App header ─────────────────────────────────────────────── */
.tb-header{padding:var(--sp-4) var(--sp-6) var(--sp-3);border-bottom:1px solid var(--line)}
.tb-inner{max-width:1060px;margin:0 auto}
.tb-name{font-size:var(--fs-h2);font-weight:800;color:#fff;letter-spacing:-.3px}
.tb-sub{font-size:var(--fs-caption);color:var(--dim);margin-top:2px}

/* ── Step track ─────────────────────────────────────────────── */
.wiz-track{padding:var(--sp-3) var(--sp-6);border-bottom:1px solid var(--line);background:var(--bg)}
.wiz-inner{max-width:1060px;margin:0 auto;display:flex;align-items:flex-start}
.wiz-node{display:flex;flex-direction:column;align-items:center;gap:var(--sp-1);cursor:default;flex-shrink:0}
.wiz-node.clickable{cursor:pointer}
.wiz-circle{width:26px;height:26px;border-radius:50%;border:2px solid var(--line2);background:var(--surface);color:var(--dim);display:flex;align-items:center;justify-content:center;font-size:var(--fs-body-sm);font-weight:700;flex-shrink:0;transition:all .22s var(--ease)}
.wiz-circle.active{background:var(--accent);border-color:var(--accent);color:#fff;box-shadow:0 0 0 4px var(--accent-dim)}
.wiz-circle.done{background:var(--ok);border-color:var(--ok);color:var(--okbg)}
.wiz-label{font-size:var(--fs-caption);color:var(--dim);text-align:center;white-space:nowrap;font-weight:600;letter-spacing:.3px;text-transform:uppercase;transition:color .22s}
.wiz-label.active{color:var(--accent)}
.wiz-label.done{color:var(--ok)}
.wiz-seg{flex:1;height:1px;background:var(--line2);margin-top:12px;min-width:10px;transition:background .3s var(--ease)}
.wiz-seg.done{background:var(--ok)}
@media(max-width:480px){
  .wiz-label{display:none}
  .wiz-circle{width:22px;height:22px;font-size:var(--fs-caption)}
  .wiz-seg{margin-top:10px}
  .wiz-track{padding:var(--sp-2) var(--sp-4)}
  .tb-header{padding:var(--sp-3) var(--sp-4) var(--sp-2)}
}

/* ── Main layout ───────────────────────────────────────────── */
.main-layout{display:grid;grid-template-columns:1fr;gap:0;padding:var(--sp-6) var(--sp-6) var(--sp-6);max-width:1060px;margin:0 auto;width:100%}
@media(min-width:520px){.main-layout{grid-template-columns:1fr 250px;gap:var(--sp-6)}}
@media(max-width:480px){.main-layout{padding:var(--sp-5) var(--sp-4)}}

/* ── Step panels ───────────────────────────────────────────── */
.step-panel{display:none}
.step-panel.active{display:block;animation:rise .3s var(--ease)}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
@keyframes riseIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.step-title{font-size:var(--fs-h1);font-weight:800;color:#fff;margin-bottom:6px;letter-spacing:-.2px;text-wrap:balance}
.step-sub{font-size:var(--fs-h2);color:var(--muted);margin-bottom:var(--sp-6);line-height:1.65}

/* ── Framework grid & cards ────────────────────────────────── */
.cat-label{font-size:var(--fs-section);font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:var(--sp-5) 0 var(--sp-3);display:flex;align-items:center;gap:var(--sp-2)}
.cat-label::after{content:'';flex:1;height:1px;background:var(--line)}
.cat-label:first-child{margin-top:0}
.fw-grid{display:grid;grid-template-columns:1fr 1fr;gap:var(--sp-3);margin-bottom:var(--sp-1)}
@media(max-width:440px){.fw-grid{grid-template-columns:1fr}}
.fw-card{background:var(--surface);border:1.5px solid var(--line2);border-radius:var(--r);padding:var(--sp-4);cursor:pointer;transition:transform .16s var(--ease),border-color .16s,background .16s,box-shadow .16s;position:relative;overflow:hidden;opacity:0;animation:riseIn .28s var(--ease) forwards}
.fw-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;border-radius:3px 0 0 3px;transition:background .15s}
.fw-card:hover{border-color:var(--line3);background:var(--surface2);transform:translateY(-1px)}
.fw-card:active{transform:translateY(0) scale(.99)}
.fw-card.selected{border-color:var(--accent);background:var(--accent-dim);box-shadow:0 8px 22px -14px rgba(124,106,247,.6)}
.fw-card.selected::before{background:var(--accent)}
.fc-name{font-size:var(--fs-body);font-weight:650;color:#e4e4f0}
.fc-desc{font-size:var(--fs-body-sm);color:var(--muted);margin-top:5px;line-height:1.55}
.fc-ver{font-size:var(--fs-caption);color:var(--faint);margin-top:8px;font-family:'JetBrains Mono','Fira Code',monospace;letter-spacing:.2px}

/* ── Option rows ───────────────────────────────────────────── */
.opt-row{background:var(--surface);border:1.5px solid var(--line2);border-radius:var(--r);padding:var(--sp-3) var(--sp-4) var(--sp-3) 19px;cursor:pointer;transition:transform .16s var(--ease),border-color .16s,background .16s;margin-bottom:var(--sp-2);position:relative;overflow:hidden;opacity:0;animation:riseIn .28s var(--ease) forwards}
.opt-row::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:transparent;transition:background .15s}
.opt-row:hover{border-color:var(--line3);background:var(--surface2)}
.opt-row:active{transform:scale(.995)}
.opt-row.selected{border-color:var(--accent);background:var(--accent-dim)}
.opt-row.selected::before{background:var(--accent)}
.or-name{font-size:var(--fs-body);font-weight:650;color:#dde}
.or-desc{font-size:var(--fs-body-sm);color:var(--muted);margin-top:4px;line-height:1.55}

/* ── Fields ────────────────────────────────────────────────── */
.field-label{display:block;font-size:var(--fs-section);font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:var(--sp-2)}
.field-input{width:100%;background:var(--surface);border:1.5px solid var(--line2);border-radius:var(--r-sm);padding:10px var(--sp-3);color:var(--txt);font-size:var(--fs-body);outline:none;transition:border-color .18s,box-shadow .18s;margin-bottom:var(--sp-5)}
.field-input::placeholder{color:var(--faint)}
.field-input:focus{border-color:var(--accent);box-shadow:0 0 0 3px var(--accent-dim)}
.folder-picker{background:var(--surface);border:1.5px dashed var(--line2);border-radius:var(--r-sm);padding:var(--sp-3) 14px;cursor:pointer;display:flex;align-items:center;transition:border-color .18s,background .18s;margin-bottom:var(--sp-6);min-height:52px}
.folder-picker:hover{border-color:var(--accent);background:var(--surface2)}
.folder-picker.has-path{border-style:solid;border-color:var(--line3)}
.fp-label{font-size:var(--fs-section);color:var(--dim);font-weight:700;text-transform:uppercase;letter-spacing:.04em}
.fp-value{font-size:var(--fs-body-sm);color:var(--muted);margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.folder-picker.has-path .fp-value{color:var(--accent)}

/* ── Toasts ─────────────────────────────────────────────────── */
.toast{display:none;margin-top:var(--sp-2);padding:10px var(--sp-3);border-radius:var(--r-sm);font-size:var(--fs-body-sm);line-height:1.55;white-space:pre-wrap;animation:riseIn .22s var(--ease)}
.toast.info{display:block;background:#1a2440;border:1px solid #2a4070;color:#7ab4f8}
.toast.ok{display:block;background:var(--okbg);border:1px solid var(--okline);color:var(--ok)}
.toast.err{display:block;background:var(--errbg);border:1px solid var(--errline);color:var(--err)}

/* ── Navigation ─────────────────────────────────────────────── */
.wiz-nav{display:flex;justify-content:space-between;align-items:center;gap:var(--sp-3);margin-top:var(--sp-6);padding-top:var(--sp-5);border-top:1px solid var(--line)}
.btn{padding:10px 20px;border-radius:9px;font-size:var(--fs-body-sm);font-weight:650;cursor:pointer;transition:transform .12s var(--ease),filter .18s,background .18s,border-color .18s;border:none;display:inline-flex;align-items:center;gap:6px;letter-spacing:.1px;white-space:nowrap}
.btn:active:not(:disabled){transform:scale(.97)}
.btn-ghost{background:transparent;border:1.5px solid var(--line2);color:var(--muted)}
.btn-ghost:hover:not(:disabled){background:var(--surface);border-color:var(--line3);color:var(--txt)}
.btn-ghost:disabled{opacity:.3;cursor:not-allowed}
.btn-primary{background:linear-gradient(135deg,var(--accent),var(--accent2));color:#fff;flex:1;justify-content:center}
.btn-primary:hover:not(:disabled){filter:brightness(1.1)}
.btn-primary:disabled{background:var(--surface2);color:var(--faint);cursor:not-allowed;filter:none}
.btn-success{background:linear-gradient(135deg,#1c8870,#157060);color:#fff;flex:1;justify-content:center}
.btn-success:hover:not(:disabled){filter:brightness(1.1)}
.btn-success:disabled{background:var(--surface2);color:var(--faint);cursor:not-allowed;filter:none}

/* ── Sidebar ─────────────────────────────────────────────────── */
#sidebar{display:flex;flex-direction:column;gap:var(--sp-3);position:static}
@media(min-width:520px){#sidebar{position:sticky;top:var(--sp-4);align-self:start}}
.prev-card{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);padding:var(--sp-4) 18px}
.prev-card h4{font-size:var(--fs-section);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--dim);margin-bottom:var(--sp-3)}
.kv{display:flex;justify-content:space-between;align-items:baseline;font-size:var(--fs-body-sm);padding:6px 0;border-bottom:1px solid var(--line);gap:var(--sp-2)}
.kv:last-of-type{border-bottom:none}
.kv .k{color:var(--dim);flex-shrink:0;font-size:var(--fs-caption)}
.kv .v{font-weight:650;color:#c0c0d0;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:140px}

/* ── Status dot — the ONE icon language for every state, everywhere:
   progress steps, tool rows, sidebar. Same shape, same glyph set. ─────── */
.status-dot{width:16px;height:16px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;position:relative;transition:background .25s,border-color .25s}
.status-dot--lg{width:20px;height:20px;font-size:11px}
.status-dot::after{content:'';color:#0a0a0f;line-height:1}
.status-dot--pending{background:var(--surface2);border:2px solid var(--line2)}
.status-dot--checking{background:transparent;border:2px solid var(--line2);border-top-color:var(--accent);animation:spin .7s linear infinite}
.status-dot--ready{background:var(--ok);border:2px solid var(--ok)}
.status-dot--ready::after{content:'\\2713'}
.status-dot--warning{background:var(--warn);border:2px solid var(--warn)}
.status-dot--warning::after{content:'!'}
.status-dot--error{background:var(--err);border:2px solid var(--err)}
.status-dot--error::after{content:'\\2715'}
.status-dot--skipped{background:transparent;border:2px solid var(--line2);opacity:.4}
@keyframes spin{to{transform:rotate(360deg)}}

.tool-row{display:flex;align-items:center;gap:var(--sp-2);padding:6px 0;font-size:var(--fs-body-sm);opacity:0;animation:riseIn .22s var(--ease) forwards}
.tool-name{flex:1;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tool-ver{font-family:'JetBrains Mono','Fira Code',monospace;font-size:var(--fs-caption);color:var(--dim);flex-shrink:0}

/* ── Summary block ───────────────────────────────────────────── */
.sum-block{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);padding:20px 22px;margin-bottom:var(--sp-5)}
.sum-section-label{font-size:var(--fs-section);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--dim);margin-bottom:var(--sp-4)}
.tree{background:var(--bg);border:1px solid var(--line);border-radius:var(--r-sm);padding:var(--sp-3) 14px;margin-top:4px;font-family:'JetBrains Mono','Fira Code',monospace;font-size:var(--fs-caption);line-height:1.8;color:var(--dim);white-space:pre;overflow-x:auto;max-height:200px;overflow-y:auto}
.tree .t-root{color:#ddd;font-weight:700}
.tree .t-file{color:var(--accent)}

/* ── Progress panel ─────────────────────────────────────────── */
.progress-panel{padding:4px 0;display:flex;flex-direction:column;gap:var(--sp-2)}
.progress-step{display:flex;align-items:center;gap:var(--sp-3);padding:var(--sp-3) var(--sp-4);border-radius:var(--r);background:var(--surface);border:1px solid var(--line);font-size:var(--fs-body-sm);transition:border-color .3s var(--ease),background .3s var(--ease);opacity:0;animation:riseIn .28s var(--ease) forwards}
.progress-step.running{border-color:var(--accent);background:var(--accent-dim)}
.progress-step.done{border-color:var(--okline);background:var(--okbg)}
.progress-step.error{border-color:var(--errline);background:var(--errbg)}
.progress-step.skip{opacity:.4 !important}
.progress-step.warn{border-color:var(--warnline);background:var(--warnbg)}
.ps-label{flex:1;color:#b8b8cc;font-size:var(--fs-body-sm)}
.progress-step.running .ps-label{color:var(--txt)}
.progress-step.done    .ps-label{color:var(--ok)}
.progress-step.error   .ps-label{color:var(--err)}
.progress-step.warn    .ps-label{color:var(--warn)}
.ps-detail{font-size:var(--fs-caption);color:var(--dim);margin-top:2px}

/* Install log — collapsed by default, never invades the screen on its own */
.log-drawer{margin-top:var(--sp-3);border:1px solid var(--line);border-radius:var(--r);overflow:hidden}
.log-toggle{width:100%;display:flex;align-items:center;gap:var(--sp-2);padding:10px var(--sp-3);background:var(--surface);border:none;border-bottom:2px solid transparent;color:var(--muted);font-size:var(--fs-body-sm);font-weight:650;cursor:pointer;text-align:left;transition:background .15s,color .15s,border-color .15s}
.log-toggle:hover{background:var(--surface2);color:var(--txt)}
/* Feedback lives on the button itself, not only on the content area — so
   toggling is unmistakable even before any log line has arrived (confirmed
   root cause: with an empty log, the body only grows ~16px, too subtle to
   read as "something happened" on its own). */
.log-drawer.open .log-toggle{background:var(--surface2);color:var(--txt);border-bottom-color:var(--accent)}
.log-toggle .chev{margin-left:auto;transition:transform .2s var(--ease);color:var(--faint)}
.log-drawer.open .chev{transform:rotate(90deg);color:var(--accent)}
.log-body{max-height:0;overflow:hidden;transition:max-height .3s var(--ease)}
.log-drawer.open .log-body{max-height:180px}
.install-log{background:#050510;padding:8px var(--sp-3);font-family:'JetBrains Mono','Fira Code',monospace;font-size:var(--fs-caption);color:var(--muted);max-height:180px;overflow-y:auto;white-space:pre-wrap;word-break:break-all}
.log-line{color:#48485e;line-height:1.6}

/* ── Done screen ─────────────────────────────────────────────── */
.done-screen{padding:var(--sp-6) 0 8px;text-align:left}
.done-check{width:46px;height:46px;border-radius:50%;background:var(--okbg);border:1.5px solid var(--okline);display:flex;align-items:center;justify-content:center;margin-bottom:var(--sp-4);transform:scale(.6);opacity:0;animation:popIn .4s var(--ease) forwards}
.done-check::after{content:'\\2713';color:var(--ok);font-size:20px;font-weight:800}
@keyframes popIn{to{transform:scale(1);opacity:1}}
.done-badge{display:inline-block;background:var(--okbg);border:1px solid var(--okline);color:var(--ok);font-size:var(--fs-caption);font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:.05em;text-transform:uppercase;margin-bottom:var(--sp-3)}
.done-title{font-size:var(--fs-h1);font-weight:800;color:#fff;margin-bottom:4px;letter-spacing:-.3px}
.done-sub{font-size:var(--fs-h2);color:var(--muted);margin-bottom:var(--sp-5)}
.done-meta{background:var(--surface);border:1px solid var(--line);border-radius:var(--r-lg);padding:var(--sp-4) 18px;margin-bottom:var(--sp-5)}
.done-row{display:flex;justify-content:space-between;align-items:baseline;padding:7px 0;border-bottom:1px solid var(--line);gap:var(--sp-3)}
.done-row:last-child{border-bottom:none}
.done-key{color:var(--muted);flex-shrink:0;font-size:var(--fs-caption)}
.done-val{font-weight:650;color:#c8c8dc;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px;font-size:var(--fs-body-sm)}
.done-warn-card{background:var(--surface);border:1px solid var(--warnline);border-radius:var(--r-lg);padding:var(--sp-4) 18px;margin-bottom:var(--sp-5)}
.done-warn-head{display:flex;align-items:center;gap:var(--sp-2);margin-bottom:var(--sp-2)}
.done-warn-title{font-size:var(--fs-body);font-weight:650;color:var(--warn)}
.done-warn-text{font-size:var(--fs-body-sm);color:var(--muted);line-height:1.65;white-space:pre-wrap;margin-bottom:var(--sp-2)}
.done-manual{margin-top:var(--sp-2);background:var(--bg);border:1px solid var(--line);border-radius:6px;padding:8px 11px;font-family:'JetBrains Mono','Fira Code',monospace;font-size:var(--fs-caption);color:var(--warn);display:none}
.done-actions{display:flex;flex-direction:column;gap:var(--sp-2)}
.done-actions .btn{justify-content:center}
.done-prompt{font-size:var(--fs-section);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--dim);margin-bottom:var(--sp-3)}
</style>
</head>
<body>

<!-- Sticky header + step track -->
<div class="sticky-top">
  <div class="tb-header">
    <div class="tb-inner">
      <div class="tb-name">${COPY.brandName}</div>
      <div class="tb-sub">${COPY.brandTagline}</div>
    </div>
  </div>
  <div class="wiz-track">
    <div class="wiz-inner" id="wizInner">
      <div class="wiz-node" data-step="0" onclick="goToStep(0)">
        <div class="wiz-circle active">1</div>
        <div class="wiz-label active">${COPY.steps[0]}</div>
      </div>
      <div class="wiz-seg"></div>
      <div class="wiz-node" data-step="1" onclick="goToStep(1)">
        <div class="wiz-circle">2</div>
        <div class="wiz-label">${COPY.steps[1]}</div>
      </div>
      <div class="wiz-seg"></div>
      <div class="wiz-node" data-step="2" onclick="goToStep(2)">
        <div class="wiz-circle">3</div>
        <div class="wiz-label">${COPY.steps[2]}</div>
      </div>
      <div class="wiz-seg"></div>
      <div class="wiz-node" data-step="3" onclick="goToStep(3)">
        <div class="wiz-circle">4</div>
        <div class="wiz-label">${COPY.steps[3]}</div>
      </div>
      <div class="wiz-seg"></div>
      <div class="wiz-node" data-step="4" onclick="goToStep(4)">
        <div class="wiz-circle">5</div>
        <div class="wiz-label">${COPY.steps[4]}</div>
      </div>
    </div>
  </div>
</div>

<div class="main-layout">
<div id="stepContainer">

  <!-- ── Step 1: Framework ──────────────────────────────────── -->
  <div class="step-panel active" id="step-0">
    <div class="step-title">${COPY.step0Title}</div>
    <div class="step-sub">${COPY.step0Sub}</div>

    <label class="field-label" for="projectName">${COPY.projectNameLabel}</label>
    <input class="field-input" id="projectName" type="text" placeholder="MiProyecto"
      autocomplete="off" spellcheck="false" oninput="onNameChange()" aria-label="${COPY.projectNameLabel}"/>

    <label class="field-label">${COPY.folderLabel}</label>
    <div class="folder-picker" id="folderPicker" onclick="pickFolder()" tabindex="0" role="button"
      aria-label="${COPY.folderLabel}" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();pickFolder();}">
      <div>
        <div class="fp-label">${COPY.folderHint}</div>
        <div class="fp-value" id="folderValue">${COPY.folderEmpty}</div>
      </div>
    </div>

    <div id="frameworkList" role="radiogroup" aria-label="Framework"></div>

    <div class="toast" id="toast-0" role="alert" aria-live="assertive"></div>
    <div class="wiz-nav">
      <button class="btn btn-ghost" disabled>${COPY.btnBack}</button>
      <button class="btn btn-primary" id="next-0" onclick="nextStep()" disabled>${COPY.btnContinue}</button>
    </div>
  </div>

  <!-- ── Step 2: Architecture ───────────────────────────────── -->
  <div class="step-panel" id="step-1">
    <div class="step-title">${COPY.step1Title}</div>
    <div class="step-sub">${COPY.step1Sub}</div>
    <div id="archList" role="radiogroup" aria-label="${COPY.step1Title}"></div>
    <div class="wiz-nav">
      <button class="btn btn-ghost" onclick="prevStep()">${COPY.btnBack}</button>
      <button class="btn btn-primary" onclick="nextStep()">${COPY.btnContinue}</button>
    </div>
  </div>

  <!-- ── Step 3: Database ───────────────────────────────────── -->
  <div class="step-panel" id="step-2">
    <div class="step-title">${COPY.step2Title}</div>
    <div class="step-sub">${COPY.step2Sub}</div>
    <div role="radiogroup" aria-label="${COPY.step2Title}">
      <div class="opt-row selected" data-db="none" tabindex="0" role="radio" aria-checked="true" onclick="selectDb(this,'none')" onkeydown="rowKey(event,this)">       <div class="or-name">Sin base de datos</div>    <div class="or-desc">No se agregará configuración adicional de base de datos.</div></div>
      <div class="opt-row" data-db="postgresql" tabindex="0" role="radio" aria-checked="false" onclick="selectDb(this,'postgresql')" onkeydown="rowKey(event,this)"> <div class="or-name">PostgreSQL</div> <div class="or-desc">Base de datos relacional robusta. Recomendada para producción.</div></div>
      <div class="opt-row" data-db="mysql" tabindex="0" role="radio" aria-checked="false" onclick="selectDb(this,'mysql')" onkeydown="rowKey(event,this)">      <div class="or-name">MySQL / MariaDB</div><div class="or-desc">Base de datos relacional de alta compatibilidad.</div></div>
      <div class="opt-row" data-db="sqlite" tabindex="0" role="radio" aria-checked="false" onclick="selectDb(this,'sqlite')" onkeydown="rowKey(event,this)">     <div class="or-name">SQLite</div> <div class="or-desc">Base de datos embebida. Perfecta para desarrollo local.</div></div>
      <div class="opt-row" data-db="mongodb" tabindex="0" role="radio" aria-checked="false" onclick="selectDb(this,'mongodb')" onkeydown="rowKey(event,this)">    <div class="or-name">MongoDB</div> <div class="or-desc">Base de datos NoSQL orientada a documentos.</div></div>
    </div>
    <div class="wiz-nav">
      <button class="btn btn-ghost" onclick="prevStep()">${COPY.btnBack}</button>
      <button class="btn btn-primary" onclick="nextStep()">${COPY.btnContinue}</button>
    </div>
  </div>

  <!-- ── Step 4: DevOps ─────────────────────────────────────── -->
  <div class="step-panel" id="step-3">
    <div class="step-title">${COPY.step3Title}</div>
    <div class="step-sub">${COPY.step3Sub}</div>
    <div id="devopsList" role="radiogroup" aria-label="${COPY.step3Title}"></div>
    <div class="wiz-nav">
      <button class="btn btn-ghost" onclick="prevStep()">${COPY.btnBack}</button>
      <button class="btn btn-primary" onclick="nextStep()">${COPY.btnReviewSummary}</button>
    </div>
  </div>

  <!-- ── Step 5: Summary ────────────────────────────────────── -->
  <div class="step-panel" id="step-4">
    <div class="step-title">${COPY.step4Title}</div>
    <div class="step-sub">${COPY.step4Sub}</div>

    <div class="sum-block">
      <div class="sum-section-label">${COPY.configTitle}</div>
      <div class="kv"><span class="k">Proyecto</span>      <span class="v" id="sum-name">—</span></div>
      <div class="kv"><span class="k">Framework</span>    <span class="v" id="sum-fw">—</span></div>
      <div class="kv"><span class="k">Tipo de proyecto</span> <span class="v" id="sum-arch">—</span></div>
      <div class="kv"><span class="k">Base de datos</span>     <span class="v" id="sum-db">—</span></div>
      <div class="kv"><span class="k">DevOps</span>       <span class="v" id="sum-devops">—</span></div>
      <div class="kv"><span class="k">Ubicación</span>     <span class="v" id="sum-path" style="font-size:var(--fs-caption)">—</span></div>
      <div class="sum-section-label" style="margin-top:18px">${COPY.structurePreview}</div>
      <div class="tree" id="sum-tree">${COPY.treeEmpty}</div>
    </div>

    <div class="toast" id="toast-4" role="alert" aria-live="assertive"></div>
    <div class="wiz-nav">
      <button class="btn btn-ghost" id="btnBack" onclick="prevStep()">${COPY.btnBack}</button>
      <button class="btn btn-success" id="btnGenerate" onclick="goPreflight()">${COPY.btnGenerate}</button>
    </div>
  </div>

  <!-- ── Preflight check ─────────────────────────────────────── -->
  <div class="step-panel" id="step-preflight">
    <div class="step-title">${COPY.preflightTitle}</div>
    <div class="step-sub">${COPY.preflightSub}</div>
    <div class="progress-panel" id="preflightList" aria-live="polite"></div>
    <div class="toast" id="toast-preflight" role="status" aria-live="polite"></div>
    <div class="wiz-nav">
      <button class="btn btn-ghost" onclick="showStep(4)">${COPY.btnBack}</button>
      <button class="btn btn-success" id="btnStartGenerate" onclick="generate()" disabled>${COPY.btnStartGeneration}</button>
    </div>
  </div>

  <!-- ── Generating screen ──────────────────────────────────── -->
  <div class="step-panel" id="step-generating">
    <div class="step-title">${COPY.generatingTitle}</div>
    <div class="step-sub" id="gen-subtitle">${COPY.generatingSub}</div>
    <div class="progress-panel" id="progressPanel" aria-live="polite"></div>
    <div class="log-drawer" id="logDrawer">
      <button class="log-toggle" onclick="toggleLog()" aria-expanded="false" aria-controls="installLog">
        <span>Ver detalles</span><span class="chev">›</span>
      </button>
      <div class="log-body"><div class="install-log" id="installLog" aria-live="off"></div></div>
    </div>
    <div class="toast" id="toast-gen" role="alert" aria-live="assertive"></div>
  </div>

  <!-- ── Done screen ────────────────────────────────────────── -->
  <div class="step-panel" id="step-done">
    <div class="done-screen">
      <div class="done-check" aria-hidden="true"></div>
      <div class="done-badge" id="done-badge">Proyecto creado</div>
      <div class="done-title" id="done-title">Tu proyecto está listo</div>
      <div class="done-sub" id="done-sub">Ya puedes comenzar a desarrollar.</div>

      <div class="done-meta">
        <div class="done-row"><span class="done-key">${COPY.doneFramework}</span>    <span class="done-val" id="done-fw">—</span></div>
        <div class="done-row"><span class="done-key">${COPY.doneArch}</span> <span class="done-val" id="done-arch">—</span></div>
        <div class="done-row"><span class="done-key">${COPY.doneLocation}</span>     <span class="done-val" id="done-path">—</span></div>
        <div class="done-row"><span class="done-key">${COPY.doneTime}</span> <span class="done-val" id="done-time">—</span></div>
      </div>

      <div id="done-warning" class="done-warn-card" style="display:none">
        <div class="done-warn-head"><span class="status-dot status-dot--warning" aria-hidden="true"></span><span class="done-warn-title">Quedan algunas dependencias por instalar</span></div>
        <div id="done-warning-text" class="done-warn-text"></div>
        <div id="done-manual-cmd" class="done-manual"></div>
      </div>

      <div class="done-prompt">¿Qué deseas hacer ahora?</div>
      <div class="done-actions">
        <button class="btn btn-primary" onclick="openProject()">${COPY.btnOpenProject}</button>
        <button class="btn btn-ghost"   onclick="openFolder()">${COPY.btnOpenFolder}</button>
        <button class="btn btn-ghost"   onclick="resetWizard()">${COPY.btnCreateAnother}</button>
      </div>
    </div>
  </div>

</div><!-- /stepContainer -->

<!-- Sidebar — permanent: System Status is always visible, Configuration only once there's something to show -->
<aside id="sidebar" role="complementary" aria-label="Estado del proyecto">
  <div class="prev-card" id="configCard" style="display:none">
    <h4>Configuración</h4>
    <div class="kv"><span class="k">Proyecto</span>  <span class="v" id="sb-name"><em style="color:var(--faint);font-style:normal">—</em></span></div>
    <div class="kv"><span class="k">Framework</span><span class="v" id="sb-fw"><em style="color:var(--faint);font-style:normal">—</em></span></div>
    <div class="kv"><span class="k">Tipo</span>     <span class="v" id="sb-arch"><em style="color:var(--faint);font-style:normal">—</em></span></div>
    <div class="kv"><span class="k">BD</span>       <span class="v" id="sb-db"><em style="color:var(--faint);font-style:normal">—</em></span></div>
    <div class="kv"><span class="k">DevOps</span>  <span class="v" id="sb-devops"><em style="color:var(--faint);font-style:normal">—</em></span></div>
  </div>
  <div class="prev-card">
    <h4>Estado del entorno</h4>
    <div id="systemStatusSummary" style="font-size:var(--fs-caption);color:var(--muted);margin-bottom:var(--sp-2)"></div>
    <div id="systemStatusList" aria-live="polite"></div>
  </div>
</aside>
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

// ── Copy — dynamic dictionaries (values depend on runtime selections) ──
const ARCH_LABELS = { mvc:'MVC', clean:'Arquitectura limpia', api:'API', standard:'Estándar', hexagonal:'Hexagonal', ddd:'DDD' };
const DB_LABELS   = { none:'Ninguna', postgresql:'PostgreSQL', mysql:'MySQL', sqlite:'SQLite', mongodb:'MongoDB' };
const DO_LABELS   = { none:'Ninguno', docker:'Docker', kubernetes:'Docker + Kubernetes', 'github-actions':'GitHub Actions', 'azure-pipelines':'Azure Pipelines' };

const ARCH_DESCS = {
  mvc:      'Modelo-Vista-Controlador. Aplicación web con vistas renderizadas en el servidor.',
  api:      'Servicio API REST sin capa de vistas. Ideal para backends y microservicios.',
  clean:    'Arquitectura por capas con inversión de dependencias. Excelente para proyectos que necesitan escalar.',
  standard: 'Estructura estándar del framework.',
};
const DO_NAMES = {
  none:             'Ninguno',
  docker:           'Docker',
  kubernetes:       'Docker + Kubernetes',
  'github-actions': 'GitHub Actions',
  'azure-pipelines':'Azure Pipelines',
};
const DO_DESCS = {
  none:             'No se generarán archivos de infraestructura adicionales.',
  docker:           'Dockerfile, docker-compose.yml y .dockerignore.',
  kubernetes:       'Dockerfile y manifiestos de Kubernetes (deployment, service, ingress…).',
  'github-actions': 'Pipeline de CI/CD en .github/workflows/ci.yml.',
  'azure-pipelines':'azure-pipelines.yml con etapas de pruebas y Docker.',
};
const VALIDATION = {
  invalidName: 'El nombre no es válido. Usa letras, números, puntos o guiones bajos, comenzando con una letra.',
  noFolder:    'Selecciona una carpeta de destino para continuar.',
  noFramework: 'Elige un framework para continuar.',
};
const PREFLIGHT_COPY = {
  ready:   'Todo listo. Tu entorno tiene lo necesario para generar el proyecto.',
  blocked: 'Faltan algunas herramientas necesarias. Instálalas y vuelve a intentarlo.',
};

const vscode = acquireVsCodeApi();

// ── Pipeline steps ──────────────────────────────────────────
const PIPELINE_STEPS = [
  { id: 'structure', label: 'Creando la estructura del proyecto…' },
  { id: 'devops',    label: 'Configurando archivos de DevOps…' },
  { id: 'install',   label: 'Instalando dependencias…' },
  { id: 'verify',    label: 'Verificando el proyecto…' },
];

// ── Framework list ──────────────────────────────────────────
function renderFrameworks() {
  const container = document.getElementById('frameworkList');
  container.innerHTML = '';
  let cardIndex = 0;
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
      card.tabIndex = 0;
      card.setAttribute('role', 'radio');
      card.setAttribute('aria-checked', state.frameworkId === fw.id ? 'true' : 'false');
      card.style.animationDelay = (cardIndex * 25) + 'ms';
      cardIndex++;
      card.innerHTML = \`<div class="fc-name">\${fw.name}</div><div class="fc-desc">\${fw.description}</div><div class="fc-ver">\${fw.version}</div>\`;
      card.addEventListener('click', () => selectFramework(fw.id, fw.name));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectFramework(fw.id, fw.name); } });
      grid.appendChild(card);
    });
    container.appendChild(grid);
  });
}

// ── Selection handlers ──────────────────────────────────────
function selectFramework(id, name) {
  state.frameworkId   = id;
  state.frameworkName = name;
  document.querySelectorAll('.fw-card').forEach(c => { c.classList.remove('selected'); c.setAttribute('aria-checked', 'false'); });
  const card = document.querySelector(\`.fw-card[data-id="\${id}"]\`);
  if (card) { card.classList.add('selected'); card.setAttribute('aria-checked', 'true'); }
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
  (state.archOptions || []).forEach((a, i) => {
    const row = document.createElement('div');
    row.className = 'opt-row' + (state.architectureId === a.id ? ' selected' : '');
    row.dataset.arch = a.id;
    row.tabIndex = 0;
    row.setAttribute('role', 'radio');
    row.setAttribute('aria-checked', state.architectureId === a.id ? 'true' : 'false');
    row.style.animationDelay = (i * 30) + 'ms';
    row.addEventListener('click', () => selectArch(row, a.id));
    row.addEventListener('keydown', e => rowKey(e, row, () => selectArch(row, a.id)));
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
  (state.devopsOptions || []).forEach((d, i) => {
    const row = document.createElement('div');
    row.className = 'opt-row' + (state.devops === d.id ? ' selected' : '');
    row.dataset.devops = d.id;
    row.tabIndex = 0;
    row.setAttribute('role', 'radio');
    row.setAttribute('aria-checked', state.devops === d.id ? 'true' : 'false');
    row.style.animationDelay = (i * 30) + 'ms';
    row.addEventListener('click', () => selectDevops(row, d.id));
    row.addEventListener('keydown', e => rowKey(e, row, () => selectDevops(row, d.id)));
    const dname = DO_NAMES[d.id] || d.name;
    const ddesc = DO_DESCS[d.id] || d.desc;
    row.innerHTML = \`<div class="or-name">\${dname}</div><div class="or-desc">\${ddesc}</div>\`;
    container.appendChild(row);
  });
}

// Shared keydown helper for tabindex="0" role="radio" rows (Enter/Space activates)
function rowKey(e, el, fallbackFn) {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  e.preventDefault();
  if (fallbackFn) fallbackFn(); else el.click();
}

function selectArch(el, id) {
  state.architectureId = id;
  document.querySelectorAll('.opt-row[data-arch]').forEach(r => { r.classList.remove('selected'); r.setAttribute('aria-checked', 'false'); });
  el.classList.add('selected');
  el.setAttribute('aria-checked', 'true');
  updateSidebar();
}
function selectDb(el, id) {
  state.database = id;
  document.querySelectorAll('.opt-row[data-db]').forEach(r => { r.classList.remove('selected'); r.setAttribute('aria-checked', 'false'); });
  el.classList.add('selected');
  el.setAttribute('aria-checked', 'true');
  updateSidebar();
}
function selectDevops(el, id) {
  state.devops = id;
  document.querySelectorAll('.opt-row[data-devops]').forEach(r => { r.classList.remove('selected'); r.setAttribute('aria-checked', 'false'); });
  el.classList.add('selected');
  el.setAttribute('aria-checked', 'true');
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
  // System status stays visible always; only the Configuration recap needs
  // a selection to show.
  document.getElementById('configCard').style.display = (n >= 1 && n < 5) ? 'block' : 'none';
}

function canAdvanceStep0() {
  if (!state.projectName || !/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(state.projectName)) {
    showToast('toast-0', 'err', VALIDATION.invalidName);
    return false;
  }
  if (!state.targetFolder) { showToast('toast-0', 'err', VALIDATION.noFolder); return false; }
  if (!state.frameworkId)  { showToast('toast-0', 'err', VALIDATION.noFramework); return false; }
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
  if (!state.frameworkId) return 'Elige un framework para ver una vista previa.';
  const name = state.projectName || 'MiProyecto';
  const lines = [\`<span class="t-root">\${name}/</span>\`];
  ['README.md', '.gitignore', '.env.example'].forEach(f =>
    lines.push(\`├─ <span class="t-file">\${f}</span>\`));
  if (state.devops === 'docker')          { lines.push('├─ <span class="t-file">Dockerfile</span>'); lines.push('├─ <span class="t-file">docker-compose.yml</span>'); }
  if (state.devops === 'kubernetes')      { lines.push('├─ <span class="t-file">Dockerfile</span>'); lines.push('├─ <span class="t-file">k8s/</span>'); }
  if (state.devops === 'github-actions')  lines.push('├─ <span class="t-file">.github/workflows/ci.yml</span>');
  if (state.devops === 'azure-pipelines') lines.push('├─ <span class="t-file">azure-pipelines.yml</span>');
  lines.push('└─ <span class="t-file">src/ (estructura del framework)</span>');
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
  const startBtn = document.getElementById('btnStartGenerate');
  if (startBtn) startBtn.disabled = true;
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('step-generating').classList.add('active');
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
  PIPELINE_STEPS.forEach((step, i) => {
    stepStates[step.id] = 'pending';
    const row = document.createElement('div');
    row.className = 'progress-step pending';
    row.id = \`ps-\${step.id}\`;
    row.style.animationDelay = (i * 40) + 'ms';
    row.innerHTML = \`
      <span class="status-dot status-dot--lg status-dot--pending" id="psi-\${step.id}" aria-hidden="true"></span>
      <div style="flex:1">
        <div class="ps-label">\${step.label}</div>
        <div class="ps-detail" id="psd-\${step.id}"></div>
      </div>
    \`;
    panel.appendChild(row);
  });
}

const PROGRESS_DOT_STATE = { pending: 'pending', running: 'checking', done: 'ready', warn: 'warning', error: 'error', skip: 'skipped' };

function updateProgressStep(id, state_, detailText) {
  const row = document.getElementById(\`ps-\${id}\`);
  if (!row) return;
  row.className = \`progress-step \${state_}\`;
  stepStates[id] = state_;
  const dot = document.getElementById(\`psi-\${id}\`);
  if (dot) dot.className = 'status-dot status-dot--lg status-dot--' + (PROGRESS_DOT_STATE[state_] || 'pending');
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

// ── Install log — starts collapsed, user opts in ─────────────
let logBuffer = [];
let logFlushTimer = null;

function toggleLog() {
  const drawer = document.getElementById('logDrawer');
  const open = drawer.classList.toggle('open');
  drawer.querySelector('.log-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
}

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
  // Only follow new output if the user was already at the bottom — if they
  // scrolled up to read earlier lines, respect that instead of yanking them
  // back down on every new line.
  const wasAtBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 4;
  const frag = document.createDocumentFragment();
  logBuffer.forEach(line => {
    const el = document.createElement('div');
    el.className = 'log-line';
    el.textContent = line;
    frag.appendChild(el);
  });
  logBuffer = [];
  log.appendChild(frag);
  if (wasAtBottom) log.scrollTop = log.scrollHeight;
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
  document.getElementById('configCard').style.display = 'none';

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
    const sub   = document.getElementById('done-sub');
    if (badge) { badge.textContent = 'Casi listo'; badge.style.background = 'var(--warnbg)'; badge.style.color = 'var(--warn)'; badge.style.borderColor = 'var(--warnline)'; }
    if (title) title.textContent = 'Tu proyecto está listo';
    if (sub)   sub.textContent = 'Solo falta instalar algunas dependencias para empezar a desarrollar.';
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
    r.setAttribute('aria-checked', r.dataset.db === 'none' ? 'true' : 'false');
    if (r.dataset.db === 'none') r.classList.add('selected');
  });
  renderDevops();
  document.getElementById('installLog').innerHTML = '';
  document.getElementById('logDrawer').classList.remove('open');
  document.getElementById('logDrawer').querySelector('.log-toggle').setAttribute('aria-expanded', 'false');
  document.getElementById('btnGenerate').disabled = false;
  document.getElementById('btnBack').disabled = false;
  const badge = document.getElementById('done-badge');
  const title = document.getElementById('done-title');
  const sub   = document.getElementById('done-sub');
  if (badge) { badge.textContent = 'Proyecto creado'; badge.style.background = ''; badge.style.color = ''; badge.style.borderColor = ''; }
  if (title) title.textContent = 'Tu proyecto está listo';
  if (sub)   sub.textContent = 'Ya puedes comenzar a desarrollar.';
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
  // TEMP: instrumentation for the webview-visibility investigation — acks
  // every message this listener actually got to run for, so the extension
  // host can prove whether a live listener ever processed a given command.
  // Remove alongside src/services/diagLog.js once validated.
  vscode.postMessage({ command: 'debugAck', original: msg.command, ts: Date.now() });
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
      // A step left in 'running' means the backend aborted (or crashed)
      // while that stage was in flight — without this, its spinner would
      // keep spinning forever even though the pipeline already stopped.
      PIPELINE_STEPS.forEach(s => {
        if (stepStates[s.id] === 'running') updateProgressStep(s.id, 'error');
      });
      showToast('toast-gen', 'err', msg.text);
      document.getElementById('btnGenerate').disabled = false;
      document.getElementById('btnBack').disabled = false;
      if (!document.getElementById('step-generating').querySelector('.wiz-nav')) {
        const nav = document.createElement('div');
        nav.className = 'wiz-nav';
        nav.style.marginTop = '16px';
        nav.innerHTML = '<button class="btn btn-ghost" onclick="prevStep()">' + '${COPY.btnBackToSummary}' + '</button>';
        document.getElementById('step-generating').appendChild(nav);
      }
      break;

    // System Status panel — always-on, framework-independent. The backend
    // streams one snapshot per tool as it resolves; we just re-render the
    // whole (small) list each time, no incremental merge logic here.
    case 'systemStatus':
      renderToolList(document.getElementById('systemStatusList'), msg.environment.tools);
      renderSystemSummary(msg.environment.tools);
      break;

    // Preflight — scoped to the exact framework/architecture chosen.
    // Ignore replies to a request that's no longer current (e.g. the user
    // went back and re-triggered a check for a different framework before
    // this one arrived) — otherwise a late response can paint stale tool
    // data over the screen the user is actually looking at.
    case 'requirementsResult':
      if (msg.requestId !== currentPreflightRequestId) break;
      renderToolList(document.getElementById('preflightList'), msg.environment.tools, true);
      document.getElementById('btnStartGenerate').disabled = !msg.ok;
      showToast('toast-preflight', msg.ok ? 'ok' : 'err', msg.ok ? PREFLIGHT_COPY.ready : PREFLIGHT_COPY.blocked);
      break;
  }
});

// ── Tool status rendering (System Status panel + Preflight) ─────────
// The only place that turns { available, version } into an icon — no
// classification, just formatting of data the backend already decided.
// Uses the same .status-dot language as the progress panel — one visual
// system, not a second one reinvented here.
function shortVersion(raw) {
  const m = String(raw || '').match(/\\d+\\.\\d+(\\.\\d+)?/);
  return m ? m[0] : '';
}
function renderToolList(container, tools, asProgressStep) {
  if (!container) return;
  container.innerHTML = '';
  (tools || []).forEach((t, i) => {
    const row = document.createElement('div');
    row.className = asProgressStep ? 'progress-step' : 'tool-row';
    row.style.animationDelay = (i * 55) + 'ms';
    const dotState = t.pending ? 'checking' : (t.available ? 'ready' : 'error');
    if (asProgressStep) {
      row.innerHTML = \`<span class="status-dot status-dot--lg status-dot--\${dotState}" aria-hidden="true"></span>\` +
        \`<div style="flex:1"><div class="ps-label">\${t.name}</div></div>\` +
        \`<span class="tool-ver">\${t.available ? shortVersion(t.version) : ''}</span>\`;
    } else {
      row.innerHTML = \`<span class="status-dot status-dot--\${dotState}" aria-hidden="true"></span>\` +
        \`<span class="tool-name">\${t.name}</span>\` +
        \`<span class="tool-ver">\${t.available ? shortVersion(t.version) : ''}</span>\`;
    }
    container.appendChild(row);
  });
}

// Small, explicitly temporary bridge: counts an already-labeled array
// (available/pending booleans the backend already computed) to build the
// "N disponibles / N pendientes" summary line. This is arithmetic over
// data that's already classified, not new classification — but it's slated
// to be deleted the moment the backend sends a real Diagnostics aggregate
// (Fase 2 del Diagnostic Engine), at which point this function is removed
// and the sidebar reads that field directly instead.
function _tempCountToolStatus(tools) {
  const list = tools || [];
  const ready = list.filter(t => t.available).length;
  const pending = list.filter(t => t.pending).length;
  const missing = list.length - ready - pending;
  return { ready, pending, missing, total: list.length };
}
function renderSystemSummary(tools) {
  const el = document.getElementById('systemStatusSummary');
  if (!el) return;
  const c = _tempCountToolStatus(tools);
  if (c.pending > 0) { el.textContent = 'Verificando tu entorno…'; return; }
  const parts = [c.ready + ' disponibles'];
  if (c.missing > 0) parts.push(c.missing + ' pendientes');
  el.textContent = parts.join(' · ');
}

// ── Preflight ─────────────────────────────────────────────────
// Incremented on every check so a late reply to a superseded request can be
// told apart from the current one (see the 'requirementsResult' handler).
let currentPreflightRequestId = 0;

function goPreflight() {
  document.querySelectorAll('.step-panel').forEach(p => p.classList.remove('active'));
  document.getElementById('step-preflight').classList.add('active');
  document.getElementById('btnStartGenerate').disabled = true;
  document.getElementById('preflightList').innerHTML =
    \`<div class="progress-step running"><span class="status-dot status-dot--lg status-dot--checking" aria-hidden="true"></span><div style="flex:1"><div class="ps-label">\${'${COPY.preflightChecking}'}</div></div></div>\`;
  const toast = document.getElementById('toast-preflight');
  toast.style.display = 'none';
  currentPreflightRequestId += 1;
  vscode.postMessage({
    command: 'checkRequirements',
    requestId: currentPreflightRequestId,
    project: {
      name:           state.projectName,
      targetFolder:   state.targetFolder,
      frameworkId:    state.frameworkId,
      frameworkName:  state.frameworkName,
      architectureId: state.architectureId,
      database:       state.database,
      devops:         state.devops,
    },
  });
}

// ── Init ────────────────────────────────────────────────────
renderFrameworks();
renderDevops();
updateSidebar();
vscode.postMessage({ command: 'checkSystemStatus' });
</script>
</body>
</html>`;
}

module.exports = { getWebviewContent };
