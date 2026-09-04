// Engineering notation, both ways. The parser accepts what a technician would
// type — `4.7k`, `100n`, `2200u`, `1meg`, `0.25W` — and the UI prints readings
// the way a bench meter does: three significant digits and the right prefix.
//
// Prefixes follow SPICE except for one deliberate departure: `m` is milli and
// `M` is mega (SPICE treats both as milli, which trips up everyone who has
// ever written "1M" for a megohm). `meg` is accepted as mega too.

const PREFIX = {
  p: 1e-12, n: 1e-9, u: 1e-6, 'µ': 1e-6, 'μ': 1e-6, m: 1e-3,
  k: 1e3, K: 1e3, M: 1e6, meg: 1e6, MEG: 1e6, Meg: 1e6, g: 1e9, G: 1e9,
};

// Value token → number, or null when it is not a value at all. Trailing unit
// letters (Ω, F, H, V, A, Hz, W, s) are ignored so `1kΩ` and `100nF` work.
export function parseValue(tok) {
  if (tok == null) return null;
  const s = String(tok).trim().replace(/(ohm|Ω|Hz|[FHVAWsΩ])$/i, (m) => (/^(hz|f|h|v|a|w|s|Ω|ohm)$/i.test(m) ? '' : m));
  const m = /^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(meg|MEG|Meg|[pnuµμmkKMgG])?$/.exec(s);
  if (!m) return null;
  const num = Number(m[1]);
  if (!Number.isFinite(num)) return null;
  return m[2] ? Number((num * PREFIX[m[2]]).toPrecision(15)) : num;
}

const STEPS = [
  [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p'],
];

// 0.01364 → "13.6 m" (prefix chosen so the mantissa is in [1, 1000)).
export function formatValue(v, unit = '', digits = 3) {
  if (v == null || !Number.isFinite(v)) return '—';
  if (v === 0) return `0 ${unit}`.trim();
  const a = Math.abs(v);
  if (a < 1e-13) return `0 ${unit}`.trim();
  let scale = 1e-12; let pre = 'p';
  for (const [s, p] of STEPS) { if (a >= s * 0.9995) { scale = s; pre = p; break; } }
  const mant = v / scale;
  const str = Number(mant.toPrecision(digits)).toString();
  return `${str} ${pre}${unit}`.trim();
}

// The E12 series: the values a drawer of resistors actually contains.
export const E12 = [1.0, 1.2, 1.5, 1.8, 2.2, 2.7, 3.3, 3.9, 4.7, 5.6, 6.8, 8.2];

export function isE12(v) {
  if (!(v > 0) || !Number.isFinite(v)) return false;
  const exp = Math.floor(Math.log10(v));
  const mant = v / 10 ** exp;
  return E12.some((e) => Math.abs(mant - e) / e < 0.01 || Math.abs(mant / 10 - e) / e < 0.01);
}
