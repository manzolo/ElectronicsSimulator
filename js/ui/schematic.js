// The schematic — the signature canvas of EDU-ELN. Nodes are horizontal RAILS
// ordered by potential (highest on top, ground at the bottom); each part is a
// column hanging between its two rails. Potential literally becomes height,
// and current, like water, flows down through the parts. Wires take the
// colour of their voltage; "marching ants" along each part show the current
// (direction = sign, speed ∝ log|I|). Where a part's wire crosses a rail it
// is not connected to, it hops over it — no dot, no contact.
//
// Everything is drawn from the LIVE circuit on update(): rail colours and
// voltage labels, ant speed and direction, LED glow, burned parts. Clicking a
// rail or a part puts the probe on it (main.js adds the `.probe` line).

import { formatValue } from '../core/units.js';
import { describeValue } from './readings.js';

const SVG = 'http://www.w3.org/2000/svg';
const LABEL_W = 96;
const COL_W = 78;
const ROW_H = 54;
const TOP = 34;

function el(name, attrs = {}, text = null) {
  const n = document.createElementNS(SVG, name);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
}

// voltage → colour: green near zero, through amber to red for +, towards
// blue for −; grey for ground/zero.
export function colorOf(v, vref) {
  const t = Math.max(-1, Math.min(1, v / Math.max(1e-9, vref)));
  if (Math.abs(t) < 0.015) return 'hsl(150 12% 58%)';
  if (t > 0) return `hsl(${Math.round(150 - 140 * t)} 78% ${Math.round(62 - 8 * t)}%)`;
  return `hsl(${Math.round(150 + 60 * -t)} 70% 62%)`;
}

function antsDuration(i) {
  const a = Math.abs(i);
  if (a < 2e-7) return 0;
  const mag = Math.log10(1 + a / 1e-5);
  return Math.min(6, Math.max(0.15, 1.6 / Math.max(0.25, mag)));
}

// ---- symbols, drawn vertically, terminal 0 at (0,-14) and terminal 1 at (0,+14)

