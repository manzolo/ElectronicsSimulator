// i18n core (same design as EDU-SQL / EDU-NN / EDU-NET): flat per-language
// dictionaries for the chrome, inline {en, it} objects for level content via
// tr(). The chosen language is stored under the app's own key.

import en from './strings/en.js';
import it from './strings/it.js';

const LANG_KEY = 'elnsim.lang';

const dicts = { en, it };
let lang = 'en';
const listeners = [];

export function initLang() {
  // Priority: ?lang= in the URL (a shareable, language-forcing link) > stored
  // choice > browser language > English.
  let urlLang = null;
  try {
    urlLang = new URLSearchParams(window.location.search).get('lang');
  } catch { /* no URL */ }
  let stored = null;
  try {
    stored = localStorage.getItem(LANG_KEY);
  } catch { /* private mode */ }

  if (urlLang && dicts[urlLang]) {
    lang = urlLang;
    try { localStorage.setItem(LANG_KEY, urlLang); } catch { /* private mode */ }
  } else if (stored && dicts[stored]) {
    lang = stored;
  } else if (typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('it')) {
    lang = 'it';
  }
  document.documentElement.lang = lang;
  syncUrlLang();
}

// Keep ?lang= in the address bar in sync with the current language, preserving
// the hash route, so the URL is always a correct shareable link.
function syncUrlLang() {
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get('lang') === lang) return;
    url.searchParams.set('lang', lang);
    window.history.replaceState(null, '', url);
  } catch { /* no history/URL */ }
}

export function getLang() {
  return lang;
}

export function setLang(l) {
  if (!dicts[l] || l === lang) return;
  lang = l;
  document.documentElement.lang = l;
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch { /* private mode */ }
  syncUrlLang();
  refreshStatic();
  listeners.forEach((f) => f(l));
}

// Components with dynamic content re-render themselves here.
export function onLangChange(f) {
  listeners.push(f);
}

export function t(key, ...args) {
  const s = dicts[lang][key] ?? dicts.en[key] ?? key;
  return s.replace(/\{(\d+)\}/g, (_, n) => String(args[+n] ?? ''));
}

// tr({en: '...', it: '...'}) for per-level content.
export function tr(obj) {
  if (obj == null) return '';
  return obj[lang] ?? obj.en ?? '';
}

// Resolve an event/label that is either a plain string (language-neutral) or a
// {code, args} object (deferred localization).
export function tl(label) {
  if (label == null) return '';
  if (typeof label === 'string') return label;
  return t(label.code, ...(label.args ?? []));
}

export function refreshStatic(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    el.innerHTML = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-title]').forEach((el) => {
    el.title = t(el.dataset.i18nTitle);
  });
  root.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
}
