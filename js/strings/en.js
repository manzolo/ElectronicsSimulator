export default {
  tagline: 'Write the circuit, watch voltages and currents settle — then pick up the probe.',
  navIntro: 'Basics',
  navLevels: 'Levels',
  navSandbox: 'Sandbox',
  help: 'Help',

  run: 'Run',
  pause: 'Pause',
  step: 'Step',
  reset: 'Reset',
  speed: 'Speed',

  panelSchematic: 'Schematic — nodes ordered by potential',
  panelInstruments: 'Bench: multimeter and oscilloscope',
  panelNetlist: 'Netlist',
  panelBuilder: 'Parts (edit here or in the text)',
  panelReadings: 'Readings per part',
  panelCases: 'Test cases',
  panelEvents: 'Solver log',
  fixtureLabel: 'given board (locked)',
  userLabel: 'your lines',

  statusRunning: 'Running…',
  statusReady: 'Ready. Press Run.',
  statusPaused: 'Paused.',
  statusParseFailed: 'The netlist could not be parsed.',
  statusDone: 'Done in {0} ticks · t = {1}.',
  statusDoneBurn: 'Done in {0} ticks — but something burned: {1}.',

  meterEmpty: 'No probe. Add <code>.probe node</code> or <code>.probe I(R1)</code>, or click a node or a part in the schematic.',
  scopeEmpty: 'No channel. Add <code>.scope node</code> (and <code>.tran</code> to see time).',
  scopeNoTran: 'DC circuit: the scope shows a flat line. Add <code>.tran 20m</code> for time.',
  scopeDiv: '{0}/div',
  readingsEmpty: 'Run to read voltages, currents and powers.',
  colPart: 'part', colValue: 'value', colV: 'V', colI: 'I', colP: 'P', colStress: 'limit',
  burnedTag: 'burned',
  replacedTag: 'new',
  builderEmpty: 'No parts of yours. Add with the buttons or write in the netlist.',
  builderAdd: 'add',
  builderRemove: 'remove',
  builderNodes: 'nodes',
  builderDirectives: 'directives (.probe, .scope, .replace) stay in the text',

  evtSolveDc: 'operating point: solving the network (MNA)',
  evtSolveTran: 'transient to {0} (dt {1})',
  evtIterate: 'iteration {0} · Δ {1}',
  evtConverge: 'converged in {0} iterations',
  evtSettle: 'settled',
  evtTick: 't = {0}',
  evtConduct: '{0} conducts ({1})',
  evtCutoff: '{0} cut off',
  evtZener: '{0} in Zener region ({1})',
  evtSaturate: '{0} saturated ({1})',
  evtActive: '{0} in active region ({1})',
  evtCharge: '{0} charging',
  evtDischarge: '{0} discharging',
  evtBurnPower: '✗ {0} BURNS: {1} against a {2} limit',
  evtBurnCurrent: '✗ {0} BURNS: {1} against a {2} limit',
  evtProbeV: 'probe V({0}) = {1}',
  evtProbeI: 'probe I({0}) = {1}',
  evtFaultFound: '✓ {0} replaced: it was the faulty part',
  evtReplace: '{0} replaced: it was fine',
  evtDiverge: 'the solver does not converge',
  evtDone: 'done · {0} ticks',
  evtEmpty: 'No events yet — press Run.',

  caseLabel: 'Case',
  casesNote: 'Checked on these AND on hidden cases (different tolerances) — the circuit has to work, not to guess.',

  allowedLabel: 'parts',
  allowedNone: 'nothing to add: probes and .replace only',
  e12Chip: 'E12 values only',
  maxChip: 'max {0}',
  replaceChip: 'replacements: {0}',

  hintBtn: 'Hint {0} of {1}',
  hintsDone: 'No more hints',
  nextLevel: 'Next level →',
  completedBadge: 'completed',
  levelBadge: 'Level {0}',
  goalLabel: 'Goal',
  checksLabel: 'Checks',
  wantBetween: 'want {0} – {1}',
  wantMax: 'want ≤ {0}',
  wantMin: 'want ≥ {0}',

  sandboxTitle: 'Sandbox',
  sandboxText: 'Free bench: a complete stabilized supply with the scope already on the right nodes. Change everything, break everything (parts really burn), add <code>.probe</code> wherever you like. Nothing is verified here.',
  sandboxCardTitle: 'Sandbox',
  sandboxCardDesc: 'free bench',

  selectTitle: 'Pick a level',

  passMsg: 'The circuit works in every case. Nice work.',
  failVisible: 'Not yet: on a shown case the circuit misses the spec.',
  failHidden: 'Works on the shown cases but fails a hidden one — does it hold under tolerances?',
  failStatus: 'Some cases not passed.',
  failBurn: 'Something burned.',

  introTitle: 'Never held a soldering iron? Start here',
  introStart: 'Got it — take me to level 1 →',

  segnala: 'Report a problem',
  segnalaTitle: 'Opens a GitHub issue prefilled with level, language, engine state and browser.',
  segnalaCorpo: '**What is wrong?**\n\nDescribe here: what you did, what you expected, what happened.\n\n---\n_Data collected from the page (check and correct if needed):_\n\n- Page: {0}\n- Level: {1}\n- Language: {2}\n- State: {3}\n- Browser: `{4}`\n',

  helpTitle: 'EDU-ELN — how it works',
  helpHtml: `
    <p>You write a circuit as a <b>netlist</b> (one line per part); a hand-written solver — modified nodal analysis + Newton-Raphson, no libraries — computes voltages and currents and shows them on the schematic, the multimeter and the oscilloscope.</p>
    <h3>The netlist</h3>
    <table>
      <tr><th>R1 in out 4.7k [0.5W]</th><td>resistor (optional power rating, default ¼ W)</td></tr>
      <tr><th>C1 out gnd 100n · L1 a b 10m</th><td>capacitor, inductor</td></tr>
      <tr><th>V1 in gnd DC 9</th><td>DC source</td></tr>
      <tr><th>V1 in gnd SIN off amp f</th><td>sine: offset, amplitude (peak), frequency</td></tr>
      <tr><th>V1 in gnd PULSE v1 v2 f · STEP v1 v2 t0</th><td>square wave (50%) · step at t0</td></tr>
      <tr><th>D1 anode cathode [SI|1N4007|LED|SCHOTTKY]</th><td>diode; node order IS polarity</td></tr>
      <tr><th>DZ1 anode cathode ZENER 5.1</th><td>Zener with its V<sub>z</sub></td></tr>
      <tr><th>Q1 c b e NPN [beta]</th><td>NPN transistor (β defaults to 100)</td></tr>
      <tr><th>.tran 20m [dt]</th><td>simulate in time (without it: operating point only)</td></tr>
      <tr><th>.probe out · .probe I(R1)</th><td>multimeter on a node / current through a part</td></tr>
      <tr><th>.scope in out</th><td>up to two oscilloscope channels</td></tr>
      <tr><th>.replace C1</th><td>in the repair levels: swap a part for a new one</td></tr>
    </table>
    <p>Suffixes: <code>p n u m k M</code> (mind: <code>m</code> = milli, <code>M</code> = mega). <code>gnd</code> or <code>0</code> is ground. Comments with <code>#</code>.</p>
    <h3>The schematic</h3>
    <p>Nodes are <b>horizontal rails ordered by potential</b>: higher up, more volts. Each part is a column between its two nodes; wire colour is voltage, the marching ants are current (speed ∝ log|I|). A little hop where a wire crosses a rail means <em>no contact</em>. Click a node or a part to put the probe on it.</p>
    <h3>Controls</h3>
    <table>
      <tr><th>Run / Pause</th><td>Ctrl/Cmd + Enter</td></tr>
      <tr><th>Step</th><td>F8 — one operating-point iteration, or one time step</td></tr>
      <tr><th>Speed</th><td>the slider; the last notch is Turbo</td></tr>
    </table>
    <h3>Limits are real</h3>
    <p>A ¼ W resistor with 0.3 W on it <b>burns</b> and goes open; an LED above 30 mA too; a Zener above 0.5 W, a transistor above 1.5 W or 1 A. In transients the stress is averaged (thermal inertia), so a few milliseconds of inrush do not kill a rectifier.</p>
    <h3>Levels</h3>
    <p>Each level hands you a board (locked) and asks you to add or replace something. Verification measures the circuit on several cases — some shown, some hidden with different tolerances — so a design that holds passes, a lucky shot does not.</p>`,

  // ---- parser / engine error codes ----
  errUnknownElement: 'Unknown part “{0}”: parts start with R, C, L, V, I, D or Q.',
  errDuplicateName: '“{0}” is already defined.',
  errNeedNodes: '“{0}” needs {1} nodes.',
  errBadValue: 'Bad value for “{0}” (e.g. 4.7k, 100n).',
  errBadRating: 'Bad power rating for “{0}” (e.g. 0.5W).',
  errBadSource: 'Unknown source type for “{0}”: use DC, SIN, PULSE or STEP.',
  errSourceArgs: 'A {0} source takes {1} numbers.',
  errBadFreq: 'Bad frequency for “{0}”.',
  errUnknownModel: 'Unknown model “{0}”.',
  errZenerVoltage: 'Zener “{0}” needs its V<sub>z</sub> (e.g. ZENER 5.1).',
  errTranValue: '.tran needs a duration (e.g. .tran 20m).',
  errProbeArg: 'Say what to probe: a node or I(part).',
  errReplaceArg: 'Say which part to replace.',
  errUnknownDirective: 'Unknown directive “{0}”.',
  errNoGround: 'No node is connected to gnd: the circuit has no reference.',
  errUnknownComponent: 'Unknown part “{0}”.',
  errUnknownNode: 'Unknown node “{0}”.',
  errRedefinesFixture: '“{0}” is already on the board: you cannot redefine it.',
  errEmpty: 'The netlist is empty.',
  errBuild: 'Could not build the circuit: {0}',
  errNoConverge: 'The solver does not converge: as it stands, the circuit has no stable operating point.',
  errSingular: 'Singular system: a node is connected to nothing, or two sources conflict.',
  errBudget: 'Too many steps: the simulation was stopped.',
  errNotAllowed: '“{0}” is a {1}: not allowed in this level.',
  errTooMany: 'Too many parts: at most {0}.',
  errNotE12: '“{0}” is not an E12 value.',
  errNoReplaceHere: 'No parts are replaced in this level.',
  errTooManyReplace: 'You may replace at most {0} part.',
};