function symbol(g, e) {
  const add = (n) => g.appendChild(n);
  switch (e.type) {
    case 'R': add(el('rect', { x: -6, y: -14, width: 12, height: 28, class: 'sym-body' })); break;
    case 'C':
      add(el('line', { x1: 0, y1: -14, x2: 0, y2: -3, class: 'sym-lead' }));
      add(el('line', { x1: -9, y1: -3, x2: 9, y2: -3, class: 'sym-body' }));
      add(el('line', { x1: -9, y1: 3, x2: 9, y2: 3, class: 'sym-body' }));
      add(el('line', { x1: 0, y1: 3, x2: 0, y2: 14, class: 'sym-lead' }));
      break;
    case 'L':
      add(el('path', { d: 'M0 -14 v2 a4 4 0 0 1 0 8 a4 4 0 0 1 0 8 a4 4 0 0 1 0 8 v2', class: 'sym-body sym-coil' }));
      break;
    case 'V': case 'I': {
      add(el('line', { x1: 0, y1: -14, x2: 0, y2: -10, class: 'sym-lead' }));
      add(el('circle', { cx: 0, cy: 0, r: 10, class: 'sym-body' }));
      add(el('line', { x1: 0, y1: 10, x2: 0, y2: 14, class: 'sym-lead' }));
      if (e.type === 'I') add(el('path', { d: 'M0 6 L0 -6 M-3 -3 L0 -6 L3 -3', class: 'sym-mark' }));
      else if (e.kind === 'SIN') add(el('path', { d: 'M-6 0 q3 -6 6 0 t6 0', class: 'sym-mark' }));
      else if (e.kind === 'PULSE') add(el('path', { d: 'M-6 3 h3 v-6 h6 v6 h3', class: 'sym-mark' }));
      else if (e.kind === 'STEP') add(el('path', { d: 'M-6 3 h6 v-6 h6', class: 'sym-mark' }));
      else { add(el('line', { x1: -4, y1: -4, x2: 4, y2: -4, class: 'sym-mark' })); add(el('line', { x1: 0, y1: -8, x2: 0, y2: 0, class: 'sym-mark' })); add(el('line', { x1: -4, y1: 5, x2: 4, y2: 5, class: 'sym-mark' })); }
      break;
    }
    case 'D': {
      // anode at top (terminal 0), cathode bar at bottom
      add(el('line', { x1: 0, y1: -14, x2: 0, y2: -7, class: 'sym-lead' }));
      add(el('path', { d: 'M-8 -7 L8 -7 L0 7 Z', class: 'sym-body sym-fill' }));
      if (e.dev?.zener) add(el('path', { d: 'M-11 4 L-8 7 L8 7 L11 10', class: 'sym-body' }));
      else add(el('line', { x1: -8, y1: 7, x2: 8, y2: 7, class: 'sym-body' }));
      add(el('line', { x1: 0, y1: 7, x2: 0, y2: 14, class: 'sym-lead' }));
      if (e.dev?.led) {
        add(el('circle', { cx: 0, cy: 0, r: 15, class: 'led-glow' }));
        add(el('path', { d: 'M9 -6 l6 -6 M15 -12 l-3 0 l3 3 M12 -1 l6 -6 M18 -7 l-3 0 l3 3', class: 'sym-mark' }));
      }
      break;
    }
    case 'Q': {
      // collector top (terminal 0), emitter bottom (2), base from the left
      add(el('circle', { cx: 0, cy: 0, r: 12, class: 'sym-body' }));
      add(el('line', { x1: -4, y1: -7, x2: -4, y2: 7, class: 'sym-body sym-thick' }));
      add(el('line', { x1: -4, y1: -3, x2: 4, y2: -9, class: 'sym-body' }));
      add(el('line', { x1: 4, y1: -9, x2: 4, y2: -14, class: 'sym-lead' }));
      add(el('line', { x1: -4, y1: 3, x2: 4, y2: 9, class: 'sym-body' }));
      add(el('line', { x1: 4, y1: 9, x2: 4, y2: 14, class: 'sym-lead' }));
      add(el('path', { d: 'M1 9 L4 9 L4 6 Z', class: 'sym-body sym-fill' }));
      add(el('line', { x1: -12, y1: 0, x2: -4, y2: 0, class: 'sym-lead' }));
      break;
    }
    default: break;
  }
}

