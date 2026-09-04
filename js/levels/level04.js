import { band } from './verify.js';

export const solution = 'R1 in out 220';

export default {
  id: 'led',
  title: { en: 'The LED and its ballast resistor', it: 'Il LED e la sua resistenza di zavorra' },
  text: {
    en: `<p>An LED is not a resistor: it is a <b>diode</b>. Below its forward voltage V<sub>f</sub> (about 2.0 V for a red one) almost nothing flows; above it, the current explodes exponentially. Connect it straight to 5 V and it dies in a flash — and this lab lets you watch: press Run with the starter 47 Ω and look for <code>burn</code> in the event log.</p>
<p>So the LED needs a <b>ballast resistor</b> that takes the difference: <b>R = (V<sub>in</sub> − V<sub>f</sub>) / I</b>. For 15 mA from 5 V: (5 − 2.0) / 0.015 = 200 Ω. The drawer has 180 and 220. Which one?</p>
<p>The supply is a USB port: nominally 5 V, but it may read 5.2 V. Choose the safe side — an LED is bright enough at 13 mA, and dead at 30.</p>`,
    it: `<p>Un LED non è una resistenza: è un <b>diodo</b>. Sotto la sua tensione diretta V<sub>f</sub> (circa 2,0 V per uno rosso) non passa quasi niente; sopra, la corrente esplode in modo esponenziale. Collegalo direttamente a 5 V e muore in un lampo — e questo laboratorio te lo fa vedere: premi Esegui con i 47 Ω di partenza e cerca <code>burn</code> nel log degli eventi.</p>
<p>Il LED ha quindi bisogno di una <b>resistenza di zavorra</b> che si prenda la differenza: <b>R = (V<sub>in</sub> − V<sub>f</sub>) / I</b>. Per 15 mA da 5 V: (5 − 2,0) / 0,015 = 200 Ω. Nel cassetto ci sono 180 e 220. Quale?</p>
<p>L'alimentazione è una porta USB: nominalmente 5 V, ma può dare 5,2 V. Stai dalla parte sicura — un LED è abbastanza luminoso a 13 mA, e morto a 30.</p>`,
  },
  goal: {
    en: 'Choose <code>R1</code> (E12) so the LED runs at <b>13–17 mA</b> on any USB port between 5.0 and 5.2 V.',
    it: 'Scegli <code>R1</code> (E12) perché il LED lavori a <b>13–17 mA</b> su qualunque porta USB tra 5,0 e 5,2 V.',
  },
  hints: [
    { en: 'Compute the current for both 180 and 220 Ω at 5.0 and 5.2 V. Which stays inside 13–17 mA on both?', it: 'Calcola la corrente per 180 e per 220 Ω a 5,0 e a 5,2 V. Quale resta tra 13 e 17 mA in entrambi i casi?' },
    { en: '<code>R1 in out 220</code>: 13.7 mA at 5 V, 14.6 mA at 5.2 V. 180 Ω would give 17.7 mA at 5.2 V.', it: '<code>R1 in out 220</code>: 13,7 mA a 5 V, 14,6 mA a 5,2 V. 180 Ω darebbe 17,7 mA a 5,2 V.' },
  ],
  start: 'R1 in out 47',
  fixture: (p) => `V1 in gnd DC ${p.vin}\nD1 out gnd LED\n.probe I(D1) out`,
  allowed: ['R'],
  maxElements: 1,
  e12: true,
  checks: [
    band('iled', { en: 'LED current', it: 'corrente nel LED' }, 'A', (m) => m.i('d1'), 0.013, 0.017),
  ],
  makeCases: () => [
    { visible: true, label: { en: 'USB at 5.0 V', it: 'USB a 5,0 V' }, params: { vin: 5.0 } },
    { visible: false, params: { vin: 5.2 } },
  ],
};
