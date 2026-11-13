// Zapis gry: localStorage, 2 rotacyjne kopie zapasowe, sumy kontrolne,
// migracje wersji, eksport/import (base64) oraz reset.
import { game, createDefaultState, SAVE_VERSION } from './state.js';
import { rng, hashString } from './rng.js';
import { bus } from './eventBus.js';

const KEY = 'poszukiwacz_save';
const BACKUPS = ['poszukiwacz_save_bak1', 'poszukiwacz_save_bak2'];
const BACKUP_INTERVAL_MS = 5 * 60 * 1000;
let lastBackupAt = 0;

// Migracje: klucz = wersja źródłowa, funkcja zwraca stan w wersji +1.
const MIGRATIONS = {
  1: (s) => {
    // v1 -> v2: dodano maxSeenTimestamp i ustawienie progu mikstur
    s.maxSeenTimestamp = s.maxSeenTimestamp || s.lastTimestamp || Date.now();
    s.settings = s.settings || {};
    if (s.settings.potionThreshold == null) s.settings.potionThreshold = 35;
    s.version = 2;
    return s;
  }
};

function migrate(data) {
  let s = data;
  let guard = 0;
  while ((s.version || 1) < SAVE_VERSION && guard++ < 50) {
    const fn = MIGRATIONS[s.version || 1];
    if (!fn) throw new Error('Brak migracji dla wersji ' + s.version);
    s = fn(s);
  }
  return s;
}

// Uzupełnia brakujące pola wartościami domyślnymi (odporność na stare zapisy).
function mergeDefaults(target, defaults) {
  for (const [k, v] of Object.entries(defaults)) {
    if (target[k] === undefined || target[k] === null && v !== null) {
      target[k] = structuredCloneSafe(v);
    } else if (v && typeof v === 'object' && !Array.isArray(v) && typeof target[k] === 'object' && target[k] !== null) {
      mergeDefaults(target[k], v);
    }
  }
  return target;
}

function structuredCloneSafe(v) { return v === null || typeof v !== 'object' ? v : JSON.parse(JSON.stringify(v)); }

export function validateState(s) {
  return !!(s && typeof s === 'object' && s.hero && typeof s.hero.level === 'number' &&
    Array.isArray(s.inventory) && s.equipment && s.combat && s.resources && s.settlement);
}

function wrap(state) {
  const data = JSON.stringify(state);
  return JSON.stringify({ v: state.version, sum: hashString(data), data });
}

function unwrap(raw) {
  if (!raw) return null;
  const obj = JSON.parse(raw);
  if (!obj || typeof obj.data !== 'string' || hashString(obj.data) !== obj.sum) throw new Error('Zła suma kontrolna');
  return JSON.parse(obj.data);
}

export function prepareState(raw) {
  let s = migrate(raw);
  s = mergeDefaults(s, createDefaultState(s.createdAt || Date.now()));
  if (!validateState(s)) throw new Error('Niepoprawna struktura zapisu');
  return s;
}

export function saveGame(reason = 'auto') {
  const s = game.state;
  if (!s) return false;
  s.rngState = rng.state;
  const now = Date.now();
  s.lastTimestamp = now;
  s.maxSeenTimestamp = Math.max(s.maxSeenTimestamp || 0, now);
  try {
    const payload = wrap(s);
    const prev = localStorage.getItem(KEY);
    if (prev && now - lastBackupAt > BACKUP_INTERVAL_MS) {
      const b1 = localStorage.getItem(BACKUPS[0]);
      if (b1) localStorage.setItem(BACKUPS[1], b1);
      localStorage.setItem(BACKUPS[0], prev);
      lastBackupAt = now;
    }
    localStorage.setItem(KEY, payload);
    bus.emit('save:done', reason);
    return true;
  } catch (err) {
    console.error('Błąd zapisu', err);
    bus.emit('save:error', err);
    return false;
  }
}

// Zwraca { state, source } — source: 'main' | 'backup1' | 'backup2' | 'new'
export function loadGame() {
  const sources = [[KEY, 'main'], [BACKUPS[0], 'backup1'], [BACKUPS[1], 'backup2']];
  for (const [key, source] of sources) {
    try {
      const raw = unwrap(localStorage.getItem(key));
      if (raw) return { state: prepareState(raw), source };
    } catch (err) {
      console.warn(`Zapis ${key} uszkodzony`, err);
    }
  }
  return { state: createDefaultState(), source: 'new' };
}

function toBase64(str) {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin);
}

function fromBase64(b64) {
  const bin = atob(b64.trim());
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function exportSave() {
  game.state.rngState = rng.state;
  return toBase64(JSON.stringify({ game: 'poszukiwacz', state: game.state }));
}

// Zwraca przygotowany stan lub rzuca wyjątek przy błędnych danych.
export function parseImport(text) {
  if (!text || !text.trim()) throw new Error('empty');
  const obj = JSON.parse(fromBase64(text));
  if (!obj || obj.game !== 'poszukiwacz') throw new Error('foreign');
  return prepareState(obj.state);
}

export function resetGame() {
  localStorage.removeItem(KEY);
  BACKUPS.forEach((k) => localStorage.removeItem(k));
}
