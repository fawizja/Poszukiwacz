// Osada: rozbudowa budynków, bonusy globalne, handel surowcami na Targu.
import { BALANCE, buildingCost } from '../data/balance.js';
import { BUILDINGS, BUILDING_BONUS, MARKET_PRICES } from '../data/buildings.js';
import { bus } from '../core/eventBus.js';

export function getBuilding(id) { return BUILDINGS.find((b) => b.id === id); }

export function getBonuses(state) {
  const s = state.settlement;
  const out = { xpPct: 0, goldPct: 0, maxUpgrade: 0, potionPct: 0, buffDurPct: 0, backpack: 0, sellPct: 0 };
  for (const [id, bonus] of Object.entries(BUILDING_BONUS)) {
    for (const [k, v] of Object.entries(bonus)) out[k] += v * (s[id] || 0);
  }
  out.afkEff = Math.min(1, BALANCE.AFK_BASE_EFFICIENCY + BALANCE.AFK_EFF_PER_TOWNHALL * s.townhall);
  return out;
}

export function nextCost(state, id) {
  const lvl = state.settlement[id] || 0;
  if (lvl >= BALANCE.BUILDING_MAX_LEVEL) return null;
  return buildingCost(getBuilding(id), lvl + 1);
}

export function hasCost(state, cost) {
  return Object.entries(cost).every(([k, v]) => (k === 'gold' ? state.hero.gold : state.resources[k] || 0) >= v);
}

export function payCost(state, cost) {
  for (const [k, v] of Object.entries(cost)) {
    if (k === 'gold') state.hero.gold -= v; else state.resources[k] -= v;
  }
}

export function refundCost(state, cost) {
  for (const [k, v] of Object.entries(cost)) {
    if (k === 'gold') state.hero.gold += v; else state.resources[k] = (state.resources[k] || 0) + v;
  }
}

// Zwraca { ok, reason, cost }
export function canUpgradeBuilding(state, id) {
  const lvl = state.settlement[id] || 0;
  const cost = nextCost(state, id);
  if (!cost) return { ok: false, reason: 'max', cost: null };
  if (id !== 'townhall' && lvl + 1 > state.settlement.townhall + 1) return { ok: false, reason: 'townhall', cost };
  if (!hasCost(state, cost)) return { ok: false, reason: 'cost', cost };
  return { ok: true, cost };
}

export function upgradeBuilding(state, id) {
  const check = canUpgradeBuilding(state, id);
  if (!check.ok) return false;
  payCost(state, check.cost);
  state.settlement[id] = (state.settlement[id] || 0) + 1;
  bus.emit('settlement:changed', id);
  bus.emit('hero:changed');
  bus.emit('inventory:changed');
  return true;
}

export function marketPrice(state, res) {
  const lvl = state.settlement.market;
  return Math.max(1, Math.round(MARKET_PRICES[res] * (1 - 0.05 * Math.max(0, lvl - 1))));
}

export function marketBuy(state, res, amount) {
  if (state.settlement.market < 1 || !MARKET_PRICES[res]) return false;
  const total = marketPrice(state, res) * amount;
  if (state.hero.gold < total) return false;
  state.hero.gold -= total;
  state.resources[res] = (state.resources[res] || 0) + amount;
  bus.emit('settlement:changed', 'market');
  return true;
}
