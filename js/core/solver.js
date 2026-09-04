// The circuit solver: Modified Nodal Analysis with Newton-Raphson.
//
// Unknowns are the node voltages (ground excluded) plus one current per
// voltage source. Every element STAMPS its linearized contribution into the
// matrix G and the right-hand side: a resistor is a conductance; a capacitor
// or inductor in a transient step becomes its backward-Euler "companion" (a
// conductance plus a current source that remembers the previous step); a
// diode or transistor is linearized around the current guess (conductance +
// current source), and the whole thing is iterated until the guess stops
// moving — that IS Newton-Raphson. Junction voltages are limited between
// iterations (SPICE's pnjlim) so an exponential cannot run away.
//
// Sign convention, used everywhere: I_t is the current flowing FROM node t
// INTO the element. KCL says the sum over elements at a node is zero; the
// resistor stamp G[a][a] += g, G[a][b] -= g follows directly.
//
// No randomness, no clock: same netlist ⇒ same numbers, always.

import { VT, DIODE_MODELS, BJT_MODELS } from './models.js';

const GMIN = 1e-12;        // leak from every node to ground: keeps floating nodes solvable
const G_SHORT = 1e3;       // a "short" (shorted part, inductor at DC) is 1 mΩ
const VNTOL = 1e-6;
const RELTOL = 1e-3;
const MAX_EXP = 80;

const clampExp = (x) => Math.exp(Math.min(x, MAX_EXP));

// SPICE's junction limiting: never let a p-n voltage jump more than the
// exponential can bear in one iteration.
function pnjlim(vnew, vold, vt, vcrit) {
  if (vnew > vcrit && Math.abs(vnew - vold) > vt + vt) {
    if (vold > 0) {
      const arg = 1 + (vnew - vold) / vt;
      vnew = arg > 0 ? vold + vt * Math.log(arg) : vcrit;
    } else {
      vnew = vt * Math.log(vnew / vt);
    }
    return { v: vnew, limited: true };
  }
  return { v: vnew, limited: false };
}

// Dense Gaussian elimination with partial pivoting. Sizes here are tiny
// (a dozen unknowns), so clarity beats cleverness.
function gauss(A, b) {
  const n = b.length;
  for (let col = 0; col < n; col++) {
    let piv = col; let best = Math.abs(A[col][col]);
    for (let r = col + 1; r < n; r++) { const a = Math.abs(A[r][col]); if (a > best) { best = a; piv = r; } }
    if (best < 1e-300) return null; // singular
    if (piv !== col) { [A[col], A[piv]] = [A[piv], A[col]]; [b[col], b[piv]] = [b[piv], b[col]]; }
    const inv = 1 / A[col][col];
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] * inv;
      if (f === 0) continue;
      const Ar = A[r]; const Ac = A[col];
      for (let c = col; c < n; c++) Ar[c] -= f * Ac[c];
      b[r] -= f * b[col];
    }
  }
  const x = new Float64Array(n);
  for (let r = n - 1; r >= 0; r--) {
    let s = b[r];
    for (let c = r + 1; c < n; c++) s -= A[r][c] * x[c];
    x[r] = s / A[r][r];
  }
  return x;
}

// The instantaneous value of a source at time t.
export function sourceValue(el, t) {
  switch (el.kind) {
    case 'SIN': return el.params.offset + el.params.amp * Math.sin(2 * Math.PI * el.params.freq * t);
    case 'PULSE': { const ph = (t * el.params.freq) % 1; return ph < 0.5 - 1e-12 ? el.params.v1 : el.params.v2; }
    case 'STEP': return t <= el.params.t0 + 1e-15 ? el.params.v1 : el.params.v2;
    default: return el.actual ?? el.value;
  }
}

