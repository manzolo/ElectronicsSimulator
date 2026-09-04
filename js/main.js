// EDU-ELN orchestrator: wires the DOM-free circuit engine to the bench UI
// through the Player's event stream. Mirrors EDU-SQL / EDU-NN's main.js:
// build → run → verify the circuit on every level case (visible AND hidden)
// headlessly, by MEASURING it.

import { buildRun, runHeadless } from './core/engine.js';
import { runToCompletion } from './core/sim.js';
import { Player } from './player.js';
import { initLang, setLang, getLang, t, tr, onLangChange, refreshStatic } from './i18n.js';
import { INTRO } from './strings/intro.js';
import * as storage from './storage.js';
import { levels, levelById } from './levels/index.js';
import { SANDBOX } from './levels/sandbox.js';
import { verifyAll, checkConstraints } from './levels/verify.js';
import { formatValue } from './core/units.js';
import { createEditor } from './ui/editor.js';
import { createSchematic } from './ui/schematic.js';
import { createScope } from './ui/scope.js';
import { createMeter } from './ui/meter.js';
import { createReadings } from './ui/readings.js';
import { createBuilder } from './ui/builder.js';
import { createEventLog } from './ui/eventlog.js';
import { createCasesPanel } from './ui/casesPanel.js';
import { createLevelPanel } from './ui/levelPanel.js';
import { createLevelSelect } from './ui/levelSelect.js';
import { toFalstad, falstadUrl } from './ui/falstad.js';

initLang();

// ---------- components ----------

const editor = createEditor(document.getElementById('editor'), {
  onChange: onUserEdit,
  onRun: () => btnRun.click(),
});
const schematic = createSchematic(document.getElementById('schematic'), {
  onProbeNode: (node) => toggleProbe(node === '0' ? 'gnd' : node),
  onProbeComp: (name) => toggleProbe(`I(${name.toUpperCase()})`),
});
const scope = createScope(document.getElementById('scope'));
const meter = createMeter(document.getElementById('meter'));
const readings = createReadings(document.getElementById('readings'));
const builder = createBuilder(document.getElementById('builder'), { onChange: onBuilderWrite });
const eventlog = createEventLog(document.getElementById('eventLog'));
const casesPanel = createCasesPanel(document.getElementById('casesPanel'), { onPick: pickCase });
const levelPanel = createLevelPanel(document.getElementById('lessonPanel'), { onNext: gotoNextLevel });
const levelSelect = createLevelSelect(document.getElementById('levelSelectOverlay'), { onSelect: select });

const statusEl = document.getElementById('statusLine');
const btnRun = document.getElementById('btnRun');
const btnPause = document.getElementById('btnPause');
const btnStep = document.getElementById('btnStep');
const btnReset = document.getElementById('btnReset');
const casesCard = document.getElementById('casesCard');

// ---------- machine state ----------

let currentId = null;
let level = null;
let sim = null;
let circuit = null;
let machineStale = true;
let visibleCases = [];
let selectedCase = 0;
let hadRun = false; // the user has seen this build run to the end
let railRank = [];  // node order of the current schematic, reused by the Falstad export

const player = new Player({
  onEvents: handleEvents,
  onFrame: handleFrame,
  onHalt: handleHalt,
  onError: handleError,
  onRunState: (running) => {
    btnRun.hidden = running;
    btnPause.hidden = !running;
    btnStep.disabled = running;
    if (running) setStatus(t('statusRunning'), '');
  },
});

function setStatus(msg, kind = '') { statusEl.textContent = msg; statusEl.dataset.kind = kind; }
function isSandbox() { return currentId === 'sandbox'; }
function errMsg(e) { return t(e.code, ...(e.args ?? [])); }

// ---------- build ----------

function activeCase() { return visibleCases[selectedCase] ?? null; }
function fixtureText() { return level ? level.fixture(activeCase()?.params ?? {}) : ''; }
function activeFaults() { return level ? (activeCase()?.faults ?? {}) : {}; }

