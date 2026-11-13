// Ekrany zakładek: Bohater, Walka, Plecak, Crafting, Osada.
// Każdy ekran ma render() (pełne odświeżenie) i update() (lekka aktualizacja co tick UI).
import { t } from '../i18n/i18n.js';
import { game } from '../core/state.js';
import { BALANCE } from '../data/balance.js';
import { LOCATIONS, getLocation } from '../data/locations.js';
import { ENEMIES } from '../data/enemies.js';
import { SKILLS, SYNERGIES, ELEMENTS } from '../data/skillTree.js';
import { EQUIP_SLOTS, CONSUMABLES, RESOURCES } from '../data/items.js';
import { BUILDINGS, BUILDING_BONUS, MARKET_PRICES } from '../data/buildings.js';
import { PROFESSIONS } from '../data/recipes.js';
import { professionXpFor } from '../data/balance.js';
import { esc, fmt, fmtTime, fmtStat, statLine, bar, itemIcon, resourceIcon, costHtml, $ } from './renderer.js';
import { registerActions, registerChanges } from './navigation.js';
import { confirmModal, toast } from './modals.js';
import { getDerived, xpProgress, allocateStat, resetStats, statResetCost, STAT_KEYS } from '../systems/hero.js';
import { changeLocation, challengeBoss } from '../systems/combat.js';
import { capacity, sellAllUpTo, useConsumable } from '../systems/inventory.js';
import { itemScore } from '../systems/loot.js';
import { skillRank, canLearn, learnSkill, elementPoints, activeSynergies, respecCost, resetSkills } from '../systems/skills.js';
import { recipesFor, canCraft, enqueue, cancelCraft, craftDuration } from '../systems/crafting.js';
import { canUpgradeBuilding, upgradeBuilding, marketPrice, marketBuy } from '../systems/settlement.js';

const ui = { heroTab: 'stats', craftTab: 'smithing', sort: 'rarity', logLen: -1 };
const S = () => game.state;
const el = (id) => document.getElementById(id);

// ======================= BOHATER =======================
function renderHero() {
  const s = S(), h = s.hero, d = getDerived(s), p = xpProgress(s);
  const tabs = ['stats', 'skills'].map((id) => `<button class="tab ${ui.heroTab === id ? 'tab--active' : ''}" type="button" data-action="hero-tab" data-tab="${id}">${t(`hero.tab.${id}`)}${id === 'skills' && h.skillPoints ? ` <span class="badge">${h.skillPoints}</span>` : ''}${id === 'stats' && h.statPoints ? ` <span class="badge">${h.statPoints}</span>` : ''}</button>`).join('');
  const head = `
    <div class="card hero-card">
      <div class="portrait portrait--hero portrait--large" data-portrait="hero"></div>
      <div class="hero-card__info">
        <h2>${t('hero.name')}</h2>
        <div>${t('common.level', { n: h.level })}</div>
        ${bar(p.pct, 'bar--xp', '', `${fmt(p.xp)} / ${fmt(p.need)} ${t('common.xp')}`)}
        ${bar(h.hp / d.maxHp * 100, 'bar--hp', 'hero-tab-hp', `${fmt(h.hp)} / ${fmt(d.maxHp)}`)}
      </div>
    </div>
    <div class="tabs">${tabs}</div>`;
  $('#screen-hero').innerHTML = head + (ui.heroTab === 'stats' ? heroStatsHtml(s, d) : heroSkillsHtml(s));
}

