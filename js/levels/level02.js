import { band } from './verify.js';

export const solution = 'R1 in out 5.6k\nR2 out gnd 3.3k';

export default {
  id: 'divider',
  title: { en: 'Series & parallel — the voltage divider', it: 'Serie e parallelo — il partitore di tensione' },
  text: {
    en: `<p>Two resistors in <b>series</b> carry the same current, so the voltage splits in proportion to their values: <b>V<sub>out</sub> = V<sub>in</sub> · R2 / (R1 + R2)</b>. That is the <em>voltage divider</em>, the most used two-part circuit in electronics.</p>
<p>From now on you pick values from a real drawer: the <b>E12 series</b> — 1.0 1.2 1.5 1.8 2.2 2.7 3.3 3.9 4.7 5.6 6.8 8.2 (times any power of ten). There is no 450 Ω resistor in the shop; there is 470.</p>
<p>The battery is 9 V; the meter across <code>out</code> has a 10 MΩ input, so it barely disturbs the circuit. Don't waste the battery: keep the total current under 5 mA.</p>`,
    it: `<p>Due resistenze in <b>serie</b> portano la stessa corrente, quindi la tensione si divide in proporzione ai loro valori: <b>V<sub>out</sub> = V<sub>in</sub> · R2 / (R1 + R2)</b>. È il <em>partitore di tensione</em>, il circuito a due componenti più usato dell'elettronica.</p>
<p>Da qui in avanti i valori li peschi da un cassetto vero: la <b>serie E12</b> — 1,0 1,2 1,5 1,8 2,2 2,7 3,3 3,9 4,7 5,6 6,8 8,2 (per qualunque potenza di dieci). In negozio una resistenza da 450 Ω non esiste; c'è la 470.</p>
<p>La pila è da 9 V; il multimetro su <code>out</code> ha 10 MΩ d'ingresso, quindi disturba appena il circuito. Non sprecare la pila: tieni la corrente totale sotto 5 mA.</p>`,
  },
  goal: {
    en: 'Get <b>3.3 V</b> (±3%) on <code>out</code> with two E12 resistors, drawing less than 5 mA from the battery.',
    it: 'Ottieni <b>3,3 V</b> (±3%) su <code>out</code> con due resistenze E12, assorbendo meno di 5 mA dalla pila.',
  },
  hints: [
    { en: 'You need R2/(R1+R2) ≈ 0.367. Try ratios of E12 values: 3.3/(5.6+3.3)?', it: 'Serve R2/(R1+R2) ≈ 0,367. Prova rapporti tra valori E12: 3,3/(5,6+3,3)?' },
    { en: '<code>R1 in out 5.6k</code> and <code>R2 out gnd 3.3k</code> give 3.34 V at about 1 mA.', it: '<code>R1 in out 5.6k</code> e <code>R2 out gnd 3.3k</code> danno 3,34 V a circa 1 mA.' },
  ],
  start: 'R1 in out 1k\nR2 out gnd 1k',
  fixture: (p) => `V1 in gnd DC ${p.vin}\nRM out gnd ${p.rm}\n.probe out`,
  allowed: ['R'],
  maxElements: 2,
  e12: true,
  checks: [
    band('vout', { en: 'V(out)', it: 'V(out)' }, 'V', (m) => m.v('out'), 3.3 * 0.97, 3.3 * 1.03),
    band('itot', { en: 'battery current', it: 'corrente della pila' }, 'A', (m) => m.i('v1'), null, 0.005),
  ],
  makeCases: () => [
    { visible: true, label: { en: '9 V, meter 10 MΩ', it: '9 V, strumento 10 MΩ' }, params: { vin: 9, rm: 10e6 } },
    { visible: false, params: { vin: 9, rm: 1e6 } },
  ],
};
