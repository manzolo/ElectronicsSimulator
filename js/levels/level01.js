import { band } from './verify.js';

// 9 V, 20 mA → 450 Ω. Not an E12 value on purpose: this level is about the law,
// the drawer of real resistors arrives in level 2.
export const solution = 'R1 in gnd 450';

export default {
  id: 'ohm',
  title: { en: "Ohm's law — one battery, one resistor", it: 'La legge di Ohm — una pila, una resistenza' },
  text: {
    en: `<p>Everything starts here: a voltage <b>V</b> across a resistance <b>R</b> pushes a current <b>I = V / R</b>. Push 9 V through 1 kΩ and 9 mA flow; halve the resistance and the current doubles.</p>
<p>The resistor also <em>heats</em>: it dissipates a power <b>P = V · I</b> (or V²/R). A common resistor is rated ¼ W — ask it for more and it burns. The engine will show you: the readings table has a bar that fills up as the part approaches its rating.</p>
<p>The board gives you a 9 V battery between <code>in</code> and <code>gnd</code>. You add <code>R1</code>.</p>`,
    it: `<p>Tutto comincia qui: una tensione <b>V</b> ai capi di una resistenza <b>R</b> spinge una corrente <b>I = V / R</b>. Spingi 9 V in 1 kΩ e scorrono 9 mA; dimezza la resistenza e la corrente raddoppia.</p>
<p>La resistenza inoltre <em>scalda</em>: dissipa una potenza <b>P = V · I</b> (oppure V²/R). Una resistenza comune è da ¼ W — chiedile di più e brucia. Il motore te lo fa vedere: nella tabella delle letture c'è una barra che si riempie man mano che il componente si avvicina al suo limite.</p>
<p>La scheda ti dà una pila da 9 V tra <code>in</code> e <code>gnd</code>. Tu aggiungi <code>R1</code>.</p>`,
  },
  goal: {
    en: 'Choose <code>R1</code> so that <b>20 mA</b> (±5%) flow through it. Read its power too: does a ¼ W part survive?',
    it: 'Scegli <code>R1</code> perché ci scorrano <b>20 mA</b> (±5%). Leggi anche la potenza: una da ¼ W sopravvive?',
  },
  hints: [
    { en: 'R = V / I. Nine volts divided by twenty milliamps.', it: 'R = V / I. Nove volt diviso venti milliampere.' },
    { en: '9 / 0.020 = 450 Ω → <code>R1 in gnd 450</code>. Power: 9 · 0.02 = 0.18 W, under ¼ W.', it: '9 / 0,020 = 450 Ω → <code>R1 in gnd 450</code>. Potenza: 9 · 0,02 = 0,18 W, sotto ¼ W.' },
  ],
  start: 'R1 in gnd 1k',
  fixture: (p) => `V1 in gnd DC ${p.vin}\n.probe I(R1)`,
  allowed: ['R'],
  maxElements: 1,
  checks: [
    band('current', { en: 'current through R1', it: 'corrente in R1' }, 'A', (m) => m.i('r1'), 0.019, 0.021),
  ],
  makeCases: () => [
    { visible: true, label: { en: 'fresh 9 V battery', it: 'pila da 9 V nuova' }, params: { vin: 9 } },
    { visible: false, params: { vin: 9.2 } },
  ],
};