function heroStatsHtml(s, d) {
  const h = s.hero;
  const base = STAT_KEYS.map((k) => `
    <div class="attr">
      <div class="attr__icon icon icon--${k}" data-icon="${k}"></div>
      <div class="attr__info"><b>${t(`stat.${k}`)}: ${d[k]}</b><small>${t(`hero.attrDesc.${k}`)}</small></div>
      <button class="btn btn--small btn--primary" type="button" data-action="alloc" data-stat="${k}" data-n="1" ${h.statPoints ? '' : 'disabled'}>+1</button>
      <button class="btn btn--small" type="button" data-action="alloc" data-stat="${k}" data-n="5" ${h.statPoints >= 5 ? '' : 'disabled'}>+5</button>
    </div>`).join('');
  const derived = [
    ['maxHp', fmt(d.maxHp)], ['atk', fmt(d.atk)], ['def', fmt(d.def)], ['magic', fmt(d.magic)],
    ['crit', d.crit.toFixed(1) + '%'], ['critMult', '×' + d.critMult.toFixed(2)], ['dodge', d.dodge.toFixed(1) + '%'],
    ['regen', d.regen], ['lifesteal', d.lifesteal + '%'], ['thorns', d.thorns + '%'],
    ['fireDmg', '+' + d.fireDmg + '%'], ['iceDmg', '+' + d.iceDmg + '%'], ['earthDmg', '+' + d.earthDmg + '%'],
    ['goldFind', '+' + d.goldFind + '%'], ['magicFind', '+' + d.magicFind + '%'], ['xpBonus', '+' + d.xpBonus + '%']
  ].map(([k, v]) => `<div class="stat-line"><span>${t(`stat.${k}`)}</span><b>${v}</b></div>`).join('');
  const buffs = s.buffs.length ? s.buffs.map((b) => `<div class="buff"><span class="consumable-icon" style="--c:${CONSUMABLES[b.id]?.color}"></span>
    <span>${t(`consumable.${b.id}.name`)}</span><b>${fmtTime(b.remaining)}</b></div>`).join('') : `<div class="muted">${t('hero.noBuffs')}</div>`;
  const st = s.stats;
  return `
    <div class="card"><div class="card__head"><h3>${t('hero.attributes')}</h3><span class="pill">${t('hero.points', { n: h.statPoints })}</span></div>${base}
      <button class="btn btn--small" type="button" data-action="reset-stats">${t('hero.resetStats', { gold: fmt(statResetCost(s)) })}</button></div>
    <div class="card"><h3>${t('hero.derived')}</h3><div class="stat-grid">${derived}</div></div>
    <div class="card"><h3>${t('hero.buffs')}</h3><div id="buff-list">${buffs}</div></div>
    <div class="card"><h3>${t('hero.statistics')}</h3><div class="stat-grid">
      <div class="stat-line"><span>${t('hero.stat.kills')}</span><b>${fmt(st.kills)}</b></div>
      <div class="stat-line"><span>${t('hero.stat.bossKills')}</span><b>${fmt(st.bossKills)}</b></div>
      <div class="stat-line"><span>${t('hero.stat.deaths')}</span><b>${fmt(st.deaths)}</b></div>
      <div class="stat-line"><span>${t('hero.stat.goldEarned')}</span><b>${fmt(st.goldEarned)}</b></div>
      <div class="stat-line"><span>${t('hero.stat.itemsFound')}</span><b>${fmt(st.itemsFound)}</b></div>
      <div class="stat-line"><span>${t('hero.stat.crafted')}</span><b>${fmt(st.crafted)}</b></div>
      <div class="stat-line"><span>${t('hero.stat.playTime')}</span><b>${fmtTime(st.playTimeMs)}</b></div>
    </div></div>`;
}

function skillDesc(sk, rank) {
  const r = Math.max(0, rank - 1);
  const p = (arr) => (arr ? Math.round(arr[r] * 100) : 0);
  const eff = sk.effects?.[0];
  return t(`skill.${sk.id}.desc`, {
    magic: p(sk.magic), atk: p(sk.atk), def: p(sk.def), cd: sk.cd,
    chance: eff ? p(eff.chance) : 0, power: eff ? p(eff.power) : 0, turns: eff?.turns,
    v1: sk.passive ? Object.values(sk.passive)[0][r] : '', v2: sk.passive ? (Object.values(sk.passive)[1] || [])[r] : '',
    v3: sk.passive ? (Object.values(sk.passive)[2] || [])[r] : '', flag: sk.flags ? Math.round(Object.values(sk.flags)[0][r] * 100) : ''
  });
}

