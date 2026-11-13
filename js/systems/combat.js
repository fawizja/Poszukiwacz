// Automatyczna walka turowa: rundy co ROUND_MS, umiejętności, efekty statusu,
// bossowie co 10 wrogów, łupy po każdej wygranej.
import { BALANCE, enemyStats, enemyXp, enemyGold, applyDefense } from '../data/balance.js';
import { LOCATIONS, getLocation, locationIndex } from '../data/locations.js';
import { ENEMIES } from '../data/enemies.js';
import { SKILLS } from '../data/skillTree.js';
import { rng } from '../core/rng.js';
import { bus } from '../core/eventBus.js';
import { game } from '../core/state.js';
import { t } from '../i18n/i18n.js';
import { getDerived, addXp, ensureHp } from './hero.js';
import { skillRank } from './skills.js';
import { rollDrops, itemName } from './loot.js';
import { addItem, autoSellValue, useConsumable, bestPotion } from './inventory.js';
import { getBonuses } from './settlement.js';
import { playSound } from '../core/audio.js';

const DOT = ['burn', 'poison', 'bleed'];
const LOG_MAX = 40;

export function log(textKey, params, cls = '') {
  game.runtime.log.push({ text: t(textKey, params), cls });
  if (game.runtime.log.length > LOG_MAX) game.runtime.log.shift();
  bus.emit('combat:log');
}

const enemyName = (f) => t(`enemy.${f.enemyId}`);
const fmt = (n) => Math.round(n).toLocaleString('pl-PL');

export function spawnEnemy(state, boss = false) {
  const loc = getLocation(state.combat.locationId);
  const id = boss ? loc.boss : rng.pick(loc.enemies);
  const def = ENEMIES[id];
  const level = boss ? loc.levels[1] : rng.int(loc.levels[0], loc.levels[1]);
  const m = boss
    ? { hp: def.m.hp * BALANCE.BOSS_MULT.hp, atk: def.m.atk * BALANCE.BOSS_MULT.atk, def: def.m.def * BALANCE.BOSS_MULT.def }
    : def.m;
  const s = enemyStats(level, m);
  state.combat.fight = { enemyId: id, boss, level, hp: s.hp, maxHp: s.hp, atk: s.atk, def: s.def,
    effects: [], heroEffects: [], cooldowns: {}, round: 0 };
  state.combat.phase = 'fighting';
  state.combat.timer = BALANCE.ROUND_MS;
  log(boss ? 'log.bossAppears' : 'log.enemyAppears', { name: t(`enemy.${id}`), level });
  bus.emit('combat:spawn');
}

export function changeLocation(state, id) {
  const idx = locationIndex(id);
  if (idx >= state.combat.unlocked) return false;
  state.combat.locationId = id;
  state.combat.killsSinceBoss = 0;
  state.combat.bossReady = false;
  state.combat.autoBoss = true;
  state.combat.fight = null;
  state.combat.phase = 'pause';
  state.combat.timer = 300;
  log('log.travel', { name: t(`location.${id}.name`) }, 'log--info');
  bus.emit('combat:location');
  return true;
}

export function challengeBoss(state) {
  if (!state.combat.bossReady) return false;
  state.combat.autoBoss = true;
  if (!(state.combat.fight && state.combat.fight.boss)) spawnEnemy(state, true);
  return true;
}

function addEffect(list, eff, fresh = false) {
  const existing = list.find((e) => e.type === eff.type);
  if (existing) {
    existing.turns = Math.max(existing.turns, eff.turns);
    existing.power = Math.max(existing.power || 0, eff.power || 0);
    if (fresh) existing.fresh = true;
  } else list.push({ ...eff, fresh });
}

const hasEffect = (list, type) => list.some((e) => e.type === type && e.turns > 0);

function endRoundEffects(list) {
  for (const e of list) {
    if (e.fresh) { e.fresh = false; continue; }
    e.turns--;
  }
  return list.filter((e) => e.turns > 0);
}

function elementBonus(d, element) {
  return 1 + ((element === 'fire' ? d.fireDmg : element === 'ice' ? d.iceDmg : d.earthDmg) || 0) / 100;
}

function damageEnemy(f, amount) {
  f.hp = Math.max(0, f.hp - amount);
  return amount;
}

