// Netlist parser: one component per line, SPICE-flavoured and forgiving.
//
//   V1 in gnd DC 9              R1 in out 4.7k [0.5W]      C1 out gnd 100n
//   V1 in gnd SIN 0 5 1k        L1 a b 10m                 D1 a k [SI|LED|1N4007|SCHOTTKY]
//   V1 in gnd PULSE 0 3.3 1k    I1 a gnd DC 2m             D1 a k ZENER 5.1  (anode, cathode)
//   V1 in gnd STEP 5 0 0        Q1 c b e NPN [beta]
//   .tran 20m [dt]   .probe out | .probe I(R1)   .scope in [out]   .replace C1
//
// Names are case-insensitive and lowercased; `gnd` and `0` are the ground.
// Comments start with `#`, `*` or `;`. Errors carry {code, args, line, pos, len}
// so the editor can underline the exact token, like EDU-SQL's parser does.

import { parseValue } from './units.js';
import { DIODE_MODELS, BJT_MODELS, DEFAULT_R_RATING } from './models.js';

const TYPE_OF_LETTER = { R: 'R', C: 'C', L: 'L', V: 'V', I: 'I', D: 'D', Q: 'Q' };

export function normNode(n) {
  const s = String(n).toLowerCase();
  return s === 'gnd' || s === '0' || s === 'ground' ? '0' : s;
}

function err(code, args, line, pos, len) {
  return { code, args, line, pos, len: Math.max(1, len) };
}

// Split a line into tokens with their column positions.
function tokenize(line) {
  const toks = [];
  const re = /\S+/g;
  let m;
  while ((m = re.exec(line)) !== null) toks.push({ text: m[0], pos: m.index, len: m[0].length });
  return toks;
}

