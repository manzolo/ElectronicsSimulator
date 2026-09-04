import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runHeadless, buildRun } from '../js/core/engine.js';
import { runToCompletion } from '../js/core/sim.js';
import { measure } from '../js/core/metrics.js';
import { parseNetlist } from '../js/core/netlist.js';
import { parseValue, formatValue, isE12 } from '../js/core/units.js';

const run = (user, fixture = '', extra = {}) => {
  const r = runHeadless({ fixture, user, ...extra });
  assert.equal(r.errors, undefined, `unexpected parse error: ${JSON.stringify(r.errors)}`);
  assert.equal(r.error, null, `unexpected sim error: ${JSON.stringify(r.error)}`);
  return { m: measure(r.state), state: r.state };
};
const near = (got, want, tol, msg) => assert.ok(Math.abs(got - want) <= tol, `${msg}: got ${got}, want ${want} ± ${tol}`);

test('units: engineering suffixes, m/M distinction, trailing unit letters', () => {
  assert.equal(parseValue('4.7k'), 4700);
  assert.equal(parseValue('100n'), 1e-7);
  assert.equal(parseValue('1meg'), 1e6);
  assert.equal(parseValue('1M'), 1e6);
  assert.equal(parseValue('2m'), 0.002);
  assert.equal(parseValue('1kΩ'), 1000);
  assert.equal(parseValue('0.25W'), 0.25);
  assert.equal(parseValue('abc'), null);
  assert.equal(formatValue(0.01364, 'A'), '13.6 mA');
  assert.equal(formatValue(4700, 'Ω'), '4.7 kΩ');
  assert.ok(isE12(4700) && isE12(330) && isE12(1e6) && !isE12(450) && !isE12(1234));
});

test('parser: positioned errors, ground required, duplicate names, fixture protection', () => {
  const p = parseNetlist('R1 a b 1k');
  assert.equal(p.errors[0].code, 'errNoGround');
  const d = parseNetlist('R1 a gnd 1k\nR1 a gnd 2k');
  assert.equal(d.errors[0].code, 'errDuplicateName');
  assert.equal(d.errors[0].line, 1);
  const bad = parseNetlist('R1 a gnd abc');
  assert.equal(bad.errors[0].code, 'errBadValue');
  assert.equal(bad.errors[0].pos, 9);
  const r = runHeadless({ fixture: 'V1 in gnd DC 9', user: 'V1 in gnd DC 3' });
  assert.equal(r.errors[0].code, 'errRedefinesFixture');
});

test("Ohm's law and a resistive divider", () => {
  const { m } = run('V1 in gnd DC 9\nR1 in out 5.6k\nR2 out gnd 3.3k');
  near(m.v('out'), 9 * 3.3 / 8.9, 1e-6, 'divider');
  near(m.i('r1'), 9 / 8900, 1e-9, 'current');
  near(m.p('r1'), (9 / 8900) ** 2 * 5600, 1e-9, 'power');
});

test('a loaded divider sags; Thevenin agrees', () => {
  const { m } = run('V1 in gnd DC 9\nRL out gnd 1k\nR1 in out 150\nR2 out gnd 100');
  const vth = 9 * 100 / 250; const rth = 150 * 100 / 250;
  near(m.v('out'), vth * 1000 / (1000 + rth), 1e-6, 'loaded divider');
});

test('silicon diode: ~0.71 V at 10 mA; LED ~2.0 V at 15 mA', () => {
  const a = run('I1 gnd a DC 10m\nD1 a gnd SI');
  near(a.m.v('a'), 0.714, 0.01, 'Si Vf');
  const b = run('V1 in gnd DC 5\nR1 in out 220\nD1 out gnd LED');
  near(b.m.i('d1'), 0.0137, 0.0005, 'LED current');
  near(b.m.v('out'), 2.0, 0.05, 'LED Vf');
});

test('burn: a 47 Ω ballast kills the LED; a quarter-watt resistor dies above 0.25 W', () => {
  const led = run('V1 in gnd DC 5\nR1 in out 47\nD1 out gnd LED');
  assert.deepEqual(led.m.burnedList(), ['d1']);
  assert.ok(led.state.trace.some((e) => e.type === 'burn' && e.comp === 'd1' && e.kind === 'current'));
  const r = run('V1 in gnd DC 9\nR1 in gnd 100');
  assert.deepEqual(r.m.burnedList(), ['r1']);
  const ok = run('V1 in gnd DC 9\nR1 in gnd 100 1W');
  assert.deepEqual(ok.m.burnedList(), []);
});

test('RC discharge: V(τ)/V(0) = 1/e within 0.5%', () => {
  const { m } = run('V1 in gnd STEP 5 0 0\nD1 in top SI\nR1 top gnd 10k\nC1 top gnd 100u\n.tran 2');
  near(m.vAt('top', 1) / m.vAt('top', 0), Math.exp(-1), 0.002, 'tau');
});

test('RC low-pass: gain at f vs 1/sqrt(1+(f/fc)^2)', () => {
  const fc = 1 / (2 * Math.PI * 1500 * 100e-9);
  const a = run('V1 in gnd SIN 0 1 1k\nR1 in out 1.5k\nC1 out gnd 100n\n.tran 5m');
  near(a.m.vpp('out') / a.m.vpp('in'), 1 / Math.sqrt(1 + (1000 / fc) ** 2), 0.02, 'gain @1k');
  const b = run('V1 in gnd SIN 0 1 5k\nR1 in out 1.5k\nC1 out gnd 100n\n.tran 5m');
  near(b.m.vpp('out') / b.m.vpp('in'), 1 / Math.sqrt(1 + (5000 / fc) ** 2), 0.02, 'gain @5k');
});

