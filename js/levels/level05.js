import { band } from './verify.js';

export const solution = 'R4 b gnd 10k';

export default {
  id: 'kirchhoff',
  title: { en: "Kirchhoff's laws — balancing the bridge", it: 'Le leggi di Kirchhoff — bilanciare il ponte' },
  text: {
    en: `<p>Two laws describe every circuit. <b>KCL</b>: the currents entering a node add up to zero (charge does not pile up). <b>KVL</b>: the voltages around any loop add up to zero. Every reading in this lab comes from solving those two laws on every node at once — the engine literally builds that system of equations and iterates it (watch the <code>iterate</code> ticks).</p>
<p>The classic exercise is the <b>Wheatstone bridge</b>: two dividers side by side, R1/R2 on the left and R3/R4 on the right, with a meter <code>Rm</code> between their midpoints <code>a</code> and <code>b</code>. When the two ratios match — <b>R1/R2 = R3/R4</b> — the midpoints sit at the same voltage and <em>no current flows through Rm</em>, whatever the supply voltage. That is how strain gauges and precision thermometers still work today.</p>
<p>R1 = 1k, R2 = 2.2k, R3 = 4.7k are given. Find R4.</p>`,
    it: `<p>Due leggi descrivono ogni circuito. <b>KCL</b>: le correnti che entrano in un nodo sommano a zero (la carica non si accumula). <b>KVL</b>: le tensioni lungo qualunque maglia sommano a zero. Ogni lettura di questo laboratorio nasce risolvendo quelle due leggi su tutti i nodi insieme — il motore costruisce letteralmente quel sistema di equazioni e lo itera (guarda i tick <code>iterate</code>).</p>
<p>L'esercizio classico è il <b>ponte di Wheatstone</b>: due partitori affiancati, R1/R2 a sinistra e R3/R4 a destra, con uno strumento <code>Rm</code> tra i punti di mezzo <code>a</code> e <code>b</code>. Quando i due rapporti coincidono — <b>R1/R2 = R3/R4</b> — i punti di mezzo stanno alla stessa tensione e <em>in Rm non scorre corrente</em>, qualunque sia la tensione di alimentazione. È così che funzionano ancora oggi gli estensimetri e i termometri di precisione.</p>
<p>R1 = 1k, R2 = 2,2k, R3 = 4,7k sono dati. Trova R4.</p>`,
  },
  goal: {
    en: 'Choose <code>R4</code> (E12) so that the current through <code>Rm</code> stays under <b>50 µA</b> — with the bridge fed at 9 V <em>and</em> at 12 V.',
    it: 'Scegli <code>R4</code> (E12) perché la corrente in <code>Rm</code> resti sotto <b>50 µA</b> — col ponte alimentato a 9 V <em>e</em> a 12 V.',
  },
  hints: [
    { en: 'Balance: R4 = R3 · R2 / R1 = 4.7k · 2.2 / 1. Round to E12.', it: 'Bilanciamento: R4 = R3 · R2 / R1 = 4,7k · 2,2 / 1. Arrotonda alla E12.' },
    { en: '10.34 kΩ → <code>R4 b gnd 10k</code>. The residual imbalance leaves about 13 µA in Rm at 9 V.', it: '10,34 kΩ → <code>R4 b gnd 10k</code>. Lo sbilanciamento residuo lascia circa 13 µA in Rm a 9 V.' },
  ],
  start: 'R4 b gnd 1k',
  fixture: (p) => `V1 top gnd DC ${p.vin}\nR1 top a 1k\nR2 a gnd 2.2k\nR3 top b 4.7k\nRm a b 1k\n.probe a b I(Rm)`,
  allowed: ['R'],
  maxElements: 1,
  e12: true,
  checks: [
    band('im', { en: '|I(Rm)|', it: '|I(Rm)|' }, 'A', (m) => Math.abs(m.i('rm')), null, 50e-6),
  ],
  makeCases: () => [
    { visible: true, label: { en: 'fed at 9 V', it: 'alimentato a 9 V' }, params: { vin: 9 } },
    { visible: false, params: { vin: 12 } },
  ],
};
