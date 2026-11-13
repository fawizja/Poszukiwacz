// Postęp offline (AFK): deterministyczne, statystyczne wyliczenie nagród
// na podstawie ziarna i upływu czasu, z wykrywaniem cofnięcia zegara.
import { BALANCE } from '../data/balance.js';
import { Rng } from './rng.js';
import { estimateFight } from '../systems/combat.js';
import { addXp, tickBuffs } from '../systems/hero.js';
import { generateItem, rollRarity, expectedResources } from '../systems/loot.js';
import { addItem, freeSlots } from '../systems/inventory.js';
import { advanceCrafting } from '../systems/crafting.js';
import { getBonuses } from '../systems/settlement.js';
import { getDerived } from '../systems/hero.js';

// Sprawdza zegar. Zwraca { elapsed, manipulated }.
export function checkClock(state, now = Date.now()) {
  const ref = Math.max(state.lastTimestamp || now, state.maxSeenTimestamp || 0);
  if (now < ref) return { elapsed: 0, manipulated: true };
  return { elapsed: now - ref, manipulated: false };
}

// Statystyczne wyliczenie i zastosowanie nagród za czas offline (ms).
export function applyOfflineProgress(state, rawElapsed, now = Date.now()) {
  const elapsed = Math.min(rawElapsed, BALANCE.MAX_OFFLINE_MS);
  const report = {
    elapsed, capped: rawElapsed > BALANCE.MAX_OFFLINE_MS, kills: 0, xp: 0, gold: 0, levels: 0,
    resources: {}, items: [], itemsConverted: 0, essence: 0, crafted: [], bossReady: false
  };
  if (elapsed <= 0) return report;

  // Rzemiosło i wzmocnienia postępują w pełnym tempie.
  report.crafted = advanceCrafting(state, elapsed);
  tickBuffs(state, elapsed);

  const bonuses = getBonuses(state);
  const efficiency = Math.min(1, BALANCE.AFK_BASE_EFFICIENCY + BALANCE.AFK_EFF_PER_TOWNHALL * state.settlement.townhall);
  const est = estimateFight(state);
  // Deterministyczne ziarno: ziarno gry + znacznik ostatniej sesji
  const r = new Rng((state.seed ^ Math.floor((state.lastTimestamp || now) / 1000)) >>> 0);

  const expectedKills = (elapsed / 1000) / est.secondsPerKill * est.winRate * efficiency;
  const kills = Math.floor(expectedKills) + (r.chance(expectedKills % 1) ? 1 : 0);
  if (kills <= 0) return report;
  report.kills = kills;

  const d = getDerived(state);
  const xp = Math.floor(kills * est.avgXp * (1 + (d.xpBonus + bonuses.xpPct) / 100));
  const gold = Math.floor(kills * est.avgGold * (1 + (d.goldFind + bonuses.goldPct) / 100));
  report.xp = xp;
  report.gold = gold;
  state.hero.gold += gold;
  state.stats.goldEarned += gold;
  state.stats.kills += kills;
  report.levels = addXp(state, xp);

  // Surowce: wartość oczekiwana na zabójstwo * liczba zabójstw
  const perKill = expectedResources(est.location);
  for (const [res, amount] of Object.entries(perKill)) {
    const total = Math.floor(amount * kills);
    if (total > 0) {
      state.resources[res] = (state.resources[res] || 0) + total;
      report.resources[res] = total;
    }
  }
  const essence = Math.floor(kills * BALANCE.ESSENCE_DROP_CHANCE);
  state.resources.essence += essence;
  report.essence = essence;

  // Przedmioty: liczba oczekiwana, generowana do limitu; nadmiar zamieniany na esencję
  const expectedItems = kills * BALANCE.ITEM_DROP_CHANCE;
  const itemCount = Math.floor(expectedItems);
  const toGenerate = Math.min(itemCount, BALANCE.AFK_MAX_ITEMS, freeSlots(state));
  const mf = d.magicFind;
  for (let i = 0; i < toGenerate; i++) {
    const lvl = r.int(est.location.levels[0], est.location.levels[1]);
    const item = generateItem(state, lvl, rollRarity(mf, 0, r), null, r);
    if (addItem(state, item)) { report.items.push(item); state.stats.itemsFound++; }
  }
  const leftover = itemCount - report.items.length;
  if (leftover > 0) {
    const ess = Math.ceil(leftover * 1.5);
    state.resources.essence += ess;
    report.itemsConverted = leftover;
    report.essence += ess;
  }

  // Postęp do bossa (boss nie jest walczony offline)
  state.combat.killsSinceBoss = Math.min(BALANCE.KILLS_PER_BOSS, state.combat.killsSinceBoss + kills);
  if (state.combat.killsSinceBoss >= BALANCE.KILLS_PER_BOSS) { state.combat.bossReady = true; report.bossReady = true; }
  return report;
}