test('oscilloscope readings: Vpp, mean over whole periods, frequency', () => {
  const { m } = run('V1 in gnd SIN 1 1 500\nR1 in gnd 1k\n.tran 12m');
  near(m.vpp('in'), 2, 0.01, 'Vpp');
  near(m.vavg('in'), 1, 0.01, 'mean');
  near(m.freq('in'), 500, 2, 'freq');
});

test('half-wave rectifier: peak minus a diode drop, no negative half', () => {
  const { m } = run('V1 in gnd SIN 0 5 50\nD1 in out SI\nRL out gnd 1k\n.tran 40m');
  near(m.vmax('out'), 4.31, 0.05, 'peak');
  near(m.vmin('out'), 0, 0.01, 'floor');
});

test('bridge + reservoir: ripple ≈ I/(2f·C); inrush does not kill a rectifier diode', () => {
  const { m } = run('V1 a b SIN 0 8.5 50\nD1 a p 1N4007\nD2 b p 1N4007\nD3 gnd a 1N4007\nD4 gnd b 1N4007\nC1 p gnd 470u\nRL p gnd 470\n.tran 60m');
  assert.deepEqual(m.burnedList(), []);
  const i = m.vavg('p') / 470;
  near(m.vpp('p'), i / (100 * 470e-6), 0.08, 'ripple');
  // a steady 0.43 A through a small-signal diode is a different story
  const weak = run('V1 in gnd DC 5\nR1 in a 10 5W\nD1 a gnd SI');
  assert.deepEqual(weak.m.burnedList(), ['d1']);
});

test('zener regulator holds 5.1 V; a 47 Ω dropper burns', () => {
  const { m } = run('V1 in gnd DC 12\nR1 in out 330\nDZ1 gnd out ZENER 5.1\nRL out gnd 1k');
  near(m.v('out'), 5.11, 0.03, 'Vz');
  near(-m.i('dz1'), 0.0164, 0.001, 'Iz');
  const hot = run('V1 in gnd DC 12\nR1 in out 47\nDZ1 gnd out ZENER 5.1\nRL out gnd 1k');
  assert.ok(hot.m.anyBurned());
});

test('BJT switch: saturates with enough base current, stays linear without', () => {
  const on = run('V1 vcc gnd DC 12\nRL vcc c 100 5W\nVin bin gnd PULSE 0 3.3 1k\nRb bin b 680\nQ1 c b gnd NPN\n.tran 2m');
  assert.ok(on.m.vmin('c') < 0.3, `saturated Vce ${on.m.vmin('c')}`);
  near(on.m.vmax('c'), 12, 0.01, 'off → Vcc');
  const weak = run('V1 vcc gnd DC 12\nRL vcc c 100 5W\nVin bin gnd DC 3.3\nRb bin b 2.2k\nQ1 c b gnd NPN 60');
  near(weak.m.v('c'), 12 - 100 * 60 * (3.3 - 0.764) / 2200, 0.15, 'active region Ic = β·Ib');
});

test('faults: a hidden open diode kills the output; .replace on the right part heals it', () => {
  const board = 'V1 a gnd SIN 0 12 50\nD1 a p 1N4007\nC1 p gnd 1000u\nR1 p out 220\nDZ1 gnd out ZENER 5.1\nRL out gnd 1k\n.tran 60m';
  const faults = { d1: { kind: 'open' } };
  const sick = run('', board, { faults });
  near(sick.m.vavg('out'), 0, 0.01, 'dead output');
  near(sick.m.vmax('a'), 12, 0.05, 'AC still there');
  const healed = run('.replace D1', board, { faults });
  near(healed.m.vavg('out'), 5.12, 0.05, 'healed');
  assert.ok(healed.state.trace.some((e) => e.type === 'fault_found' && e.comp === 'd1'));
  const wrong = run('.replace C1', board, { faults });
  near(wrong.m.vavg('out'), 0, 0.01, 'wrong part');
  assert.ok(wrong.state.trace.some((e) => e.type === 'replace' && e.comp === 'c1'));
});

test('event stream: solve → iterate → converge; regimes reported; done last', () => {
  const b = buildRun({ user: 'V1 in gnd DC 5\nR1 in out 220\nD1 out gnd LED' });
  runToCompletion(b.sim);
  const types = b.sim.trace.map((e) => e.type);
  assert.equal(types[0], 'solve');
  assert.ok(types.includes('iterate') && types.includes('converge') && types.includes('conduct'));
  assert.equal(types[types.length - 1], 'done');
});

test('determinism: same netlist → identical trace', () => {
  const src = 'V1 a b SIN 0 8.5 50\nD1 a p 1N4007\nD2 b p 1N4007\nD3 gnd a 1N4007\nD4 gnd b 1N4007\nC1 p gnd 470u\nRL p gnd 470\n.tran 60m';
  const a = runHeadless({ user: src }); const b = runHeadless({ user: src });
  assert.equal(JSON.stringify(a.state.trace), JSON.stringify(b.state.trace));
  assert.equal(JSON.stringify(Array.from(a.state.samples[500].v)), JSON.stringify(Array.from(b.state.samples[500].v)));
});
