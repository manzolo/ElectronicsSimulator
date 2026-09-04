// Scrolling tape of the solver's events, localized at render time (the engine
// emits codes, never words). Same construction as EDU-SQL's event log.

import { t } from '../i18n.js';
import { formatValue } from '../core/units.js';

const MAX_ROWS = 600;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const up = (s) => esc(String(s).toUpperCase());
const fmtT = (s) => formatValue(s, 's');

export function createEventLog(container) {
  container.innerHTML = '<div class="evt-tape"></div>';
  const tape = container.querySelector('.evt-tape');
  let empty = true;

  function describe(evt) {
    switch (evt.type) {
      case 'solve': return evt.mode === 'dc'
        ? { cls: 'evt-phase', text: `▸ ${t('evtSolveDc')}` }
        : { cls: 'evt-phase', text: `▸ ${t('evtSolveTran', fmtT(evt.stop), fmtT(evt.dt))}` };
      case 'iterate': return { cls: 'evt-dim', text: t('evtIterate', evt.k, formatValue(evt.delta, 'V')) };
      case 'converge': return { cls: 'evt-pass', text: `✓ ${t('evtConverge', evt.k)}` };
      case 'settle': return { cls: 'evt-phase', text: t('evtSettle') };
      case 'tick': return { cls: 'evt-dim', text: t('evtTick', fmtT(evt.t)) };
      case 'conduct': return { cls: 'evt-pass', text: t('evtConduct', up(evt.comp), formatValue(evt.i, 'A')) };
      case 'cutoff': return { cls: 'evt-dim', text: t('evtCutoff', up(evt.comp)) };
      case 'zener_on': return { cls: 'evt-group', text: t('evtZener', up(evt.comp), formatValue(-evt.i, 'A')) };
      case 'saturate': return { cls: 'evt-pass', text: t('evtSaturate', up(evt.comp), formatValue(evt.i, 'A')) };
      case 'active': return { cls: 'evt-group', text: t('evtActive', up(evt.comp), formatValue(evt.i, 'A')) };
      case 'charge': return { cls: 'evt-sub', text: `↑ ${t('evtCharge', up(evt.comp))}` };
      case 'discharge': return { cls: 'evt-sub', text: `↓ ${t('evtDischarge', up(evt.comp))}` };
      case 'burn': return { cls: 'evt-drop', text: t(evt.kind === 'power' ? 'evtBurnPower' : 'evtBurnCurrent', up(evt.comp), formatValue(evt.value, evt.kind === 'power' ? 'W' : 'A'), formatValue(evt.limit, evt.kind === 'power' ? 'W' : 'A')) };
      case 'probe': return { cls: 'evt-result', text: evt.kind === 'v' ? t('evtProbeV', esc(evt.target), formatValue(evt.value, 'V')) : t('evtProbeI', up(evt.target), formatValue(evt.value, 'A')) };
      case 'fault_found': return { cls: 'evt-pass', text: t('evtFaultFound', up(evt.comp)) };
      case 'replace': return { cls: 'evt-unknown', text: t('evtReplace', up(evt.comp)) };
      case 'diverge': return { cls: 'evt-drop', text: `✗ ${t('evtDiverge')}` };
      case 'done': return { cls: 'evt-result', text: `■ ${t('evtDone', evt.ticks)}` };
      case 'error': return { cls: 'evt-drop', text: `✗ ${t(evt.code, ...(evt.args ?? []))}` };
      default: return null;
    }
  }

  function rowFor(evt) {
    const d = describe(evt);
    if (!d) return null;
    const row = document.createElement('div');
    row.className = `evt-row ${d.cls}`;
    row.innerHTML = `<span class="evt-time">${evt.time}</span><span>${d.text}</span>`;
    return row;
  }

  function append(evt) {
    const row = rowFor(evt);
    if (!row) return;
    if (empty) { tape.innerHTML = ''; empty = false; }
    const pinned = tape.scrollTop + tape.clientHeight >= tape.scrollHeight - 24;
    tape.appendChild(row);
    while (tape.childElementCount > MAX_ROWS) tape.firstElementChild.remove();
    if (pinned) tape.scrollTop = tape.scrollHeight;
  }

  function setAll(trace) {
    clear();
    for (const evt of trace) {
      const row = rowFor(evt);
      if (!row) continue;
      if (empty) { tape.innerHTML = ''; empty = false; }
      tape.appendChild(row);
    }
    while (tape.childElementCount > MAX_ROWS) tape.firstElementChild.remove();
    tape.scrollTop = tape.scrollHeight;
  }

  function clear() {
    tape.innerHTML = `<div class="tbl-empty">${t('evtEmpty')}</div>`;
    empty = true;
  }

  clear();
  return { append, setAll, clear };
}