export class Circuit {
  // parsed: { elements, directives } from netlist.js
  // faults: { name: { kind: 'value'|'open'|'short', value? } } — the hidden defect of a fault level
  constructor(parsed, { faults = {} } = {}) {
    const replaced = new Set((parsed.directives?.replaces ?? []).map((r) => r.comp));
    this.nodes = ['0'];
    for (const e of parsed.elements) for (const n of e.nodes) if (!this.nodes.includes(n)) this.nodes.push(n);
    this.idx = new Map(this.nodes.map((n, i) => [n, i - 1])); // ground → -1
    this.N = this.nodes.length - 1;

    this.elements = parsed.elements.map((e) => {
      const el = {
        name: e.name, type: e.type, nodes: e.nodes, ni: e.nodes.map((n) => this.idx.get(n)),
        kind: e.kind ?? null, model: e.model ?? null, params: { ...e.params },
        nominal: e.value ?? null, actual: e.value ?? null,
        fixture: !!e.fixture, line: e.line,
        faulty: false, fault: null, replaced: false, burned: false, open: false, short: false,
        // runtime state
        vj: 0, vbe: 0, vbc: 0, vprev: 0, iprev: 0,
        i: 0, v: 0, p: 0, ib: 0, ic: 0, state: null,
      };
      if (el.type === 'D') el.dev = DIODE_MODELS[el.model];
      if (el.type === 'Q') el.dev = { ...BJT_MODELS[el.model], ...(el.params.bf ? { bf: el.params.bf } : {}) };
      const f = faults[el.name];
      if (f && !replaced.has(el.name)) {
        el.faulty = true; el.fault = f.kind;
        if (f.kind === 'value') el.actual = f.value;
        if (f.kind === 'open') el.open = true;
        if (f.kind === 'short') el.short = true;
      }
      if (replaced.has(el.name)) { el.replaced = true; el.wasFaulty = !!f; }
      return el;
    });
    this.byName = new Map(this.elements.map((e) => [e.name, e]));
    this.vsrcs = this.elements.filter((e) => e.type === 'V');
    this.vsrcs.forEach((e, j) => { e.k = this.N + j; });
    this.size = this.N + this.vsrcs.length;
    this.v = new Float64Array(this.N); // node voltages (current guess / last solution)
    this.directives = parsed.directives;
  }

  // ---------------------------------------------------------------- stamping

  _stampG(G, a, b, g) {
    if (a >= 0) G[a][a] += g;
    if (b >= 0) G[b][b] += g;
    if (a >= 0 && b >= 0) { G[a][b] -= g; G[b][a] -= g; }
  }

  // A current `i` flowing from node a through the element to node b.
  _stampI(rhs, a, b, i) {
    if (a >= 0) rhs[a] -= i;
    if (b >= 0) rhs[b] += i;
  }

  _junction(el, vj) {
    const { is, n } = el.dev;
    const nvt = n * VT;
    const ex = clampExp(vj / nvt);
    let i = is * (ex - 1);
    let g = (is / nvt) * ex;
    if (el.dev.zener) {
      // reverse knee: Izt flows at exactly -Vz, exponential beyond
      const u = -(vj + el.params.vz);
      const er = clampExp(u / VT);
      const ir = el.dev.izt * er;
      i -= ir;
      g += (el.dev.izt / VT) * er;
    }
    return { i, g };
  }

  _bjt(el) {
    const { is, bf, br } = el.dev;
    const ebe = clampExp(el.vbe / VT);
    const ebc = clampExp(el.vbc / VT);
    const icc = is * (ebe - 1);
    const iec = is * (ebc - 1);
    const gbe = (is / VT) * ebe;
    const gbc = (is / VT) * ebc;
    const ic = icc - iec * (1 + 1 / br);
    const ib = icc / bf + iec / br;
    return { ic, ib, gbe, gbc };
  }