export function createSchematic(container, { onProbeNode, onProbeComp } = {}) {
  let svg = null;
  let circuit = null;
  let railY = new Map();   // node → y
  let vref = 1;
  let railEls = new Map(); // node → {path, label, dots:[]}
  let partEls = new Map(); // name → {g, ants, wire, led, lastDur, lastSign}
  let order = [];

  function clear() {
    container.innerHTML = '';
    svg = null; circuit = null; railEls = new Map(); partEls = new Map();
  }

  // rank: node names top→bottom (ground last); vrefIn: max |v| seen in a preview run
  function build(c, rank, vrefIn) {
    clear();
    circuit = c;
    order = rank;
    vref = Math.max(1, vrefIn ?? 1);
    const cols = c.elements.length;
    const W = LABEL_W + 24 + cols * COL_W + 40;
    const H = TOP + (rank.length - 1) * ROW_H + 40;
    svg = el('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sch-svg' });
    // small circuits must not blow up to poster size; big ones scale down to
    // fit and only scroll when they would become illegible
    svg.style.maxWidth = `${Math.round(W * 1.6)}px`;
    if (cols > 14) svg.style.minWidth = `${Math.round(W * 0.8)}px`;
    container.appendChild(svg);
    railY = new Map(rank.map((n, i) => [n, TOP + i * ROW_H]));
    const x0 = LABEL_W + 24;
    const xOf = (k) => x0 + (k + 0.5) * COL_W;

    // vertical wire segments, to compute hops: [{x, y1, y2, rails:Set(nodes touched)}]
    const verticals = [];
    c.elements.forEach((e, k) => {
      const x = xOf(k);
      const ys = e.nodes.map((n) => railY.get(n));
      if (e.type === 'Q') {
        const [yc, yb, ye] = ys;
        verticals.push({ x, y1: Math.min(yc, ye), y2: Math.max(yc, ye), rails: new Set([e.nodes[0], e.nodes[2]]) });
        const ym = (yc + ye) / 2;
        verticals.push({ x: x - 26, y1: Math.min(yb, ym), y2: Math.max(yb, ym), rails: new Set([e.nodes[1]]) });
      } else {
        verticals.push({ x, y1: Math.min(ys[0], ys[1]), y2: Math.max(ys[0], ys[1]), rails: new Set(e.nodes) });
      }
    });

    // rails (with hops where a foreign vertical crosses)
    const railGroup = el('g', { class: 'rails' });
    svg.appendChild(railGroup);
    for (const n of rank) {
      const y = railY.get(n);
      const hops = verticals.filter((v) => !v.rails.has(n) && v.y1 < y - 1 && v.y2 > y + 1).map((v) => v.x).sort((a, b) => a - b);
      let d = `M ${LABEL_W + 8} ${y}`;
      for (const hx of hops) d += ` L ${hx - 6} ${y} A 6 6 0 0 1 ${hx + 6} ${y}`;
      d += ` L ${W - 16} ${y}`;
      const path = el('path', { d, class: `rail${n === '0' ? ' rail-gnd' : ''}` });
      path.addEventListener('click', () => onProbeNode?.(n));
      railGroup.appendChild(path);
      const lg = el('g', { class: 'rail-label' });
      lg.addEventListener('click', () => onProbeNode?.(n));
      lg.appendChild(el('rect', { x: 4, y: y - 15, width: LABEL_W - 2, height: 30, rx: 5, class: 'rail-label-bg' }));
      lg.appendChild(el('text', { x: 10, y: y - 3, class: 'rail-name' }, n === '0' ? '⏚ gnd' : n));
      const vt = el('text', { x: 10, y: y + 10, class: 'rail-v' }, n === '0' ? '0 V' : '—');
      lg.appendChild(vt);
      railGroup.appendChild(lg);
      if (n === '0') {
        railGroup.appendChild(el('path', { d: `M ${W - 30} ${y} v8 m-8 0 h16 m-12 5 h8 m-6 5 h4`, class: 'rail-gnd-sym' }));
      }
      railEls.set(n, { path, label: vt, bg: lg.firstChild });
    }

    // parts
    const partGroup = el('g', { class: 'parts' });
    svg.appendChild(partGroup);
    c.elements.forEach((e, k) => {
      const x = xOf(k);
      const g = el('g', { class: `part part-${e.type}${e.fixture ? ' fx' : ' usr'}`, 'data-name': e.name });
      g.addEventListener('click', () => onProbeComp?.(e.name));
      const title = el('title', {}, `${e.name.toUpperCase()} · ${describeValue(e)}`);
      g.appendChild(title);
      let ya; let yb; let ym; let flip = false; let sym;
      if (e.type === 'Q') {
        const [yc, yb2, ye] = e.nodes.map((n) => railY.get(n));
        ya = yc; yb = ye; ym = (yc + ye) / 2; flip = yc > ye;
        // base lead: from symbol left to x-26, then vertical to the base rail
        const wireB = el('path', { d: `M ${x - 12} ${ym} H ${x - 26} V ${yb2}`, class: 'wire wire-b' });
        g.appendChild(wireB);
        g.appendChild(el('circle', { cx: x - 26, cy: yb2, r: 3.2, class: 'dot' }));
      } else {
        [ya, yb] = e.nodes.map((n) => railY.get(n));
        ym = (ya + yb) / 2; flip = ya > yb;
      }
      const top = Math.min(ya, yb); const bot = Math.max(ya, yb);
      if (Math.abs(ya - yb) < 1) { ym = ya; }
      // the two half-wires (coloured by their rail) and the symbol between
      const w1 = el('line', { x1: x, y1: ya, x2: x, y2: ym + (flip ? 14 : -14), class: 'wire' });
      const w2 = el('line', { x1: x, y1: ym + (flip ? -14 : 14), x2: x, y2: yb, class: 'wire' });
      g.appendChild(w1); g.appendChild(w2);
      sym = el('g', { class: 'sym', transform: `translate(${x} ${ym})${flip ? ' scale(1 -1)' : ''}` });
      symbol(sym, e);
      g.appendChild(sym);
      // marching ants: path from terminal a to terminal b (current > 0 flows a→b)
      const ants = el('path', { d: `M ${x} ${ya} L ${x} ${yb}`, class: 'ants' });
      g.appendChild(ants);
      g.appendChild(el('circle', { cx: x, cy: ya, r: 3.2, class: 'dot' }));
      g.appendChild(el('circle', { cx: x, cy: yb, r: 3.2, class: 'dot' }));
      // labels to the right of the symbol
      g.appendChild(el('text', { x: x + 18, y: ym - 3, class: 'part-name' }, e.name.toUpperCase()));
      g.appendChild(el('text', { x: x + 18, y: ym + 10, class: 'part-val' }, describeValue(e)));
      const burnMark = el('path', { d: `M ${x - 9} ${ym - 9} L ${x + 9} ${ym + 9} M ${x + 9} ${ym - 9} L ${x - 9} ${ym + 9}`, class: 'burn-mark' });
      g.appendChild(burnMark);
      if (e.replaced) g.appendChild(el('text', { x: x + 18, y: ym + 22, class: 'part-new' }, '✦ new'));
      partGroup.appendChild(g);
      partEls.set(e.name, { g, ants, w1, w2, led: e.dev?.led ? sym.querySelector('.led-glow') : null, lastDur: null, lastSign: 0, top, bot });
    });
    update();
  }

  function update() {
    if (!circuit || !svg) return;
    let maxAbs = 0;
    for (const n of order) maxAbs = Math.max(maxAbs, Math.abs(circuit.nodeVoltage(n)));
    const ref = Math.max(vref, maxAbs);
    const colorOfNode = new Map();
    for (const n of order) {
      const v = circuit.nodeVoltage(n);
      const col = colorOf(v, ref);
      colorOfNode.set(n, col);
      const r = railEls.get(n);
      if (!r) continue;
      r.path.style.stroke = col;
      if (n !== '0') {
        const txt = formatValue(v, 'V');
        if (r.label.textContent !== txt) r.label.textContent = txt;
        r.label.style.fill = col;
      }
    }
    for (const e of circuit.elements) {
      const p = partEls.get(e.name); if (!p) continue;
      p.w1.style.stroke = colorOfNode.get(e.nodes[0]);
      p.w2.style.stroke = colorOfNode.get(e.nodes[e.type === 'Q' ? 2 : 1]);
      const i = e.type === 'Q' ? e.ic : e.i;
      const dur = e.burned ? 0 : antsDuration(i);
      const sign = Math.sign(i);
      const qd = dur ? Math.round(dur * 20) / 20 : 0;
      if (qd !== p.lastDur || sign !== p.lastSign) {
        p.lastDur = qd; p.lastSign = sign;
        if (!qd) { p.ants.style.animationDuration = ''; p.ants.classList.remove('flow'); }
        else {
          p.ants.classList.add('flow');
          p.ants.style.animationDuration = `${qd}s`;
          p.ants.style.animationDirection = sign < 0 ? 'reverse' : 'normal';
        }
      }
      if (p.led) {
        const glow = Math.min(1, Math.max(0, i / (e.dev.imax * 0.6)));
        p.led.style.opacity = e.burned ? 0 : glow.toFixed(2);
      }
      const burned = p.g.classList.contains('burned');
      if (burned !== !!e.burned) p.g.classList.toggle('burned', !!e.burned);
    }
  }

  return {
    build,
    update,
    clear,
    refresh() { /* nothing language-dependent in the drawing */ },
  };
}
