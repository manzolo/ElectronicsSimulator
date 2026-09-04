// Cross-check: our engine vs CircuitJS1 (falstad.com), an independent
// simulator. For each DC level, the reference solution is built here, exported
// with the same converter the "second opinion" button uses, loaded in headless
// Chrome on falstad.com, and the node voltages are compared. Needs network and
// Chrome; not part of `npm test` (which must run offline).
//   node tools/xcheck-falstad.mjs

import { spawn } from 'node:child_process';
import http from 'node:http';
import { buildRun } from '../js/core/engine.js';
import { runToCompletion } from '../js/core/sim.js';
import { toFalstad, falstadUrl } from '../js/ui/falstad.js';
import { levels } from '../js/levels/index.js';
import { solutions } from '../tests/solutions.js';

const CHROME = process.env.CHROME ?? '/usr/bin/google-chrome-stable';
const PORT = 9250;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (url) => new Promise((res, rej) => { http.get(url, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d))); }).on('error', rej); });
function cdp(ws) {
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (ev) => { const msg = JSON.parse(ev.data); if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); } });
  return { send: (method, params = {}, sessionId) => new Promise((resolve) => { const m = { id: ++id, method, params }; if (sessionId) m.sessionId = sessionId; pending.set(m.id, (r) => resolve(r.result ?? r)); ws.send(JSON.stringify(m)); }) };
}

// DC levels only: Falstad runs in wall-clock time, a transient comparison
// would need synchronized sampling.
const DC_LEVELS = ['ohm', 'divider', 'divider-load', 'led', 'kirchhoff', 'zener'];
const EXTRA = [{ id: 'bjt-dc', user: 'V1 vcc gnd DC 12\nRL vcc c 100 5W\nVin bin gnd DC 3.3\nRb bin b 680\nQ1 c b gnd NPN', fixture: '' }];

function rank(state, nodes) {
  const arr = nodes.filter((n) => n !== '0');
  arr.sort((a, b) => (state.v[b] - state.v[a]) || nodes.indexOf(a) - nodes.indexOf(b));
  return [...arr, '0'];
}

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox', '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', `--remote-debugging-port=${PORT}`, 'about:blank'], { stdio: 'ignore' });
let worst = 0; const rows = [];
try {
  let version; for (let i = 0; i < 40; i++) { try { version = await getJSON(`http://localhost:${PORT}/json/version`); break; } catch { await sleep(150); } }
  const ws = new WebSocket(version.webSocketDebuggerUrl); await new Promise((r) => ws.addEventListener('open', r)); const c = cdp(ws);
  const { targetId } = await c.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await c.send('Target.attachToTarget', { targetId, flatten: true });
  await c.send('Page.enable', {}, sessionId); await c.send('Runtime.enable', {}, sessionId);
  const ev = async (expr) => { const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId); return r.result?.value; };

  const cases = [
    ...DC_LEVELS.map((id) => { const lv = levels.find((l) => l.id === id); const cs = lv.makeCases().find((k) => k.visible); return { id, fixture: lv.fixture(cs.params), user: solutions[id] }; }),
    ...EXTRA,
  ];
  for (const cs of cases) {
    const b = buildRun({ fixture: cs.fixture, user: cs.user });
    runToCompletion(b.sim);
    const st = b.sim.finalState();
    const rk = rank(st, st.nodes);
    const url = falstadUrl(toFalstad(b.circuit, rk));
    await c.send('Page.navigate', { url }, sessionId);
    let ok = false;
    for (let i = 0; i < 60; i++) { await sleep(250); ok = await ev(`!!(window.CircuitJS1 && window.CircuitJS1.getTime && window.CircuitJS1.getTime() > 0.02)`); if (ok) break; }
    if (!ok) { rows.push([cs.id, 'falstad did not start']); continue; }
    await sleep(400);
    const nodes = rk.filter((n) => n !== '0');
    const theirs = await ev(`(() => { const o = {}; for (const n of ${JSON.stringify(nodes)}) { try { o[n] = window.CircuitJS1.getNodeVoltage(n); } catch (e) { o[n] = 'ERR ' + e; } } return o; })()`);
    for (const n of nodes) {
      const ours = st.v[n]; const th = theirs[n];
      const diff = typeof th === 'number' ? Math.abs(ours - th) : NaN;
      worst = Math.max(worst, Number.isFinite(diff) ? diff / Math.max(1, Math.abs(ours)) : 1);
      rows.push([cs.id, n, ours.toFixed(4), typeof th === 'number' ? th.toFixed(4) : String(th), Number.isFinite(diff) ? (diff * 1000).toFixed(1) + ' mV' : '—']);
    }
  }
} finally { chrome.kill('SIGKILL'); }
console.log(['level', 'node', 'EDU-ELN [V]', 'CircuitJS [V]', '|Δ|'].join('\t'));
for (const r of rows) console.log(r.join('\t'));
console.log(`\nworst relative difference: ${(worst * 100).toFixed(2)} %`);
process.exitCode = worst < 0.05 ? 0 : 1;
