/* eslint-disable */
// Untyped by design: this file owns direct DOM rendering for the home
// prototype and is excluded from typecheck/lint (see salaHomeScript.d.ts).
// The waiting-room board's data comes only from the typed feed below, which
// applies the same allow-list as the rest of the app (surfaces.publicBoard).
import { getKioskBoardFeed, projectKioskRecord } from "../feeds/kioskBoard";
import { surfaceContractViolations } from "../policy/visibility";

const SHAPES = { Triangle:"#2F6FDB", Circle:"#E07A1F", Square:"#2E9E5B", Diamond:"#7C4DCC", Star:"#D6457A", Hexagon:"#0E8A96" };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const $ = id => document.getElementById(id);
const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmtTime = d => d.toLocaleTimeString([], { hour:"numeric", minute:"2-digit" });

function glyphSVG(shape, size) {
  const c = SHAPES[shape], s = size;
  const p = {
    Circle:`<circle cx="50" cy="50" r="42" fill="${c}"/>`,
    Square:`<rect x="10" y="10" width="80" height="80" rx="8" fill="${c}"/>`,
    Triangle:`<path d="M50 8 L92 88 H8 Z" fill="${c}"/>`,
    Diamond:`<path d="M50 6 L94 50 L50 94 L6 50 Z" fill="${c}"/>`,
    Star:`<path d="M50 6l12.6 28.4 30.9 3.2-23.1 20.8 6.6 30.4L50 73.3 23 88.8l6.6-30.4L6.5 37.6l30.9-3.2z" fill="${c}"/>`,
    Hexagon:`<path d="M50 6l38 22v44L50 94 12 72V28z" fill="${c}"/>`
  }[shape];
  return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" aria-hidden="true" focusable="false">${p}</svg>`;
}

// ---------- board ----------
// Deliberately outside bootSalaHome: this code cannot see the arrival records.
// It receives public board rows (glyph, tokenLabel, waitRange, status) and a
// map of recently updated token labels, nothing else.
function boardTile(row, updatedAt) {
  const since = updatedAt[row.tokenLabel];
  const isNew = since && Date.now() - since < (reduced() ? 10000 : 5000);
  const cls = row.status.startsWith("Go to") ? "is-called" : row.status === "You're next" ? "is-next" : row.status.startsWith("Please") ? "is-desk" : "";
  return `<div class="tile ${cls} ${isNew?"updated":""}" data-token="${esc(row.tokenLabel)}"><div class="t-top">${glyphSVG(row.glyph.charAt(0).toUpperCase()+row.glyph.slice(1), cls==="is-called"?52:40)}<span class="t-label">${esc(row.tokenLabel)}</span></div><div class="t-bot"><span class="t-status">${esc(row.status)}</span><span class="t-wait">${row.waitRange==="Now"||row.waitRange==="—"?esc(row.waitRange):"Est. "+esc(row.waitRange)}</span></div></div>`;
}
function renderBoard(feed, updatedAt) {
  const called = feed.filter(row => row.status.startsWith("Go to"));
  const rest = feed.filter(row => !row.status.startsWith("Go to"));
  $("calledTiles").innerHTML = called.length ? called.map(row => boardTile(row, updatedAt)).join("") : `<div class="tv-empty">No one called right now.</div>`;
  $("waitTiles").innerHTML = rest.length ? rest.map(row => boardTile(row, updatedAt)).join("") : `<div class="tv-empty">No one waiting.</div>`;
  $("clock").textContent = fmtTime(new Date());
}

