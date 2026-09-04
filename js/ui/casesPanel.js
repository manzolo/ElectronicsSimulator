// The level's visible test cases. Each row is one set of board parameters the
// circuit is checked against; after a check it shows a live ✓/✗. Clicking a
// case loads it into the bench so you can watch your circuit run on it. The
// HIDDEN cases — different tolerances — are never shown: that is the
// anti-cheat (a value tuned to the visible case fails the hidden ones).

import { t, tr } from '../i18n.js';

export function createCasesPanel(container, { onPick } = {}) {
  let cases = [];
  let verdicts = new Map(); // index → bool
  let selected = 0;

  function render() {
    if (!cases.length) { container.innerHTML = ''; return; }
    const rows = cases.map((c, i) => {
      const v = verdicts.has(i) ? (verdicts.get(i) ? 'ok' : 'bad') : '';
      const mark = v === 'ok' ? '✓' : v === 'bad' ? '✗' : '';
      const label = c.label ? tr(c.label) : `${t('caseLabel')} ${String.fromCharCode(65 + i)}`;
      return `<button class="case-row ${v}${i === selected ? ' sel' : ''}" data-i="${i}">
        <span class="case-desc">${label}</span>
        <span class="case-mark">${mark}</span>
      </button>`;
    }).join('');
    container.innerHTML = `<div class="cases">${rows}</div><div class="cases-note">${t('casesNote')}</div>`;
    container.querySelectorAll('.case-row').forEach((el) => {
      el.addEventListener('click', () => { selected = +el.dataset.i; render(); onPick?.(selected); });
    });
  }

  return {
    showCases(visible) { cases = visible; verdicts = new Map(); selected = 0; render(); },
    setVerdicts(map) { verdicts = map; render(); },
    clear() { cases = []; verdicts = new Map(); render(); },
    refresh: render,
  };
}
