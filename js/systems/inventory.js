// Plecak i ekwipunek: zakładanie, sprzedaż, rozbiórka, ulepszanie, mikstury.
import { BALANCE, sellPrice, upgradeCost } from '../data/balance.js';
import { CONSUMABLES } from '../data/items.js';
import { bus } from '../core/eventBus.js';
import { getBonuses } from './settlement.js';
import { getDerived, healHero, applyBuff } from './hero.js';

export function capacity(state) { return BALANCE.BASE_BACKPACK + getBonuses(state).backpack; }
export function freeSlots(state) { return Math.max(0, capacity(state) - state.inventory.length); }

const changed = () => { bus.emit('inventory:changed'); bus.emit('hero:changed'); };

export function addItem(state, item) {
  if (state.inventory.length >= capacity(state)) return false;
  state.inventory.push(item);
  return true;
}

export function findItem(state, uid) { return state.inventory.find((i) => i.uid === uid); }

export function slotsFor(item) { return item.slot === 'ring' ? ['ring1', 'ring2'] : [item.slot]; }

export function equip(state, uid, targetSlot = null) {
  const item = findItem(state, uid);
  if (!item) return false;
  const slots = slotsFor(item);
  const slot = targetSlot && slots.includes(targetSlot) ? targetSlot : (slots.find((s) => !state.equipment[s]) || slots[0]);
  state.inventory = state.inventory.filter((i) => i.uid !== uid);
  const prev = state.equipment[slot];
  state.equipment[slot] = item;
  if (prev) state.inventory.push(prev);
  clampHp(state);
  changed();
  return true;
}

export function unequip(state, slot) {
  const item = state.equipment[slot];
  if (!item || state.inventory.length >= capacity(state)) return false;
  state.equipment[slot] = null;
  state.inventory.push(item);
  clampHp(state);
  changed();
  return true;
}

function clampHp(state) {
  const max = getDerived(state).maxHp;
  if (state.hero.hp > max) state.hero.hp = max;
}

export function itemSellPrice(state, item) { return sellPrice(item, getBonuses(state).sellPct); }
export function autoSellValue(state, item) { return itemSellPrice(state, item); }

export function sellItem(state, uid) {
  const item = findItem(state, uid);
  if (!item || item.locked) return 0;
  const g = itemSellPrice(state, item);
  state.inventory = state.inventory.filter((i) => i.uid !== uid);
  state.hero.gold += g;
  state.stats.goldEarned += g;
  changed();
  return g;
}

// Sprzedaje wszystkie niezablokowane przedmioty o rzadkości <= maxRarity.
export function sellAllUpTo(state, maxRarity) {
  let total = 0, count = 0;
  for (const item of [...state.inventory]) {
    if (!item.locked && item.rarity <= maxRarity) { total += itemSellPrice(state, item); count++; }
  }
  state.inventory = state.inventory.filter((i) => i.locked || i.rarity > maxRarity);
  state.hero.gold += total;
  state.stats.goldEarned += total;
  changed();
  return { total, count };
}

export function salvageValue(item) {
  return { essence: BALANCE.RARITY_ESSENCE[item.rarity] + item.upgrade, iron: item.level >= 11 ? 1 + Math.floor(item.level / 15) : 0 };
}

export function salvageItem(state, uid) {
  const item = findItem(state, uid);
  if (!item || item.locked) return null;
  const v = salvageValue(item);
  state.inventory = state.inventory.filter((i) => i.uid !== uid);
  state.resources.essence += v.essence;
  state.resources.iron += v.iron;
  changed();
  return v;
}

export function maxUpgrade(state) { return getBonuses(state).maxUpgrade; }

export function locateItem(state, uid) {
  const inv = findItem(state, uid);
  if (inv) return inv;
  return Object.values(state.equipment).find((i) => i && i.uid === uid) || null;
}

// Zwraca { ok, reason, cost }
export function canUpgrade(state, item) {
  const cost = upgradeCost(item);
  if (maxUpgrade(state) <= 0) return { ok: false, reason: 'noForge', cost };
  if (item.upgrade >= maxUpgrade(state)) return { ok: false, reason: 'maxUpgrade', cost };
  if (state.hero.gold < cost.gold) return { ok: false, reason: 'noGold', cost };
  if (state.resources.essence < cost.essence) return { ok: false, reason: 'noEssence', cost };
  return { ok: true, cost };
}

export function upgradeItem(state, uid) {
  const item = locateItem(state, uid);
  if (!item) return false;
  const check = canUpgrade(state, item);
  if (!check.ok) return false;
  state.hero.gold -= check.cost.gold;
  state.resources.essence -= check.cost.essence;
  item.upgrade++;
  changed();
  return true;
}

export function toggleLock(state, uid) {
  const item = findItem(state, uid);
  if (!item) return false;
  item.locked = !item.locked;
  bus.emit('inventory:changed');
  return true;
}

export function bestPotion(state) {
  return ['hp_large', 'hp_medium', 'hp_small'].find((id) => (state.consumables[id] || 0) > 0) || null;
}

export function useConsumable(state, id) {
  const def = CONSUMABLES[id];
  if (!def || !(state.consumables[id] > 0)) return false;
  const b = getBonuses(state);
  state.consumables[id]--;
  if (def.heal) {
    const max = getDerived(state).maxHp;
    healHero(state, max * def.heal / 100 * (1 + b.potionPct / 100));
  } else {
    applyBuff(state, { id, kind: def.kind, stats: { ...def.stats }, remaining: def.duration * (1 + b.buffDurPct / 100) });
  }
  bus.emit('inventory:changed');
  bus.emit('hero:changed');
  return true;
}