export function bootSalaHome() {
  "use strict";
  // ---------- data ----------
  const VISITS = { annual:"Annual visit", follow:"Follow-up", lab:"Lab only", other:"Something else" };
  const LANGS = { en:"English", es:"Español", other:"Another language" };
  const IDLE_MS = 60000;
  // updated: token label -> time of last change, used only to highlight board tiles.
  let patients = [], seq = 0, lens = false, lastWire = null, locked = false, lastActive = Date.now(), updated = {};

  const shapeOf = t => t.split(" ")[0];
  function newToken() {
    const used = new Set(patients.filter(p => p.status !== "done").map(p => p.token));
    const shapes = Object.keys(SHAPES);
    for (let i = 0; i < 200; i++) {
      const active = patients.filter(p => p.status !== "done").map(p => shapeOf(p.token));
      const least = Math.min(...shapes.map(sh => active.filter(x => x === sh).length));
      const pool = shapes.filter(sh => active.filter(x => x === sh).length === least);
      const t = `${pool[Math.floor(Math.random()*pool.length)]} ${10 + Math.floor(Math.random()*80)}`;
      if (!used.has(t)) return t;
    }
    return `Circle ${99 - seq}`;
  }
  const minsAgo = m => new Date(Date.now() - m*60000);

  function seed() {
    patients = []; seq = 0;
    const list = [
      ["James","Okafor","1975-11-02","annual","en",24,"called",1],
      ["Luis","Fernández","1968-01-09","follow","es",19,"waiting"],
      ["Priya","Nair","1992-06-27","lab","en",15,"waiting"],
      ["Andre","Baptiste","1983-04-18","other","en",12,"desk"],
      ["Hannah","Kim","2001-08-30","annual","en",8,"waiting"],
      ["Grace","Liu","1959-12-05","lab","other",4,"waiting"],
      ["Omar","Haddad","1990-07-21","follow","en",31,"done"]
    ];
    for (const [first,last,dob,visit,lang,m,status,win] of list) {
      patients.push({ id:++seq, first, last, dob, visit, lang, note:"", arrived:minsAgo(m), status, window:win||null, token:newToken(), you:false });
    }
    updated = {};
    lastWire = null;
  }

  // ---------- public board projection ----------
  // Every public value comes from src/feeds/kioskBoard.ts; nothing here builds board data.
  const publicRow = p => projectKioskRecord(p, patients);
  function waitingOrder() { return patients.filter(p => p.status === "waiting").sort((a,b) => a.arrived - b.arrived); }

  // ---------- kiosk ----------
  const T = {
   en:{ title:"Check in for your visit", intro:"Takes about a minute. You'll get a symbol to watch for. Your name never appears on the waiting-room screen.", start:"Start check-in",
    s1:"Who's checking in?", first:"First name", last:"Last name", dob:"Date of birth", dobHint:"For example: 03 / 14 / 1988", mm:"Month", dd:"Day", yyyy:"Year", cont:"Continue", back:"Back",
    s2:"What's the visit for?", visits:[["annual","Annual visit","Yearly check-up"],["follow","Follow-up","After a recent visit"],["lab","Lab only","Tests, no exam"],["other","Something else","The front desk will help"]],
    lang:"Language at the desk", note:"Anything the front desk should know? (optional)", noteHint:"Only staff see this. It never appears on the waiting-room screen.",
    s3:"Check your details", edit:"Edit", name:"Name", visit:"Visit", noteL:"Note for staff", langL:"Language", none:"None", privacy:"The waiting-room screen will show only your symbol, a wait estimate, and your status.", confirm:"Confirm check-in",
    done1:"You're checked in", watch:t=>`Watch the waiting-room screen for ${t}. Your name will not be shown.`, est:"Estimated wait", finish:"Done", restart:s=>`Starting over in ${s}s`,
    errTitle:n=> n===1 ? "1 thing needs fixing" : `${n} things need fixing`, eFirst:"Enter your first name.", eLast:"Enter your last name.", eDob:"Enter a real date of birth, like 03 / 14 / 1988.", eVisit:"Choose what the visit is for.", step:n=>`Step ${n} of 3`, symbol:"Your waiting-room symbol" },
   es:{ title:"Registre su llegada", intro:"Toma un minuto. Recibirá un símbolo para buscar en la pantalla. Su nombre nunca aparece en la sala de espera.", start:"Comenzar",
    s1:"¿Quién se registra?", first:"Nombre", last:"Apellido", dob:"Fecha de nacimiento", dobHint:"Por ejemplo: 03 / 14 / 1988", mm:"Mes", dd:"Día", yyyy:"Año", cont:"Continuar", back:"Atrás",
    s2:"¿Cuál es el motivo de la visita?", visits:[["annual","Chequeo anual","Revisión de cada año"],["follow","Seguimiento","Después de una visita reciente"],["lab","Solo laboratorio","Pruebas, sin examen"],["other","Otro motivo","Recepción le ayudará"]],
    lang:"Idioma en recepción", note:"¿Algo que recepción deba saber? (opcional)", noteHint:"Solo el personal lo ve. Nunca aparece en la pantalla de la sala de espera.",
    s3:"Revise sus datos", edit:"Editar", name:"Nombre", visit:"Visita", noteL:"Nota para el personal", langL:"Idioma", none:"Ninguna", privacy:"La pantalla de la sala de espera solo mostrará su símbolo, un tiempo estimado y su estado.", confirm:"Confirmar llegada",
    done1:"Ya está registrado", watch:t=>`Busque ${t} en la pantalla de la sala de espera. Su nombre no aparecerá.`, est:"Espera estimada", finish:"Listo", restart:s=>`Volviendo al inicio en ${s}s`,
    errTitle:n=> n===1 ? "Hay 1 cosa por corregir" : `Hay ${n} cosas por corregir`, eFirst:"Escriba su nombre.", eLast:"Escriba su apellido.", eDob:"Escriba una fecha real, como 03 / 14 / 1988.", eVisit:"Elija el motivo de la visita.", step:n=>`Paso ${n} de 3`, symbol:"Su símbolo en la sala de espera" }
  };
  let K = { step:0, lang:"en", d:{ first:"", last:"", mm:"", dd:"", yy:"", visit:"", note:"", desk:"en" }, errors:{}, issued:null, timer:null };
  const t = () => T[K.lang];

  function langToggle() {
    return `<div class="lang" role="group" aria-label="Language"><button type="button" data-lang="en" aria-pressed="${K.lang==="en"}">EN</button><button type="button" data-lang="es" aria-pressed="${K.lang==="es"}" lang="es">ES</button></div>`;
  }
  function stepBar(n) {
    return `<div class="steps"><span>${t().step(n)}</span>${[1,2,3].map(i=>`<i class="${i<=n?"on":""}"></i>`).join("")}</div>`;
  }
  function fieldErr(k) { return K.errors[k] ? `<span class="err" id="e-${k}"><span aria-hidden="true">!</span>${esc(K.errors[k])}</span>` : ""; }
  function errSummary() {
    const keys = Object.keys(K.errors); if (!keys.length) return "";
    const target = { first:"f-first", last:"f-last", dob:"f-mm", visit:"v-annual" };
    return `<div class="summary" role="alert"><b>${esc(t().errTitle(keys.length))}</b><ul>${keys.map(k=>`<li><a href="#${target[k]}" data-focus="${target[k]}">${esc(K.errors[k])}</a></li>`).join("")}</ul></div>`;
  }
  function inv(k){ return K.errors[k] ? `aria-invalid="true" aria-describedby="e-${k}"` : ""; }
  // A <dl> row group may hold only <dt>/<dd>, so the Edit button lives inside the <dd>.
  // The hidden label gives each button a unique name ("Edit Name", "Edit Visit").
  // `value` is already escaped by the caller.
  function reviewRow(label, value, step, L) {
    return `<div><dt>${esc(label)}</dt><dd><span>${value}</span><button class="btn btn-ghost btn-sm" type="button" data-go="${step}">${esc(L.edit)}<span class="sr"> ${esc(label)}</span></button></dd></div>`;
  }

  function renderKiosk(focus) {
    clearInterval(K.timer);
    const el = $("kiosk"), L = t(), d = K.d;
    el.classList.toggle("kiosk-issued", K.step === 4);
    let head = `<div class="panel-head"><h3>Check-in kiosk</h3>${langToggle()}</div>`, body = "", foot = "";
    if (K.step === 0) {
      body = `<div class="welcome"><div class="glyph-row">${["Triangle","Circle","Square","Diamond","Star"].map(s=>glyphSVG(s,30)).join("")}</div>
        <h4 tabindex="-1">${esc(L.title)}</h4><p class="lede">${esc(L.intro)}</p>
        <div><button class="btn btn-primary btn-lg" type="button" data-go="1">${esc(L.start)}</button></div></div>`;
    } else if (K.step === 1) {
      body = `${stepBar(1)}<h4 tabindex="-1">${esc(L.s1)}</h4>${errSummary()}
        <div class="field"><label for="f-first">${esc(L.first)}</label><input class="input" id="f-first" autocomplete="given-name" value="${esc(d.first)}" ${inv("first")}>${fieldErr("first")}</div>
        <div class="field"><label for="f-last">${esc(L.last)}</label><input class="input" id="f-last" autocomplete="family-name" value="${esc(d.last)}" ${inv("last")}>${fieldErr("last")}</div>
        <fieldset class="field" ${K.errors.dob?'aria-describedby="e-dob"':'aria-describedby="dob-help"'}><legend>${esc(L.dob)}</legend>
          <div class="dob"><div><span id="l-mm">${esc(L.mm)}</span><input class="input mm" id="f-mm" inputmode="numeric" maxlength="2" autocomplete="bday-month" aria-labelledby="l-mm" value="${esc(d.mm)}" ${K.errors.dob?'aria-invalid="true"':""}></div>
          <div><span id="l-dd">${esc(L.dd)}</span><input class="input dd" id="f-dd" inputmode="numeric" maxlength="2" autocomplete="bday-day" aria-labelledby="l-dd" value="${esc(d.dd)}" ${K.errors.dob?'aria-invalid="true"':""}></div>
          <div><span id="l-yy">${esc(L.yyyy)}</span><input class="input yy" id="f-yy" inputmode="numeric" maxlength="4" autocomplete="bday-year" aria-labelledby="l-yy" value="${esc(d.yy)}" ${K.errors.dob?'aria-invalid="true"':""}></div></div>
          ${K.errors.dob ? fieldErr("dob") : `<span class="help" id="dob-help">${esc(L.dobHint)}</span>`}</fieldset>`;
      foot = `<button class="btn btn-ghost" type="button" data-go="0">${esc(L.back)}</button><button class="btn btn-primary" type="button" data-next="1">${esc(L.cont)}</button>`;
    } else if (K.step === 2) {
      body = `${stepBar(2)}<h4 tabindex="-1">${esc(L.s2)}</h4>${errSummary()}
        <fieldset class="field card-group" ${K.errors.visit?'aria-invalid="true" aria-describedby="e-visit"':""}><legend class="sr">${esc(L.s2)}</legend>
        <div class="cards">${L.visits.map(([k,a,b])=>`<label class="card-opt"><input type="radio" name="visit" id="v-${k}" value="${k}" ${d.visit===k?"checked":""}><span class="dot" aria-hidden="true"></span><span><b>${esc(a)}</b><small>${esc(b)}</small></span></label>`).join("")}</div>${fieldErr("visit")}</fieldset>
        <div class="field"><label for="f-desk">${esc(L.lang)}</label><select class="input" id="f-desk">${Object.entries(LANGS).map(([k,v])=>`<option value="${k}" ${d.desk===k?"selected":""}>${esc(v)}</option>`).join("")}</select></div>
        <div class="field"><label for="f-note">${esc(L.note)}</label><textarea class="input" id="f-note" aria-describedby="note-help" maxlength="140">${esc(d.note)}</textarea><span class="help" id="note-help">${esc(L.noteHint)}</span></div>`;
      foot = `<button class="btn btn-ghost" type="button" data-go="1">${esc(L.back)}</button><button class="btn btn-primary" type="button" data-next="2">${esc(L.cont)}</button>`;
    } else if (K.step === 3) {
      const vis = L.visits.find(v=>v[0]===d.visit);
      body = `${stepBar(3)}<h4 tabindex="-1">${esc(L.s3)}</h4>
        <dl class="review">
          ${reviewRow(L.name, `${esc(d.first)} ${esc(d.last)}`, 1, L)}
          ${reviewRow(L.dob, `${esc(d.mm.padStart(2,"0"))}/${esc(d.dd.padStart(2,"0"))}/${esc(d.yy)}`, 1, L)}
          ${reviewRow(L.visit, esc(vis?vis[1]:""), 2, L)}
          ${reviewRow(L.noteL, d.note?esc(d.note):esc(L.none), 2, L)}
        </dl><div class="note">${esc(L.privacy)}</div>`;
      foot = `<button class="btn btn-ghost" type="button" data-go="2">${esc(L.back)}</button><button class="btn btn-primary" type="button" id="confirm">${esc(L.confirm)}</button>`;
    } else if (K.step === 4) {
      const p = patients.find(x=>x.id===K.issued), pr = p ? publicRow(p) : null;
      body = `<div class="field center" style="gap:14px"><h4 tabindex="-1" class="center">${esc(L.done1)}</h4>
        <div class="token-card">${glyphSVG(shapeOf(p.token),84)}<span class="label">${esc(p.token)}</span><small>${esc(L.symbol)}</small></div>
        <p class="lede center" style="max-width:34ch">${esc(L.watch(p.token))}</p>
        <span class="pill s-called" style="background:var(--accent-soft);color:var(--accent)">${esc(L.est)}: ${esc(pr.waitRange)}</span></div>`;
      foot = `<span class="help" id="countdown" style="font-size:14px;color:var(--muted)"></span><button class="btn btn-primary" type="button" data-go="0" data-clear="1">${esc(L.finish)}</button>`;
    }
    el.innerHTML = head + `<div class="kiosk-body">${body}</div>` + (foot ? `<div class="kiosk-foot">${foot}</div>` : `<div class="kiosk-foot"><span style="font-size:13px;color:var(--muted)">Synthetic demo. Nothing you type is saved.</span></div>`);
    if (K.step === 4) {
      let s = 20; const cd = $("countdown"); cd.textContent = t().restart(s);
      K.timer = setInterval(() => { s--; if (s <= 0) { clearInterval(K.timer); clearForm(); K.step = 0; renderKiosk(true); } else cd.textContent = t().restart(s); }, 1000);
    }
    if (focus) {
      const f = focus === true ? el.querySelector("h4") : document.getElementById(focus);
      if (f) f.focus({ preventScroll: focus === true && K.step === 0 });
    }
  }
  function readForm() {
    const v = id => { const e = $(id); return e ? e.value : null; };
    if (K.step === 1) { K.d.first = v("f-first").trim(); K.d.last = v("f-last").trim(); K.d.mm = v("f-mm").trim(); K.d.dd = v("f-dd").trim(); K.d.yy = v("f-yy").trim(); }
    if (K.step === 2) { const r = document.querySelector('input[name="visit"]:checked'); K.d.visit = r ? r.value : ""; K.d.desk = v("f-desk"); K.d.note = v("f-note").trim(); }
  }
  function validDob(m,d,y) {
    if (!/^\d{1,2}$/.test(m) || !/^\d{1,2}$/.test(d) || !/^\d{4}$/.test(y)) return false;
    const dt = new Date(+y, +m-1, +d);
    if (dt.getFullYear() !== +y || dt.getMonth() !== +m-1 || dt.getDate() !== +d) return false;
    const now = new Date(); return dt <= now && +y > now.getFullYear() - 120;
  }
  function validate(step) {
    const L = t(), e = {};
    if (step === 1) { if (!K.d.first) e.first = L.eFirst; if (!K.d.last) e.last = L.eLast; if (!validDob(K.d.mm,K.d.dd,K.d.yy)) e.dob = L.eDob; }
    if (step === 2) { if (!K.d.visit) e.visit = L.eVisit; }
    K.errors = e; return Object.keys(e);
  }
  function clearForm() { K.d = { first:"", last:"", mm:"", dd:"", yy:"", visit:"", note:"", desk:"en" }; K.errors = {}; K.issued = null; }

  const kioskClickHandler = ev => {
    const b = ev.target.closest("button, a[data-focus]"); if (!b) return;
    if (b.dataset.focus) { ev.preventDefault(); const f = $(b.dataset.focus); if (f) f.focus(); return; }
    if (b.dataset.lang) { readForm(); K.lang = b.dataset.lang; if (Object.keys(K.errors).length) validate(K.step); renderKiosk(); $("kiosk").querySelector(`[data-lang="${K.lang}"]`).focus(); return; }
    if (b.dataset.go !== undefined) { if (K.step >= 1 && K.step <= 2) readForm(); if (b.dataset.clear) clearForm(); K.errors = {}; K.step = +b.dataset.go; renderKiosk(true); return; }
    if (b.dataset.next) {
      readForm(); const bad = validate(K.step);
      if (bad.length) { const first = { first:"f-first", last:"f-last", dob:"f-mm", visit:"v-annual" }[bad[0]]; renderKiosk(first); return; }
      K.step++; renderKiosk(true); return;
    }
    if (b.id === "confirm") checkIn();
  };
  $("kiosk").addEventListener("click", kioskClickHandler);
  const kioskKeydownHandler = ev => {
    if (ev.key === "Enter" && ev.target.matches("input.input")) { ev.preventDefault(); const n = $("kiosk").querySelector("[data-next]"); if (n) n.click(); }
  };
  $("kiosk").addEventListener("keydown", kioskKeydownHandler);

  function checkIn() {
    const d = K.d;
    const p = { id:++seq, first:d.first, last:d.last, dob:`${d.yy}-${d.mm.padStart(2,"0")}-${d.dd.padStart(2,"0")}`, visit:d.visit, lang:d.desk, note:d.note, arrived:new Date(), status:"waiting", window:null, token:newToken(), you:true };
    patients.push(p);
    K.issued = p.id; K.step = 4;
    mark(p.id);
    renderKiosk(true);
    renderAll();
    say("staffLive", `New arrival: ${p.token}.`);
    toast(`${p.token} checked in. The staff console has the full record; the board got four fields.`);
    requestAnimationFrame(() => { const row = document.querySelector(`tr[data-id="${p.id}"]`); if (row) row.scrollIntoView({ block:"nearest", behavior: reduced() ? "auto" : "smooth" }); });
  }

  // ---------- staff ----------
  const fmtDob = s => { const [y,m,d] = s.split("-"); return `${m}/${d}/${y}`; };
  const mins = d => Math.max(0, Math.round((Date.now() - d) / 60000));
  const initials = p => `${p.first[0]||""}. ${p.last[0]||""}.`.toUpperCase();

  function staffStatus(p) {
    if (p.status === "called") return [`Called · window ${p.window}`, "s-called", "↗"];
    if (p.status === "desk") return ["See front desk", "s-desk", "!"];
    if (p.status === "done") return ["Done", "s-done", "✓"];
    return waitingOrder()[0] === p ? ["Next", "s-next", "→"] : ["Waiting", "s-waiting", "•"];
  }
  function hidden() { return `<span class="masked" aria-hidden="true">••••</span><span class="sr">Hidden</span>`; }

  function renderStaff() {
    const rank = { called:0, desk:1, waiting:1, done:2 };
    const rows = [...patients].sort((a,b) => rank[a.status]-rank[b.status] || a.arrived-b.arrived);
    $("rows").innerHTML = rows.map(p => {
      const [label, cls, icon] = staffStatus(p);
      const name = lens ? `<span class="pname">${esc(initials(p))}</span>` : `<span class="pname">${esc(p.first)} ${esc(p.last)}</span>`;
      const tag = p.you ? `<span class="you-tag">You</span>` : "";
      const sub = !lens && p.note ? `<span class="sub">Note: ${esc(p.note)}</span>` : (!lens && p.lang !== "en" ? `<span class="sub">${esc(LANGS[p.lang])} at the desk</span>` : "");
      let acts = "";
      if (p.status === "waiting" || p.status === "desk") acts = `<button class="btn btn-secondary btn-sm" data-act="call" data-id="${p.id}" type="button">Call<span class="sr"> ${esc(p.token)}</span></button>` + (p.status === "waiting" ? `<button class="btn btn-ghost btn-sm" data-act="desk" data-id="${p.id}" type="button">Needs desk<span class="sr"> for ${esc(p.token)}</span></button>` : "");
      if (p.status === "called") acts = `<button class="btn btn-secondary btn-sm" data-act="done" data-id="${p.id}" type="button">Mark done<span class="sr"> ${esc(p.token)}</span></button><button class="btn btn-ghost btn-sm" data-act="back" data-id="${p.id}" type="button">Back to waiting<span class="sr"> ${esc(p.token)}</span></button>`;
      return `<tr data-id="${p.id}" class="${p.status==="done"?"done":""} ${p.you?"you":""}">
        <td><span class="tok">${glyphSVG(shapeOf(p.token),20)}${esc(p.token)}</span></td>
        <td>${name}${tag}${sub}</td>
        <td class="nowrap">${lens ? hidden() : esc(fmtDob(p.dob))}</td>
        <td>${lens ? hidden() : esc(VISITS[p.visit])}</td>
        <td class="nowrap">${esc(fmtTime(p.arrived))}<span class="sub">${p.status==="done"?"—":mins(p.arrived)===0?"Just now":mins(p.arrived)+" min"}</span></td>
        <td><span class="pill ${cls}"><span aria-hidden="true">${icon}</span>${esc(label)}</span></td>
        <td><div class="acts">${acts}</div></td></tr>`;
    }).join("");
    const c = s => patients.filter(p => p.status === s).length;
    $("counts").innerHTML = `<span><b>${c("waiting")}</b>waiting</span><span><b>${c("called")}</b>called</span><span><b>${c("desk")}</b>at desk</span><span><b>${c("done")}</b>done</span>`;
    $("staff").classList.toggle("lens", lens);
    $("lens").setAttribute("aria-checked", String(lens));
    $("lensText").textContent = `Privacy lens: ${lens ? "on" : "off"}`;
  }

  const rowsClickHandler = ev => {
    const b = ev.target.closest("button[data-act]"); if (!b) return;
    const p = patients.find(x => x.id === +b.dataset.id); if (!p) return;
    const a = b.dataset.act;
    if (a === "call") { const taken = patients.filter(x=>x.status==="called").map(x=>x.window); p.window = [1,2,3].find(w=>!taken.includes(w)) || 1; p.status = "called"; toast(`${p.token} called to window ${p.window}. Board updated.`); say("boardLive", `${p.token}, go to window ${p.window}.`); }
    if (a === "desk") { p.status = "desk"; toast(`${p.token} asked to see the front desk. Board updated.`); say("boardLive", `${p.token}, please see the front desk.`); }
    if (a === "done") { p.status = "done"; p.window = null; toast(`${p.token} marked done. Removed from the board.`); }
    if (a === "back") { p.status = "waiting"; p.window = null; toast(`${p.token} moved back to waiting.`); }
    mark(p.id);
    renderAll();
    const again = document.querySelector(`tr[data-id="${p.id}"] button`); if (again) again.focus();
  };
  $("rows").addEventListener("click", rowsClickHandler);
  const lensClickHandler = () => { lens = !lens; renderStaff(); say("staffLive", lens ? "Privacy lens on. Identifiers hidden." : "Privacy lens off. Full details shown."); };
  $("lens").addEventListener("click", lensClickHandler);
  const altLHandler = ev => { if (ev.altKey && (ev.key === "l" || ev.key === "L" || ev.code === "KeyL")) { ev.preventDefault(); $("lens").click(); } };
  document.addEventListener("keydown", altLHandler);

  // idle lock
  let beforeLock = null;
  function lock() { if (locked) return; beforeLock = document.activeElement; locked = true; $("staff").classList.add("locked"); $("resume").focus({ preventScroll:true }); }
  function unlock() { if (!locked) return; locked = false; lastActive = Date.now(); $("staff").classList.remove("locked"); if (beforeLock && beforeLock.focus && document.contains(beforeLock)) beforeLock.focus({ preventScroll:true }); }
  $("resume").addEventListener("click", unlock);
  $("previewIdle").addEventListener("click", lock);
  const activityEvents = ["pointerdown","keydown","wheel","touchstart"];
  const activityHandler = ev => {
    if (locked && ev.type === "keydown" && $("staff") && $("staff").contains(document.activeElement)) { ev.preventDefault(); unlock(); return; }
    if (!locked) lastActive = Date.now();
  };
  activityEvents.forEach(e => document.addEventListener(e, activityHandler, { passive: e !== "keydown" }));
  const idleInterval = setInterval(() => { if (!locked && Date.now() - lastActive > IDLE_MS) lock(); }, 3000);

  // ---------- board updates ----------
  function mark(id) { const p = patients.find(x=>x.id===id); if (!p) return; updated[p.token] = Date.now(); if (p.status !== "done") showWire(publicRow(p)); }

  // ---------- wall ----------
  function jsonHTML(obj, badKeys = []) {
    const lines = Object.entries(obj).map(([k,v]) => {
      const bad = badKeys.includes(k);
      return `  <span class="k ${bad?"bad":""}">"${esc(k)}"</span>: <span class="v ${bad?"bad":""}">${esc(JSON.stringify(v))}</span>`;
    });
    return `{\n${lines.join(",\n")}\n}`;
  }
  function showWire(payload) {
    lastWire = payload;
    $("wall").classList.remove("blocked");
    $("wire").innerHTML = jsonHTML(payload);
    $("verdict").className = "verdict ok";
    $("verdict").textContent = `Sent: 4 fields for ${payload.tokenLabel}. Nothing else crossed.`;
  }
  const leakClickHandler = () => {
    const p = patients.find(x => x.id === K.issued) || [...patients].reverse().find(x => x.status !== "done");
    // Demo: the attempt is shown, then checked against the same contract the feed enforces.
    const attempt = { ...publicRow(p), firstName: p.first, lastName: p.last };
    const blocked = surfaceContractViolations("publicBoard", attempt);
    if (blocked.length) {
      $("wire").innerHTML = jsonHTML(attempt, blocked);
      const w = $("wall"); w.classList.remove("blocked"); void w.offsetWidth; w.classList.add("blocked");
      $("verdict").className = "verdict no";
      $("verdict").textContent = `Blocked. ${blocked.join(" and ")} aren't in the waiting-room contract, so the board never received them. The board is unchanged.`;
    }
  };
  $("leak").addEventListener("click", leakClickHandler);

  // ---------- misc ----------
  let toastT;
  function toast(msg) { const el = $("toast"); el.textContent = msg; el.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("show"), 5000); }
  function say(id, msg) { const el = $(id); el.textContent = ""; setTimeout(() => { el.textContent = msg; }, 60); }
  // The board is handed public rows only; it never receives `patients`.
  function renderAll() { renderStaff(); renderBoard(getKioskBoardFeed(patients), updated); }
  function applyTheme(v) { if (v === "auto") document.documentElement.removeAttribute("data-theme"); else document.documentElement.setAttribute("data-theme", v); }
  const themeChangeHandler = e => applyTheme(e.target.value);
  $("theme").addEventListener("change", themeChangeHandler);
  const resetClickHandler = () => { seed(); clearForm(); K.step = 0; lens = false; unlock(); renderKiosk(); renderAll(); initWire(); toast("Demo reset."); };
  $("reset").addEventListener("click", resetClickHandler);
  const dlg = $("contract");
  const openContractHandler = () => dlg.showModal();
  const closeContractHandler = () => dlg.close();
  const dlgBackdropHandler = e => { if (e.target === dlg) dlg.close(); };
  $("openContract").addEventListener("click", openContractHandler);
  $("closeContract").addEventListener("click", closeContractHandler);
  dlg.addEventListener("click", dlgBackdropHandler);
  function initWire() {
    const p = patients.find(x => x.status === "called");
    showWire(publicRow(p));
    $("verdict").className = "verdict";
    $("verdict").textContent = "Four fields, every time: glyph, token label, wait range, status.";
  }
  const renderInterval = setInterval(renderAll, 30000);

  seed(); renderKiosk(); renderAll(); initWire();

  return function cleanup() {
    clearInterval(K.timer);
    clearInterval(idleInterval);
    clearInterval(renderInterval);
    clearTimeout(toastT);
    activityEvents.forEach(e => document.removeEventListener(e, activityHandler));
    document.removeEventListener("keydown", altLHandler);
    $("kiosk") && $("kiosk").removeEventListener("click", kioskClickHandler);
    $("kiosk") && $("kiosk").removeEventListener("keydown", kioskKeydownHandler);
    $("rows") && $("rows").removeEventListener("click", rowsClickHandler);
    $("lens") && $("lens").removeEventListener("click", lensClickHandler);
    $("resume") && $("resume").removeEventListener("click", unlock);
    $("previewIdle") && $("previewIdle").removeEventListener("click", lock);
    $("leak") && $("leak").removeEventListener("click", leakClickHandler);
    $("theme") && $("theme").removeEventListener("change", themeChangeHandler);
    $("reset") && $("reset").removeEventListener("click", resetClickHandler);
    $("openContract") && $("openContract").removeEventListener("click", openContractHandler);
    $("closeContract") && $("closeContract").removeEventListener("click", closeContractHandler);
    dlg && dlg.removeEventListener("click", dlgBackdropHandler);
  };
}