function heroSkillsHtml(s) {
  const pts = elementPoints(s);
  const active = activeSynergies(s).map((x) => x.id);
  const syn = SYNERGIES.map((x) => `<div class="synergy ${active.includes(x.id) ? 'synergy--active' : ''}">
    <b>${t(`synergy.${x.id}.name`)}</b><small>${t(`synergy.${x.id}.desc`)}</small>
    <small class="muted">${t('skills.synergyReq', { n: x.points, list: x.elements.map((e) => t(`element.${e}`)).join(' + ') })}</small></div>`).join('');
  const cols = ELEMENTS.map((e) => `
    <div class="element-col element-col--${e}">
      <h3 class="element-title"><span class="icon icon--${e}" data-icon="${e}"></span>${t(`element.${e}`)} <small>(${pts[e]})</small></h3>
      ${SKILLS.filter((sk) => sk.element === e).map((sk) => {
        const rank = skillRank(s, sk.id);
        const c = canLearn(s, sk.id);
        return `<div class="skill ${rank ? 'skill--learned' : ''}" data-skill="${sk.id}">
          <div class="skill__icon skill-icon skill-icon--${e}" data-skill-icon="${sk.id}"></div>
          <div class="skill__body">
            <div class="skill__name"><b>${t(`skill.${sk.id}.name`)}</b> <span class="pill">${rank}/${sk.maxRank}</span>
              <span class="muted small">${t(`skills.type.${sk.type}`)}</span></div>
            <small>${skillDesc(sk, rank || 1)}</small>
            ${c.ok || c.reason === 'maxRank' ? '' : `<small class="warn">${t(`skills.reason.${c.reason}`, { n: sk.reqLevel })}</small>`}
          </div>
          <button class="btn btn--small btn--primary" type="button" data-action="learn-skill" data-id="${sk.id}" ${c.ok ? '' : 'disabled'}>${rank ? '+1' : t('skills.learn')}</button>
        </div>`;
      }).join('')}
    </div>`).join('');
  return `
    <div class="card"><div class="card__head"><h3>${t('skills.title')}</h3><span class="pill">${t('skills.points', { n: s.hero.skillPoints })}</span></div>
      <p class="muted small">${t('skills.hint', { n: BALANCE.SKILL_POINT_EVERY })}</p>
      <div class="skill-tree">${cols}</div>
      <button class="btn btn--small" type="button" data-action="reset-skills">${t('skills.reset', { gold: fmt(respecCost(s)) })}</button></div>
    <div class="card"><h3>${t('skills.synergies')}</h3>${syn}</div>`;
}

function updateHero() {
  const s = S(), d = getDerived(s);
  const hp = el('hero-tab-hp');
  if (hp) { hp.style.width = `${s.hero.hp / d.maxHp * 100}%`; el('hero-tab-hp-label').textContent = `${fmt(s.hero.hp)} / ${fmt(d.maxHp)}`; }
}

// ======================= WALKA =======================
const effectsHtml = (list) => (list || []).map((e) => `<span class="effect effect--${e.type}" title="${esc(t(`effect.${e.type}`))}">${t(`effect.${e.type}`)} ${e.turns}</span>`).join('');