// Rails top→bottom: by mean voltage over the (headless preview) run, ties by
// order of appearance; ground always last.
function rankNodes(state) {
  const nodes = state.nodes.filter((n) => n !== '0');
  const score = new Map();
  nodes.forEach((n, k) => {
    const ni = state.nodes.indexOf(n) - 1;
    let s = 0;
    if (state.samples.length) { for (const smp of state.samples) s += smp.v[ni]; s /= state.samples.length; } else s = state.v[n] ?? 0;
    score.set(n, { s, k });
  });
  nodes.sort((a, b) => {
    const A = score.get(a); const B = score.get(b);
    if (Math.abs(A.s - B.s) > 1e-3) return B.s - A.s;
    return A.k - B.k;
  });
  return [...nodes, '0'];
}

function maxAbsVoltage(state, onlyNodes = null) {
  let m = 0;
  const idx = onlyNodes ? onlyNodes.map((n) => state.nodes.indexOf(n) - 1) : null;
  for (const smp of state.samples) {
    if (idx) { for (const ni of idx) if (ni >= 0) m = Math.max(m, Math.abs(smp.v[ni])); } else for (const v of smp.v) m = Math.max(m, Math.abs(v));
  }
  if (!state.samples.length) for (const n of state.nodes) m = Math.max(m, Math.abs(state.v[n] ?? 0));
  return m;
}

function buildMachine() {
  const user = editor.getUser();
  const fixture = fixtureText();
  const faults = activeFaults();
  eventlog.clear();
  hadRun = false;

  const cerr = level ? checkConstraints(level, user) : [];
  if (cerr.length) {
    const e = cerr[0];
    editor.setError({ pos: e.pos, len: e.len, msg: errMsg(e) });
    setStatus(t('statusParseFailed'), 'err');
    sim = null; circuit = null;
    builder.render(user, level ? level.allowed : null);
    return false;
  }

  const built = buildRun({ fixture, user, faults });
  if (built.errors) {
    const e = built.errors[0];
    editor.setError({ pos: e.pos, len: e.len, msg: errMsg(e), inFixture: !!e.inFixture });
    setStatus(t('statusParseFailed'), 'err');
    sim = null; circuit = null;
    schematic.clear(); scope.clear(); meter.clear(); readings.clear();
    builder.setInvalid();
    return false;
  }
  editor.setError(null);
  sim = built.sim; circuit = built.circuit;

  // a headless preview of the same run fixes the layout (rail order) and the
  // scope's volts/div before the first tick, like setting the instrument up
  const preview = runHeadless({ fixture, user, faults });
  const st = preview.state;
  const rank = rankNodes(st);
  railRank = rank;
  schematic.build(circuit, rank, maxAbsVoltage(st));
  const scopes = built.parsed.directives.scopes.map((s) => ({ node: s.node, ni: circuit.idx.get(s.node) }));
  scope.setup({ channels: scopes, stop: st.tran?.stop ?? 0, range: maxAbsVoltage(st, scopes.map((s) => s.node)) });
  meter.setup(built.parsed.directives.probes);
  readings.build(circuit);
  builder.render(user, level ? level.allowed : null);

  player.load(sim);
  machineStale = false;
  setStatus(t('statusReady'));
  return true;
}

function ensureMachine() {
  if (machineStale || !sim || sim.halted || sim.error) return buildMachine();
  return true;
}

// ---------- event stream → UI ----------

function handleEvents(events) {
  if (player.turbo) return;
  for (const evt of events) eventlog.append(evt);
}

function handleFrame() {
  if (!sim) return;
  schematic.update();
  readings.update();
  meter.update(circuit);
  if (sim.tran) scope.draw(sim.samples, sim.t);
  else if (sim.samples.length) scope.draw(sim.samples, 0);
}

function handleHalt() {
  hadRun = true;
  if (player.turbo) eventlog.setAll(sim.trace);
  handleFrame();
  if (sim.burned.length) setStatus(t('statusDoneBurn', sim.steps, sim.burned.map((n) => n.toUpperCase()).join(', ')), 'err');
  else setStatus(t('statusDone', sim.steps, formatValue(sim.t, 's')), 'ok');
  if (level) verifySolution();
}

function handleError(err) { setStatus(errMsg(err), 'err'); if (sim) eventlog.setAll(sim.trace); }

// ---------- verification (headless, every case) ----------

