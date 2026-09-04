// The multimeter: one big amber readout per `.probe` — a node voltage or a
// part current — refreshed every frame from the live circuit.

import { t } from '../i18n.js';
import { formatValue } from '../core/units.js';

export function createMeter(container) {
  let probes = [];
  let cells = [];

  function render() {
    if (!probes.length) { container.innerHTML = `<div class="meter-empty">${t('meterEmpty')}</div>`; cells = []; return; }
    container.innerHTML = `<div class="meter">${probes.map((p) => `
      <div class="meter-cell">
        <div class="meter-label">${p.kind === 'v' ? `V(${p.node === '0' ? 'gnd' : p.node})` : `I(${p.comp.toUpperCase()})`}</div>
        <div class="meter-digits">—</div>
      </div>`).join('')}</div>`;
    cells = [...container.querySelectorAll('.meter-digits')];
  }

  return {
    setup(list) { probes = list ?? []; render(); },
    update(circuit) {
      probes.forEach((p, i) => {
        const cell = cells[i]; if (!cell) return;
        let v = null; let unit = 'V';
        if (p.kind === 'v') v = circuit.nodeVoltage(p.node);
        else { const el = circuit.byName.get(p.comp); v = el ? el.i : null; unit = 'A'; }
        const txt = v == null ? '—' : formatValue(v, unit);
        if (cell.textContent !== txt) cell.textContent = txt;
      });
    },
    clear() { probes = []; render(); },
    refresh: render,
  };
}