function renderCombat() {
  const s = S(), c = s.combat;
  const locs = LOCATIONS.map((l, i) => {
    const locked = i >= c.unlocked;
    return `<button class="loc ${l.id === c.locationId ? 'loc--active' : ''} ${locked ? 'loc--locked' : ''}" type="button"
      data-action="travel" data-id="${l.id}" ${locked ? 'disabled' : ''} style="--loc-color:${l.color}">
      <span class="loc__art location-art location-art--${l.id}" data-location="${l.id}"></span>
      <span class="loc__name">${locked ? t('combat.locked') : t(`location.${l.id}.name`)}</span>
      <span class="loc__lvl">${t('combat.levels', { a: l.levels[0], b: l.levels[1] })}</span>
      ${c.bossesDefeated[l.id] ? '<span class="loc__done">✓</span>' : ''}
    </button>`;
  }).join('');
  const loc = getLocation(c.locationId);
  const potions = Object.keys(CONSUMABLES).filter((id) => (s.consumables[id] || 0) > 0).map((id) => `
    <button class="consumable" type="button" data-action="use-consumable" data-id="${id}" title="${esc(t(`consumable.${id}.desc`))}">
      <span class="consumable-icon" style="--c:${CONSUMABLES[id].color}" data-consumable="${id}"></span>
      <span>${t(`consumable.${id}.name`)}</span><b>×${s.consumables[id]}</b></button>`).join('');
  $('#screen-combat').innerHTML = `
    <div class="loc-list">${locs}</div>
    <div class="card arena" style="--loc-color:${loc.color}">
      <div class="arena__bg location-art location-art--${loc.id}" data-location="${loc.id}"></div>
      <div class="arena__title"><b>${t(`location.${loc.id}.name`)}</b><small>${t(`location.${loc.id}.desc`)}</small></div>
      <div class="arena__fighters">
        <div class="fighter fighter--hero">
          <div class="portrait portrait--hero" data-portrait="hero" id="arena-hero"></div>
          <div class="fighter__name">${t('hero.name')}</div>
          <div id="arena-hero-hp"></div>
          <div class="effects" id="arena-hero-effects"></div>
        </div>
        <div class="arena__vs">VS</div>
        <div class="fighter fighter--enemy">
          <div class="portrait portrait--enemy" id="arena-enemy"></div>
          <div class="fighter__name" id="arena-enemy-name"></div>
          <div id="arena-enemy-hp"></div>
          <div class="effects" id="arena-enemy-effects"></div>
        </div>
      </div>
      <div class="arena__status" id="arena-status"></div>
    </div>
    <div class="card">
      <div class="card__head"><b>${t('combat.bossProgress')}</b><span id="boss-count"></span></div>
      <div id="boss-bar"></div>
      <button class="btn btn--danger btn--block" type="button" data-action="challenge-boss" id="btn-boss">${t('combat.challengeBoss', { name: t(`enemy.${loc.boss}`) })}</button>
    </div>
    <div class="card"><h3>${t('combat.consumables')}</h3><div class="consumables">${potions || `<span class="muted">${t('combat.noConsumables')}</span>`}</div>
      <label class="setting setting--toggle"><span>${t('combat.autoPotion', { n: s.settings.potionThreshold })}</span><input type="checkbox" data-change="auto-potion" ${s.settings.autoPotion ? 'checked' : ''}></label>
      <label class="setting setting--toggle"><span>${t('combat.autoAdvance')}</span><input type="checkbox" data-change="auto-advance" ${s.settings.autoAdvance ? 'checked' : ''}></label>
    </div>
    <div class="card"><h3>${t('combat.log')}</h3><div class="battle-log" id="battle-log"></div></div>`;
  ui.logLen = -1;
  updateCombat();
}

