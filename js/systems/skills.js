// Umiejętności żywiołów: nauka, wymagania, pasywne bonusy, synergie, reset.
import { SKILLS, SYNERGIES, ELEMENTS, getSkill } from '../data/skillTree.js';
import { BALANCE } from '../data/balance.js';
import { bus } from '../core/eventBus.js';

export function skillRank(state, id) { return state.skills[id] || 0; }

export function elementPoints(state) {
  const pts = Object.fromEntries(ELEMENTS.map((e) => [e, 0]));
  for (const s of SKILLS) pts[s.element] += skillRank(state, s.id);
  return pts;
}

export function activeSynergies(state) {
  const pts = elementPoints(state);
  return SYNERGIES.filter((syn) => syn.elements.every((e) => pts[e] >= syn.points));
}

// Zwraca { ok, reason }
export function canLearn(state, id) {
  const s = getSkill(id);
  if (!s) return { ok: false, reason: 'unknown' };
  const rank = skillRank(state, id);
  if (rank >= s.maxRank) return { ok: false, reason: 'maxRank' };
  if (state.hero.level < s.reqLevel) return { ok: false, reason: 'level' };
  if (s.tier > 1) {
    const prev = SKILLS.find((x) => x.element === s.element && x.tier === s.tier - 1);
    if (prev && skillRank(state, prev.id) < 1) return { ok: false, reason: 'prev' };
  }
  if (state.hero.skillPoints < 1) return { ok: false, reason: 'points' };
  return { ok: true };
}

export function learnSkill(state, id) {
  if (!canLearn(state, id).ok) return false;
  state.skills[id] = skillRank(state, id) + 1;
  state.hero.skillPoints--;
  bus.emit('hero:changed');
  return true;
}

export function respecCost(state) { return state.hero.level * BALANCE.RESPEC_COST_PER_LEVEL; }

export function resetSkills(state) {
  const spent = Object.values(state.skills).reduce((a, b) => a + b, 0);
  const cost = respecCost(state);
  if (spent <= 0 || state.hero.gold < cost) return false;
  state.hero.gold -= cost;
  state.hero.skillPoints += spent;
  state.skills = {};
  bus.emit('hero:changed');
  return true;
}

// Bonusy pasywne + synergie: { stats, flags }
export function skillPassives(state) {
  const stats = {};
  const flags = {};
  for (const s of SKILLS) {
    const r = skillRank(state, s.id);
    if (!r || s.type !== 'passive') continue;
    for (const [k, vals] of Object.entries(s.passive || {})) stats[k] = (stats[k] || 0) + vals[r - 1];
    for (const [k, vals] of Object.entries(s.flags || {})) flags[k] = vals[r - 1];
  }
  for (const syn of activeSynergies(state)) {
    for (const [k, v] of Object.entries(syn.stats)) stats[k] = (stats[k] || 0) + v;
    if (syn.flag) flags[syn.flag] = true;
  }
  return { stats, flags };
}
