import { band } from './verify.js';

export const solution = '.replace D1';

// A hidden defect: D1 has gone open. Symptom: no output at all. The AC is
// still on the anode; nothing after the diode. That is the whole diagnosis.
export default {
  id: 'fault-dead',
  title: { en: 'Fault — the power supply is dead', it: 'Guasto — l\'alimentatore non parte' },
  text: {
    en: `<p>From here on you stop designing and start <b>repairing</b>. The board is a small linear supply: transformer secondary (12 V peak sine on <code>a</code>) → rectifier diode <code>D1</code> → reservoir <code>C1</code> → dropping resistor <code>R1</code> → Zener <code>DZ1</code> → load. It should give 5.1 V. It gives nothing.</p>
<p>You cannot change the schematic, and you cannot see inside the parts — a broken diode looks exactly like a good one. What you have is <b>the probe</b>: <code>.probe node</code> reads a voltage, <code>.probe I(part)</code> a current, <code>.scope node</code> shows the waveform; you can also click a rail or a part in the schematic. The rule of the bench: <em>follow the signal from the input until it disappears.</em> Where it disappears, the fault is.</p>
<p>When you know which part is broken, replace it: <code>.replace D1</code>. You may replace <b>one</b> part. The board must then work on any load.</p>`,
    it: `<p>Da qui in avanti smetti di progettare e cominci a <b>riparare</b>. La scheda è un piccolo alimentatore lineare: secondario del trasformatore (sinusoide da 12 V di picco su <code>a</code>) → diodo raddrizzatore <code>D1</code> → condensatore di livellamento <code>C1</code> → resistenza di caduta <code>R1</code> → zener <code>DZ1</code> → carico. Dovrebbe dare 5,1 V. Non dà niente.</p>
<p>Lo schema non lo puoi cambiare, e dentro i componenti non puoi vedere — un diodo rotto è identico a uno sano. Quello che hai è <b>la sonda</b>: <code>.probe nodo</code> legge una tensione, <code>.probe I(componente)</code> una corrente, <code>.scope nodo</code> mostra la forma d'onda; puoi anche cliccare un nodo o un componente nello schema. La regola del banco: <em>segui il segnale dall'ingresso finché non sparisce.</em> Dove sparisce, lì è il guasto.</p>
<p>Quando sai qual è il componente rotto, sostituiscilo: <code>.replace D1</code>. Puoi sostituire <b>un</b> componente. La scheda deve poi funzionare con qualunque carico.</p>`,
  },
  goal: {
    en: 'Find the broken part by measuring and <code>.replace</code> it (one replacement only): <code>out</code> must come back to <b>4.9–5.3 V</b>.',
    it: 'Trova il componente rotto misurando e sostituiscilo con <code>.replace</code> (una sola sostituzione): <code>out</code> deve tornare a <b>4,9–5,3 V</b>.',
  },
  hints: [
    { en: 'Probe <code>a</code> (before D1) and <code>p</code> (after it). Is the AC there? Is anything after the diode?', it: 'Sonda su <code>a</code> (prima di D1) e su <code>p</code> (dopo). L\'alternata c\'è? Dopo il diodo c\'è qualcosa?' },
    { en: '12 V of sine on <code>a</code>, flat zero on <code>p</code>, zero current in D1: the diode is open. <code>.replace D1</code>.', it: '12 V di sinusoide su <code>a</code>, zero piatto su <code>p</code>, corrente zero in D1: il diodo è aperto. <code>.replace D1</code>.' },
  ],
  start: '.probe out',
  fixture: (p) => `V1 a gnd SIN 0 12 50\nD1 a p 1N4007\nC1 p gnd 1000u\nR1 p out 220\nDZ1 gnd out ZENER 5.1\nRL out gnd ${p.rl}\n.scope a p\n.tran 60m`,
  allowed: [],
  maxElements: 0,
  maxReplace: 1,
  checks: [
    band('vout', { en: 'mean V(out)', it: 'V(out) media' }, 'V', (m) => m.vavg('out'), 4.9, 5.3),
    band('ripple', { en: 'ripple on out', it: 'ripple su out' }, 'V', (m) => m.vpp('out'), null, 0.1),
  ],
  makeCases: () => [
    { visible: true, label: { en: 'the board as it came in (load 1 kΩ)', it: 'la scheda com\'è arrivata (carico 1 kΩ)' }, params: { rl: 1000 }, faults: { d1: { kind: 'open' } } },
    { visible: false, params: { rl: 680 }, faults: { d1: { kind: 'open' } } },
  ],
};
