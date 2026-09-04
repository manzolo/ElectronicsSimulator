// Reference solutions, one per level id. Each MUST pass every case (visible
// and hidden) its level generates — that is what tests/levels.test.js checks.

import { solution as l01 } from '../js/levels/level01.js';
import { solution as l02 } from '../js/levels/level02.js';
import { solution as l03 } from '../js/levels/level03.js';
import { solution as l04 } from '../js/levels/level04.js';
import { solution as l05 } from '../js/levels/level05.js';
import { solution as l06 } from '../js/levels/level06.js';
import { solution as l07 } from '../js/levels/level07.js';
import { solution as l08 } from '../js/levels/level08.js';
import { solution as l09 } from '../js/levels/level09.js';
import { solution as l10 } from '../js/levels/level10.js';
import { solution as l11 } from '../js/levels/level11.js';
import { solution as l12 } from '../js/levels/level12.js';
import { solution as l13 } from '../js/levels/level13.js';
import { solution as l14 } from '../js/levels/level14.js';

export const solutions = {
  ohm: l01,
  divider: l02,
  'divider-load': l03,
  led: l04,
  kirchhoff: l05,
  'rc-time': l06,
  scope: l07,
  'rc-filter': l08,
  diode: l09,
  'bridge-ripple': l10,
  zener: l11,
  'bjt-switch': l12,
  'fault-dead': l13,
  'fault-hum': l14,
};

// Answers that pass the VISIBLE case(s) but fail a hidden one, or break a shop
// rule — used to prove the anti-cheat bites.
export const cheats = {
  // a second battery wired straight to `out` — not a divider, and not allowed
  divider: 'V9 out gnd DC 3.3',
  // the level-2 divider: perfect unloaded, collapses under load
  'divider-load': 'R1 in out 5.6k\nR2 out gnd 3.3k',
  // 180 Ω is fine at 5.0 V and gives 17.7 mA at 5.2 V
  led: 'R1 in out 180',
  // 330 µF: 0.37 V of ripple on 470 Ω, 0.44 V on the hidden 390 Ω load
  'bridge-ripple': 'C1 p gnd 330u',
  // 1.8k saturates a β = 100 transistor and leaves a β = 60 one at 3.5 V
  'bjt-switch': 'Rb bin b 1.8k',
  // replacing everything in sight
  'fault-dead': '.replace D1\n.replace C1',
  // the tempting output capacitor: the symptom is there, the cause is not
  'fault-hum': '.replace C2',
};
