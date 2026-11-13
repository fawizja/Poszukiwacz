// Rzemiosło: kolejka do 3 receptur wykonywanych w czasie rzeczywistym.
import { BALANCE, professionXpFor } from '../data/balance.js';
import { RECIPES, PROFESSIONS, getRecipe } from '../data/recipes.js';
import { bus } from '../core/eventBus.js';
import { hasCost, payCost, refundCost } from './settlement.js';
import { generateItem, rollRarity } from './loot.js';
import { addItem, autoSellValue } from './inventory.js';
import { getDerived } from './hero.js';

export function recipesFor(profession) { return RECIPES.filter((r) => r.profession === profession); }

export function craftDuration(state, recipe) {
  const prof = state.crafting.professions[recipe.profession];
  return Math.round(recipe.time * 1000 * (1 - BALANCE.PROFESSION_TIME_REDUCTION * (prof.level - 1)));
}

// Zwraca { ok, reason }
export function canCraft(state, recipeId) {
  const r = getRecipe(recipeId);
  if (!r) return { ok: false, reason: 'unknown' };
  const building = PROFESSIONS[r.profession].building;
  if ((state.settlement[building] || 0) < r.level) return { ok: false, reason: 'building' };
  if (state.crafting.queue.length >= BALANCE.CRAFT_QUEUE_MAX) return { ok: false, reason: 'queue' };
  if (!hasCost(state, r.cost)) return { ok: false, reason: 'cost' };
  return { ok: true };
}

export function enqueue(state, recipeId) {
  if (!canCraft(state, recipeId).ok) return false;
  const r = getRecipe(recipeId);
  payCost(state, r.cost);
  const total = craftDuration(state, r);
  state.crafting.queue.push({ recipeId, remaining: total, total });
  bus.emit('crafting:changed');
  return true;
}

export function cancelCraft(state, index) {
  const job = state.crafting.queue[index];
  if (!job) return false;
  refundCost(state, getRecipe(job.recipeId).cost);
  state.crafting.queue.splice(index, 1);
  bus.emit('crafting:changed');
  return true;
}

function produce(state, recipe) {
  const res = recipe.result;
  const out = { recipeId: recipe.id };
  if (res.type === 'item') {
    const slot = res.slots ? res.slots[Math.floor(Math.random() * res.slots.length)] : null;
    const rarity = Math.max(res.minRarity, rollRarity(getDerived(state).magicFind));
    const item = generateItem(state, Math.max(1, state.hero.level), rarity, slot);
    item.crafted = true;
    if (addItem(state, item)) out.item = item;
    else { const g = autoSellValue(state, item); state.hero.gold += g; out.soldFor = g; }
  } else if (res.type === 'consumable') {
    state.consumables[res.id] = (state.consumables[res.id] || 0) + res.count;
    out.consumable = res.id; out.count = res.count;
  } else if (res.type === 'resource') {
    state.resources[res.id] = (state.resources[res.id] || 0) + res.count;
    out.resource = res.id; out.count = res.count;
  }
  const prof = state.crafting.professions[recipe.profession];
  if (prof.level < BALANCE.PROFESSION_MAX_LEVEL) {
    prof.xp += recipe.xp;
    while (prof.level < BALANCE.PROFESSION_MAX_LEVEL && prof.xp >= professionXpFor(prof.level)) {
      prof.xp -= professionXpFor(prof.level);
      prof.level++;
      bus.emit('crafting:profLevel', { profession: recipe.profession, level: prof.level });
    }
  }
  state.stats.crafted++;
  return out;
}

// Przesuwa kolejkę o ms. Zwraca listę ukończonych wyników.
export function advanceCrafting(state, ms) {
  const done = [];
  let left = ms;
  while (left > 0 && state.crafting.queue.length) {
    const job = state.crafting.queue[0];
    const step = Math.min(left, job.remaining);
    job.remaining -= step;
    left -= step;
    if (job.remaining <= 0) {
      state.crafting.queue.shift();
      done.push(produce(state, getRecipe(job.recipeId)));
    }
  }
  if (done.length) {
    bus.emit('crafting:done', done);
    bus.emit('crafting:changed');
    bus.emit('inventory:changed');
  }
  return done;
}