function updateCombat() {
  const s = S(), c = s.combat, d = getDerived(s), f = c.fight;
  const hp = el('arena-hero-hp');
  if (!hp) return;
  hp.innerHTML = bar(s.hero.hp / d.maxHp * 100, 'bar--hp', '', `${fmt(s.hero.hp)} / ${fmt(d.maxHp)}`);
  el('arena-hero-effects').innerHTML = effectsHtml(f?.heroEffects);
  const ep = el('arena-enemy');
  if (f) {
    ep.dataset.portrait = f.enemyId;
    ep.style.setProperty('--enemy-color', ENEMIES[f.enemyId].color);
    ep.classList.toggle('portrait--boss', f.boss);
    ep.classList.remove('portrait--empty');
    el('arena-enemy-name').innerHTML = `${f.boss ? `<span class="boss-tag">${t('combat.boss')}</span> ` : ''}${esc(t(`enemy.${f.enemyId}`))} <small>${t('common.levelShort', { n: f.level })}</small>`;
    el('arena-enemy-hp').innerHTML = bar(f.hp / f.maxHp * 100, 'bar--enemy', '', `${fmt(f.hp)} / ${fmt(f.maxHp)}`);
    el('arena-enemy-effects').innerHTML = effectsHtml(f.effects);
  } else {
    ep.classList.add('portrait--empty');
    ep.classList.remove('portrait--boss');
    el('arena-enemy-name').textContent = '';
    el('arena-enemy-hp').innerHTML = '';
    el('arena-enemy-effects').innerHTML = '';
  }
  el('arena-status').textContent = c.phase === 'dead' ? t('combat.respawning', { s: Math.ceil(c.timer / 1000) })
    : c.phase === 'pause' ? t('combat.searching') : t('combat.round', { n: f?.round || 0 });
  el('boss-count').textContent = c.bossReady ? t('combat.bossReady') : `${c.killsSinceBoss}/${BALANCE.KILLS_PER_BOSS}`;
  el('boss-bar').innerHTML = bar(c.killsSinceBoss / BALANCE.KILLS_PER_BOSS * 100, 'bar--boss');
  el('btn-boss').disabled = !c.bossReady || !!(f && f.boss);
  const log = game.runtime.log;
  if (ui.logLen !== log.length || ui.logLast !== log[log.length - 1]) {
    ui.logLen = log.length;
    ui.logLast = log[log.length - 1];
    el('battle-log').innerHTML = log.slice(-25).reverse().map((l) => `<div class="log-line ${l.cls}">${esc(l.text)}</div>`).join('');
  }
}

// ======================= PLECAK =======================
const SORTS = {
  rarity: (a, b) => b.rarity - a.rarity || b.level - a.level,
  level: (a, b) => b.level - a.level || b.rarity - a.rarity,
  slot: (a, b) => a.slot.localeCompare(b.slot) || b.rarity - a.rarity,
  power: (a, b) => itemScore(b) - itemScore(a)
};

