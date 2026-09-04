import { band } from './verify.js';

export const solution = '.replace C1';

// Capstone: the reservoir capacitor has dried out (2200 µF → 22 µF). The
// symptom is at the OUTPUT (low, humming), the cause is two stages upstream.
export default {
  id: 'fault-hum',
  title: { en: 'Capstone — low voltage and a hum', it: 'Capstone — tensione bassa e ronzio' },
  text: {
    en: `<p>The real thing. A complete stabilized supply: bridge (<code>D1–D4</code>) → reservoir <code>C1</code> → Zener reference (<code>R1</code>, <code>DZ1</code> at 6.2 V) → <b>series pass transistor</b> <code>Q1</code>, an emitter follower that copies the reference minus 0.7 V onto the output → <code>C2</code> → load. It should give a clean 5.5 V. The complaint: "the voltage is low and there is a hum".</p>
<p>A hum is 50 or 100 Hz ripple getting through. The output capacitor <code>C2</code> is the tempting suspect — it's right there where the symptom is. Before you replace it, <em>look upstream</em>: put the scope on <code>p</code> and on <code>z</code>. A regulator can only regulate if what comes in stays <b>above</b> what should come out; if the input dips below the reference on every cycle, the output dips with it — and no output capacitor can fix that.</p>
<p>Electrolytics dry out with age: their capacitance drops to a fraction of the label. Measure, deduce, replace <b>one</b> part.</p>`,
    it: `<p>Quella vera. Un alimentatore stabilizzato completo: ponte (<code>D1–D4</code>) → livellamento <code>C1</code> → riferimento zener (<code>R1</code>, <code>DZ1</code> a 6,2 V) → <b>transistor serie</b> <code>Q1</code>, un inseguitore di emettitore che copia il riferimento meno 0,7 V sull'uscita → <code>C2</code> → carico. Dovrebbe dare 5,5 V puliti. La lamentela: «la tensione è bassa e c'è un ronzio».</p>
<p>Un ronzio è ripple a 50 o 100 Hz che passa. Il condensatore d'uscita <code>C2</code> è il sospetto comodo — sta proprio dove sta il sintomo. Prima di sostituirlo, <em>guarda a monte</em>: metti lo scopio su <code>p</code> e su <code>z</code>. Un regolatore può regolare solo se ciò che entra resta <b>sopra</b> ciò che deve uscire; se l'ingresso a ogni ciclo scende sotto il riferimento, l'uscita scende con lui — e nessun condensatore d'uscita può rimediare.</p>
<p>Gli elettrolitici invecchiando si seccano: la capacità cala a una frazione di quella scritta. Misura, deduci, sostituisci <b>un</b> componente.</p>`,
  },
  goal: {
    en: 'Diagnose with the instruments and <code>.replace</code> the faulty part (one only): <code>out</code> back to <b>5.2–5.8 V</b> with less than <b>50 mV</b> of ripple, on any load from 100 to 82 Ω.',
    it: 'Diagnostica con gli strumenti e sostituisci con <code>.replace</code> il componente guasto (uno solo): <code>out</code> torna a <b>5,2–5,8 V</b> con meno di <b>50 mV</b> di ripple, con qualunque carico da 100 a 82 Ω.',
  },
  hints: [
    { en: 'Scope <code>p</code>: a healthy reservoir shows 13 V with a small sawtooth. What do you see? How deep does it dip?', it: 'Scopio su <code>p</code>: un livellamento sano mostra 13 V con un piccolo dente di sega. Cosa vedi? Fin dove scende?' },
    { en: '<code>p</code> swings by 8 V and dips to 5 V — below the 6.2 V reference. C1 has lost its capacitance: <code>.replace C1</code>. Replacing C2 changes nothing.', it: '<code>p</code> oscilla di 8 V e scende a 5 V — sotto il riferimento di 6,2 V. C1 ha perso la capacità: <code>.replace C1</code>. Sostituire C2 non cambia niente.' },
  ],
  start: '.probe out',
  fixture: (p) => `V1 a b SIN 0 15 50\nD1 a p 1N4007\nD2 b p 1N4007\nD3 gnd a 1N4007\nD4 gnd b 1N4007\nC1 p gnd 2200u\nR1 p z 1k\nDZ1 gnd z ZENER 6.2\nQ1 p z out NPN\nC2 out gnd 100u\nRL out gnd ${p.rl} 2W\n.scope p out\n.tran 80m`,
  allowed: [],
  maxElements: 0,
  maxReplace: 1,
  checks: [
    band('vout', { en: 'mean V(out)', it: 'V(out) media' }, 'V', (m) => m.vavg('out'), 5.2, 5.8),
    band('ripple', { en: 'ripple on out', it: 'ripple su out' }, 'V', (m) => m.vpp('out'), null, 0.05),
  ],
  makeCases: () => [
    { visible: true, label: { en: 'the board as it came in (load 100 Ω)', it: 'la scheda com\'è arrivata (carico 100 Ω)' }, params: { rl: 100 }, faults: { c1: { kind: 'value', value: 22e-6 } } },
    { visible: false, params: { rl: 82 }, faults: { c1: { kind: 'value', value: 22e-6 } } },
  ],
};
