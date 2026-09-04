// The verifier. A level is passed when the user's circuit WORKS on every case
// (visible and hidden): each case fixes the board's given parts (the fixture:
// supply, load, source…) and the hidden faults; the user's lines are appended;
// the whole thing is simulated headlessly and MEASURED. Checks are bands on
// readings — a voltage between 3.1 and 3.5 V, a ripple under 0.4 V — never a
// comparison with a reference netlist: there are many right answers.
//
// Constraints are the shop rules of each level: which part types you may add,
// how many, whether only E12 values are allowed, how many parts you may
// `.replace`. They are reported like parse errors (positioned in the user
// text) so the editor underlines them before you even press Run.

import { runHeadless } from '../core/engine.js';
import { measure } from '../core/metrics.js';
import { parseNetlist } from '../core/netlist.js';
import { isE12 } from '../core/units.js';

export const TYPE_NAMES = { R: 'R', C: 'C', L: 'L', V: 'V', I: 'I', D: 'D', Q: 'Q' };

export function checkConstraints(level, userText) {
  const parsed = parseNetlist(userText ?? '');
  const errors = [];
  const els = parsed.elements;
  if (level.allowed) {
    for (const e of els) {
      if (!level.allowed.includes(e.type)) errors.push({ code: 'errNotAllowed', args: [e.name.toUpperCase(), e.type], line: e.line, pos: e.pos, len: e.len });
    }
  }
  if (level.maxElements != null && els.length > level.maxElements) {
    const e = els[level.maxElements];
    errors.push({ code: 'errTooMany', args: [level.maxElements], line: e.line, pos: e.pos, len: e.len });
  }
  if (level.e12) {
    for (const e of els) {
      if (e.type === 'R' && !isE12(e.value)) errors.push({ code: 'errNotE12', args: [e.name.toUpperCase()], line: e.line, pos: e.pos, len: e.len });
    }
  }
  const reps = parsed.directives.replaces;
  const maxRep = level.maxReplace ?? 0;
  if (reps.length > maxRep) {
    const r = reps[maxRep];
    errors.push({ code: maxRep === 0 ? 'errNoReplaceHere' : 'errTooManyReplace', args: [maxRep], line: r.line, pos: r.pos, len: r.len });
  }
  return errors;
}

// Run one case and evaluate every check. Result: { pass, visible, label,
// checks: [{id, label, ok, got, want, unit}], error, burned }.
export function verifyCase(level, userText, c) {
  const fixture = level.fixture(c.params ?? {});
  const constraintErrors = checkConstraints(level, userText);
  if (constraintErrors.length) return { pass: false, visible: !!c.visible, label: c.label, checks: [], error: constraintErrors[0], burned: [] };
  const r = runHeadless({ fixture, user: userText, faults: c.faults ?? {} });
  if (r.errors) return { pass: false, visible: !!c.visible, label: c.label, checks: [], error: r.errors[0], burned: [] };
  if (r.error) return { pass: false, visible: !!c.visible, label: c.label, checks: [], error: r.error, burned: r.state.burned };
  const m = measure(r.state, { windowFrac: level.windowFrac ?? 0.5 });
  const checks = (level.checks ?? []).map((ch) => {
    let res;
    try { res = ch.fn(m, c.params ?? {}); } catch (e) { res = { ok: false, got: null }; }
    return { id: ch.id, label: ch.label, unit: ch.unit ?? '', ok: !!res.ok, got: res.got ?? null, want: res.want ?? null };
  });
  if (!level.allowBurn) {
    checks.push({ id: 'noburn', label: { en: 'nothing burns', it: 'niente brucia' }, unit: '', ok: r.state.burned.length === 0, got: r.state.burned.length ? r.state.burned.map((n) => n.toUpperCase()).join(', ') : null, want: null });
  }
  return { pass: checks.every((k) => k.ok), visible: !!c.visible, label: c.label, checks, error: null, burned: r.state.burned };
}

export function verifyAll(level, userText) {
  return level.makeCases().map((c) => verifyCase(level, userText, c));
}

// ---- check builders shared by the level files ----

// A reading that must fall inside [min, max] (either side optional).
export function band(id, label, unit, getter, min, max) {
  return {
    id, label, unit,
    fn: (m, p) => {
      const got = getter(m, p);
      const lo = typeof min === 'function' ? min(p) : min;
      const hi = typeof max === 'function' ? max(p) : max;
      const ok = got != null && Number.isFinite(got) && (lo == null || got >= lo) && (hi == null || got <= hi);
      return { ok, got, want: { min: lo ?? null, max: hi ?? null } };
    },
  };
}