function renderBackpack() {
  const s = S();
  const eq = EQUIP_SLOTS.map((slot) => {
    const it = s.equipment[slot];
    return `<button class="eq-slot eq-slot--${slot}" type="button" ${it ? `data-action="open-item" data-uid="${it.uid}"` : 'disabled'}>
      ${it ? itemIcon(it) : `<div class="item-icon item-icon--empty item-icon--${slot.replace(/\d/, '')}" data-slot="${slot}"></div>`}
      <span class="eq-slot__label">${t(`slot.${slot}`)}</span></button>`;
  }).join('');
  const res = RESOURCES.map((r) => `<div class="res" title="${esc(t(`resource.${r}`))}">${resourceIcon(r)}<span>${t(`resource.${r}`)}</span><b>${fmt(s.resources[r] || 0)}</b></div>`).join('');
  const cons = Object.keys(CONSUMABLES).filter((id) => (s.consumables[id] || 0) > 0).map((id) => `
    <div class="cons-row"><span class="consumable-icon" style="--c:${CONSUMABLES[id].color}" data-consumable="${id}"></span>
      <div><b>${t(`consumable.${id}.name`)} ×${s.consumables[id]}</b><small>${t(`consumable.${id}.desc`)}</small></div>
      <button class="btn btn--small" type="button" data-action="use-consumable" data-id="${id}">${t('inventory.use')}</button></div>`).join('');
  const items = [...s.inventory].sort(SORTS[ui.sort]);
  const cap = capacity(s);
  const grid = items.map((it) => `<button class="bag-slot" type="button" data-action="open-item" data-uid="${it.uid}">${itemIcon(it)}<span class="bag-slot__lvl">${it.level}</span></button>`).join('')
    + Array.from({ length: Math.max(0, cap - items.length) }, () => '<div class="bag-slot bag-slot--empty"></div>').join('');
  $('#screen-backpack').innerHTML = `
    <div class="card"><h3>${t('inventory.equipment')}</h3><div class="eq-grid">${eq}</div></div>
    <div class="card"><h3>${t('inventory.resources')}</h3><div class="res-grid">${res}</div></div>
    <div class="card"><h3>${t('inventory.consumables')}</h3>${cons || `<div class="muted">${t('combat.noConsumables')}</div>`}</div>
    <div class="card">
      <div class="card__head"><h3>${t('inventory.backpack')}</h3><span class="pill ${items.length >= cap ? 'pill--warn' : ''}">${items.length}/${cap}</span></div>
      <div class="toolbar">
        <select data-change="sort" aria-label="${esc(t('inventory.sort'))}">${Object.keys(SORTS).map((k) => `<option value="${k}" ${ui.sort === k ? 'selected' : ''}>${t(`inventory.sortBy.${k}`)}</option>`).join('')}</select>
        <button class="btn btn--small btn--gold" type="button" data-action="sell-all" data-max="0">${t('inventory.sellCommon')}</button>
        <button class="btn btn--small btn--gold" type="button" data-action="sell-all" data-max="1">${t('inventory.sellUncommon')}</button>
      </div>
      <div class="bag-grid">${grid}</div>
      <p class="muted small">${t('inventory.hint')}</p>
    </div>`;
}

// ======================= CRAFTING =======================
function renderCrafting() {
  const s = S();
  const tabs = Object.keys(PROFESSIONS).map((p) => `<button class="tab ${ui.craftTab === p ? 'tab--active' : ''}" type="button" data-action="craft-tab" data-tab="${p}">${t(`profession.${p}`)}</button>`).join('');
  const prof = s.crafting.professions[ui.craftTab];
  const building = PROFESSIONS[ui.craftTab].building;
  const bLvl = s.settlement[building];
  const recipes = recipesFor(ui.craftTab).map((r) => {
    const c = canCraft(s, r.id);
    return `<div class="recipe ${bLvl < r.level ? 'recipe--locked' : ''}">
      <div class="recipe__icon recipe-icon recipe-icon--${r.result.type}" data-recipe="${r.id}" style="--c:${r.result.type === 'consumable' ? CONSUMABLES[r.result.id].color : 'var(--rarity-' + (r.result.minRarity ?? 0) + ')'}"></div>
      <div class="recipe__body">
        <b>${t(`recipe.${r.id}.name`)}</b><small>${t(`recipe.${r.id}.desc`)}</small>
        <div class="costs">${costHtml(s, r.cost)}<span class="cost">⏱ ${fmtTime(craftDuration(s, r))}</span></div>
        ${bLvl < r.level ? `<small class="warn">${t('crafting.needBuilding', { name: t(`building.${building}.name`), n: r.level })}</small>` : ''}
      </div>
      <button class="btn btn--small btn--primary" type="button" data-action="craft" data-id="${r.id}" ${c.ok ? '' : 'disabled'}>${t('crafting.craft')}</button>
    </div>`;
  }).join('');
  const queue = Array.from({ length: BALANCE.CRAFT_QUEUE_MAX }, (_, i) => {
    const job = s.crafting.queue[i];
    if (!job) return `<div class="queue-slot queue-slot--empty">${t('crafting.emptySlot')}</div>`;
    return `<div class="queue-slot">
      <div class="queue-slot__info"><b>${t(`recipe.${job.recipeId}.name`)}</b><small id="q-time-${i}">${i === 0 ? fmtTime(job.remaining) : t('crafting.waiting')}</small></div>
      <div id="q-bar-${i}">${bar((1 - job.remaining / job.total) * 100, 'bar--craft')}</div>
      <button class="btn btn--small" type="button" data-action="craft-cancel" data-index="${i}">${t('crafting.cancel')}</button></div>`;
  }).join('');
  $('#screen-crafting').innerHTML = `
    <div class="tabs">${tabs}</div>
    <div class="card">
      <div class="card__head"><h3>${t(`profession.${ui.craftTab}`)}</h3><span class="pill">${t('common.level', { n: prof.level })}</span></div>
      ${bar(prof.level >= BALANCE.PROFESSION_MAX_LEVEL ? 100 : prof.xp / professionXpFor(prof.level) * 100, 'bar--xp', '', prof.level >= BALANCE.PROFESSION_MAX_LEVEL ? t('crafting.maxLevel') : `${prof.xp} / ${professionXpFor(prof.level)}`)}
      <p class="muted small">${t('crafting.profHint', { pct: Math.round(BALANCE.PROFESSION_TIME_REDUCTION * 100) })} ${bLvl < 1 ? t('crafting.buildFirst', { name: t(`building.${building}.name`) }) : ''}</p>
    </div>
    <div class="card"><h3>${t('crafting.queue')}</h3>${queue}</div>
    <div class="card"><h3>${t('crafting.recipes')}</h3>${recipes}</div>`;
}

