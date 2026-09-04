// Measurements: what a multimeter and an oscilloscope would read off the
// final state. Levels express their goals through these (a voltage within a
// band, a ripple below a limit, a current inside a window), never through
// inspecting the netlist — a circuit passes because it WORKS, not because it
// looks like the reference.
//
// For a transient, readings are taken over the LAST part of the run (default:
// the second half), i.e. after the circuit has settled — like waiting for the
// trace to stabilize before reading the scope.

export function measure(state, { windowFrac = 0.5 } = {}) {
  const nodeIdx = new Map(state.nodes.map((n, i) => [n, i - 1]));
  const elIdx = new Map(state.elements.map((e, i) => [e.name, i]));
  const all = state.samples;
  const t0 = state.tran ? state.tran.stop * (1 - windowFrac) : 0;
  const win = all.length > 1 ? all.filter((s) => s.t >= t0 - 1e-12) : all;

  const nodeSeries = (node) => {
    const ni = nodeIdx.get(String(node).toLowerCase() === 'gnd' ? '0' : String(node).toLowerCase());
    if (ni === undefined) return null;
    return win.map((s) => (ni < 0 ? 0 : s.v[ni]));
  };
  const elSeries = (name, field) => {
    const k = elIdx.get(String(name).toLowerCase());
    if (k === undefined) return null;
    return win.map((s) => s[field][k]);
  };
  const times = win.map((s) => s.t);
  // Average over an INTEGER number of periods when the signal is periodic
  // (between the first and last rising crossing of its mean), so a 2.5-cycle
  // window does not bias the reading; min/max/pp use the whole window.
  const stats = (arr) => {
    if (!arr || !arr.length) return null;
    let min = Infinity; let max = -Infinity; let sum = 0;
    for (const x of arr) { if (x < min) min = x; if (x > max) max = x; sum += x; }
    let avg = sum / arr.length;
    if (arr.length > 8 && max - min > 1e-9) {
      const cross = [];
      for (let i = 1; i < arr.length; i++) {
        if (arr[i - 1] - avg < 0 && arr[i] - avg >= 0) cross.push(i);
      }
      if (cross.length >= 2) {
        const a = cross[0]; const b = cross[cross.length - 1];
        let s2 = 0; for (let i = a; i < b; i++) s2 += arr[i];
        avg = s2 / (b - a);
      }
    }
    return { min, max, avg, pp: max - min };
  };

  const m = {
    burned: (name) => !!state.elements[elIdx.get(String(name).toLowerCase())]?.burned,
    anyBurned: () => state.burned.length > 0,
    burnedList: () => [...state.burned],
    element: (name) => state.elements[elIdx.get(String(name).toLowerCase())] ?? null,
    replaced: () => state.elements.filter((e) => e.replaced).map((e) => e.name),
    // voltages
    vstats: (node) => stats(nodeSeries(node)),
    v: (node) => stats(nodeSeries(node))?.avg ?? null,
    vavg: (node) => stats(nodeSeries(node))?.avg ?? null,
    vmin: (node) => stats(nodeSeries(node))?.min ?? null,
    vmax: (node) => stats(nodeSeries(node))?.max ?? null,
    vpp: (node) => stats(nodeSeries(node))?.pp ?? null,
    // voltage at a given instant (nearest sample of the whole run)
    vAt: (node, t) => {
      const ni = nodeIdx.get(String(node).toLowerCase());
      if (ni === undefined || !all.length) return null;
      let best = all[0];
      for (const s of all) if (Math.abs(s.t - t) < Math.abs(best.t - t)) best = s;
      return ni < 0 ? 0 : best.v[ni];
    },
    // dominant frequency from rising zero-crossings of (v - avg)
    freq: (node) => {
      const arr = nodeSeries(node);
      if (!arr || arr.length < 4) return null;
      const avg = stats(arr).avg;
      const cross = [];
      for (let i = 1; i < arr.length; i++) {
        const a = arr[i - 1] - avg; const b = arr[i] - avg;
        if (a < 0 && b >= 0) cross.push(times[i - 1] + (times[i] - times[i - 1]) * (-a / (b - a)));
      }
      if (cross.length < 2) return 0;
      return (cross.length - 1) / (cross[cross.length - 1] - cross[0]);
    },
    // currents / powers
    istats: (name) => stats(elSeries(name, 'i')),
    i: (name) => stats(elSeries(name, 'i'))?.avg ?? null,
    iavg: (name) => stats(elSeries(name, 'i'))?.avg ?? null,
    imax: (name) => { const s = stats(elSeries(name, 'i')); return s ? Math.max(Math.abs(s.min), Math.abs(s.max)) : null; },
    p: (name) => stats(elSeries(name, 'p'))?.avg ?? null,
    pmax: (name) => stats(elSeries(name, 'p'))?.max ?? null,
    // the value the user gave a part (nominal), e.g. to check E12 or a rating
    value: (name) => state.elements[elIdx.get(String(name).toLowerCase())]?.nominal ?? null,
    window: { t0, samples: win.length },
  };
  return m;
}
