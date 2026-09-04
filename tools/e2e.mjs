// Minimal headless end-to-end check — no dependencies. Drives Chrome via the
// DevTools Protocol over Node's built-in WebSocket: loads the page, collects
// console errors / exceptions, checks the beginner's primer, runs a level at
// turbo speed and asserts the schematic, the meter and the pass banner fill
// in; then a repair level: probes, .replace, pass. Usage:
//   node tools/e2e.mjs [baseUrl]   (default http://localhost:8123)

import { spawn } from 'node:child_process';
import http from 'node:http';

const BASE = process.argv[2] ?? 'http://localhost:8123';
const CHROME = process.env.CHROME ?? '/usr/bin/google-chrome-stable';
const PORT = 9222;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const getJSON = (url) => new Promise((res, rej) => {
  http.get(url, (r) => { let d = ''; r.on('data', (c) => (d += c)); r.on('end', () => res(JSON.parse(d))); }).on('error', rej);
});

function cdp(ws) {
  let id = 0;
  const pending = new Map();
  const handlers = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
    else handlers.forEach((h) => h(msg));
  });
  const send = (method, params = {}, sessionId) => new Promise((resolve) => {
    const m = { id: ++id, method, params };
    if (sessionId) m.sessionId = sessionId;
    pending.set(m.id, (r) => resolve(r.result ?? r));
    ws.send(JSON.stringify(m));
  });
  return { send, on: (h) => handlers.push(h) };
}