function heroLifesteal(state, d, dmg) {
  if (d.lifesteal > 0) state.hero.hp = Math.min(d.maxHp, state.hero.hp + dmg * d.lifesteal / 100);
}

function enemyDef(f, d) {
  return f.def * (d.flags.magma && hasEffect(f.effects, 'burn') ? 0.85 : 1);
}

function castSkill(state, f, d, skill, rank) {
  const r = rank - 1;
  const ctrlBonus = d.flags.permafrost ? 1 : 0;
  let raw = (d.magic * (skill.magic?.[r] || 0) + d.atk * (skill.atk?.[r] || 0) + d.def * (skill.def?.[r] || 0));
  raw *= elementBonus(d, skill.element) * rng.float(1 - BALANCE.DMG_VARIANCE, 1 + BALANCE.DMG_VARIANCE);
  const crit = rng.chance(d.crit / 100);
  if (crit) raw *= d.critMult;
  // Magia ignoruje połowę obrony wroga
  const dmg = Math.round(applyDefense(raw, enemyDef(f, d) * 0.5, state.hero.level));
  damageEnemy(f, dmg);
  heroLifesteal(state, d, dmg);
  log(crit ? 'log.skillCrit' : 'log.skill', { skill: t(`skill.${skill.id}.name`), dmg: fmt(dmg) }, `log--${skill.element}`);
  for (const eff of skill.effects || []) {
    if (!rng.chance(eff.chance?.[r] ?? 1)) continue;
    const isCtrl = !DOT.includes(eff.type);
    const power = DOT.includes(eff.type) ? Math.max(1, Math.round(d.magic * (eff.power?.[r] || 0.3) * elementBonus(d, skill.element)))
      : (eff.power?.[r] || 0);
    addEffect(f.effects, { type: eff.type, power, turns: eff.turns + (isCtrl && eff.type !== 'chill' ? ctrlBonus : 0) });
    log(`log.effect.${eff.type}`, { name: enemyName(f) }, 'log--status');
  }
  playSound(crit ? 'crit' : 'hit');
}

function heroAct(state, f, d) {
  // Umiejętności aktywne: najwyższy tier gotowy do użycia
  const actives = SKILLS.filter((s) => s.type === 'active' && skillRank(state, s.id) > 0)
    .sort((a, b) => b.tier - a.tier);
  for (const s of actives) {
    if ((f.cooldowns[s.id] || 0) <= 0) {
      castSkill(state, f, d, s, skillRank(state, s.id));
      f.cooldowns[s.id] = s.cd;
      return;
    }
  }
  if (rng.chance(BALANCE.ENEMY_DODGE / 100)) { log('log.enemyDodge', { name: enemyName(f) }, 'log--miss'); return; }
  const crit = rng.chance(d.crit / 100);
  let raw = d.atk * rng.float(1 - BALANCE.DMG_VARIANCE, 1 + BALANCE.DMG_VARIANCE);
  if (crit) raw *= d.critMult;
  const dmg = Math.round(applyDefense(raw, enemyDef(f, d), state.hero.level));
  damageEnemy(f, dmg);
  heroLifesteal(state, d, dmg);
  log(crit ? 'log.heroCrit' : 'log.heroHit', { name: enemyName(f), dmg: fmt(dmg) }, crit ? 'log--crit' : '');
  if (crit && d.flags.critBurn) {
    addEffect(f.effects, { type: 'burn', power: Math.max(1, Math.round(d.magic * d.flags.critBurn)), turns: 2 });
    log('log.effect.burn', { name: enemyName(f) }, 'log--status');
  }
  if (d.poisonChance > 0 && rng.chance(d.poisonChance / 100)) {
    addEffect(f.effects, { type: 'poison', power: Math.max(1, Math.round(d.atk * 0.15)), turns: 3 });
    log('log.effect.poison', { name: enemyName(f) }, 'log--status');
  }
  playSound(crit ? 'crit' : 'hit');
}

