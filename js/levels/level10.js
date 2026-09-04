import { band } from './verify.js';

export const solution = 'C1 p gnd 470u';

export default {
  id: 'bridge-ripple',
  title: { en: 'Bridge rectifier and the reservoir capacitor', it: 'Ponte di Graetz e condensatore di livellamento' },
  text: {
    en: `<p>Four diodes arranged as a <b>bridge</b> (Graetz) use <em>both</em> half-waves: whichever way the transformer swings, the current is steered the same way through the load. The output is a bumpy 100 Hz pulsating voltage — still not DC.</p>
<p>A big <b>reservoir capacitor</b> across the output fills at each peak and feeds the load in between. The voltage no longer drops to zero but sags a little between peaks: that sag is the <b>ripple</b>, and it is roughly <b>V<sub>ripple</sub> ≈ I<sub>load</sub> / (2f · C)</b> (2f because the bridge gives two peaks per cycle). More load or less capacitance → more ripple.</p>
<p>The bridge is built (rectifier diodes, 1N4007 — note the fixture uses those, not the small-signal SI: charging a big capacitor draws a large inrush). You add <code>C1</code> between <code>p</code> and <code>gnd</code>. The load is 470 Ω nominal but may be as heavy as 390 Ω.</p>`,
    it: `<p>Quattro diodi disposti a <b>ponte</b> (di Graetz) usano <em>entrambe</em> le semionde: in qualunque verso oscilli il trasformatore, la corrente viene indirizzata nello stesso verso attraverso il carico. L'uscita è una tensione pulsante a 100 Hz — ancora non continua.</p>
<p>Un grosso <b>condensatore di livellamento</b> in parallelo all'uscita si riempie a ogni picco e alimenta il carico negli intervalli. La tensione non scende più a zero ma cede un po' tra un picco e l'altro: quel cedimento è il <b>ripple</b>, e vale circa <b>V<sub>ripple</sub> ≈ I<sub>carico</sub> / (2f · C)</b> (2f perché il ponte dà due picchi per ciclo). Più carico o meno capacità → più ripple.</p>
<p>Il ponte è già montato (diodi raddrizzatori 1N4007 — nota che la scheda usa quelli, non gli SI da segnale: caricare un grosso condensatore assorbe una forte corrente di spunto). Tu aggiungi <code>C1</code> tra <code>p</code> e <code>gnd</code>. Il carico è 470 Ω nominali ma può arrivare a 390 Ω.</p>`,
  },
  goal: {
    en: 'Choose <code>C1</code> so the ripple on <code>p</code> stays under <b>0.4 V<sub>pp</sub></b> on any load from 470 down to 390 Ω, without oversizing (≤ 1000 µF).',
    it: 'Scegli <code>C1</code> perché il ripple su <code>p</code> resti sotto <b>0,4 V<sub>pp</sub></b> con qualunque carico da 470 a 390 Ω, senza esagerare (≤ 1000 µF).',
  },
  hints: [
    { en: 'I ≈ 7 V / 390 Ω ≈ 18 mA. C ≥ I / (100 Hz · 0.4 V) ≈ 450 µF.', it: 'I ≈ 7 V / 390 Ω ≈ 18 mA. C ≥ I / (100 Hz · 0,4 V) ≈ 450 µF.' },
    { en: '<code>C1 p gnd 470u</code>: 0.26 V of ripple at 470 Ω, 0.32 V at 390 Ω. 330 µF passes the visible case and fails the heavy load.', it: '<code>C1 p gnd 470u</code>: 0,26 V di ripple a 470 Ω, 0,32 V a 390 Ω. 330 µF passa il caso visibile e fallisce col carico pesante.' },
  ],
  start: 'C1 p gnd 10u',
  fixture: (p) => `V1 a b SIN 0 8.5 50\nD1 a p 1N4007\nD2 b p 1N4007\nD3 gnd a 1N4007\nD4 gnd b 1N4007\nRL p gnd ${p.rl}\n.scope a p\n.probe p\n.tran 60m`,
  allowed: ['C'],
  maxElements: 1,
  checks: [
    band('ripple', { en: 'ripple on p', it: 'ripple su p' }, 'V', (m) => m.vpp('p'), null, 0.4),
    band('vavg', { en: 'mean of p', it: 'media di p' }, 'V', (m) => m.vavg('p'), 6, 8.5),
    band('size', { en: 'C1 value', it: 'valore di C1' }, 'F', (m) => m.value('c1'), null, 1000e-6),
  ],
  makeCases: () => [
    { visible: true, label: { en: 'load 470 Ω', it: 'carico 470 Ω' }, params: { rl: 470 } },
    { visible: false, params: { rl: 390 } },
  ],
};
