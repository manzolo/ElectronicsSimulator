import { band } from './verify.js';

export const solution = 'Rb bin b 680';

export default {
  id: 'bjt-switch',
  title: { en: 'The transistor as a switch', it: 'Il transistor come interruttore' },
  text: {
    en: `<p>A bipolar transistor (<b>BJT</b>) is a current amplifier: a small current into the <em>base</em> lets a current about <b>β</b> times larger (here β ≈ 100) flow from <em>collector</em> to <em>emitter</em>. Used as a <b>switch</b> we don't want "about": we want it fully ON — <em>saturated</em>, collector nearly at ground — or fully OFF.</p>
<p>The board: a 12 V load of 100 Ω (120 mA — a relay coil or a lamp) in the collector, and a microcontroller pin toggling 0 ↔ 3.3 V at 1 kHz. To saturate you need I<sub>b</sub> ≥ I<sub>c</sub>/β = 1.2 mA — and in practice <b>2–3× that</b>, because β is a loose number (a hidden case has a transistor with β = 60). The base resistor sets it: <b>R<sub>b</sub> = (3.3 − 0.7) / I<sub>b</sub></b>.</p>
<p>But the pin has a limit too: a GPIO can source at most about 8 mA. Too small an R<sub>b</sub> saves the transistor and kills the microcontroller.</p>`,
    it: `<p>Un transistor bipolare (<b>BJT</b>) è un amplificatore di corrente: una piccola corrente nella <em>base</em> lascia scorrere dal <em>collettore</em> all'<em>emettitore</em> una corrente circa <b>β</b> volte più grande (qui β ≈ 100). Usato come <b>interruttore</b> il «circa» non ci interessa: lo vogliamo tutto acceso — <em>saturo</em>, collettore quasi a massa — o tutto spento.</p>
<p>La scheda: un carico da 12 V e 100 Ω (120 mA — la bobina di un relè o una lampadina) sul collettore, e il pin di un microcontrollore che commuta 0 ↔ 3,3 V a 1 kHz. Per saturare serve I<sub>b</sub> ≥ I<sub>c</sub>/β = 1,2 mA — e in pratica <b>2–3 volte tanto</b>, perché β è un numero ballerino (in un caso nascosto c'è un transistor con β = 60). La resistenza di base la fissa: <b>R<sub>b</sub> = (3,3 − 0,7) / I<sub>b</sub></b>.</p>
<p>Ma anche il pin ha un limite: un GPIO eroga al massimo 8 mA circa. Una R<sub>b</sub> troppo piccola salva il transistor e uccide il microcontrollore.</p>`,
  },
  goal: {
    en: 'Choose <code>Rb</code> (E12) so that when the pin is high the collector drops below <b>0.5 V</b> (even with β = 60), when low it is back at 12 V, and the base current never exceeds <b>8 mA</b>.',
    it: 'Scegli <code>Rb</code> (E12) perché col pin alto il collettore scenda sotto <b>0,5 V</b> (anche con β = 60), col pin basso torni a 12 V, e la corrente di base non superi mai <b>8 mA</b>.',
  },
  hints: [
    { en: 'With β = 60 you need 2 mA; take 3–4 mA of margin. R<sub>b</sub> = 2.6 V / 0.0035 ≈ 740 Ω.', it: 'Con β = 60 servono 2 mA; prendi 3–4 mA di margine. R<sub>b</sub> = 2,6 V / 0,0035 ≈ 740 Ω.' },
    { en: '<code>Rb bin b 680</code>: 3.8 mA of base current, collector at 0.1 V. 1.8k would leave the collector at 3.5 V with β = 60.', it: '<code>Rb bin b 680</code>: 3,8 mA di base, collettore a 0,1 V. Con 1,8k il collettore resterebbe a 3,5 V con β = 60.' },
  ],
  start: 'Rb bin b 10k',
  fixture: (p) => `V1 vcc gnd DC 12\nRL vcc c 100 5W\nVin bin gnd PULSE 0 3.3 1k\nQ1 c b gnd NPN ${p.beta}\n.scope bin c\n.probe c I(Rb)\n.tran 2m`,
  allowed: ['R'],
  maxElements: 1,
  e12: true,
  checks: [
    band('sat', { en: 'V(c) when ON', it: 'V(c) da acceso' }, 'V', (m) => m.vmin('c'), null, 0.5),
    band('off', { en: 'V(c) when OFF', it: 'V(c) da spento' }, 'V', (m) => m.vmax('c'), 11.5, null),
    band('ib', { en: 'peak base current (GPIO limit)', it: 'corrente di base massima (limite GPIO)' }, 'A', (m) => m.imax('rb'), null, 0.008),
  ],
  makeCases: () => [
    { visible: true, label: { en: 'transistor with β = 100', it: 'transistor con β = 100' }, params: { beta: 100 } },
    { visible: false, params: { beta: 60 } },
  ],
};
