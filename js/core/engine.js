// Facade shared by the UI (buildRun) and the headless verifier / tests
// (runHeadless): parse fixture + user text → Circuit (with the level's hidden
// faults applied, unless the user `.replace`d the part) → ElnSim.

import { parseWithFixture } from './netlist.js';
import { Circuit } from './solver.js';
import { ElnSim, runToCompletion } from './sim.js';

export function buildRun({ fixture = '', user = '', faults = {}, budget = 60000 } = {}) {
  const parsed = parseWithFixture(fixture, user);
  if (parsed.errors) return { errors: parsed.errors };
  if (!parsed.elements.length) return { errors: [{ code: 'errEmpty', args: [], line: 0, pos: 0, len: 1 }] };
  let circuit;
  try {
    circuit = new Circuit(parsed, { faults });
  } catch (e) {
    return { errors: [{ code: 'errBuild', args: [String(e.message ?? e)], line: 0, pos: 0, len: 1 }] };
  }
  const sim = new ElnSim(circuit, { tran: parsed.directives.tran, budget });
  return { sim, circuit, parsed };
}

// One-shot execution with no animation — used by the verifier and the tests.
export function runHeadless(opts) {
  const built = buildRun(opts);
  if (built.errors) return { errors: built.errors };
  const { state, error } = runToCompletion(built.sim);
  return { state, error, parsed: built.parsed };
}