function enemyAct(state, f, d) {
  if (hasEffect(f.effects, 'stun') || hasEffect(f.effects, 'freeze')) {
    log('log.enemyStunned', { name: enemyName(f) }, 'log--status');
    return;
  }
  if (rng.chance(d.dodge / 100)) { log('log.heroDodge', { name: enemyName(f) }, 'log--miss'); return; }
  const chill = f.effects.find((e) => e.type === 'chill');
  let raw = f.atk * rng.float(1 - BALANCE.DMG_VARIANCE, 1 + BALANCE.DMG_VARIANCE) * (chill ? 1 - chill.power : 1);
  const dmg = Math.round(applyDefense(raw, d.def, f.level));
  state.hero.hp = Math.max(0, state.hero.hp - dmg);
  log('log.enemyHit', { name: enemyName(f), dmg: fmt(dmg) }, 'log--enemy');
  if (d.thorns > 0) {
    const back = Math.round(dmg * d.thorns / 100);
    if (back > 0) { damageEnemy(f, back); log('log.thorns', { dmg: fmt(back) }, 'log--earth'); }
  }
  const eff = ENEMIES[f.enemyId].effect;
  if (eff && rng.chance(eff.chance)) {
    addEffect(f.heroEffects, { type: eff.type, power: Math.max(1, Math.round(f.atk * eff.power)), turns: eff.turns }, true);
    log(`log.heroEffect.${eff.type}`, {}, 'log--status');
  }
}

function tickDots(list, apply) {
  for (const e of list) if (DOT.includes(e.type) && !e.fresh) apply(e);
}

function tryAutoPotion(state, d) {
  if (!state.settings.autoPotion) return;
  if (state.hero.hp / d.maxHp * 100 > state.settings.potionThreshold) return;
  const id = bestPotion(state);
  if (id) { useConsumable(state, id); log('log.potion', { name: t(`consumable.${id}.name`) }, 'log--heal'); }
}

function round(state) {
  const f = state.combat.fight;
  const d = getDerived(state);
  f.round++;
  for (const k of Object.keys(f.cooldowns)) f.cooldowns[k]--;

  tickDots(f.effects, (e) => { damageEnemy(f, e.power); log(`log.dot.${e.type}`, { name: enemyName(f), dmg: fmt(e.power) }, 'log--status'); });
  if (f.hp <= 0) return victory(state, f, d);
  tickDots(f.heroEffects, (e) => { state.hero.hp = Math.max(0, state.hero.hp - e.power); log(`log.heroDot.${e.type}`, { dmg: fmt(e.power) }, 'log--enemy'); });
  if (state.hero.hp <= 0) return defeat(state, f);

  state.hero.hp = Math.min(d.maxHp, state.hero.hp + d.regen);
  tryAutoPotion(state, d);

  if (hasEffect(f.heroEffects, 'stun')) log('log.heroStunned', {}, 'log--status');
  else heroAct(state, f, d);
  if (f.hp <= 0) return victory(state, f, d);

  enemyAct(state, f, d);
  if (f.hp <= 0) return victory(state, f, d);
  if (state.hero.hp <= 0) return defeat(state, f);

  f.effects = endRoundEffects(f.effects);
  f.heroEffects = endRoundEffects(f.heroEffects);
}

