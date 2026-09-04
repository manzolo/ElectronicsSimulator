import { band } from './verify.js';

export const solution = 'R1 in out 1.5k\nC1 out gnd 100n';

// The band the gain must fall in if fc is within ±10% of 1 kHz, at the case's
// test frequency.
const gain = (f, fc) => 1 / Math.sqrt(1 + (f / fc) ** 2);

export default {
  id: 'rc-filter',
  title: { en: 'The RC low-pass filter', it: 'Il filtro RC passa-basso' },
  text: {
    en: `<p>Put a resistor in series and a capacitor to ground and you have a <b>low-pass filter</b>: the capacitor's opposition to current (its <em>reactance</em>, 1/(2πfC)) is huge at low frequency and tiny at high frequency, so slow signals pass and fast ones are shorted away. The dividing line is the <b>cutoff frequency</b> <b>f<sub>c</sub> = 1 / (2π R C)</b>, where the output is down to <b>1/√2 = 0.707</b> of the input — the famous <em>−3 dB</em> point.</p>
<p>The generator sends a 1 kHz sine. Both channels are on the scope: <code>in</code> and <code>out</code>. The verifier measures the ratio V<sub>pp</sub>(out)/V<sub>pp</sub>(in) — and, in a hidden case, it also sends 5 kHz to make sure yours is really a low-pass and not just a divider.</p>`,
    it: `<p>Metti una resistenza in serie e un condensatore verso massa e hai un <b>filtro passa-basso</b>: l'opposizione del condensatore alla corrente (la sua <em>reattanza</em>, 1/(2πfC)) è enorme a bassa frequenza e minuscola ad alta, quindi i segnali lenti passano e quelli veloci vengono cortocircuitati via. La linea di confine è la <b>frequenza di taglio</b> <b>f<sub>c</sub> = 1 / (2π R C)</b>, dove l'uscita è scesa a <b>1/√2 = 0,707</b> dell'ingresso — il famoso punto a <em>−3 dB</em>.</p>
<p>Il generatore manda una sinusoide a 1 kHz. Sullo scopio ci sono entrambi i canali: <code>in</code> e <code>out</code>. Il verificatore misura il rapporto V<sub>pp</sub>(out)/V<sub>pp</sub>(in) — e, in un caso nascosto, manda anche 5 kHz per assicurarsi che il tuo sia davvero un passa-basso e non solo un partitore.</p>`,
  },
  goal: {
    en: 'Build an RC low-pass with <b>f<sub>c</sub> = 1 kHz</b> (±10%): the gain at 1 kHz must be ≈ 0.707, and at 5 kHz ≈ 0.2. R from the E12 drawer.',
    it: 'Costruisci un passa-basso RC con <b>f<sub>c</sub> = 1 kHz</b> (±10%): il guadagno a 1 kHz deve essere ≈ 0,707, e a 5 kHz ≈ 0,2. R dal cassetto E12.',
  },
  hints: [
    { en: 'Pick C = 100 nF, then R = 1 / (2π · 1000 · 100n) ≈ 1.59 kΩ. Nearest E12?', it: 'Scegli C = 100 nF, poi R = 1 / (2π · 1000 · 100n) ≈ 1,59 kΩ. La E12 più vicina?' },
    { en: '<code>R1 in out 1.5k</code> + <code>C1 out gnd 100n</code> → f<sub>c</sub> = 1061 Hz, gain 0.72 at 1 kHz.', it: '<code>R1 in out 1.5k</code> + <code>C1 out gnd 100n</code> → f<sub>c</sub> = 1061 Hz, guadagno 0,72 a 1 kHz.' },
  ],
  start: 'R1 in out 1k\nC1 out gnd 1u',
  fixture: (p) => `V1 in gnd SIN 0 ${p.amp} ${p.f}\n.scope in out\n.tran ${p.f >= 5000 ? '2m' : '5m'}`,
  allowed: ['R', 'C'],
  maxElements: 2,
  e12: true,
  windowFrac: 0.5,
  checks: [
    band('gain', { en: 'Vpp(out) / Vpp(in)', it: 'Vpp(out) / Vpp(in)' }, '', (m) => m.vpp('out') / m.vpp('in'),
      (p) => gain(p.f, 900) - 0.005, (p) => gain(p.f, 1100) + 0.005),
    band('lowpass', { en: 'C to ground (out follows in at DC)', it: 'C verso massa (out segue in in continua)' }, '',
      (m) => Math.abs(m.vavg('out') - m.vavg('in')), null, 0.05),
  ],
  makeCases: () => [
    { visible: true, label: { en: '1 V at 1 kHz', it: '1 V a 1 kHz' }, params: { amp: 1, f: 1000 } },
    { visible: false, params: { amp: 2, f: 1000 } },
    { visible: false, params: { amp: 1, f: 5000 } },
  ],
};
