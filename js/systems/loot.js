// Generowanie łupów: rzadkość, typ bazowy, afiksy, nazwa oraz surowce.
import { BALANCE } from '../data/balance.js';
import { BASES, AFFIXES, PERCENT_STATS, STAT_WEIGHTS } from '../data/items.js';
import { getLocation } from '../data/locations.js';
import { rng as globalRng } from '../core/rng.js';
import { t } from '../i18n/i18n.js';

const round1 = (v) => Math.round(v * 10) / 10;

export function getBase(id) { return BASES.find((b) => b.id === id); }

// Rzadkość: wagi 60/25/10/4/1; "szczęście" (magicFind %) zwiększa wagi rzadszych klas.
export function rollRarity(magicFind = 0, shift = 0, r = globalRng) {
  const weights = BALANCE.RARITY_WEIGHTS.map((w, i) => [i, i === 0 ? w : w * (1 + magicFind / 100)]);
  return Math.min(4, r.weighted(weights) + shift);
}

export function tierFor(level) { return Math.min(4, Math.floor((level - 1) / 11)); }

export function generateItem(state, level, rarity, slot = null, r = globalRng) {
  const pool = BASES.filter((b) => !slot || b.slot === slot || (slot.startsWith('ring') && b.slot === 'ring'));
  const base = r.pick(pool);
  const mult = BALANCE.RARITY_STAT_MULT[rarity];
  const baseStats = {};
  for (const [stat, [a, b]] of Object.entries(base.stats)) {
    const v = (a + b * level) * (stat === 'crit' && a < 0 ? 1 : mult);
    baseStats[stat] = PERCENT_STATS.has(stat) || stat === 'int' ? round1(v) : Math.round(v);
  }
  const allowed = AFFIXES.filter((a) => !a.slots || a.slots.includes(base.slot));
  const affixes = [];
  const count = BALANCE.RARITY_AFFIXES[rarity];
  for (let i = 0; i < count && allowed.length; i++) {
    const idx = Math.floor(r.next() * allowed.length);
    const a = allowed.splice(idx, 1)[0];
    const raw = (a.a + a.b * level) * r.float(0.8, 1.2) * (1 + 0.15 * rarity);
    affixes.push({ id: a.id, kind: a.kind, stat: a.stat, value: a.pct || a.stat === 'regen' ? round1(raw) : Math.max(1, Math.round(raw)) });
  }
  return { uid: state.nextUid++, base: base.id, slot: base.slot, tier: tierFor(level), level, rarity,
    baseStats, affixes, upgrade: 0, locked: false };
}

// Łączne statystyki przedmiotu (z ulepszeniem).
export function itemStats(item) {
  const out = {};
  const up = 1 + BALANCE.UPGRADE_STAT_BONUS * item.upgrade;
  for (const [k, v] of Object.entries(item.baseStats)) out[k] = (out[k] || 0) + (v > 0 ? v * up : v);
  for (const a of item.affixes) out[a.stat] = (out[a.stat] || 0) + a.value;
  for (const k of Object.keys(out)) out[k] = PERCENT_STATS.has(k) || k === 'regen' || k === 'int' ? round1(out[k]) : Math.round(out[k]);
  return out;
}

export function itemScore(item) {
  if (!item) return 0;
  return Math.round(Object.entries(itemStats(item)).reduce((s, [k, v]) => s + v * (STAT_WEIGHTS[k] || 1), 0));
}

// Nazwa: [przymiotnik z prefiksu w odpowiednim rodzaju] + nazwa bazowa + [dopełniacz z sufiksu] + [+ulepszenie]
export function itemName(item) {
  const baseInfo = t(`base.${item.base}`)[item.tier] || { n: item.base, g: 'm' };
  const prefix = item.affixes.find((a) => a.kind === 'prefix');
  const suffix = item.affixes.find((a) => a.kind === 'suffix');
  let name = baseInfo.n;
  if (prefix) {
    const adj = t(`prefix.${prefix.id}`)[baseInfo.g] || '';
    name = `${adj} ${name.charAt(0).toLowerCase()}${name.slice(1)}`;
  }
  if (suffix) name += ` ${t(`suffix.${suffix.id}`)}`;
  if (item.upgrade > 0) name += ` +${item.upgrade}`;
  return name;
}

export function rollResources(location, r = globalRng) {
  const out = {};
  if (!r.chance(BALANCE.RESOURCE_DROP_CHANCE)) return out;
  for (const [res, chance, min, max] of location.resources) {
    if (r.chance(chance)) out[res] = (out[res] || 0) + r.int(min, max);
  }
  return out;
}

export function expectedResources(location) {
  const out = {};
  for (const [res, chance, min, max] of location.resources) {
    out[res] = (out[res] || 0) + BALANCE.RESOURCE_DROP_CHANCE * chance * (min + max) / 2;
  }
  return out;
}

export function rollDrops(state, fight, derived) {
  const loc = getLocation(state.combat.locationId);
  const items = [];
  const mf = derived.magicFind;
  if (fight.boss) {
    for (let i = 0; i < BALANCE.BOSS_ITEM_DROPS; i++) items.push(generateItem(state, fight.level, rollRarity(mf, BALANCE.BOSS_RARITY_SHIFT)));
  } else if (globalRng.chance(BALANCE.ITEM_DROP_CHANCE)) {
    items.push(generateItem(state, fight.level, rollRarity(mf)));
  }
  const resources = rollResources(loc);
  if (fight.boss) {
    for (const [res, , min, max] of loc.resources) resources[res] = (resources[res] || 0) + max * 2;
    resources.essence = (resources.essence || 0) + 3 + Math.floor(fight.level / 5);
  } else if (globalRng.chance(BALANCE.ESSENCE_DROP_CHANCE)) {
    resources.essence = (resources.essence || 0) + 1;
  }
  return { items, resources };
}