async function main() {
  const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-sandbox',
    '--disable-background-timer-throttling', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
    `--remote-debugging-port=${PORT}`, 'about:blank'], { stdio: 'ignore' });
  const errors = [];
  try {
    let version;
    for (let i = 0; i < 40; i++) { try { version = await getJSON(`http://localhost:${PORT}/json/version`); break; } catch { await sleep(150); } }
    if (!version) throw new Error('Chrome debug endpoint never came up');

    const ws = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((r, j) => { ws.addEventListener('open', r); ws.addEventListener('error', j); });
    const c = cdp(ws);

    const { targetId } = await c.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await c.send('Target.attachToTarget', { targetId, flatten: true });

    c.on((msg) => {
      if (msg.method === 'Runtime.exceptionThrown') {
        errors.push('EXCEPTION: ' + (msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text));
      }
      if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
        errors.push('CONSOLE.ERROR: ' + msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
      }
      if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
        errors.push('LOG.ERROR: ' + msg.params.entry.text + ' ' + (msg.params.entry.url ?? ''));
      }
    });

    await c.send('Runtime.enable', {}, sessionId);
    await c.send('Log.enable', {}, sessionId);
    await c.send('Page.enable', {}, sessionId);
    await c.send('Network.enable', {}, sessionId);
    await c.send('Network.setCacheDisabled', { cacheDisabled: true }, sessionId);
    await c.send('Emulation.setDeviceMetricsOverride', { width: 1400, height: 1000, deviceScaleFactor: 1, mobile: false }, sessionId);
    await c.send('Page.navigate', { url: BASE + '/?lang=it#ohm' }, sessionId);
    await sleep(1500);

    const evalJS = async (expr) => {
      const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }, sessionId);
      if (r.exceptionDetails) errors.push('EVAL: ' + (r.exceptionDetails.exception?.description ?? r.exceptionDetails.text));
      return r.result?.value;
    };
    const waitHalt = async () => {
      for (let i = 0; i < 80; i++) { await sleep(150); if (!(await evalJS(`document.getElementById('btnRun').hidden`))) return; }
    };
    const setUser = async (text) => {
      await evalJS(`(() => { const q = document.querySelector('.nl-input'); q.value = ${JSON.stringify(text)}; q.dispatchEvent(new Event('input', {bubbles:true})); return true; })()`);
      await sleep(250);
    };
    const runTurbo = async () => {
      await evalJS(`(() => { const sp = document.getElementById('speed'); sp.value = 5; sp.dispatchEvent(new Event('input', {bubbles:true})); document.getElementById('btnRun').click(); return true; })()`);
      await waitHalt();
      await sleep(300);
    };

    // first visit: the beginner's primer auto-opens and covers the page
    const primer = await evalJS(`(() => ({
      open: !document.getElementById('introOverlay')?.hidden,
      headings: document.querySelectorAll('#introBody h3').length,
    }))()`);
    console.log('primer:', JSON.stringify(primer));
    await evalJS(`document.getElementById('introClose')?.click()`);
    await sleep(200);
    await c.send('Page.navigate', { url: BASE + '/?lang=it#ohm' }, sessionId);
    await sleep(1200);
    const primerAfterReload = await evalJS(`!document.getElementById('introOverlay')?.hidden`);
    console.log('primer after reload (should be false):', primerAfterReload);

    const booted = await evalJS(`(() => ({
      rails: document.querySelectorAll('.rail').length,
      parts: document.querySelectorAll('.part').length,
      title: document.querySelector('.lesson-title')?.textContent ?? '',
      fixture: document.querySelector('.nl-fixture-text')?.textContent ?? '',
      builderRows: document.querySelectorAll('.bd-row').length,
    }))()`);
    console.log('booted:', JSON.stringify(booted));

    // level 1: a correct answer at turbo → meter reads 20 mA, pass banner
    await setUser('R1 in gnd 450');
    await runTurbo();
    const after = await evalJS(`(() => ({
      status: document.querySelector('#statusLine')?.textContent ?? '',
      banner: document.querySelector('.banner')?.className ?? '',
      meter: [...document.querySelectorAll('.meter-digits')].map(e => e.textContent),
      railV: [...document.querySelectorAll('.rail-v')].map(e => e.textContent),
      checksOk: document.querySelectorAll('.check.ok').length,
      events: document.querilySelectorAll ? 0 : document.querySelectorAll('.evt-row').length,
      caseVerdicts: [...document.querySelectorAll('.case-row')].map(e => e.className.includes(' ok') ? 'ok' : e.className.includes('bad') ? 'bad' : '-'),
    }))()`);
    console.log('after run:', JSON.stringify(after));

    // the scope's empty state offers a one-click way in: .scope in + .tran 20m
    await evalJS(`document.querySelector('.scope-add[data-act="scope"]')?.click()`);
    await sleep(600);
    const scoped = await evalJS(`(() => ({ user: document.querySelector('.nl-input').value, legend: document.querySelector('.scope-legend')?.textContent ?? '', msgHidden: document.querySelector('.scope-msg')?.hidden }))()`);
    console.log('scope one-click:', JSON.stringify(scoped));

    // level 4: the starter burns the LED — the engine must say so
    await evalJS(`location.hash = '#led'`);
    await sleep(600);
    await setUser('R1 in out 47');
    await runTurbo();
    const burned = await evalJS(`(() => ({
      burned: document.querySelectorAll('.part.burned').length,
      banner: document.querySelector('.banner')?.className ?? '',
      burnEvt: [...document.querySelectorAll('.evt-row')].some(e => /BRUCIA|BURNS/.test(e.textContent)),
    }))()`);
    console.log('LED with 47 Ω:', JSON.stringify(burned));

    // level 14: probe by clicking a rail, then .replace the right part → pass, scope drawn
    await evalJS(`location.hash = '#fault-hum'`);
    await sleep(600);
    await setUser('.probe out');
    await runTurbo();
    const sick = await evalJS(`(() => ({
      banner: document.querySelector('.banner')?.className ?? '',
      meter: [...document.querySelectorAll('.meter-digits')].map(e => e.textContent),
      legend: document.querySelector('.scope-legend')?.textContent ?? '',
    }))()`);
    console.log('sick board:', JSON.stringify(sick));
    // click the `p` rail label → a .probe p line appears and the meter shows it
    await evalJS(`(() => { const lbl = [...document.querySelectorAll('.rail-label')].find(g => g.textContent.includes('p')); lbl?.dispatchEvent(new MouseEvent('click', {bubbles:true})); return true; })()`);
    await sleep(500);
    const probed = await evalJS(`(() => ({ user: document.querySelector('.nl-input').value, meters: document.querySelectorAll('.meter-digits').length }))()`);
    console.log('after clicking rail p:', JSON.stringify(probed));
    await setUser('.probe out\n.replace C1');
    await runTurbo();
    const healed = await evalJS(`(() => ({
      banner: document.querySelector('.banner')?.className ?? '',
      status: document.querySelector('#statusLine')?.textContent ?? '',
      found: [...document.querySelectorAll('.evt-row')].some(e => /guasto|faulty/.test(e.textContent)),
    }))()`);
    console.log('healed board:', JSON.stringify(healed));

    // language switch re-renders the chrome
    await evalJS(`document.querySelector('.lang-switch [data-lang="en"]').click()`);
    await sleep(300);
    const en = await evalJS(`(() => ({ run: document.getElementById('btnRun').textContent, title: document.querySelector('.lesson-title')?.textContent, url: location.search }))()`);
    console.log('EN:', JSON.stringify(en));

    // assertions
    const problems = [];
    if (!primer || !primer.open) problems.push('beginner primer did not auto-open on first visit');
    if (!primer || primer.headings < 4) problems.push('primer content did not render');
    if (primerAfterReload) problems.push('primer reopened despite introSeen flag');
    if (!booted || booted.rails < 2 || booted.parts < 2) problems.push('schematic not rendered');
    if (!booted || !booted.fixture.includes('V1')) problems.push('fixture not shown');
    if (!booted || booted.builderRows < 1) problems.push('builder did not list the user part');
    if (!after || !after.banner.includes('banner-pass')) problems.push('pass banner missing on level 1 (verify failed)');
    if (!after || !/20 mA/.test(after.meter.join(' '))) problems.push('meter did not read 20 mA');
    if (!after || !after.caseVerdicts.every((v) => v === 'ok')) problems.push('case verdicts not all ok');
    if (!scoped || !/\.scope in/.test(scoped.user) || !/\.tran 20m/.test(scoped.user) || !/CH1 in/.test(scoped.legend) || !scoped.msgHidden) problems.push('scope empty-state button did not add .scope/.tran');
    if (!burned || burned.burned < 1 || !burned.burnEvt) problems.push('LED did not burn with 47 Ω');
    if (!sick || !sick.banner.includes('banner-fail')) problems.push('sick board should fail');
    if (!sick || !/CH1/.test(sick.legend)) problems.push('scope legend missing');
    if (!probed || !/\.probe p/i.test(probed.user) || probed.meters < 2) problems.push('clicking a rail did not add a probe');
    if (!healed || !healed.banner.includes('banner-pass') || !healed.found) problems.push('.replace C1 did not heal the board');
    if (!en || en.run !== 'Run' || !/lang=en/.test(en.url)) problems.push('language switch to EN failed');
    if (errors.length) problems.push(...errors);

    if (problems.length) { console.error('\nFAIL:\n' + problems.map((p) => ' - ' + p).join('\n')); process.exitCode = 1; }
    else console.log('\nE2E OK');
  } finally {
    chrome.kill('SIGKILL');
  }
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
