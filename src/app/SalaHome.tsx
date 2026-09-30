"use client";

import { useEffect } from "react";
import localFont from "next/font/local";
import { bootSalaHome } from "./salaHomeScript";

// Self-hosted per AGENTS.md (no remote font CDN). Both files are variable
// fonts, so one file each covers the full weight range used below.
const atkinsonNext = localFont({
  src: "../fonts/AtkinsonHyperlegibleNext-Variable.woff2",
  weight: "400 800",
  display: "swap"
});
const atkinsonMono = localFont({
  src: "../fonts/AtkinsonHyperlegibleMono-Variable.woff2",
  weight: "400 600",
  display: "swap"
});

const STYLE = `
:root{
  --bg:#EEF2F1;--surface:#FFFFFF;--surface-2:#F6F8F7;--ink:#14201F;--muted:#52605D;--border:#D3DBD9;--line:#8E9C98;
  --accent:#0F5C63;--accent-ink:#FFFFFF;--accent-soft:#DFEEEF;--focus:#2F6FDB;
  --error:#B42318;--error-soft:#FEF1EF;--ok:#067647;--ok-soft:#E6F6EC;--warn:#8F3A06;--warn-soft:#FFF4E0;--neutral-soft:#E9EEEC;--neutral-ink:#344054;
  --board:#0E1A1F;--board-tile:#17272E;--board-called:#0F4C52;--board-soft:#A9BAC1;--board-hl:#F5C542;
  --font:${atkinsonNext.style.fontFamily},system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --mono:${atkinsonMono.style.fontFamily},ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  color-scheme:light;
  box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px);
}
@media (prefers-color-scheme:dark){
  :root:not([data-theme="light"]):not([data-theme="hc"]){
    --bg:#0F1413;--surface:#182120;--surface-2:#1E2826;--ink:#EEF3F2;--muted:#A6B3B0;--border:#2D3A38;--line:#5F6E6B;
    --accent:#5EC4CC;--accent-ink:#0B1A1C;--accent-soft:#163A3D;--focus:#7AA7FF;
    --error:#FF8A80;--error-soft:#3A1714;--ok:#6FD39A;--ok-soft:#123020;--warn:#FFB870;--warn-soft:#3A2A12;--neutral-soft:#26302E;--neutral-ink:#D0D8D6;color-scheme:dark;}
}
:root[data-theme="dark"]{
  --bg:#0F1413;--surface:#182120;--surface-2:#1E2826;--ink:#EEF3F2;--muted:#A6B3B0;--border:#2D3A38;--line:#5F6E6B;
  --accent:#5EC4CC;--accent-ink:#0B1A1C;--accent-soft:#163A3D;--focus:#7AA7FF;
  --error:#FF8A80;--error-soft:#3A1714;--ok:#6FD39A;--ok-soft:#123020;--warn:#FFB870;--warn-soft:#3A2A12;--neutral-soft:#26302E;--neutral-ink:#D0D8D6;color-scheme:dark;}
:root[data-theme="hc"]{
  --bg:#FFFFFF;--surface:#FFFFFF;--surface-2:#FFFFFF;--ink:#000000;--muted:#1F2524;--border:#000000;--line:#000000;
  --accent:#00393E;--accent-ink:#FFFFFF;--accent-soft:#D3ECEE;--focus:#0033CC;
  --error:#8A0F07;--error-soft:#FFE6E3;--ok:#004D2C;--ok-soft:#DDF6E7;--warn:#6B2800;--warn-soft:#FFEFD1;--neutral-soft:#EDEDED;--neutral-ink:#000000;}
html{scroll-padding-top:env(safe-area-inset-top,0px);-webkit-text-size-adjust:100%}
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font:400 16px/1.5 var(--font);-webkit-font-smoothing:antialiased}
button,input,select,textarea{font:inherit;color:inherit}
:focus-visible{outline:3px solid var(--focus);outline-offset:2px;border-radius:6px}
.sr{position:absolute!important;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
.skip{position:absolute;left:12px;top:-60px;background:var(--accent);color:var(--accent-ink);padding:10px 14px;border-radius:8px;z-index:50}
.skip:focus{top:12px}
.wrap{max-width:1560px;margin:0 auto;padding:0 28px}

/* top */
.top{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;flex-wrap:wrap;padding:28px 0 22px}
.brand{display:flex;flex-direction:column;gap:6px;max-width:720px}
.brand h1{margin:0;font-weight:800;font-size:clamp(34px,4vw,48px);line-height:1;letter-spacing:-.02em;color:var(--accent)}
.brand p{margin:0;color:var(--muted);font-size:17px;max-width:62ch}
.brand p strong{color:var(--ink);font-weight:600}
.controls{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.controls label{font-size:14px;color:var(--muted)}
select.small{height:40px;border:1.5px solid var(--line);border-radius:8px;background:var(--surface);padding:0 10px}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:44px;padding:10px 18px;border-radius:8px;border:1.5px solid transparent;font-weight:700;cursor:pointer;text-decoration:none;white-space:nowrap}
.btn-primary{background:var(--accent);color:var(--accent-ink)}
.btn-primary:hover{filter:brightness(1.08)}
.btn-secondary{background:var(--surface);border-color:var(--line);color:var(--ink)}
.btn-secondary:hover{background:var(--surface-2)}
.btn-ghost{background:transparent;color:var(--accent);padding-inline:10px}
.btn-ghost:hover{background:var(--accent-soft)}
.btn-sm{min-height:36px;padding:6px 12px;font-size:14px}
.btn-lg{min-height:56px;padding:14px 26px;font-size:18px}

/* zones */
.zone-label{display:flex;align-items:baseline;gap:4px 12px;margin:0 0 12px;flex-wrap:wrap}
.zone-label h2{margin:0;font-size:20px;font-weight:700}
.zone-label span{color:var(--muted);font-size:15px}
.private{display:grid;grid-template-columns:minmax(340px,400px) 1fr;gap:20px;align-items:start}
.panel{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;position:relative}
.panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 18px;border-bottom:1px solid var(--border);background:var(--surface-2)}
.panel-head h3{margin:0;font-size:15px;font-weight:700}
.panel-head .hint{font-size:13px;color:var(--muted)}

/* kiosk */
.kiosk{min-height:640px;display:flex;flex-direction:column}
.kiosk-body{padding:24px 24px 20px;flex:1;display:flex;flex-direction:column;gap:18px}
.kiosk-foot{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:14px 24px;border-top:1px solid var(--border)}
.lang{display:inline-flex;border:1.5px solid var(--border);border-radius:999px;padding:3px}
.lang button{border:0;background:transparent;border-radius:999px;padding:4px 12px;font-size:14px;font-weight:600;color:var(--muted);cursor:pointer;min-height:32px}
.lang button[aria-pressed="true"]{background:var(--accent);color:var(--accent-ink)}
.steps{display:flex;gap:6px;align-items:center;font-size:13px;color:var(--muted)}
.steps i{display:block;width:34px;height:4px;border-radius:4px;background:var(--border)}
.steps i.on{background:var(--accent)}
.kiosk h4{margin:0;font-size:28px;line-height:1.15;font-weight:800;letter-spacing:-.01em}
.kiosk h4:focus{outline:none}
.lede{margin:0;color:var(--muted);font-size:17px}
.welcome{flex:1;display:flex;flex-direction:column;justify-content:center;gap:18px}
.welcome h4{font-size:36px}
.glyph-row{display:flex;gap:10px}
.field{display:flex;flex-direction:column;gap:6px}
.field label,.field legend{font-weight:600;font-size:15px}
.field .help{font-size:14px;color:var(--muted)}
.field .err{font-size:14px;color:var(--error);font-weight:600;display:flex;gap:6px}
.input{height:52px;border:1.5px solid var(--line);border-radius:8px;background:var(--surface);padding:0 14px;font-size:17px;width:100%}
textarea.input{height:84px;padding:12px 14px;resize:vertical}
.input[aria-invalid="true"]{border-color:var(--error);border-width:2px}
.input:focus-visible{outline-offset:1px}
.dob{display:flex;gap:10px}
.dob div{display:flex;flex-direction:column;gap:4px}
.dob span{font-size:13px;color:var(--muted)}
.dob .mm,.dob .dd{width:76px}.dob .yy{width:112px}
fieldset{border:0;padding:0;margin:0}
.cards{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}
.card-opt{position:relative;display:flex;gap:12px;align-items:flex-start;padding:14px;border:1.5px solid var(--border);border-radius:12px;background:var(--surface);cursor:pointer;min-height:72px}
.card-opt input{position:absolute;opacity:0;pointer-events:none}
.card-opt .dot{flex:none;width:20px;height:20px;border-radius:50%;border:2px solid var(--line);margin-top:2px;display:grid;place-items:center}
.card-opt b{display:block;font-size:16px}
.card-opt small{display:block;font-size:13px;color:var(--muted)}
.card-opt:has(input:checked){border:2px solid var(--accent);background:var(--accent-soft)}
.card-opt:has(input:checked) .dot{border-color:var(--accent)}
.card-opt:has(input:checked) .dot::after{content:"";width:9px;height:9px;border-radius:50%;background:var(--accent)}
.card-opt:has(input:focus-visible){outline:3px solid var(--focus);outline-offset:2px}
.card-group[aria-invalid="true"] .card-opt{border-color:var(--error)}
.summary{border:2px solid var(--error);background:var(--error-soft);border-radius:10px;padding:14px 16px}
.summary:focus{outline:3px solid var(--focus);outline-offset:2px}
.summary b{color:var(--error);display:block;margin-bottom:4px}
.summary ul{margin:0;padding-left:18px}
.summary a{color:var(--error);font-weight:600}
.review{border:1px solid var(--border);border-radius:12px}
.review div{display:flex;justify-content:space-between;gap:12px;padding:12px 16px;border-bottom:1px solid var(--border)}
.review div:last-child{border-bottom:0}
.review dt{font-size:13px;color:var(--muted)}
.review dd{margin:0;font-weight:700;font-size:16px;word-break:break-word}
.note{background:var(--accent-soft);color:var(--accent);border-radius:10px;padding:12px 14px;font-weight:600;font-size:15px}
.token-card{align-self:center;display:flex;flex-direction:column;align-items:center;gap:10px;padding:28px 36px;border:1.5px solid var(--border);border-radius:20px;background:var(--surface-2);text-align:center}
.token-card .label{font-size:40px;font-weight:800;letter-spacing:-.01em;line-height:1.05}
.token-card small{color:var(--muted);font-size:14px}
.pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:4px 12px;font-size:14px;font-weight:700;white-space:nowrap}
.center{text-align:center;align-items:center}
.kiosk-issued .kiosk-body{justify-content:center}

/* staff */
.staff .toolbar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 18px;flex-wrap:wrap}
.counts{display:flex;gap:18px;flex-wrap:wrap;font-size:15px;color:var(--muted)}
.counts b{color:var(--ink);font-size:20px;margin-right:4px}
.switch{display:inline-flex;align-items:center;gap:10px;border:1.5px solid var(--border);background:var(--surface);border-radius:999px;padding:6px 14px 6px 6px;cursor:pointer;font-weight:700;min-height:44px}
.switch .track{width:44px;height:26px;border-radius:13px;background:var(--line);position:relative;transition:background .15s}
.switch .track::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;transition:transform .15s}
.switch[aria-checked="true"]{border-color:var(--accent);background:var(--accent-soft)}
.switch[aria-checked="true"] .track{background:var(--accent)}
.switch[aria-checked="true"] .track::after{transform:translateX(18px)}
.lens-banner{display:none;padding:10px 18px;background:var(--accent-soft);color:var(--accent);font-weight:700;font-size:15px;border-top:1px solid var(--border)}
.staff.lens .lens-banner{display:block}
.table-wrap{overflow-x:auto;border-top:1px solid var(--border)}
table{width:100%;border-collapse:collapse;min-width:760px}
th{font-size:12px;letter-spacing:.04em;text-align:left;color:var(--muted);font-weight:700;padding:10px 10px;background:var(--surface-2);border-bottom:1px solid var(--border);white-space:nowrap}
td{padding:10px 10px;border-bottom:1px solid var(--border);vertical-align:middle;font-size:15px}
tr:last-child td{border-bottom:0}
tr.done td{opacity:.5}
tr.you td{background:var(--warn-soft)}
tr.you td:first-child{box-shadow:inset 4px 0 0 var(--board-hl)}
.tok{display:inline-flex;align-items:center;gap:8px;font-weight:700;white-space:nowrap}
.pname{font-weight:700;white-space:nowrap}
.nowrap{white-space:nowrap}
.you-tag{display:inline-block;margin-left:6px;font-size:12px;font-weight:700;background:var(--board-hl);color:#1b1500;border-radius:6px;padding:1px 6px;vertical-align:1px}
.masked{letter-spacing:.2em;color:var(--muted)}
.sub{display:block;font-size:13px;color:var(--muted)}
.acts{display:flex;gap:4px;flex-wrap:nowrap}
.s-waiting{background:var(--neutral-soft);color:var(--neutral-ink)}
.s-next{background:var(--warn-soft);color:var(--warn)}
.s-called{background:var(--ok-soft);color:var(--ok)}
.s-desk{background:var(--error-soft);color:var(--error)}
.s-done{background:var(--neutral-soft);color:var(--muted)}
.staff-foot{display:flex;justify-content:space-between;gap:12px;padding:10px 18px;font-size:13px;color:var(--muted);border-top:1px solid var(--border);flex-wrap:wrap}
.staff-body{position:relative}
.staff.locked .staff-body > :not(.idle){filter:blur(10px);pointer-events:none;user-select:none}
.idle{display:none;position:absolute;inset:0;place-items:center;background:color-mix(in srgb,var(--ink) 18%,transparent);z-index:5}
.staff.locked .idle{display:grid}
.idle-card{background:var(--surface);border-radius:18px;padding:28px 30px;max-width:420px;text-align:center;box-shadow:0 18px 50px rgba(0,0,0,.25);display:flex;flex-direction:column;gap:12px;align-items:center}
.idle-card h4{margin:0;font-size:24px}
.idle-card p{margin:0;color:var(--muted)}
.toast{position:fixed;left:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));background:var(--ink);color:var(--bg);padding:12px 16px;border-radius:10px;font-weight:600;box-shadow:0 10px 30px rgba(0,0,0,.25);transform:translateY(140%);transition:transform .2s ease-out;z-index:40;max-width:calc(100% - 40px)}
.toast.show{transform:none}

/* wall */
.wall{margin:28px 0;background:#0B1416;color:#E7EEEC;border-radius:16px;padding:22px 24px;display:grid;grid-template-columns:minmax(220px,1fr) minmax(300px,1.3fr) minmax(220px,.9fr);gap:24px;align-items:start;position:relative}
.wall::before,.wall::after{content:"";position:absolute;left:24px;right:24px;height:0;border-top:2px dashed #2F4A4E}
.wall::before{top:-15px}.wall::after{bottom:-15px}
.wall h2{margin:0 0 6px;font-size:20px;color:#fff}
.wall p{margin:0;color:#A9BAC1;font-size:15px}
.stays{display:flex;flex-wrap:wrap;gap:6px;margin-top:12px}
.stays span{font-family:var(--mono);font-size:13px;color:#7F9296;border:1px solid #2A3C40;border-radius:6px;padding:2px 8px;text-decoration:line-through;text-decoration-color:#FF8A80}
.wire{font-family:var(--mono);font-size:15px;line-height:1.6;background:#0F1F22;border:1px solid #23383C;border-radius:12px;padding:14px 16px;margin:0;white-space:pre-wrap;word-break:break-word;min-height:150px;transition:border-color .2s}
.wire .k{color:#8FD3D9}.wire .v{color:#F5C542}.wire .bad{color:#FF8A80;text-decoration:line-through}
.wall.blocked .wire{border-color:#FF8A80}
.wall-actions{display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.btn-wall{background:transparent;color:#fff;border-color:#4C6A6F}
.btn-wall:hover{background:#15282C}
.verdict{font-size:15px;font-weight:600;min-height:3em}
.verdict.no{color:#FF9C8F}.verdict.ok{color:#7EE2A8}
.wall :focus-visible{outline-color:#7AA7FF}

/* board */
.tv{background:var(--board);color:#fff;border-radius:18px;padding:28px 32px;border:10px solid #050A0C;box-shadow:0 20px 50px rgba(0,0,0,.18);min-height:520px;display:flex;flex-direction:column;gap:18px}
.tv-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap}
.tv-head h3{margin:0;font-size:36px;font-weight:800;line-height:1}
.tv-head .sub2{color:var(--board-soft);font-size:16px;margin-top:6px}
.tv-clock{font-size:36px;font-weight:700;text-align:right;line-height:1}
.tv-sec{font-size:15px;font-weight:700;color:var(--board-soft);margin:4px 0 -6px}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
.tiles.called{grid-template-columns:repeat(auto-fill,minmax(330px,1fr))}
.tile{background:var(--board-tile);border-radius:14px;padding:18px 20px;display:flex;flex-direction:column;gap:12px;border:3px solid transparent;position:relative}
.tile.is-called{background:var(--board-called)}
.tile .t-top{display:flex;align-items:center;gap:12px}
.tile .t-label{font-size:28px;font-weight:800;line-height:1.1}
.tile.is-called .t-label{font-size:34px}
.tile .t-bot{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.tile .t-status{font-size:19px;font-weight:700;color:#C9D6DB}
.tile.is-next .t-status{color:#FFC96B}.tile.is-called .t-status{color:#fff}.tile.is-desk .t-status{color:#FF9C8F}
.tile .t-wait{font-size:17px;color:var(--board-soft);white-space:nowrap}
.tile.updated{border-color:var(--board-hl)}
.tile.updated::before{content:"Updated";position:absolute;top:-12px;left:14px;background:var(--board-hl);color:#1b1500;font-size:12px;font-weight:800;border-radius:6px;padding:2px 8px}
@media (prefers-reduced-motion:no-preference){
  .tile.updated{animation:pop .5s ease-out}
  @keyframes pop{0%{transform:scale(.96);opacity:.4}100%{transform:none;opacity:1}}
  .wall.blocked .wire{animation:shake .35s}
  @keyframes shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
}
.tv-empty{color:var(--board-soft);font-size:17px;padding:10px 0}
.tv-foot{margin-top:auto;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;color:var(--board-soft);font-size:15px;border-top:1px solid #23383C;padding-top:14px}

/* footer + dialog */
.page-foot{display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap;color:var(--muted);font-size:14px;padding:28px 0 40px}
.page-foot a{color:var(--accent);font-weight:600}
dialog{border:0;border-radius:16px;padding:0;max-width:min(980px,calc(100% - 32px));width:100%;background:var(--surface);color:var(--ink);box-shadow:0 30px 80px rgba(0,0,0,.35)}
dialog::backdrop{background:rgba(8,14,16,.55)}
.dlg-head{display:flex;justify-content:space-between;align-items:center;padding:18px 22px;border-bottom:1px solid var(--border)}
.dlg-head h2{margin:0;font-size:22px}
.dlg-body{padding:18px 22px 22px;overflow-x:auto}
.dlg-body p{margin:0 0 14px;color:var(--muted);max-width:70ch}
.contract td,.contract th{font-size:14px;vertical-align:top}
.contract td.no{color:var(--error)}
.contract tr.pub td{background:var(--accent-soft)}

@media (max-width:1100px){
  .private{grid-template-columns:1fr}
  .kiosk{min-height:0}
  .wall{grid-template-columns:1fr}
}
@media (max-width:560px){
  .wrap{padding:0 14px}
  .cards{grid-template-columns:1fr}
  .tv{padding:18px;border-width:6px}
  .tv-head h3,.tv-clock{font-size:26px}
  .tiles,.tiles.called{grid-template-columns:1fr}
  .kiosk-body{padding:18px}
  .token-card{padding:22px 20px}
  .token-card .label{font-size:32px;white-space:nowrap}
}
`;

