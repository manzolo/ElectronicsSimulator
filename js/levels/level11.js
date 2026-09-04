import { band } from './verify.js';

export const solution = 'R1 in out 330';

export default {
  id: 'zener',
  title: { en: 'The Zener — a voltage reference', it: 'Lo zener — un riferimento di tensione' },
  text: {
    en: `<p>Every diode blocks reverse voltage — up to a point. A <b>Zener</b> is built so that point is precise and safe: push it backwards beyond its <b>V<sub>z</sub></b> (here 5.1 V) and it conducts as much as needed to hold the voltage there. It is a <em>voltage clamp</em>.</p>
<p>The classic <b>shunt regulator</b>: an unregulated input, a <b>dropping resistor</b> R1, and the Zener in parallel with the load. R1 sets the total current: <b>I = (V<sub>in</sub> − V<sub>z</sub>) / R1</b>. The load takes what it needs; the Zener eats the rest. Two ways to get it wrong: R1 too big and the Zener starves (below a few mA it stops regulating); R1 too small and it — or R1 — cooks. This Zener is a 0.5 W part.</p>
<p>The input comes from a battery pack: 12 V nominal, up to 13.5 V fresh. The load is 1 kΩ but may drop to 680 Ω.</p>`,
    it: `<p>Ogni diodo blocca la tensione inversa — fino a un certo punto. Uno <b>zener</b> è costruito perché quel punto sia preciso e sicuro: spingilo al contrario oltre la sua <b>V<sub>z</sub></b> (qui 5,1 V) e conduce quanto basta per tenere lì la tensione. È un <em>fermo di tensione</em>.</p>
<p>Il classico <b>regolatore shunt</b>: un ingresso non regolato, una <b>resistenza di caduta</b> R1, e lo zener in parallelo al carico. R1 fissa la corrente totale: <b>I = (V<sub>in</sub> − V<sub>z</sub>) / R1</b>. Il carico prende ciò che gli serve; lo zener si mangia il resto. Due modi per sbagliare: R1 troppo grande e lo zener muore di fame (sotto qualche mA smette di regolare); R1 troppo piccola e lui — o R1 — cuoce. Questo zener è da 0,5 W.</p>
<p>L'ingresso viene da un pacco batterie: 12 V nominali, fino a 13,5 V da nuovo. Il carico è 1 kΩ ma può scendere a 680 Ω.</p>`,
  },
  goal: {
    en: 'Choose <code>R1</code> (E12) so <code>out</code> stays at <b>4.9–5.3 V</b> with the Zener carrying <b>5–40 mA</b> in every case, and nothing burns.',
    it: 'Scegli <code>R1</code> (E12) perché <code>out</code> resti a <b>4,9–5,3 V</b> con lo zener che porta <b>5–40 mA</b> in ogni caso, e niente bruci.',
  },
  hints: [
    { en: 'Worst case for starving: 12 V in, 680 Ω load (7.5 mA). Worst case for heat: 13.5 V in, 1 kΩ load.', it: 'Caso peggiore per la fame: 12 V, carico 680 Ω (7,5 mA). Caso peggiore per il calore: 13,5 V, carico 1 kΩ.' },
    { en: '<code>R1 in out 330</code>: 21 mA total at 12 V, the Zener gets 13–16 mA; at 13.5 V it gets 20 mA and R1 dissipates 0.21 W.', it: '<code>R1 in out 330</code>: 21 mA totali a 12 V, allo zener ne restano 13–16; a 13,5 V ne prende 20 e R1 dissipa 0,21 W.' },
  ],
  start: 'R1 in out 47',
  fixture: (p) => `V1 in gnd DC ${p.vin}\nDZ1 gnd out ZENER 5.1\nRL out gnd ${p.rl}\n.probe out I(DZ1)`,
  allowed: ['R'],
  maxElements: 1,
  e12: true,
  checks: [
    band('vout', { en: 'V(out)', it: 'V(out)' }, 'V', (m) => m.v('out'), 4.9, 5.3),
    band('iz', { en: 'Zener current', it: 'corrente nello zener' }, 'A', (m) => -m.i('dz1'), 0.005, 0.040),
  ],
  makeCases: () => [
    { visible: true, label: { en: '12 V, load 1 kΩ', it: '12 V, carico 1 kΩ' }, params: { vin: 12, rl: 1000 } },
    { visible: true, label: { en: '12 V, load 680 Ω', it: '12 V, carico 680 Ω' }, params: { vin: 12, rl: 680 } },
    { visible: false, params: { vin: 13.5, rl: 1000 } },
    { visible: false, params: { vin: 13.5, rl: 680 } },
  ],
};
