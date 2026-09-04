// ElnSim: the stepper. Same protocol as EDU-SQL's SqlSim and EDU-NN's sim —
// nextTime() / stepOnce() → {time, events} / advanceTo(t) / finalState(), with
// `halted`/`error` flags, a monotonic `now`, an increasing `seq`, and emit()
// fanning every event to the trace, the per-step batch and the onEvent hook.
//
// Two phases, both made of ticks:
//   dc   — one tick = ONE Newton-Raphson iteration of the operating point.
//          You literally watch the solver converge (iterate → converge).
//   tran — one tick = one time step dt of the transient (the inner Newton
//          loop runs to convergence inside the tick). Samples are recorded
//          for the oscilloscope and the measurements.
// A component that exceeds its limits emits `burn`, goes open, and the same
// instant is re-solved: the circuit after the smoke is a different circuit.
//
// This is the only lab in the series whose engine is numeric rather than
// symbolic — but it is just as deterministic: no Math.random, no Date.now.

export class ElnSim {
  constructor(circuit, { tran = null, budget = 60000 } = {}) {
    this.circuit = circuit;
    this.tran = tran ? { stop: tran.stop, dt: tran.dt } : null;
    if (this.tran) {
      const maxSteps = 4000;
      let dt = this.tran.dt ?? this.tran.stop / 1000;
      if (this.tran.stop / dt > maxSteps) dt = this.tran.stop / maxSteps;
      this.tran.dt = dt;
      this.tran.steps = Math.round(this.tran.stop / dt);
      this.tickEvery = Math.max(1, Math.floor(this.tran.steps / 40));
    }
    this.budget = budget;
    this.now = 0;
    this._seq = 0;
    this.trace = [];
    this.onEvent = null;
    this._batch = null;
    this.halted = false;
    this.error = null;
    this.phase = 'dc';
    this.iter = 0;
    this.t = 0;
    this.stepNo = 0;
    this.samples = [];
    this.burned = [];
    this._regimes = new Map();
    this._started = false;
  }

  get steps() { return this.now; }

  emit(event) {
    event.time = this.now;
    event.seq = this._seq++;
    this.trace.push(event);
    if (this._batch) this._batch.push(event);
    if (this.onEvent) this.onEvent(event);
    return event;
  }

  nextTime() {
    if (this.halted || this.error) return null;
    return this.now + 1;
  }

  _fail(code, args = []) {
    this.error = { code, args };
    this.emit({ type: 'error', code, args });
  }

  // Regime transitions (diode starts conducting, transistor saturates, cap
  // starts discharging…) become events only when they CHANGE.
  _emitRegimes(force = false) {
    for (const el of this.circuit.elements) {
      const r = this.circuit.regime(el);
      if (r === null) continue;
      const prev = this._regimes.get(el.name);
      if (force || prev !== r) {
        this._regimes.set(el.name, r);
        if (r !== 'burned' && r !== 'hold' && !(r === 'cutoff' && prev === undefined && !force)) {
          this.emit({ type: r, comp: el.name, i: el.i, v: el.v });
        }
      }
    }
  }

  _afterSolve(t, dt, mode) {
    // burn → re-solve the same instant with the part gone; repeat until stable
    for (let guard = 0; guard < this.circuit.elements.length + 1; guard++) {
      this.circuit.commit(t, dt, mode);
      const burned = this.circuit.checkBurn(mode, dt ?? 0, this.tran ? Math.min(0.05, this.tran.stop / 2) : 0.05);
      if (!burned.length) return true;
      for (const { el, why } of burned) {
        this.burned.push(el.name);
        this.emit({ type: 'burn', comp: el.name, kind: why.kind, value: why.value, limit: why.limit });
      }
      if (this.circuit.solveAt(t, dt, mode) < 0) { this._fail('errNoConverge'); return false; }
    }
    return true;
  }

  _record() {
    const c = this.circuit;
    const s = { t: this.t, v: Float64Array.from(c.v), i: new Float64Array(c.elements.length), p: new Float64Array(c.elements.length) };
    c.elements.forEach((el, k) => { s.i[k] = el.i; s.p[k] = el.p; });
    this.samples.push(s);
  }