const MARKUP = `
<a class="skip" href="#staff">Skip to staff console</a>
<div class="wrap">
  <header class="top">
    <div class="brand">
      <h1>Sala</h1>
      <p><strong>Check yourself in at the kiosk and watch what each screen is allowed to show.</strong> Use your real name if you like. It stays on this page, is never saved, and never reaches the waiting-room screen.</p>
    </div>
    <div class="controls">
      <label for="theme">Colors</label>
      <select id="theme" class="small">
        <option value="auto">Match device</option><option value="light">Light</option><option value="dark">Dark</option><option value="hc">High contrast</option>
      </select>
      <button class="btn btn-secondary" id="openContract" type="button">Display contract</button>
      <button class="btn btn-ghost" id="reset" type="button">Reset demo</button>
    </div>
  </header>

  <section aria-labelledby="z1">
    <div class="zone-label"><h2 id="z1">Behind the desk</h2><span>Only patients and staff see these screens.</span></div>
    <div class="private">
      <div class="panel kiosk" id="kiosk" aria-label="Check-in kiosk"></div>

      <div class="panel staff" id="staff" tabindex="-1" aria-labelledby="staffTitle">
        <div class="panel-head"><h3 id="staffTitle">Staff console</h3><span class="hint">Front desk · Riverside Family Clinic</span></div>
        <div class="staff-body">
          <div class="toolbar">
            <div class="counts" id="counts"></div>
            <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
              <button class="btn btn-ghost btn-sm" id="previewIdle" type="button">Preview idle lock</button>
              <button class="switch" id="lens" type="button" role="switch" aria-checked="false"><span class="track" aria-hidden="true"></span><span id="lensText">Privacy lens: off</span></button>
            </div>
          </div>
          <div class="lens-banner" id="lensBanner">Identifiers hidden. Turn off the lens to see full details.</div>
          <div class="table-wrap">
            <table>
              <caption class="sr">Arrival queue</caption>
              <thead><tr><th scope="col">Token</th><th scope="col">Patient</th><th scope="col">Date of birth</th><th scope="col">Visit</th><th scope="col">Arrived</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
              <tbody id="rows"></tbody>
            </table>
          </div>
          <div class="staff-foot"><span>Screen locks after 60 seconds without activity.</span><span>Synthetic patients, plus anyone you check in.</span></div>
          <div class="idle" role="dialog" aria-modal="true" aria-labelledby="idleT">
            <div class="idle-card">
              <h4 id="idleT">Paused for privacy</h4>
              <p>Patient details are hidden after 60 seconds without activity. Press any key or select Resume.</p>
              <button class="btn btn-primary" id="resume" type="button">Resume</button>
            </div>
          </div>
        </div>
        <div class="sr" aria-live="polite" id="staffLive"></div>
      </div>
    </div>
  </section>

  <section class="wall" id="wall" aria-labelledby="wallT">
    <div>
      <h2 id="wallT">The wall</h2>
      <p>The waiting-room screen gets a separate, smaller record built from the staff one. These fields stay behind the desk:</p>
      <div class="stays" aria-label="Fields that never cross"><span>firstName</span><span>lastName</span><span>dob</span><span>visit</span><span>note</span><span>language</span><span>arrivedAt</span><span>exactWait</span></div>
    </div>
    <div>
      <p id="wireLabel" style="margin-bottom:8px">Last update sent to the waiting room</p>
      <pre class="wire" id="wire" aria-labelledby="wireLabel"></pre>
    </div>
    <div class="wall-actions">
      <button class="btn btn-wall" id="leak" type="button">Try to send a name</button>
      <div class="verdict" id="verdict" aria-live="polite">Four fields, every time: glyph, token label, wait range, status.</div>
    </div>
  </section>

  <section aria-labelledby="z2">
    <div class="zone-label"><h2 id="z2">Waiting room</h2><span>Everyone in the room can see this screen.</span></div>
    <div class="tv" id="board">
      <div class="tv-head">
        <div><h3>Now serving</h3><div class="sub2">Riverside Family Clinic</div></div>
        <div><div class="tv-clock" id="clock"></div><div class="sub2" style="text-align:right">Wait times are estimates</div></div>
      </div>
      <div class="tv-sec" id="calledHead">Called</div>
      <div class="tiles called" id="calledTiles"></div>
      <div class="tv-sec">Waiting</div>
      <div class="tiles" id="waitTiles"></div>
      <div class="tv-foot"><span>Don't see your symbol? Ask the front desk.</span><span lang="es">¿No ve su símbolo? Pregunte en recepción.</span></div>
      <div class="sr" aria-live="polite" id="boardLive"></div>
    </div>
  </section>

  <footer class="page-foot">
    <span>Sala is a portfolio prototype by Nicole Rodríguez. Synthetic data. Not affiliated with any EHR vendor and not a clinical system.</span>
    <a href="https://www.figma.com/design/mTrNMj9qBNuaMK88hOovGv" target="_blank" rel="noopener">Open the Figma file</a>
  </footer>
</div>

<div class="toast" id="toast" role="status" aria-live="polite"></div>

<dialog id="contract" aria-labelledby="cT">
  <div class="dlg-head"><h2 id="cT">Display contract</h2><button class="btn btn-secondary btn-sm" id="closeContract" type="button">Close</button></div>
  <div class="dlg-body">
    <p>Every screen has a written list of what it may show and who sees it. A new field is off every public screen by default. Adding one is a reviewed change, not a UI tweak.</p>
    <table class="contract">
      <thead><tr><th>Screen</th><th>Who sees it</th><th>Allowed</th><th>Never receives</th><th>How it's enforced here</th></tr></thead>
      <tbody>
        <tr><td><b>Check-in kiosk</b></td><td>The patient checking in</td><td>Their own name, date of birth, visit, note, while filling the form</td><td class="no">Anyone else's data. Anything after the form clears</td><td>Form clears after check-in and on reset</td></tr>
        <tr><td><b>Staff console, lens off</b></td><td>Front desk staff</td><td>Full record: name, date of birth, visit, note, language, arrival, exact wait, status</td><td>—</td><td>Locks after 60 seconds without activity</td></tr>
        <tr><td><b>Staff console, lens on</b></td><td>Staff with a patient at the desk or a shared screen</td><td>Token, initials, arrival, status</td><td class="no">Full name, date of birth, visit, note</td><td>Masked cells read as "Hidden" to screen readers</td></tr>
        <tr class="pub"><td><b>Waiting-room screen</b></td><td>Everyone in the room</td><td>glyph, tokenLabel, waitRange, status</td><td class="no">Name, initials, date of birth, reason, provider, service, exact minutes, free text</td><td>The board only renders what passes <code>publishToBoard()</code>, which rejects any other key</td></tr>
      </tbody>
    </table>
  </div>
</dialog>
`;

export function SalaHome() {
  useEffect(() => {
    const previousTheme = document.documentElement.getAttribute("data-theme");
    document.documentElement.removeAttribute("data-theme");

    const dispose = bootSalaHome();

    return () => {
      dispose();
      if (previousTheme === null) {
        document.documentElement.removeAttribute("data-theme");
      } else {
        document.documentElement.setAttribute("data-theme", previousTheme);
      }
    };
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLE }} />
      <div dangerouslySetInnerHTML={{ __html: MARKUP }} />
    </>
  );
}
