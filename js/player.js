// Playback controller, reshaped from EDU-SQL's Player around the circuit Sim.
// Never touches the DOM. Time here is an integer TICK counter (one Newton iteration
// of the DC solve, or one time step of the transient), not sim-milliseconds, so there is nothing
// "in flight" between ticks and no dead-time to warp over — the mapping is
// simply: accumulate ticks·speed each animation frame and drain them.

export const SPEEDS = [0.01, 0.03, 0.1, 0.3, 1, 'turbo']; // ticks per wall-ms — a 1000-step transient at the default notch takes ~3 s

export class Player {
  constructor({ onEvents, onFrame, onHalt, onError, onRunState } = {}) {
    this.onEvents = onEvents || (() => {});
    this.onFrame = onFrame || (() => {});
    this.onHalt = onHalt || (() => {});
    this.onError = onError || (() => {});
    this.onRunState = onRunState || (() => {});
    this.sim = null;
    this.simNow = 0;
    this.speedIdx = 2;
    this._raf = null;
    this._lastWall = 0;
    this._reduced = typeof matchMedia !== 'undefined'
      && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  load(sim) {
    this.pause();
    this.sim = sim;
    this.simNow = 0;
  }

  get running() { return this._raf !== null; }

  get turbo() { return SPEEDS[this.speedIdx] === 'turbo'; }

  setSpeed(idx) {
    this.speedIdx = Math.max(0, Math.min(SPEEDS.length - 1, idx));
    if (this.running && this.turbo) {
      this.pause();
      this._runTurbo();
    }
  }

  play() {
    if (!this.sim || this.running || this.sim.halted || this.sim.error) return;
    if (this.turbo) { this._runTurbo(); return; }
    this._lastWall = performance.now();
    this.onRunState(true);
    const tick = (wall) => {
      this._raf = requestAnimationFrame(tick);
      const dt = Math.min(100, wall - this._lastWall);
      this._lastWall = wall;
      this.simNow += dt * SPEEDS[this.speedIdx];
      const events = this.sim.advanceTo(this.simNow);
      if (events.length) this.onEvents(events);
      if (!this._reduced || events.length) this.onFrame(this.simNow);
      if (this.sim.error) { this.pause(); this.onError(this.sim.error); return; }
      if (this.sim.halted) { this.pause(); this.onHalt(this.sim); }
    };
    this._raf = requestAnimationFrame(tick);
  }

  pause() {
    if (this._raf !== null) {
      cancelAnimationFrame(this._raf);
      this._raf = null;
      this.onRunState(false);
    }
  }

  stepOnce() {
    if (!this.sim || this.running || this.sim.halted || this.sim.error) return;
    const d = this.sim.stepOnce();
    if (d) {
      this.simNow = this.sim.now;
      if (d.events.length) this.onEvents(d.events);
      this.onFrame(this.simNow);
    }
    if (this.sim.error) this.onError(this.sim.error);
    else if (this.sim.halted) this.onHalt(this.sim);
  }

  _runTurbo() {
    this.onRunState(true);
    const CHUNK = 4000;
    const spin = () => {
      let n = 0;
      while (!this.sim.halted && !this.sim.error && n++ < CHUNK) {
        if (this.sim.stepOnce() === null) break;
      }
      if (!this.sim.halted && !this.sim.error) {
        this._raf = requestAnimationFrame(spin);
        return;
      }
      this._raf = null;
      this.simNow = this.sim.now;
      this.onRunState(false);
      this.onFrame(this.simNow);
      if (this.sim.error) this.onError(this.sim.error);
      else this.onHalt(this.sim);
    };
    this._raf = requestAnimationFrame(spin);
  }
}
