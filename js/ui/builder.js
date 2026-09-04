// The graphical side of the netlist: one row per part the USER wrote, with
// editable value and nodes, plus "add" buttons for the allowed types. The
// text is the single source of truth (same discipline as EDU-NN's builder):
// main.js parses the editor and calls render(text) here under a muted flag;
// every edit here regenerates the part lines and hands the text back via
// onChange. Directive lines (.probe/.scope/.replace/.tran) and comments are
// preserved verbatim, in place.

import { t } from '../i18n.js';
import { parseNetlist } from '../core/netlist.js';
import { formatValue } from '../core/units.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
// 4700 → "4.7k", 1e-7 → "100n"; strings (as typed by the user) pass through
const fmt = (x) => (typeof x === 'string' ? x : formatValue(x).replace(/\s+/g, '').replace('µ', 'u'));

const TEMPLATES = {
  R: (n) => `R${n} in out 1k`,
  C: (n) => `C${n} out gnd 100n`,
  L: (n) => `L${n} in out 10m`,
  V: (n) => `V${n} in gnd DC 9`,
  D: (n) => `D${n} in out SI`,
  Q: (n) => `Q${n} c b gnd NPN`,
};

function lineOf(el) {
  const nodes = el.nodes.map((n) => (n === '0' ? 'gnd' : n)).join(' ');
  const name = el.name.toUpperCase();
  switch (el.type) {
    case 'R': return `${name} ${nodes} ${fmt(el.value)}${el.params.rating && el.params.rating !== 0.25 ? ` ${fmt(el.params.rating)}W` : ''}`;
    case 'C': case 'L': return `${name} ${nodes} ${fmt(el.value)}`;
    case 'V': case 'I':
      if (el.kind === 'SIN') return `${name} ${nodes} SIN ${fmt(el.params.offset)} ${fmt(el.params.amp)} ${fmt(el.params.freq)}`;
      if (el.kind === 'PULSE') return `${name} ${nodes} PULSE ${fmt(el.params.v1)} ${fmt(el.params.v2)} ${fmt(el.params.freq)}`;
      if (el.kind === 'STEP') return `${name} ${nodes} STEP ${fmt(el.params.v1)} ${fmt(el.params.v2)} ${fmt(el.params.t0)}`;
      return `${name} ${nodes} DC ${fmt(el.value)}`;
    case 'D': return `${name} ${nodes} ${el.model}${el.model === 'ZENER' ? ` ${fmt(el.params.vz ?? 5.1)}` : ''}`;
    case 'Q': return `${name} ${nodes} ${el.model}${el.params.bf ? ` ${fmt(el.params.bf)}` : ''}`;
    default: return '';
  }
}