function victory(state, f, d) {
  const c = state.combat;
  const bonus = getBonuses(state);
  const mult = f.boss ? BALANCE.BOSS_MULT : { xp: 1, gold: 1 };
  const xp = Math.floor(enemyXp(f.level) * mult.xp * (1 + (d.xpBonus + bonus.xpPct) / 100));
  const gold = Math.floor(enemyGold(f.level) * mult.gold * (1 + (d.goldFind + bonus.goldPct) / 100));
  state.hero.gold += gold;
  state.stats.goldEarned += gold;
  state.stats.kills++;
  log('log.victory', { name: enemyName(f), xp: fmt(xp), gold: fmt(gold) }, 'log--victory');

  const drops = rollDrops(state, f, d);
  for (const item of drops.items) {
    state.stats.itemsFound++;
    if (addItem(state, item)) {
      log('log.loot', { name: itemName(item), rarity: t(`rarity.${item.rarity}`) }, `log--rarity-${item.rarity}`);
      bus.emit('loot:item', item);
    } else {
      const g = autoSellValue(state, item);
      state.hero.gold += g;
      log('log.lootSold', { gold: fmt(g) }, 'log--info');
    }
  }
  for (const [res, n] of Object.entries(drops.resources)) {
    state.resources[res] = (state.resources[res] || 0) + n;
    log('log.resource', { n, name: t(`resource.${res}`) }, 'log--resource');
  }
  if (drops.items.length) playSound('loot');
  bus.emit('inventory:changed');

  if (f.boss) {
    state.stats.bossKills++;
    c.killsSinceBoss = 0;
    c.bossReady = false;
    c.bossesDefeated[c.locationId] = (c.bossesDefeated[c.locationId] || 0) + 1;
    const idx = locationIndex(c.locationId);
    if (idx + 1 < LOCATIONS.length && c.unlocked <= idx + 1) {
      c.unlocked = idx + 2;
      const next = LOCATIONS[idx + 1];
      log('log.unlocked', { name: t(`location.${next.id}.name`) }, 'log--victory');
      bus.emit('combat:unlocked', next.id);
      if (state.settings.autoAdvance) changeLocation(state, next.id);
    } else if (idx + 1 >= LOCATIONS.length && c.bossesDefeated[c.locationId] === 1) {
      bus.emit('game:completed');
    }
  } else {
    c.killsSinceBoss = Math.min(BALANCE.KILLS_PER_BOSS, c.killsSinceBoss + 1);
    if (c.killsSinceBoss >= BALANCE.KILLS_PER_BOSS && !c.bossReady) {
      c.bossReady = true;
      log('log.bossReady', {}, 'log--info');
    }
  }

  addXp(state, xp);
  if (c.fight === f) c.fight = null;
  if (c.phase !== 'pause' || c.timer < BALANCE.PAUSE_MS) { c.phase = 'pause'; c.timer = BALANCE.PAUSE_MS; }
  const max = getDerived(state).maxHp;
  state.hero.hp = Math.min(max, state.hero.hp + max * BALANCE.PAUSE_HEAL_PCT);
  bus.emit('combat:end', { win: true });
}

function defeat(state, f) {
  const c = state.combat;
  state.stats.deaths++;
  if (f.boss) c.autoBoss = false;
  c.fight = null;
  c.phase = 'dead';
  c.timer = BALANCE.RESPAWN_MS;
  log(f.boss ? 'log.defeatBoss' : 'log.defeat', { name: enemyName(f) }, 'log--enemy');
  playSound('defeat');
  bus.emit('combat:end', { win: false });
}

export function updateCombat(state, dt) {
  const c = state.combat;
  ensureHp(state);
  c.timer -= dt;
  let guard = 0;
  while (c.timer <= 0 && guard++ < 30) {
    if (c.phase === 'fighting' && c.fight) {
      c.timer += BALANCE.ROUND_MS;
      round(state);
    } else if (c.phase === 'dead') {
      state.hero.hp = getDerived(state).maxHp;
      log('log.respawn', {}, 'log--heal');
      spawnEnemy(state, false);
    } else {
      spawnEnemy(state, c.bossReady && c.autoBoss);
    }
  }
}

// Statystyczna estymacja walki w bieżącej lokacji (dla AFK).
export function estimateFight(state) {
  const loc = getLocation(state.combat.locationId);
  const d = getDerived(state);
  const lvl = (loc.levels[0] + loc.levels[1]) / 2;
  const avgM = { hp: 0, atk: 0, def: 0 };
  for (const id of loc.enemies) for (const k of Object.keys(avgM)) avgM[k] += ENEMIES[id].m[k] / loc.enemies.length;
  const es = enemyStats(lvl, avgM);
  let dpr = applyDefense(d.atk, es.def, state.hero.level) * (1 + d.crit / 100 * (d.critMult - 1)) * (1 - BALANCE.ENEMY_DODGE / 100);
  for (const s of SKILLS) {
    const r = skillRank(state, s.id);
    if (s.type === 'active' && r > 0) dpr += (d.magic * (s.magic?.[r - 1] || 0) + d.atk * (s.atk?.[r - 1] || 0)) / s.cd * 0.7;
  }
  const rounds = Math.max(1, es.hp / Math.max(1, dpr));
  const taken = Math.max(0, applyDefense(es.atk, d.def, lvl) * (1 - d.dodge / 100) - d.regen) * rounds;
  const winRate = taken < d.maxHp ? 1 : Math.max(0.05, Math.min(1, d.maxHp / taken));
  return {
    location: loc,
    secondsPerKill: rounds * BALANCE.ROUND_MS / 1000 + BALANCE.PAUSE_MS / 1000,
    winRate,
    avgXp: enemyXp(Math.round(lvl)),
    avgGold: enemyGold(Math.round(lvl))
  };
}