function updateCrafting() {
  const q = S().crafting.queue;
  q.forEach((job, i) => {
    const tm = el(`q-time-${i}`), b = el(`q-bar-${i}`);
    if (tm && i === 0) tm.textContent = fmtTime(job.remaining);
    if (b) { const fill = b.querySelector('.bar__fill'); if (fill) fill.style.width = `${(1 - job.remaining / job.total) * 100}%`; }
  });
}

// ======================= OSADA =======================
function bonusText(id, lvl) {
  const b = BUILDING_BONUS[id];
  const params = Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v * lvl]));
  if (id === 'townhall') params.afk = Math.round(Math.min(1, BALANCE.AFK_BASE_EFFICIENCY + BALANCE.AFK_EFF_PER_TOWNHALL * lvl) * 100);
  return t(`building.${id}.bonus`, params);
}

function renderSettlement() {
  const s = S();
  const cards = BUILDINGS.map((b) => {
    const lvl = s.settlement[b.id];
    const c = canUpgradeBuilding(s, b.id);
    return `<div class="card building ${lvl ? '' : 'building--unbuilt'}">
      <div class="building__art building-art building-art--${b.id}" data-building="${b.id}" data-level="${lvl}" style="--b-color:${b.color}"><span>${lvl}</span></div>
      <div class="building__body">
        <div class="card__head"><b>${t(`building.${b.id}.name`)}</b><span class="pill">${t('settlement.level', { n: lvl, max: BALANCE.BUILDING_MAX_LEVEL })}</span></div>
        <small>${t(`building.${b.id}.desc`)}</small>
        <div class="small">${t('settlement.current')}: <b>${lvl ? bonusText(b.id, lvl) : t('settlement.notBuilt')}</b></div>
        ${c.cost ? `<div class="small">${t('settlement.next')}: ${bonusText(b.id, lvl + 1)}</div><div class="costs">${costHtml(s, c.cost)}</div>` : `<div class="small ok">${t('settlement.maxed')}</div>`}
        ${c.reason === 'townhall' ? `<small class="warn">${t('settlement.needTownhall', { n: lvl })}</small>` : ''}
        ${c.cost ? `<button class="btn btn--primary btn--small" type="button" data-action="build" data-id="${b.id}" ${c.ok ? '' : 'disabled'}>${lvl ? t('settlement.upgrade') : t('settlement.build')}</button>` : ''}
      </div></div>`;
  }).join('');
  const market = s.settlement.market >= 1 ? `
    <div class="card"><h3>${t('settlement.marketTitle')}</h3><p class="muted small">${t('settlement.marketHint')}</p>
      ${Object.keys(MARKET_PRICES).map((r) => `<div class="market-row">${resourceIcon(r)}<span>${t(`resource.${r}`)}</span>
        <small>${t('settlement.pricePer', { gold: marketPrice(s, r) })}</small>
        <button class="btn btn--small btn--gold" type="button" data-action="market-buy" data-res="${r}" data-n="10" ${s.hero.gold >= marketPrice(s, r) * 10 ? '' : 'disabled'}>+10 (${fmt(marketPrice(s, r) * 10)})</button></div>`).join('')}
    </div>` : `<div class="card muted">${t('settlement.marketLocked')}</div>`;
  $('#screen-settlement').innerHTML = `<div class="card"><h3>${t('settlement.title')}</h3><p class="muted small">${t('settlement.hint')}</p></div>${cards}${market}`;
}

