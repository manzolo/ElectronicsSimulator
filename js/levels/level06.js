import { band } from './verify.js';

export const solution = 'C1 top gnd 100u';

export default {
  id: 'rc-time',
  title: { en: 'The capacitor and the time constant', it: 'Il condensatore e la costante di tempo' },
  text: {
    en: `<p>A capacitor <b>stores charge</b>: Q = C · V. Charge it, remove the source, and it releases that charge through whatever is connected — the voltage does not drop to zero, it <em>decays</em>: <b>V(t) = V₀ · e<sup>−t/τ</sup></b> with <b>τ = R · C</b>. After one time constant the voltage is down to 37% (1/e); after five it is practically gone.</p>
<p>This is the first level where <em>time</em> matters, so the engine switches to a transient: after the operating point, each tick is one time step. The oscilloscope below shows <code>top</code>.</p>
<p>The board: a 5 V source that drops to 0 V at t = 0 (a <code>STEP</code>), a diode so the source cannot discharge the capacitor backwards, and a 10 kΩ resistor that does the discharging. You add <code>C1</code>.</p>`,
    it: `<p>Un condensatore <b>accumula carica</b>: Q = C · V. Caricalo, togli la sorgente, e restituisce quella carica attraverso ciò che ha collegato — la tensione non va a zero di colpo, <em>decade</em>: <b>V(t) = V₀ · e<sup>−t/τ</sup></b> con <b>τ = R · C</b>. Dopo una costante di tempo la tensione è scesa al 37% (1/e); dopo cinque è praticamente sparita.</p>
<p>È il primo livello in cui conta il <em>tempo</em>, quindi il motore passa al transitorio: dopo il punto di lavoro, ogni tick è un passo temporale. L'oscilloscopio sotto mostra <code>top</code>.</p>
<p>La scheda: una sorgente da 5 V che a t = 0 scende a 0 V (uno <code>STEP</code>), un diodo perché la sorgente non possa scaricare il condensatore all'indietro, e una resistenza da 10 kΩ che fa la scarica. Tu aggiungi <code>C1</code>.</p>`,
  },
  goal: {
    en: 'Choose <code>C1</code> so that <b>τ = 1 s</b>: one second after the step, <code>top</code> must be at 33–41% of its initial value.',
    it: 'Scegli <code>C1</code> perché <b>τ = 1 s</b>: un secondo dopo il gradino, <code>top</code> deve stare al 33–41% del valore iniziale.',
  },
  hints: [
    { en: 'τ = R · C → C = τ / R = 1 s / 10 kΩ.', it: 'τ = R · C → C = τ / R = 1 s / 10 kΩ.' },
    { en: '1 / 10 000 = 100 µF → <code>C1 top gnd 100u</code>.', it: '1 / 10 000 = 100 µF → <code>C1 top gnd 100u</code>.' },
  ],
  start: 'C1 top gnd 10u',
  fixture: (p) => `V1 in gnd STEP ${p.v0} 0 0\nD1 in top SI\nR1 top gnd 10k\n.scope top\n.probe top\n.tran 2`,
  allowed: ['C'],
  maxElements: 1,
  checks: [
    band('ratio', { en: 'V(top) at 1 s / V(top) at 0', it: 'V(top) a 1 s / V(top) a 0' }, '', (m) => m.vAt('top', 1) / m.vAt('top', 0), 0.33, 0.41),
  ],
  makeCases: () => [
    { visible: true, label: { en: 'charged to 5 V', it: 'caricato a 5 V' }, params: { v0: 5 } },
    { visible: false, params: { v0: 6 } },
  ],
};
