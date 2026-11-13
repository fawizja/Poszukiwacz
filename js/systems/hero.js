// System bohatera: statystyki pochodne, doświadczenie, awanse, wzmocnienia.
import { BALANCE, xpForLevel } from '../data/balance.js';
import { itemStats } from './loot.js';
import { skillPassives } from './skills.js';
import { bus } from '../core/eventBus.js';

export const STAT_KEYS = ['str', 'dex', 'int', 'end'];

function zero() {
  return { str: 0, dex: 0, int: 0, end: 0, hp: 0, atk: 0, def: 0, crit: 0, dodge: 0, magic: 0,
    fireDmg: 0, iceDmg: 0, earthDmg: 0, goldFind: 0, magicFind: 0, xpBonus: 0, lifesteal: 0,
    regen: 0, thorns: 0, poisonChance: 0, atkPct: 0, defPct: 0, hpPct: 0, magicPct: 0, allPct: 0 };
}

function addInto(target, src) {
  for (const [k, v] of Object.entries(src)) if (typeof v === 'number') target[k] = (target[k] || 0) + v;
}

// Wszystkie statystyki bohatera po uwzględnieniu ekwipunku, wzmocnień, umiejętności i synergii.
export function getDerived(state) {
  const h = state.hero;
  const add = zero();
  for (const item of Object.values(state.equipment)) if (item) addInto(add, itemStats(item));
  for (const b of state.buffs) addInto(add, b.stats);
  const passive = skillPassives(state);
  addInto(add, passive.stats);

  const all = 1 + add.allPct / 100;
  const str = (h.stats.str + add.str) * all;
  const dex = (h.stats.dex + add.dex) * all;
  const int = (h.stats.int + add.int) * all;
  const end = (h.stats.end + add.end) * all;
  const maxHp = Math.round((50 + end * 10 + h.level * 8 + add.hp) * (1 + add.hpPct / 100));
  return {
    str: Math.round(str), dex: Math.round(dex), int: Math.round(int), end: Math.round(end),
    maxHp,
    atk: Math.round((4 + str * 2 + add.atk) * (1 + add.atkPct / 100)),
    def: Math.round((end * 1.5 + add.def) * (1 + add.defPct / 100)),
    magic: Math.round((int * 2.5 + add.magic) * (1 + add.magicPct / 100)),
    crit: Math.min(BALANCE.CRIT_CAP, 5 + dex * 0.35 + add.crit),
    critMult: 1.5 + dex * 0.004,
    dodge: Math.min(BALANCE.DODGE_CAP, 3 + dex * 0.25 + add.dodge),
    regen: Math.round((end * 0.2 + add.regen) * 10) / 10,
    lifesteal: Math.min(30, add.lifesteal),
    thorns: Math.min(60, add.thorns),
    poisonChance: Math.min(50, add.poisonChance),
    fireDmg: add.fireDmg, iceDmg: add.iceDmg, earthDmg: add.earthDmg,
    goldFind: add.goldFind, magicFind: add.magicFind, xpBonus: add.xpBonus,
    flags: passive.flags
  };
}

export function ensureHp(state) {
  const max = getDerived(state).maxHp;
  if (state.hero.hp == null || state.hero.hp > max) state.hero.hp = max;
  return max;
}

// Dodaje XP, obsługuje awanse. Zwraca liczbę zdobytych poziomów.
export function addXp(state, amount) {
  const h = state.hero;
  let gained = 0;
  if (h.level >= BALANCE.MAX_LEVEL) return 0;
  h.xp += Math.floor(amount);
  while (h.level < BALANCE.MAX_LEVEL && h.xp >= xpForLevel(h.level)) {
    h.xp -= xpForLevel(h.level);
    h.level++;
    gained++;
    h.statPoints += BALANCE.STAT_POINTS_PER_LEVEL;
    if (h.level % BALANCE.SKILL_POINT_EVERY === 0) h.skillPoints++;
  }
  if (h.level >= BALANCE.MAX_LEVEL) h.xp = 0;
  if (gained) {
    h.hp = getDerived(state).maxHp;
    bus.emit('hero:levelup', { level: h.level, gained });
  }
  bus.emit('hero:changed');
  return gained;
}

export function allocateStat(state, stat, amount = 1) {
  const h = state.hero;
  if (!STAT_KEYS.includes(stat)) return false;
  const n = Math.min(amount, h.statPoints);
  if (n <= 0) return false;
  h.stats[stat] += n;
  h.statPoints -= n;
  bus.emit('hero:changed');
  return true;
}

// Reset rozdanych punktów statystyk za złoto (poziom * 40).
export function statResetCost(state) { return state.hero.level * 40; }

export function resetStats(state) {
  const h = state.hero;
  const cost = statResetCost(state);
  if (h.gold < cost) return false;
  const spent = STAT_KEYS.reduce((s, k) => s + (h.stats[k] - BALANCE.START_STATS[k]), 0);
  if (spent <= 0) return false;
  h.gold -= cost;
  h.stats = { ...BALANCE.START_STATS };
  h.statPoints += spent;
  ensureHp(state);
  bus.emit('hero:changed');
  return true;
}

export function healHero(state, amount) {
  const max = getDerived(state).maxHp;
  state.hero.hp = Math.min(max, (state.hero.hp ?? max) + amount);
}

// Wzmocnienia: jedno aktywne na kategorię (eliksir / posiłek).
export function applyBuff(state, buff) {
  state.buffs = state.buffs.filter((b) => b.kind !== buff.kind);
  state.buffs.push(buff);
  bus.emit('hero:changed');
}

export function tickBuffs(state, ms) {
  const before = state.buffs.length;
  for (const b of state.buffs) b.remaining -= ms;
  state.buffs = state.buffs.filter((b) => b.remaining > 0);
  if (state.buffs.length !== before) bus.emit('hero:changed');
}

export function xpProgress(state) {
  const need = xpForLevel(state.hero.level);
  return { xp: state.hero.xp, need, pct: state.hero.level >= BALANCE.MAX_LEVEL ? 100 : Math.min(100, (state.hero.xp / need) * 100) };
}