  assemble(t, dt, mode) {
    const n = this.size;
    const G = Array.from({ length: n }, () => new Float64Array(n));
    const rhs = new Float64Array(n);
    for (let i = 0; i < this.N; i++) G[i][i] += GMIN;

    for (const el of this.elements) {
      if (el.burned || el.open) continue;
      const [a, b, c] = el.ni;
      switch (el.type) {
        case 'R': this._stampG(G, a, b, el.short ? G_SHORT : 1 / el.actual); break;
        case 'C':
          if (el.short) { this._stampG(G, a, b, G_SHORT); break; }
          if (mode === 'tran') {
            const geq = el.actual / dt;
            this._stampG(G, a, b, geq);
            this._stampI(rhs, a, b, -geq * el.vprev);
          }
          break;
        case 'L':
          if (mode === 'tran') {
            const geq = dt / el.actual;
            this._stampG(G, a, b, geq);
            this._stampI(rhs, a, b, el.iprev);
          } else this._stampG(G, a, b, G_SHORT);
          break;
        case 'V': {
          const k = el.k;
          if (a >= 0) { G[a][k] += 1; G[k][a] += 1; }
          if (b >= 0) { G[b][k] -= 1; G[k][b] -= 1; }
          rhs[k] = sourceValue(el, t);
          break;
        }
        case 'I': this._stampI(rhs, a, b, sourceValue(el, t)); break;
        case 'D': {
          const { i, g } = this._junction(el, el.vj);
          const ieq = i - g * el.vj;
          this._stampG(G, a, b, g);
          this._stampI(rhs, a, b, ieq);
          break;
        }
        case 'Q': {
          const { ic, ib, gbe, gbc } = this._bjt(el);
          const br1 = 1 + 1 / el.dev.br;
          // Jacobian rows for the collector and base currents (into the element)
          const Jc = [gbc * br1, gbe - gbc * br1, -gbe];
          const Jb = [-gbc / el.dev.br, gbe / el.dev.bf + gbc / el.dev.br, -gbe / el.dev.bf];
          const Je = [-(Jc[0] + Jb[0]), -(Jc[1] + Jb[1]), -(Jc[2] + Jb[2])];
          const rc = gbe * el.vbe - gbc * br1 * el.vbc - ic;
          const rb = (gbe / el.dev.bf) * el.vbe + (gbc / el.dev.br) * el.vbc - ib;
          const re = -(rc + rb);
          const rows = [[a, Jc, rc], [b, Jb, rb], [c, Je, re]];
          for (const [ti, J, r] of rows) {
            if (ti < 0) continue;
            for (let u = 0; u < 3; u++) if (el.ni[u] >= 0) G[ti][el.ni[u]] += J[u];
            rhs[ti] += r;
          }
          break;
        }
        default: break;
      }
    }
    return { G, rhs };
  }

  // One Newton-Raphson iteration at time t. Returns {delta, limited, ok}.
  nrStep(t, dt, mode) {
    const { G, rhs } = this.assemble(t, dt, mode);
    const x = gauss(G, rhs);
    if (!x || x.some((q) => !Number.isFinite(q))) return { ok: false, delta: Infinity, limited: false };
    let delta = 0;
    for (let i = 0; i < this.N; i++) {
      const d = Math.abs(x[i] - this.v[i]);
      if (d > delta) delta = d;
      this.v[i] = x[i];
    }
    this.x = x;
    let limited = false;
    const vOf = (ni) => (ni < 0 ? 0 : x[ni]);
    for (const el of this.elements) {
      if (el.burned || el.open) continue;
      if (el.type === 'D') {
        const vcrit = el.dev.n * VT * Math.log((el.dev.n * VT) / (Math.SQRT2 * el.dev.is));
        const raw = vOf(el.ni[0]) - vOf(el.ni[1]);
        const lim = pnjlim(raw, el.vj, el.dev.n * VT, vcrit);
        // reverse side of a zener: same limiting on the mirrored variable
        if (el.dev.zener && raw < 0) {
          const u = -(raw + el.params.vz);
          const uold = -(el.vj + el.params.vz);
          const l2 = pnjlim(u, uold, VT, VT * Math.log(VT / (Math.SQRT2 * el.dev.izt)));
          el.vj = -(l2.v + el.params.vz);
          if (l2.limited) limited = true;
        } else {
          el.vj = lim.v;
          if (lim.limited) limited = true;
        }
      } else if (el.type === 'Q') {
        const vcrit = VT * Math.log(VT / (Math.SQRT2 * el.dev.is));
        const vbe = vOf(el.ni[1]) - vOf(el.ni[2]);
        const vbc = vOf(el.ni[1]) - vOf(el.ni[0]);
        const l1 = pnjlim(vbe, el.vbe, VT, vcrit);
        const l2 = pnjlim(vbc, el.vbc, VT, vcrit);
        el.vbe = l1.v; el.vbc = l2.v;
        if (l1.limited || l2.limited) limited = true;
      }
    }
    return { ok: true, delta, limited };
  }

  converged(delta) {
    let vmax = 0;
    for (let i = 0; i < this.N; i++) vmax = Math.max(vmax, Math.abs(this.v[i]));
    return delta < VNTOL + RELTOL * vmax;
  }

  // Full solve at one time point (used inside transient steps). Returns the
  // number of iterations, or -1 if it did not converge.
  solveAt(t, dt, mode, maxIter = 100) {
    for (let k = 1; k <= maxIter; k++) {
      const r = this.nrStep(t, dt, mode);
      if (!r.ok) return -1;
      if (!r.limited && this.converged(r.delta)) return k;
    }
    return -1;
  }