export function createBuilder(container, { onChange } = {}) {
  let text = '';
  let parsed = null;
  let allowed = null; // null = everything (sandbox)
  let invalid = false;

  const num = (name, v, cls = 'bd-val bd-sm') => `<input class="${cls}" data-f="${name}" value="${esc(fmt(v))}">`;

  function valueField(el) {
    if (el.type === 'R' || el.type === 'C' || el.type === 'L') return num('value', el.value, 'bd-val');
    if (el.type === 'V' || el.type === 'I') {
      if (el.kind === 'SIN') return `SIN ${num('offset', el.params.offset)}${num('amp', el.params.amp)}${num('freq', el.params.freq)}`;
      if (el.kind === 'PULSE') return `PULSE ${num('v1', el.params.v1)}${num('v2', el.params.v2)}${num('freq', el.params.freq)}`;
      if (el.kind === 'STEP') return `STEP ${num('v1', el.params.v1)}${num('v2', el.params.v2)}${num('t0', el.params.t0)}`;
      return `DC ${num('value', el.value, 'bd-val')}`;
    }
    if (el.type === 'D') {
      const opts = ['SI', '1N4007', 'LED', 'SCHOTTKY', 'ZENER'].map((m) => `<option${m === el.model ? ' selected' : ''}>${m}</option>`).join('');
      return `<select class="bd-val" data-f="model">${opts}</select>${el.model === 'ZENER' ? num('vz', el.params.vz) : ''}`;
    }
    if (el.type === 'Q') return `NPN β ${num('bf', el.params.bf ?? 100)}`;
    return '';
  }

  function render() {
    const els = parsed?.elements ?? [];
    const types = allowed ?? ['R', 'C', 'L', 'V', 'D', 'Q'];
    const rows = els.map((el, i) => `
      <div class="bd-row" data-i="${i}">
        <span class="bd-name">${esc(el.name.toUpperCase())}</span>
        <span class="bd-nodes">${el.nodes.map((n, k) => `<input class="bd-node" data-f="node" data-k="${k}" value="${esc(n === '0' ? 'gnd' : n)}" title="${t('builderNodes')}">`).join('')}</span>
        <span class="bd-value">${valueField(el)}</span>
        <button class="btn btn-ghost bd-del" title="${t('builderRemove')}">✕</button>
      </div>`).join('');
    container.innerHTML = `<div class="bd${invalid ? ' bd-invalid' : ''}">
      ${els.length ? rows : `<div class="tbl-empty">${t('builderEmpty')}</div>`}
      ${types.length ? `<div class="bd-adds">${types.map((ty) => `<button class="btn btn-ghost bd-add" data-type="${ty}">+ ${ty}</button>`).join('')}</div>` : ''}
      <div class="bd-note">${t('builderDirectives')}</div>
    </div>`;
    if (!invalid) bind();
  }

  // Rewrite the part lines in place; everything else stays where it was.
  function regenerate(els) {
    const lines = text.split('\n');
    const original = parsed?.elements ?? [];
    const byLine = new Map(els.map((e) => [e.line, e]));
    const out = [];
    for (let i = 0; i < lines.length; i++) {
      if (!original.some((e) => e.line === i)) { out.push(lines[i]); continue; }
      const el = byLine.get(i);
      if (el) out.push(lineOf(el));
    }
    onChange?.(out.join('\n').replace(/\n{3,}/g, '\n\n'));
  }

  function bind() {
    const els = (parsed?.elements ?? []).map((e) => ({ ...e, params: { ...e.params }, nodes: [...e.nodes] }));
    container.querySelectorAll('.bd-row').forEach((row) => {
      const el = els[+row.dataset.i];
      row.querySelectorAll('[data-f]').forEach((inp) => {
        inp.addEventListener('change', () => {
          const f = inp.dataset.f; const v = inp.value.trim();
          if (f === 'node') el.nodes[+inp.dataset.k] = v.toLowerCase() === 'gnd' ? '0' : v.toLowerCase();
          else if (f === 'value') el.value = v;
          else if (f === 'model') { el.model = v; if (v === 'ZENER' && el.params.vz == null) el.params.vz = 5.1; }
          else el.params[f] = v;
          regenerate(els);
        });
      });
      row.querySelector('.bd-del').addEventListener('click', () => { els.splice(+row.dataset.i, 1); regenerate(els); });
    });
    container.querySelectorAll('.bd-add').forEach((b) => {
      b.addEventListener('click', () => {
        const ty = b.dataset.type;
        const names = new Set(els.map((e) => e.name));
        let n = 1;
        while (names.has(`${ty.toLowerCase()}${n}`)) n += 1;
        const line = TEMPLATES[ty](n);
        onChange?.(text.trim() ? `${text.replace(/\s+$/, '')}\n${line}` : line);
      });
    });
  }

  return {
    // called by main.js after every editor change (muted by construction:
    // rendering never emits onChange)
    render(userText, allowedTypes) {
      text = userText ?? '';
      allowed = allowedTypes ?? null;
      parsed = parseNetlist(text);
      invalid = false;
      render();
    },
    setInvalid() { invalid = true; render(); },
    refresh: render,
  };
}
