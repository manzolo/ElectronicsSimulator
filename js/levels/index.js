// The curriculum, in order. Adding a level = create the file, import it here,
// append it to the array, and add its reference solution in tests/solutions.js.

import level01 from './level01.js';
import level02 from './level02.js';
import level03 from './level03.js';
import level04 from './level04.js';
import level05 from './level05.js';
import level06 from './level06.js';
import level07 from './level07.js';
import level08 from './level08.js';
import level09 from './level09.js';
import level10 from './level10.js';
import level11 from './level11.js';
import level12 from './level12.js';
import level13 from './level13.js';
import level14 from './level14.js';

export const levels = [
  level01, level02, level03, level04, level05, level06, level07,
  level08, level09, level10, level11, level12, level13, level14,
];

export function levelById(id) {
  return levels.find((l) => l.id === id) ?? null;
}