  // Compute every element's v / i / p from the last solution and (in a
  // transient) advance the capacitor/inductor memories to this time point.
  commit(t, dt, mode) {
    const x = this.x;
    const vOf = (ni) => (ni < 0 ? 0 : x[ni]);
    for (const el of this.elements) {
      const [a, b, c] = el.ni;
      const vab = vOf(a) - vOf(b);
      el.v = vab;
      if (el.burned || el.open) { el.i = 0; el.p = 0; el.ic = 0; el.ib = 0; continue; }
      switch (el.type) {
        case 'R': el.i = el.short ? vab * G_SHORT : vab / el.actual; el.p = vab * el.i; break;
        case 'C':
          if (el.short) el.i = vab * G_SHORT;
          else el.i = mode === 'tran' ? (el.actual / dt) * (vab - el.vprev) : 0;
          el.p = vab * el.i;
          el.vprev = vab; // the transient starts from the operating point
          break;
        case 'L':
          el.i = mode === 'tran' ? el.iprev + (dt / el.actual) * vab : vab * G_SHORT;
          el.p = vab * el.i;
          el.iprev = el.i;
          break;
        case 'V': el.i = -x[el.k]; el.p = vab * el.i; el.vsrc = sourceValue(el, t); break; // delivered
        case 'I': el.i = sourceValue(el, t); el.p = -vab * el.i; break;
        case 'D': { el.vj = vab; const { i } = this._junction(el, vab); el.i = i; el.p = vab * i; break; }
        case 'Q': {
          el.vbe = vOf(b) - vOf(c); el.vbc = vOf(b) - vOf(a);
          const { ic, ib } = this._bjt(el);
          el.ic = ic; el.ib = ib; el.i = ic; el.vce = vOf(a) - vOf(c);
          el.p = el.vce * ic + el.vbe * ib;
          break;
        }
        default: break;
      }
    }
  }

  // Elements that just exceeded their limits. Marks them burned (open) and
  // returns the list, so the caller can re-solve the same instant.
  //
  // Parts have thermal inertia: in a transient the stress (power, or current
  // for a diode) is low-pass filtered with time constant `tau` before it is
  // compared with the limit, so a few milliseconds of inrush do not kill a
  // rectifier while a steady overload still does. At the DC operating point
  // the comparison is instantaneous.
  checkBurn(mode = 'dc', dt = 0, tau = 0.05) {
    const burned = [];
    const alpha = mode === 'tran' ? Math.min(1, dt / tau) : 1;
    for (const el of this.elements) {
      if (el.burned || el.open) continue;
      let stress = null; let limit = null; let kind = 'power';
      if (el.type === 'R') { stress = el.p; limit = el.params.rating; }
      else if (el.type === 'D' && el.dev.zener) { stress = el.p; limit = el.dev.pmax; }
      else if (el.type === 'D') { stress = Math.abs(el.i); limit = el.dev.imax; kind = 'current'; }
      else if (el.type === 'Q') {
        if (el.ic / el.dev.icmax > el.p / el.dev.pmax) { stress = el.ic; limit = el.dev.icmax; kind = 'current'; } else { stress = el.p; limit = el.dev.pmax; }
      }
      if (stress === null) continue;
      el.therm = (el.therm ?? 0) + (stress - (el.therm ?? 0)) * alpha;
      if (el.therm > limit * 1.0001) {
        el.burned = true; el.burn = { kind, value: el.therm, limit };
        burned.push({ el, why: el.burn });
      }
    }
    return burned;
  }

  // A language-neutral description of each nonlinear element's regime, for
  // the event stream: conduct/cutoff (diodes), zener_on, off/active/saturate.
  regime(el) {
    const I_ON = 5e-5;
    if (el.burned) return 'burned';
    if (el.type === 'D') {
      if (el.dev.zener && el.i < -I_ON) return 'zener_on';
      return el.i > I_ON ? 'conduct' : 'cutoff';
    }
    if (el.type === 'Q') {
      if (el.ic < I_ON) return 'cutoff';
      return el.vce < 0.3 ? 'saturate' : 'active';
    }
    if (el.type === 'C') {
      if (el.i > 1e-6) return 'charge';
      if (el.i < -1e-6) return 'discharge';
      return 'hold';
    }
    return null;
  }

  nodeVoltage(name) {
    const ni = this.idx.get(name);
    if (ni === undefined) return null;
    return ni < 0 ? 0 : this.v[ni];
  }
}