export function parseNetlist(text) {
  const elements = [];
  const errors = [];
  const directives = { tran: null, probes: [], scopes: [], replaces: [] };
  const names = new Set();
  const lines = String(text ?? '').split('\n');
  let offset = 0; // absolute char offset of the current line (for the editor)

  for (let ln = 0; ln < lines.length; ln++) {
    const raw = lines[ln];
    const lineStart = offset;
    offset += raw.length + 1;
    const stripped = raw.replace(/[#;].*$/, '').replace(/^\s*\*.*$/, '');
    const toks = tokenize(stripped);
    if (!toks.length) continue;
    const abs = (t) => lineStart + t.pos;
    const head = toks[0];

    if (head.text.startsWith('.')) {
      const d = head.text.slice(1).toLowerCase();
      const args = toks.slice(1);
      if (d === 'tran') {
        const stop = parseValue(args[0]?.text);
        if (!(stop > 0)) { errors.push(err('errTranValue', [], ln, abs(args[0] ?? head), (args[0] ?? head).len)); continue; }
        const dt = args[1] ? parseValue(args[1].text) : null;
        directives.tran = { stop, dt: dt > 0 ? dt : null, line: ln };
      } else if (d === 'probe') {
        if (!args.length) { errors.push(err('errProbeArg', [], ln, abs(head), head.len)); continue; }
        for (const a of args) {
          const cm = /^i\((\w+)\)$/i.exec(a.text);
          if (cm) directives.probes.push({ kind: 'i', comp: cm[1].toLowerCase(), line: ln, pos: abs(a), len: a.len });
          else directives.probes.push({ kind: 'v', node: normNode(a.text), line: ln, pos: abs(a), len: a.len });
        }
      } else if (d === 'scope') {
        if (!args.length) { errors.push(err('errProbeArg', [], ln, abs(head), head.len)); continue; }
        for (const a of args.slice(0, 2)) directives.scopes.push({ node: normNode(a.text), line: ln, pos: abs(a), len: a.len });
      } else if (d === 'replace') {
        if (!args.length) { errors.push(err('errReplaceArg', [], ln, abs(head), head.len)); continue; }
        for (const a of args) directives.replaces.push({ comp: a.text.toLowerCase(), line: ln, pos: abs(a), len: a.len });
      } else {
        errors.push(err('errUnknownDirective', [head.text], ln, abs(head), head.len));
      }
      continue;
    }

    const letter = head.text[0].toUpperCase();
    const type = TYPE_OF_LETTER[letter];
    if (!type) { errors.push(err('errUnknownElement', [head.text], ln, abs(head), head.len)); continue; }
    const name = head.text.toLowerCase();
    if (names.has(name)) { errors.push(err('errDuplicateName', [head.text], ln, abs(head), head.len)); continue; }

    const nNodes = type === 'Q' ? 3 : 2;
    if (toks.length < 1 + nNodes) { errors.push(err('errNeedNodes', [head.text, nNodes], ln, abs(head), stripped.length - head.pos)); continue; }
    const nodes = toks.slice(1, 1 + nNodes).map((t) => normNode(t.text));
    const rest = toks.slice(1 + nNodes);
    const el = { name, type, nodes, line: ln, pos: abs(head), len: head.len, params: {} };

    switch (type) {
      case 'R': case 'C': case 'L': {
        const v = parseValue(rest[0]?.text);
        if (!(v > 0)) { errors.push(err('errBadValue', [head.text], ln, abs(rest[0] ?? head), (rest[0] ?? head).len)); continue; }
        el.value = v;
        if (type === 'R') {
          el.params.rating = DEFAULT_R_RATING;
          if (rest[1]) {
            const w = parseValue(rest[1].text);
            if (!(w > 0)) { errors.push(err('errBadRating', [head.text], ln, abs(rest[1]), rest[1].len)); continue; }
            el.params.rating = w;
          }
        }
        break;
      }
      case 'V': case 'I': {
        const kind = (rest[0]?.text ?? 'DC').toUpperCase();
        const nums = rest.slice(1).map((t) => parseValue(t.text));
        const need = { DC: 1, SIN: 3, PULSE: 3, STEP: 3 }[kind];
        if (need == null) { errors.push(err('errBadSource', [head.text], ln, abs(rest[0] ?? head), (rest[0] ?? head).len)); continue; }
        if (nums.length < need || nums.slice(0, need).some((x) => x == null)) {
          errors.push(err('errSourceArgs', [kind, need], ln, abs(rest[0] ?? head), stripped.length - (rest[0] ?? head).pos)); continue;
        }
        el.kind = kind;
        if (kind === 'DC') el.value = nums[0];
        else if (kind === 'SIN') { el.value = nums[1]; el.params = { offset: nums[0], amp: nums[1], freq: nums[2] }; }
        else if (kind === 'PULSE') { el.value = nums[1]; el.params = { v1: nums[0], v2: nums[1], freq: nums[2] }; }
        else if (kind === 'STEP') { el.value = nums[1]; el.params = { v1: nums[0], v2: nums[1], t0: nums[2] }; }
        if ((kind === 'SIN' || kind === 'PULSE') && !(el.params.freq > 0)) {
          errors.push(err('errBadFreq', [head.text], ln, abs(rest[3] ?? head), (rest[3] ?? head).len)); continue;
        }
        break;
      }
      case 'D': {
        const modelName = (rest[0]?.text ?? 'SI').toUpperCase();
        const model = DIODE_MODELS[modelName];
        if (!model) { errors.push(err('errUnknownModel', [rest[0].text], ln, abs(rest[0]), rest[0].len)); continue; }
        el.model = modelName;
        if (model.zener) {
          const vz = parseValue(rest[1]?.text);
          if (!(vz > 0)) { errors.push(err('errZenerVoltage', [head.text], ln, abs(rest[1] ?? rest[0]), (rest[1] ?? rest[0]).len)); continue; }
          el.params.vz = vz;
          el.value = vz;
        }
        break;
      }
      case 'Q': {
        const modelName = (rest[0]?.text ?? 'NPN').toUpperCase();
        const model = BJT_MODELS[modelName];
        if (!model) { errors.push(err('errUnknownModel', [rest[0].text], ln, abs(rest[0]), rest[0].len)); continue; }
        el.model = modelName;
        if (rest[1]) {
          const bf = parseValue(rest[1].text);
          if (!(bf > 0)) { errors.push(err('errBadValue', [head.text], ln, abs(rest[1]), rest[1].len)); continue; }
          el.params.bf = bf;
        }
        break;
      }
      default: break;
    }
    names.add(name);
    elements.push(el);
  }

  // Semantic checks: a ground must exist, probes/replaces must name real things.
  if (elements.length && !elements.some((e) => e.nodes.includes('0'))) {
    const e0 = elements[0];
    errors.push(err('errNoGround', [], e0.line, e0.pos, e0.len));
  }
  const nodeSet = new Set(elements.flatMap((e) => e.nodes));
  for (const p of directives.probes) {
    if (p.kind === 'i' && !names.has(p.comp)) errors.push(err('errUnknownComponent', [p.comp.toUpperCase()], p.line, p.pos, p.len));
    if (p.kind === 'v' && !nodeSet.has(p.node) && elements.length) errors.push(err('errUnknownNode', [p.node], p.line, p.pos, p.len));
  }
  for (const s of directives.scopes) {
    if (!nodeSet.has(s.node) && elements.length) errors.push(err('errUnknownNode', [s.node], s.line, s.pos, s.len));
  }
  for (const r of directives.replaces) {
    if (!names.has(r.comp)) errors.push(err('errUnknownComponent', [r.comp.toUpperCase()], r.line, r.pos, r.len));
  }

  return { elements, directives, errors: errors.length ? errors : null };
}

// Merge a locked fixture (the level's board) with the user's lines. The user's
// error positions stay relative to the user text, which is what the editor
// underlines. A user line that redefines a fixture component is an error: you
// are working ON the board, not redesigning it.
export function parseWithFixture(fixtureText, userText) {
  const fx = parseNetlist(fixtureText ?? '');
  const us = parseNetlist(userText ?? '');
  const fixtureNames = new Set(fx.elements.map((e) => e.name));
  // Probes/scopes/replaces on either side may legitimately name parts or
  // nodes that live on the other side (the board probes the part YOU add):
  // re-check those errors against the merged circuit.
  const allNames = new Set([...fixtureNames, ...us.elements.map((e) => e.name)]);
  const allNodes = new Set([...fx.elements, ...us.elements].flatMap((e) => e.nodes));
  const stillValid = (e) => {
    if (e.code === 'errUnknownComponent' && allNames.has(e.args[0].toLowerCase())) return false;
    if (e.code === 'errUnknownNode' && allNodes.has(e.args[0])) return false;
    if (e.code === 'errNoGround' && allNodes.has('0')) return false;
    return true;
  };
  const fxErrors = (fx.errors ?? []).filter(stillValid);
  if (fxErrors.length) return { errors: fxErrors.map((e) => ({ ...e, inFixture: true })) };
  const errors = (us.errors ?? []).filter(stillValid);
  for (const e of us.elements) {
    if (fixtureNames.has(e.name)) errors.push(err('errRedefinesFixture', [e.name.toUpperCase()], e.line, e.pos, e.len));
  }
  if (errors.length) return { errors };
  const elements = [...fx.elements.map((e) => ({ ...e, fixture: true })), ...us.elements];
  const directives = {
    tran: fx.directives.tran ?? us.directives.tran,
    probes: [...fx.directives.probes, ...us.directives.probes],
    scopes: [...fx.directives.scopes, ...us.directives.scopes],
    replaces: [...fx.directives.replaces, ...us.directives.replaces],
  };
  return { elements, directives, userElements: us.elements, userDirectives: us.directives, errors: null };
}
