// "Second opinion": export the current circuit to Paul Falstad's CircuitJS1
// (falstad.com/circuit) and open it there. Nothing is embedded — CircuitJS1
// is GPL, several megabytes, and a different engine: exactly the point. If the
// two simulators disagree, one of them is wrong, and the honest note in the
// footer says which one to suspect first.
//
// Format (verified against the CircuitJS1 sources, CircuitElm.dump() and each
// element's constructor): one element per line,
//   <type> x y x2 y2 flags <element-specific tokens>
// connections happen only where endpoints coincide, so the ladder layout of
// our schematic is reused: node rails as chains of wires between the columns
// that touch them, parts as vertical segments between two rails.

import { normNode } from '../core/netlist.js';

const COL0 = 224;   // x of the first column
const COLW = 112;
const ROW0 = 96;    // y of the top rail
const ROWH = 96;
const LABEL_X = 128;

const num = (x) => (Number.isFinite(x) ? Number(x.toPrecision(10)).toString() : '0');

// rank: node names top→bottom (ground last), same as the on-screen schematic
export function toFalstad(circuit, rank, { nominal = true } = {}) {
  const railY = new Map(rank.map((n, i) => [n, ROW0 + i * ROWH]));
  const touches = new Map(rank.map((n) => [n, new Set([LABEL_X + 32])])); // x's connected to each rail
  const lines = [];
  // header: flags, timestep, speed, current bar, voltage range, power bar, min timestep
  lines.push('$ 1 0.000005 10.20027730826997 50 5 43 5e-11');

  circuit.elements.forEach((e, k) => {
    const x = COL0 + k * COLW;
    const value = nominal ? e.nominal : e.actual;
    const y = (n) => railY.get(n);
    const touch = (n, xx) => touches.get(n).add(xx);
    const p = e.params ?? {};
    if (e.type === 'Q') {
      const [nc, nb, ne] = e.nodes;
      const yc = y(nc); const ye = y(ne);
      let ym = Math.round((yc + ye) / 2 / 16) * 16;
      if (Math.abs(yc - ye) < 48) ym = Math.min(yc, ye) + 16; // rails too close: park the symbol just below the upper one
      // base at (x-48, ym) → body towards (x, ym); NPN: collector at (x, ym-16), emitter at (x, ym+16)
      lines.push(`t ${x - 48} ${ym} ${x} ${ym} 0 1 0 0 ${num(e.dev?.bf ?? 100)} default`);
      if (yc !== ym - 16) lines.push(`w ${x} ${ym - 16} ${x} ${yc} 0`);
      if (ye !== ym + 16) lines.push(`w ${x} ${ym + 16} ${x} ${ye} 0`);
      if (y(nb) !== ym) lines.push(`w ${x - 48} ${ym} ${x - 48} ${y(nb)} 0`);
      touch(nc, x); touch(ne, x); touch(nb, x - 48);
      return;
    }
    const [n0, n1] = e.nodes;
    const y0 = y(n0); const y1 = y(n1);
    touch(n0, x); touch(n1, x);
    switch (e.type) {
      case 'R': lines.push(`r ${x} ${y0} ${x} ${y1} 0 ${num(value)}`); break;
      case 'C': lines.push(`c ${x} ${y0} ${x} ${y1} 0 ${num(value)} 0`); break;
      case 'L': lines.push(`l ${x} ${y0} ${x} ${y1} 0 ${num(value)} 0`); break;
      case 'V': {
        // stampVoltageSource(nodes[0], nodes[1], V): the (x2,y2) end is the + terminal
        // → draw from n- (terminal 1) to n+ (terminal 0)
        let wf = 0; let f = 40; let max = value; let bias = 0;
        if (e.kind === 'SIN') { wf = 1; f = p.freq; max = p.amp; bias = p.offset; }
        else if (e.kind === 'PULSE') { wf = 2; f = p.freq; max = (p.v1 - p.v2) / 2; bias = (p.v1 + p.v2) / 2; }
        else if (e.kind === 'STEP') { wf = 2; f = 0.25; max = (p.v1 - p.v2) / 2; bias = (p.v1 + p.v2) / 2; }
        lines.push(`v ${x} ${y1} ${x} ${y0} 0 ${wf} ${num(f)} ${num(max)} ${num(bias)} 0 0.5`);
        break;
      }
      case 'I': lines.push(`i ${x} ${y0} ${x} ${y1} 0 ${num(value)}`); break;
      case 'D': {
        if (e.dev?.zener) lines.push(`z ${x} ${y0} ${x} ${y1} 0 ${num(p.vz)}`);
        else if (e.dev?.led) lines.push(`162 ${x} ${y0} ${x} ${y1} 0 1 0 0 0.02`);
        else lines.push(`d ${x} ${y0} ${x} ${y1} 2 ${e.model === '1N4148' || e.model === 'SI' ? '1N4148' : 'default'}`);
        break;
      }
      default: break;
    }
  });

  // rails: labelled stub on the left, wire segments between consecutive touch points
  const xRight = COL0 + circuit.elements.length * COLW;
  for (const n of rank) {
    const yy = railY.get(n);
    const xs = [...touches.get(n)].sort((a, b) => a - b);
    if (n === '0') { xs.push(xRight); }
    for (let i = 1; i < xs.length; i++) if (xs[i] !== xs[i - 1]) lines.push(`w ${xs[i - 1]} ${yy} ${xs[i]} ${yy} 0`);
    if (n === '0') lines.push(`g ${xRight} ${yy} ${xRight} ${yy + 32} 0 0`);
    else lines.push(`207 ${LABEL_X + 32} ${yy} ${LABEL_X} ${yy} 0 ${normNode(n)}`);
  }
  return lines.join('\n');
}

export function falstadUrl(text) {
  return `https://www.falstad.com/circuit/circuitjs.html?cct=${encodeURIComponent(text)}`;
}