  _finish() {
    const c = this.circuit;
    for (const p of c.directives.probes ?? []) {
      if (p.kind === 'v') this.emit({ type: 'probe', kind: 'v', target: p.node, value: c.nodeVoltage(p.node) });
      else { const el = c.byName.get(p.comp); if (el) this.emit({ type: 'probe', kind: 'i', target: el.name, value: el.i }); }
    }
    for (const el of c.elements) {
      if (el.replaced) this.emit({ type: el.wasFaulty ? 'fault_found' : 'replace', comp: el.name });
    }
    this.emit({ type: 'done', ticks: this.now, burned: this.burned.length, t: this.t });
    this.phase = 'done';
    this.halted = true;
  }

  stepOnce() {
    if (this.halted || this.error) return null;
    this._batch = [];
    this.now += 1;
    if (this.now > this.budget) { this._fail('errBudget'); return this._end(); }

    if (this.phase === 'dc') {
      if (!this._started) { this._started = true; this.emit({ type: 'solve', mode: 'dc' }); }
      this.iter += 1;
      const r = this.circuit.nrStep(0, null, 'dc');
      if (!r.ok) { this._fail('errSingular'); return this._end(); }
      this.emit({ type: 'iterate', k: this.iter, delta: r.delta });
      if (!r.limited && this.circuit.converged(r.delta)) {
        const before = this.burned.length;
        if (!this._afterSolve(0, null, 'dc')) return this._end();
        if (this.burned.length > before) {
          // something burned: keep iterating the DC point of the new circuit
          this.iter = 0;
          return this._end();
        }
        this.emit({ type: 'converge', k: this.iter });
        this._emitRegimes(true);
        this.t = 0;
        this._record();
        if (this.tran) {
          this.phase = 'tran';
          this.emit({ type: 'solve', mode: 'tran', stop: this.tran.stop, dt: this.tran.dt });
        } else {
          this.emit({ type: 'settle' });
          this._finish();
        }
      } else if (this.iter > 200) {
        this.emit({ type: 'diverge', k: this.iter });
        this._fail('errNoConverge');
      }
      return this._end();
    }

    if (this.phase === 'tran') {
      this.stepNo += 1;
      this.t = this.stepNo * this.tran.dt;
      const k = this.circuit.solveAt(this.t, this.tran.dt, 'tran');
      if (k < 0) { this._fail('errNoConverge'); return this._end(); }
      if (!this._afterSolve(this.t, this.tran.dt, 'tran')) return this._end();
      this._record();
      this._emitRegimes(false);
      if (this.stepNo % this.tickEvery === 0) this.emit({ type: 'tick', t: this.t, step: this.stepNo });
      if (this.stepNo >= this.tran.steps) { this.emit({ type: 'settle' }); this._finish(); }
      return this._end();
    }
    return this._end();
  }

  _end() {
    const events = this._batch;
    this._batch = null;
    return { time: this.now, events };
  }

  advanceTo(t) {
    const all = [];
    let n = this.nextTime();
    while (n !== null && n <= t) {
      const d = this.stepOnce();
      if (!d) break;
      all.push(...d.events);
      n = this.nextTime();
    }
    return all;
  }

  finalState() {
    const c = this.circuit;
    const elements = c.elements.map((el) => ({
      name: el.name, type: el.type, nodes: el.nodes, kind: el.kind, model: el.model,
      nominal: el.nominal, actual: el.actual, params: el.params, fixture: el.fixture,
      faulty: el.faulty, replaced: el.replaced, wasFaulty: !!el.wasFaulty, burned: el.burned, burn: el.burn ?? null,
      v: el.v, i: el.i, p: el.p, ic: el.ic, ib: el.ib, vce: el.vce, regime: c.regime(el),
    }));
    const op = {};
    for (const n of c.nodes) op[n] = c.nodeVoltage(n);
    return {
      time: this.now, steps: this.now, halted: this.halted, error: this.error, trace: this.trace,
      nodes: c.nodes, elements, v: op, samples: this.samples,
      tran: this.tran ? { stop: this.tran.stop, dt: this.tran.dt } : null,
      t: this.t, burned: [...this.burned],
      probes: c.directives.probes ?? [], scopes: c.directives.scopes ?? [], replaces: c.directives.replaces ?? [],
    };
  }
}

export function runToCompletion(sim) {
  while (!sim.halted && !sim.error) {
    if (sim.stepOnce() === null) break;
  }
  return { state: sim.finalState(), error: sim.error };
}
