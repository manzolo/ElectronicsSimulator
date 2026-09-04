// Device models: the handful of numbers that turn a symbol into a component.
// Deliberately small and didactic — a Shockley diode, a Zener with a sharp
// knee placed at Vz, an Ebers-Moll BJT — but real: every reading the lab shows
// comes out of these equations, not out of a lookup table.
//
// Every model also carries its LIMITS (max current / max power / power rating):
// exceed them and the engine emits `burn` and the part goes open. That is the
// feedback a worksheet cannot give.

export const VT = 0.02585; // kT/q at ~300 K

export const DIODE_MODELS = {
  // 0.70 V @ 10 mA — a small-signal silicon diode (1N4148 class)
  SI: { is: 1e-14, n: 1, imax: 0.2, label: 'Si' },
  '1N4148': { is: 1e-14, n: 1, imax: 0.2, label: '1N4148' },
  // a rectifier: same junction, but it takes an ampere
  '1N4007': { is: 1e-14, n: 1, imax: 1.0, label: '1N4007' },
  // a red LED: ~2.0 V @ 15 mA, dies above 30 mA
  LED: { is: 2.3e-19, n: 2, imax: 0.03, label: 'LED', led: true },
  // ~0.36 V @ 10 mA
  SCHOTTKY: { is: 1e-8, n: 1, imax: 1.0, label: 'Schottky' },
  // reverse knee at Vz (parameter), Izt = 10 mA at the knee, 0.5 W package
  ZENER: { is: 1e-14, n: 1, izt: 0.01, pmax: 0.5, imax: 0.5, label: 'Zener', zener: true },
};

export const BJT_MODELS = {
  // a general-purpose NPN (BC337 / 2N2222 class): β 100, 1 A, TO-92 with some headroom
  NPN: { is: 1e-14, bf: 100, br: 1, icmax: 1.0, pmax: 1.5, label: 'NPN' },
};

export const DEFAULT_R_RATING = 0.25; // W — the classic quarter-watt resistor
export const CAP_VMAX = 50; // V — informative only; caps do not burn in this lab