// ======================= REJESTR =======================
export const SCREENS = {
  hero: { render: renderHero, update: updateHero },
  combat: { render: renderCombat, update: updateCombat },
  backpack: { render: renderBackpack, update: () => {} },
  crafting: { render: renderCrafting, update: updateCrafting },
  settlement: { render: renderSettlement, update: () => {} }
};

export function initScreens(rerender) {
  registerActions({
    'hero-tab': (d) => { ui.heroTab = d.tab; rerender('hero'); },
    alloc: (d) => { allocateStat(S(), d.stat, Number(d.n)); },
    'reset-stats': () => confirmModal(t('hero.resetStatsTitle'), t('hero.resetStatsConfirm', { gold: fmt(statResetCost(S())) }), () => {
      if (!resetStats(S())) toast(t('common.cannot'), 'toast--warn');
    }),
    'learn-skill': (d) => { if (learnSkill(S(), d.id)) toast(t('skills.learned', { name: t(`skill.${d.id}.name`) }), 'toast--ok'); },
    'reset-skills': () => confirmModal(t('skills.resetTitle'), t('skills.resetConfirm', { gold: fmt(respecCost(S())) }), () => {
      if (!resetSkills(S())) toast(t('common.cannot'), 'toast--warn');
    }),
    travel: (d) => { changeLocation(S(), d.id); rerender('combat'); },
    'challenge-boss': () => { challengeBoss(S()); updateCombat(); },
    'use-consumable': (d) => { if (useConsumable(S(), d.id)) toast(t('inventory.used', { name: t(`consumable.${d.id}.name`) }), 'toast--ok'); },
    'sell-all': (d) => {
      const max = Number(d.max);
      confirmModal(t('inventory.sellAllTitle'), t(max ? 'inventory.sellAllConfirm1' : 'inventory.sellAllConfirm0'), () => {
        const r = sellAllUpTo(S(), max);
        toast(t('inventory.soldAll', { n: r.count, gold: fmt(r.total) }), 'toast--gold');
      });
    },
    'craft-tab': (d) => { ui.craftTab = d.tab; rerender('crafting'); },
    craft: (d) => { if (enqueue(S(), d.id)) toast(t('crafting.started', { name: t(`recipe.${d.id}.name`) }), 'toast--ok'); },
    'craft-cancel': (d) => { cancelCraft(S(), Number(d.index)); },
    build: (d) => { if (upgradeBuilding(S(), d.id)) toast(t('settlement.built', { name: t(`building.${d.id}.name`), n: S().settlement[d.id] }), 'toast--ok'); },
    'market-buy': (d) => { marketBuy(S(), d.res, Number(d.n)); }
  });
  registerChanges({
    sort: (e) => { ui.sort = e.value; rerender('backpack'); },
    'auto-potion': (e) => { S().settings.autoPotion = e.checked; },
    'auto-advance': (e) => { S().settings.autoAdvance = e.checked; }
  });
}
