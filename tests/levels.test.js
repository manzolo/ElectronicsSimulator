import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levels } from '../js/levels/index.js';
import { solutions, cheats } from './solutions.js';
import { verifyAll, checkConstraints } from '../js/levels/verify.js';

const fmt = (r) => r.checks.filter((c) => !c.ok).map((c) => `${c.id}=${c.got}`).join(',') + (r.error ? ' err=' + JSON.stringify(r.error) : '');

test('every level has a reference solution', () => {
  for (const lv of levels) assert.ok(solutions[lv.id] != null, `missing solution for ${lv.id}`);
});

for (const lv of levels) {
  test(`reference solution passes ALL cases: ${lv.id}`, () => {
    const results = verifyAll(lv, solutions[lv.id]);
    for (const r of results) assert.ok(r.pass, `${lv.id} failed a ${r.visible ? 'visible' : 'hidden'} case: ${fmt(r)}`);
  });

  test(`starter does NOT already pass: ${lv.id}`, () => {
    const results = verifyAll(lv, lv.start);
    assert.ok(results.some((r) => !r.pass), `${lv.id} starter unexpectedly passes everything`);
  });

  test(`has visible and hidden cases: ${lv.id}`, () => {
    const cs = lv.makeCases();
    assert.ok(cs.some((c) => c.visible) && cs.some((c) => !c.visible), `${lv.id} needs both visible and hidden cases`);
  });
}

test('anti-cheat: hardwired or rule-breaking answers fail', () => {
  for (const [id, text] of Object.entries(cheats)) {
    const lv = levels.find((l) => l.id === id);
    assert.ok(lv, `unknown level in cheats: ${id}`);
    const results = verifyAll(lv, text);
    assert.ok(results.some((r) => !r.pass), `cheat for ${id} unexpectedly passed all cases`);
  }
});

test('anti-cheat: the visible-only cheats really do pass the visible cases', () => {
  for (const id of ['led', 'bridge-ripple', 'bjt-switch']) {
    const lv = levels.find((l) => l.id === id);
    const results = verifyAll(lv, cheats[id]);
    assert.ok(results.filter((r) => r.visible).every((r) => r.pass), `${id}: cheat should pass the visible case (${results.filter((r) => r.visible).map(fmt)})`);
    assert.ok(results.filter((r) => !r.visible).some((r) => !r.pass), `${id}: cheat should fail a hidden case`);
  }
});

test('shop rules: forbidden part types, E12, replacement count', () => {
  const led = levels.find((l) => l.id === 'led');
  assert.equal(checkConstraints(led, 'V2 out gnd DC 2')[0].code, 'errNotAllowed');
  assert.equal(checkConstraints(led, 'R1 in out 200')[0].code, 'errNotE12');
  assert.equal(checkConstraints(led, 'R1 in out 220\nR2 in out 220')[0].code, 'errTooMany');
  const fault = levels.find((l) => l.id === 'fault-dead');
  assert.equal(checkConstraints(fault, '.replace D1\n.replace C1')[0].code, 'errTooManyReplace');
  assert.equal(checkConstraints(fault, 'R9 p gnd 1k')[0].code, 'errNotAllowed');
  assert.equal(checkConstraints(led, '.replace D1')[0].code, 'errNoReplaceHere');
});

test('makeCases is deterministic across calls', () => {
  for (const lv of levels) {
    assert.equal(JSON.stringify(lv.makeCases()), JSON.stringify(lv.makeCases()), `${lv.id} makeCases not deterministic`);
  }
});
