// Readings per part: value, V, I, P and a stress bar that fills as the part
// approaches its limit (power rating, max current…). A burned part is flagged;
// a replaced part gets a "new" tag. Nominal values only — a hidden fault is
// hidden here too: you find it with the instruments, not in this table.

import { t } from '../i18n.js';
import { formatValue } from '../core/units.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

export function describeValue(el) {
  switch (el.type) {
    case 'R': return formatValue(el.nominal, 'Ω') + (el.params.rating && el.params.rating !== 0.25 ? ` · ${formatValue(el.params.rating, 'W')}` : '');
    case 'C': return formatValue(el.nominal, 'F');
    case 'L': return formatValue(el.nominal, 'H');
    case 'V':
      if (el.kind === 'SIN') return `~ ${formatValue(el.params.amp, 'V')} · ${formatValue(el.params.freq, 'Hz')}${el.params.offset ? ` +${formatValue(el.params.offset, 'V')}` : ''}`;
      if (el.kind === 'PULSE') return `⊓ ${formatValue(el.params.v1, 'V')}/${formatValue(el.params.v2, 'V')} · ${formatValue(el.params.freq, 'Hz')}`;
      if (el.kind === 'STEP') return `⌐ ${formatValue(el.params.v1, 'V')}→${formatValue(el.params.v2, 'V')}`;
      return `DC ${formatValue(el.nominal, 'V')}`;
    case 'I': return `DC ${formatValue(el.nominal, 'A')}`;
    case 'D': return el.dev?.zener ? `Zener ${formatValue(el.params.vz, 'V')}` : (el.dev?.label ?? el.model);
    case 'Q': return `${el.model}${el.dev?.bf ? ` β${el.dev.bf}` : ''}`;
    default: return '';
  }
}

// stress ∈ [0, 1+]: how close to the limit; null when the part has none
export function stressOf(el) {
  if (el.type === 'R') return { ratio: Math.abs(el.p) / el.params.rating, label: `${formatValue(el.params.rating, 'W')}` };
  if (el.type === 'D' && el.dev?.zener) return { ratio: Math.abs(el.p) / el.dev.pmax, label: formatValue(el.dev.pmax, 'W') };
  if (el.type === 'D') return { ratio: Math.abs(el.i) / el.dev.imax, label: formatValue(el.dev.imax, 'A') };
  if (el.type === 'Q') return { ratio: Math.max(el.ic / el.dev.icmax, el.p / el.dev.pmax), label: formatValue(el.dev.pmax, 'W') };
  return null;
}

export function createReadings(container) {
  let circuit = null;
  let rows = new Map();

  function build(c) {
    circuit = c;
    if (!c) { container.innerHTML = `<div class="tbl-empty">${t('readingsEmpty')}</div>`; rows = new Map(); return; }
    container.innerHTML = `<div class="net-screenbox"><table class="rd-grid">
      <thead><tr><th>${t('colPart')}</th><th>${t('colValue')}</th><th>${t('colV')}</th><th>${t('colI')}</th><th>${t('colP')}</th><th>${t('colStress')}</th></tr></thead>
      <tbody>${c.elements.map((el) => `<tr data-name="${esc(el.name)}" class="${el.fixture ? 'fx' : 'usr'}">
        <td class="rd-name">${esc(el.name.toUpperCase())}${el.replaced ? ` <span class="tag tag-new">${t('replacedTag')}</span>` : ''}<span class="tag tag-burn" hidden>${t('burnedTag')}</span></td>
        <td class="rd-val">${esc(describeValue(el))}</td>
        <td class="rd-v">—</td><td class="rd-i">—</td><td class="rd-p">—</td>
        <td class="rd-s">${stressOf(el) ? `<div class="stress" title="${stressOf(el).label}"><div class="stress-fill"></div></div>` : ''}</td>
      </tr>`).join('')}</tbody></table></div>`;
    rows = new Map([...container.querySelectorAll('tr[data-name]')].map((tr) => [tr.dataset.name, tr]));
  }

  function update() {
    if (!circuit) return;
    for (const el of circuit.elements) {
      const tr = rows.get(el.name); if (!tr) continue;
      const set = (cls, txt) => { const td = tr.querySelector(cls); if (td.textContent !== txt) td.textContent = txt; };
      set('.rd-v', formatValue(el.v, 'V'));
      set('.rd-i', formatValue(el.type === 'Q' ? el.ic : el.i, 'A'));
      set('.rd-p', formatValue(Math.abs(el.p), 'W'));
      const s = stressOf(el);
      if (s) {
        const fill = tr.querySelector('.stress-fill');
        const pct = Math.min(100, Math.round((el.burned ? 1 : s.ratio) * 100));
        fill.style.width = `${pct}%`;
        fill.classList.toggle('hot', s.ratio > 0.8);
      }
      const burnedNow = tr.classList.contains('burned');
      if (el.burned !== burnedNow) { tr.classList.toggle('burned', el.burned); tr.querySelector('.tag-burn').hidden = !el.burned; }
    }
  }

  return {
    build,
    update,
    clear() { build(null); },
    refresh() { const c = circuit; build(c); update(); },
  };
}
