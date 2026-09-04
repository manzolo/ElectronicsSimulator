import { band } from './verify.js';

export const solution = 'R1 in out 150\nR2 out gnd 100';

export default {
  id: 'divider-load',
  title: { en: 'The divider under load', it: 'Il partitore sotto carico' },
  text: {
    en: `<p>Your 5.6k/3.3k divider gave a lovely 3.3 V — into a 10 MΩ meter. Now connect a real load, <code>RL</code> = 1 kΩ, and watch the output <em>collapse</em>: the load is in parallel with R2, and 1 kΩ ∥ 3.3 kΩ is nothing like 3.3 kΩ.</p>
<p>A divider is a <b>Thévenin source</b>: an ideal voltage V<sub>th</sub> = V<sub>in</sub>·R2/(R1+R2) behind an internal resistance R<sub>th</sub> = R1 ∥ R2. The load sees V<sub>out</sub> = V<sub>th</sub> · RL / (RL + R<sub>th</sub>). To hold the voltage under load, R<sub>th</sub> must be <em>small</em> compared with RL — which means small resistors, more current, and more heat. Check the power on R1.</p>
<p>The load is not precise: expect anything from 820 Ω to 1.2 kΩ. Your divider has to hold on all of them.</p>`,
    it: `<p>Il tuo partitore 5,6k/3,3k dava un bellissimo 3,3 V — su un multimetro da 10 MΩ. Ora collega un carico vero, <code>RL</code> = 1 kΩ, e guarda l'uscita <em>crollare</em>: il carico è in parallelo a R2, e 1 kΩ ∥ 3,3 kΩ non somiglia per niente a 3,3 kΩ.</p>
<p>Un partitore è una <b>sorgente di Thévenin</b>: una tensione ideale V<sub>th</sub> = V<sub>in</sub>·R2/(R1+R2) dietro una resistenza interna R<sub>th</sub> = R1 ∥ R2. Il carico vede V<sub>out</sub> = V<sub>th</sub> · RL / (RL + R<sub>th</sub>). Per tenere la tensione sotto carico, R<sub>th</sub> deve essere <em>piccola</em> rispetto a RL — cioè resistenze piccole, più corrente, più calore. Controlla la potenza su R1.</p>
<p>Il carico non è preciso: aspettati qualunque valore tra 820 Ω e 1,2 kΩ. Il tuo partitore deve reggere su tutti.</p>`,
  },
  goal: {
    en: 'Hold <code>out</code> within <b>5% of 3.3 V</b> with the load attached (any load from 820 Ω to 1.2 kΩ), E12 values only — without burning R1.',
    it: 'Tieni <code>out</code> entro il <b>5% di 3,3 V</b> col carico attaccato (qualunque carico da 820 Ω a 1,2 kΩ), solo valori E12 — senza bruciare R1.',
  },
  hints: [
    { en: 'Aim the unloaded voltage a little ABOVE 3.3 V, with R1 ∥ R2 around 60 Ω.', it: 'Punta la tensione a vuoto un po\' SOPRA 3,3 V, con R1 ∥ R2 intorno a 60 Ω.' },
    { en: '<code>R1 in out 150</code>, <code>R2 out gnd 100</code>: V<sub>th</sub> = 3.6 V, R<sub>th</sub> = 60 Ω → 3.40 V on 1 kΩ. R1 dissipates 0.21 W — close, but under ¼ W.', it: '<code>R1 in out 150</code>, <code>R2 out gnd 100</code>: V<sub>th</sub> = 3,6 V, R<sub>th</sub> = 60 Ω → 3,40 V su 1 kΩ. R1 dissipa 0,21 W — vicino, ma sotto ¼ W.' },
  ],
  start: 'R1 in out 5.6k\nR2 out gnd 3.3k',
  fixture: (p) => `V1 in gnd DC 9\nRL out gnd ${p.rl}\n.probe out I(R1)`,
  allowed: ['R'],
  maxElements: 2,
  e12: true,
  checks: [
    band('vout', { en: 'V(out) under load', it: 'V(out) sotto carico' }, 'V', (m) => m.v('out'), 3.3 * 0.95, 3.3 * 1.05),
  ],
  makeCases: () => [
    { visible: true, label: { en: 'load 1 kΩ', it: 'carico 1 kΩ' }, params: { rl: 1000 } },
    { visible: true, label: { en: 'load 820 Ω', it: 'carico 820 Ω' }, params: { rl: 820 } },
    { visible: false, params: { rl: 1200 } },
    { visible: false, params: { rl: 910 } },
  ],
};
