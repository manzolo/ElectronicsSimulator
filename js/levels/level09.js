import { band } from './verify.js';

export const solution = 'D1 in out SI';

export default {
  id: 'diode',
  title: { en: 'The diode — a one-way valve', it: 'Il diodo — una valvola a senso unico' },
  text: {
    en: `<p>A <b>diode</b> lets current flow in one direction only: from <em>anode</em> to <em>cathode</em>, and only once the voltage across it exceeds about <b>0.7 V</b> (silicon). Backwards, it blocks. In the netlist you write <code>D1 anode cathode</code> — the order IS the polarity.</p>
<p>Feed a diode with a sine and you get the first half of every cycle and nothing on the second: a <b>half-wave rectifier</b>, the first step from AC to DC. Look at the scope: the output peak is not 5 V but about 4.3 V — the diode keeps its 0.7 V.</p>
<p>The starter has the diode in backwards. Watch what comes out, then fix it.</p>`,
    it: `<p>Un <b>diodo</b> lascia passare la corrente in una sola direzione: da <em>anodo</em> a <em>catodo</em>, e solo quando la tensione ai suoi capi supera circa <b>0,7 V</b> (silicio). All'indietro, blocca. Nella netlist si scrive <code>D1 anodo catodo</code> — l'ordine È la polarità.</p>
<p>Dai a un diodo una sinusoide e ottieni la prima metà di ogni ciclo e niente nella seconda: un <b>raddrizzatore a semionda</b>, il primo passo dalla corrente alternata alla continua. Guarda lo scopio: il picco d'uscita non è 5 V ma circa 4,3 V — il diodo si tiene i suoi 0,7 V.</p>
<p>Nella netlist di partenza il diodo è al contrario. Guarda cosa esce, poi correggi.</p>`,
  },
  goal: {
    en: 'Rectify the positive half-waves onto <code>out</code>: peak between <b>V<sub>amp</sub> − 1.0</b> and <b>V<sub>amp</sub> − 0.4</b> V, and nothing below −0.1 V.',
    it: 'Raddrizza le semionde positive su <code>out</code>: picco tra <b>V<sub>amp</sub> − 1,0</b> e <b>V<sub>amp</sub> − 0,4</b> V, e niente sotto −0,1 V.',
  },
  hints: [
    { en: 'Anode on the side the current comes from.', it: 'Anodo dal lato da cui arriva la corrente.' },
    { en: '<code>D1 in out SI</code>.', it: '<code>D1 in out SI</code>.' },
  ],
  start: 'D1 out in SI',
  fixture: (p) => `V1 in gnd SIN 0 ${p.amp} 50\nRL out gnd 1k\n.scope in out\n.tran 40m`,
  allowed: ['D'],
  maxElements: 1,
  checks: [
    band('peak', { en: 'peak of out', it: 'picco di out' }, 'V', (m) => m.vmax('out'), (p) => p.amp - 1.0, (p) => p.amp - 0.4),
    band('floor', { en: 'minimum of out', it: 'minimo di out' }, 'V', (m) => m.vmin('out'), -0.1, null),
  ],
  makeCases: () => [
    { visible: true, label: { en: '5 V peak, 50 Hz', it: '5 V di picco, 50 Hz' }, params: { amp: 5 } },
    { visible: false, params: { amp: 6 } },
  ],
};
