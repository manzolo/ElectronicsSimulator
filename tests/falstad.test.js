import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildRun } from '../js/core/engine.js';
import { toFalstad, falstadUrl } from '../js/ui/falstad.js';
import { levels } from '../js/levels/index.js';
import { solutions } from './solutions.js';

// token counts each CircuitJS1 element constructor expects after "type x y x2 y2 flags"
const ARITY = { r: 1, c: 2, l: 2, v: 6, i: 1, d: 1, z: 1, 162: 4, t: 5, w: 0, g: 1, 207: 1 };

function checkText(txt) {
  const lines = txt.split('\n');
  assert.equal(lines[0].split(' ')[0], '$', 'header first');
  for (const line of lines.slice(1)) {
    const tok = line.split(' ');
    const type = tok[0];
    assert.ok(type in ARITY, `unknown element type ${type}: ${line}`);
    assert.equal(tok.length, 6 + ARITY[type], `bad arity: ${line}`);
    for (const n of tok.slice(1, 6)) assert.ok(/^-?\d+$/.test(n), `non-integer coordinate/flags: ${line}`);
    if (type === 'w') assert.ok(!(tok[1] === tok[3] && tok[2] === tok[4]), `zero-length wire: ${line}`);
  }
  return lines;
}

test('every level (fixture + solution) exports to a well-formed CircuitJS1 circuit', () => {
  for (const lv of levels) {
    const cs = lv.makeCases().find((c) => c.visible);
    const b = buildRun({ fixture: lv.fixture(cs.params), user: solutions[lv.id] });
    assert.ok(!b.errors, `${lv.id}: ${JSON.stringify(b.errors)}`);
    const rank = [...b.circuit.nodes.filter((n) => n !== '0'), '0'];
    const lines = checkText(toFalstad(b.circuit, rank));
    // one element line per part (plus wires/labels/ground), one label per non-ground node
    const parts = lines.filter((l) => /^(r|c|l|v|i|d|z|162|t) /.test(l)).length;
    assert.equal(parts, b.circuit.elements.length, `${lv.id}: part count`);
    assert.equal(lines.filter((l) => l.startsWith('207 ')).length, rank.length - 1, `${lv.id}: labels`);
    assert.equal(lines.filter((l) => l.startsWith('g ')).length, 1, `${lv.id}: one ground`);
    const url = falstadUrl(toFalstad(b.circuit, rank));
    assert.ok(url.startsWith('https://www.falstad.com/circuit/circuitjs.html?cct=') && url.length < 8000, `${lv.id}: url`);
  }
});

test('polarity and waveforms survive the export', () => {
  const b = buildRun({ user: 'V1 in gnd SIN 1 2 500\nD1 in out SI\nDZ1 gnd out ZENER 5.1\nQ1 in out gnd NPN 60\nR1 out gnd 1k' });
  const txt = toFalstad(b.circuit, ['in', 'out', '0']);
  // source drawn from n- (gnd rail, lower) to n+ (in rail, top): y1 > y2
  const v = txt.split('\n').find((l) => l.startsWith('v '));
  const [, , y1, , y2, , wf, f, amp, bias] = v.split(' ');
  assert.ok(+y1 > +y2, 'voltage source + terminal on the upper rail');
  assert.deepEqual([wf, f, amp, bias], ['1', '500', '2', '1']);
  const d = txt.split('\n').find((l) => l.startsWith('d '));
  assert.ok(d.endsWith(' 2 1N4148'), 'Si diode → 1N4148 model with FLAG_MODEL');
  const z = txt.split('\n').find((l) => l.startsWith('z '));
  assert.ok(z.endsWith(' 0 5.1'), 'zener carries its Vz');
  const t = txt.split('\n').find((l) => l.startsWith('t '));
  assert.ok(t.endsWith(' 0 1 0 0 60 default'), 'NPN with beta');
});
