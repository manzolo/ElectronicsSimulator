import { band } from './verify.js';

export const solution = 'V1 in gnd SIN 1 1 500';

export default {
  id: 'scope',
  title: { en: 'Waves and the oscilloscope', it: 'Onde e oscilloscopio' },
  text: {
    en: `<p>A multimeter gives you one number. An <b>oscilloscope</b> gives you the <em>shape</em>: voltage on the vertical axis, time on the horizontal. Three things you read off a sine wave: the <b>peak-to-peak</b> amplitude V<sub>pp</sub> (top to bottom), the <b>offset</b> (where the wave is centred), and the <b>frequency</b> (how many cycles per second — measure one period T and take f = 1/T).</p>
<p>In this lab a signal generator is written as <code>V1 in gnd SIN offset amplitude frequency</code>. Note that the <em>amplitude</em> is the peak value — half of V<sub>pp</sub>.</p>
<p>The bench technician asks: "give me a sine, 2 volts peak-to-peak, sitting on 1 volt, at 500 hertz." Set the generator and check on the scope that you got it.</p>`,
    it: `<p>Un multimetro ti dà un numero. Un <b>oscilloscopio</b> ti dà la <em>forma</em>: tensione sull'asse verticale, tempo su quello orizzontale. Tre cose si leggono da una sinusoide: l'ampiezza <b>picco-picco</b> V<sub>pp</sub> (dalla cresta al fondo), l'<b>offset</b> (dove l'onda è centrata) e la <b>frequenza</b> (quanti cicli al secondo — misura un periodo T e fai f = 1/T).</p>
<p>In questo laboratorio un generatore di segnali si scrive <code>V1 in gnd SIN offset ampiezza frequenza</code>. Attenzione: l'<em>ampiezza</em> è il valore di picco — metà della V<sub>pp</sub>.</p>
<p>Il tecnico al banco ti chiede: «dammi una sinusoide, 2 volt picco-picco, appoggiata su 1 volt, a 500 hertz». Imposta il generatore e controlla sullo scopio di averla ottenuta.</p>`,
  },
  goal: {
    en: 'Set <code>V1</code> so the scope reads <b>V<sub>pp</sub> = 2 V</b>, <b>mean = 1 V</b> and <b>f = 500 Hz</b> on <code>in</code>.',
    it: 'Imposta <code>V1</code> perché lo scopio legga <b>V<sub>pp</sub> = 2 V</b>, <b>media = 1 V</b> e <b>f = 500 Hz</b> su <code>in</code>.',
  },
  hints: [
    { en: '2 V peak-to-peak means 1 V of amplitude. The offset is the mean.', it: '2 V picco-picco vuol dire 1 V di ampiezza. L\'offset è la media.' },
    { en: '<code>V1 in gnd SIN 1 1 500</code>.', it: '<code>V1 in gnd SIN 1 1 500</code>.' },
  ],
  start: 'V1 in gnd SIN 0 1 1k',
  fixture: (p) => `R1 in gnd ${p.rl}\n.scope in\n.tran 12m`,
  allowed: ['V'],
  maxElements: 1,
  checks: [
    band('vpp', { en: 'Vpp(in)', it: 'Vpp(in)' }, 'V', (m) => m.vpp('in'), 1.9, 2.1),
    band('mean', { en: 'mean(in)', it: 'media(in)' }, 'V', (m) => m.vavg('in'), 0.9, 1.1),
    band('freq', { en: 'frequency', it: 'frequenza' }, 'Hz', (m) => m.freq('in'), 475, 525),
  ],
  makeCases: () => [
    { visible: true, label: { en: 'into 1 kΩ', it: 'su 1 kΩ' }, params: { rl: 1000 } },
    { visible: false, params: { rl: 10000 } },
  ],
};