function verifySolution() {
  const results = verifyAll(level, editor.getUser());
  const verdicts = new Map();
  let vi = 0;
  for (const r of results) if (r.visible) verdicts.set(vi++, r.pass);
  casesPanel.setVerdicts(verdicts);

  const withError = results.find((r) => r.error);
  if (withError) {
    levelPanel.setResult({ pass: false, msg: errMsg(withError.error) });
    setStatus(t('failStatus'), 'err');
    return;
  }
  const allPass = results.every((r) => r.pass);
  if (allPass) {
    storage.markCompleted(level.id);
    const shown = results.filter((r) => r.visible)[selectedCase] ?? results[0];
    levelPanel.setResult({ pass: true, msg: t('passMsg'), checks: shown.checks });
    setStatus(t('passMsg'), 'ok');
    return;
  }
  const visibleFail = results.find((r) => r.visible && !r.pass);
  const shown = visibleFail ?? results.filter((r) => r.visible)[selectedCase] ?? results[0];
  const burned = shown.burned?.length;
  const msg = visibleFail ? (burned ? t('failBurn') : t('failVisible')) : t('failHidden');
  levelPanel.setResult({ pass: false, msg, checks: shown.checks });
  setStatus(t('failStatus'), 'err');
}

// ---------- edits, builder, probes, cases ----------

let builderTimer = null;
function onUserEdit(value) {
  player.pause();
  machineStale = true;
  storage.saveNetlist(currentId, value);
  clearTimeout(builderTimer);
  builderTimer = setTimeout(() => builder.render(value, level ? level.allowed : null), 150);
}

function onBuilderWrite(text) {
  editor.setUser(text);
  onUserEdit(text);
  buildMachine();
}

// Click on a rail / part: add (or remove) the matching .probe line, rebuild,
// and — if the circuit had already been run — run it again instantly so the
// meter shows the reading right away.
function toggleProbe(target) {
  const lines = editor.getUser().split('\n');
  const want = `.probe ${target}`;
  const idx = lines.findIndex((l) => l.trim().toLowerCase() === want.toLowerCase());
  const rerun = hadRun;
  if (idx >= 0) lines.splice(idx, 1); else lines.push(want);
  const text = lines.join('\n').replace(/^\n+/, '');
  editor.setUser(text);
  onUserEdit(text);
  if (buildMachine() && rerun) {
    runToCompletion(sim);
    handleHalt();
  }
}

function pickCase(i) {
  selectedCase = i;
  player.pause();
  machineStale = true;
  buildMachine();
  editor.setFixture(fixtureText());
}

function resetToStarter() {
  player.pause();
  levelPanel.setResult(null);
  const text = level?.start ?? SANDBOX.netlist;
  editor.setUser(text);
  storage.saveNetlist(currentId, text);
  selectedCase = 0;
  machineStale = true;
  buildMachine();
}

// ---------- navigation ----------

function select(id) {
  player.pause();
  const lv = id === 'sandbox' ? null : levelById(id);
  if (id !== 'sandbox' && !lv) { select(levels[0].id); return; }
  currentId = id;
  level = lv;
  selectedCase = 0;
  storage.setLastMode(id);
  if (window.location.hash !== `#${id}`) window.location.hash = id;

  casesCard.hidden = !level;

  if (level) {
    visibleCases = level.makeCases().filter((c) => c.visible);
    const idx = levels.indexOf(level);
    levelPanel.showLevel(level, idx, levels.length, storage.getProgress().has(id));
    editor.setFixture(fixtureText());
    editor.setUser(storage.getNetlist(id) ?? level.start ?? '');
    casesPanel.showCases(visibleCases);
  } else {
    visibleCases = [];
    levelPanel.showSandbox();
    editor.setFixture('');
    editor.setUser(storage.getNetlist('sandbox') ?? SANDBOX.netlist);
    casesPanel.clear();
  }
  machineStale = true;
  buildMachine();
}

function gotoNextLevel() {
  const idx = levels.indexOf(level);
  if (idx >= 0 && idx < levels.length - 1) select(levels[idx + 1].id);
}

// ---------- toolbar & shortcuts ----------

btnRun.addEventListener('click', () => { if (ensureMachine()) player.play(); });
btnPause.addEventListener('click', () => { player.pause(); setStatus(t('statusPaused'), ''); });
btnStep.addEventListener('click', () => { if (ensureMachine()) player.stepOnce(); });
btnReset.addEventListener('click', resetToStarter);
document.getElementById('speed').addEventListener('input', (e) => player.setSpeed(+e.target.value));
player.setSpeed(+document.getElementById('speed').value);

