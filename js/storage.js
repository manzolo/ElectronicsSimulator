// Persistence under the 'elnsim.' namespace. Failures (private mode, quota)
// degrade to in-memory values, exactly like EDU-SQL / EDU-NN.

const PREFIX = 'elnsim.';
const mem = new Map();

function get(key) {
  try {
    const v = localStorage.getItem(PREFIX + key);
    return v === null ? mem.get(key) ?? null : v;
  } catch {
    return mem.get(key) ?? null;
  }
}

function set(key, value) {
  mem.set(key, value);
  try {
    localStorage.setItem(PREFIX + key, value);
  } catch { /* private mode: keep in-memory only */ }
}

function getJSON(key, fallback) {
  try {
    const v = get(key);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
}

export function getProgress() {
  return new Set(getJSON('progress', []));
}

export function markCompleted(levelId) {
  const p = getProgress();
  p.add(levelId);
  set('progress', JSON.stringify([...p]));
}

// The user's netlist for a level (or the sandbox).
export function getNetlist(id) {
  return get(`netlist.${id}`);
}

export function saveNetlist(id, text) {
  set(`netlist.${id}`, text);
}

export function getLastMode() {
  return get('lastMode');
}

// The beginner's primer auto-opens once; after that it lives behind a button.
export function getIntroSeen() {
  return get('introSeen') === '1';
}

export function setIntroSeen() {
  set('introSeen', '1');
}

export function setLastMode(mode) {
  set('lastMode', mode);
}
