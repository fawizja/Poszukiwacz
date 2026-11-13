// Moduł tłumaczeń. Wszystkie teksty gry pochodzą z plików językowych (np. pl.js).
import pl from './pl.js';

const LANGUAGES = { pl };
let current = pl;

export function setLanguage(code) {
  if (LANGUAGES[code]) current = LANGUAGES[code];
}

function lookup(key) {
  return key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), current);
}

// t('klucz.zagnieżdżony', { param: wartość }) — podstawia {param} w tekście.
export function t(key, params) {
  const v = lookup(key);
  if (v == null) return key;
  if (typeof v !== 'string') return v;
  return params ? v.replace(/\{(\w+)\}/g, (_, k) => (params[k] != null ? params[k] : '')) : v;
}

export function has(key) { return lookup(key) != null; }