document.addEventListener('keydown', (e) => {
  if (e.target.matches('textarea, input, select')) return; // editor handles Ctrl+Enter itself
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    if (player.running) btnPause.click(); else btnRun.click();
  } else if (e.key === 'F8') {
    e.preventDefault();
    btnStep.click();
  }
});

// ---------- header: nav, language, help, primer ----------

document.getElementById('btnLevels').addEventListener('click', () => {
  levelSelect.open(levels, storage.getProgress(), currentId);
});
document.getElementById('btnSandbox').addEventListener('click', () => select('sandbox'));

const introOverlay = document.getElementById('introOverlay');
function renderIntro() {
  document.getElementById('introTitle').textContent = t('introTitle');
  document.getElementById('introBody').innerHTML = tr(INTRO);
  document.getElementById('introStart').textContent = t('introStart');
}
function openIntro() {
  renderIntro();
  introOverlay.hidden = false;
  introOverlay.querySelector('.modal').scrollTop = 0;
}
function closeIntro() {
  introOverlay.hidden = true;
  storage.setIntroSeen();
}
document.getElementById('btnIntro').addEventListener('click', openIntro);
document.getElementById('introClose').addEventListener('click', closeIntro);
document.getElementById('introStart').addEventListener('click', () => {
  closeIntro();
  if (currentId !== levels[0].id) select(levels[0].id);
});
introOverlay.addEventListener('click', (e) => { if (e.target === introOverlay) closeIntro(); });

const helpOverlay = document.getElementById('helpOverlay');
function renderHelp() {
  document.getElementById('helpTitle').textContent = t('helpTitle');
  document.getElementById('helpBody').innerHTML = t('helpHtml');
}
document.getElementById('btnHelp').addEventListener('click', () => { renderHelp(); helpOverlay.hidden = false; });
document.getElementById('helpClose').addEventListener('click', () => { helpOverlay.hidden = true; });
helpOverlay.addEventListener('click', (e) => { if (e.target === helpOverlay) helpOverlay.hidden = true; });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    helpOverlay.hidden = true;
    document.getElementById('levelSelectOverlay').hidden = true;
    if (!introOverlay.hidden) closeIntro();
  }
});

// «Seconda opinione»: the same circuit, exported to CircuitJS at click time.
document.getElementById('btnFalstad').addEventListener('click', (e) => {
  if (!circuit) { e.preventDefault(); return; }
  e.currentTarget.href = falstadUrl(toFalstad(circuit, railRank, { nominal: true }));
});

// «Segnala un problema»: the href is built AT CLICK time, when the data is
// true — page URL (with level and ?lang=), level, language, engine status,
// browser. The static href (empty issue) stays as fallback.
document.getElementById('linkSegnala').addEventListener('click', (e) => {
  const a = e.currentTarget;
  const idx = level ? levels.indexOf(level) + 1 : null;
  const title = level ? `[lv ${idx}] ` : '[sandbox] ';
  const body = t('segnalaCorpo',
    location.href,
    level ? `${idx}/${levels.length} · ${level.id}` : 'sandbox',
    getLang(),
    statusEl.textContent || '—',
    navigator.userAgent);
  a.href = `${a.href.split('?')[0]}?title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;
});

const langButtons = document.querySelectorAll('.lang-switch button');
function markLang() { langButtons.forEach((b) => b.classList.toggle('active', b.dataset.lang === getLang())); }
langButtons.forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));

onLangChange(() => {
  markLang();
  levelPanel.refresh();
  casesPanel.refresh();
  editor.refresh();
  builder.refresh();
  readings.refresh();
  meter.refresh();
  scope.refresh();
  if (!helpOverlay.hidden) renderHelp();
  if (!introOverlay.hidden) renderIntro();
  if (!machineStale && sim && !sim.halted) setStatus(t('statusReady'));
});

// ---------- boot ----------

refreshStatic();
markLang();

const fromHash = window.location.hash.slice(1);
const startId = (fromHash === 'sandbox' || levelById(fromHash)) ? fromHash
  : storage.getLastMode() || levels[0].id;
select(startId);

window.addEventListener('hashchange', () => {
  const id = window.location.hash.slice(1);
  if (id !== currentId && (id === 'sandbox' || levelById(id))) select(id);
});

// First visit ever: welcome the beginner with the primer.
if (!storage.getIntroSeen()) openIntro();
