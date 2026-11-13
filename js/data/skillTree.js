// Drzewko umiejętności: 3 żywioły po 5 umiejętności (rangi 1–3).
// Aktywne: obrażenia = magia*magic[r] + atak*atk[r] + obrona*def[r], cd w rundach.
// effects: type burn|poison|bleed (power = mnożnik magii na rundę) lub stun|freeze|chill (power = osłabienie).
// Pasywne: passive = { statystyka: [wartości dla rang] }, flags — specjalne efekty.
// Wymaganie: poprzednia umiejętność danego żywiołu na randze >= 1 oraz poziom bohatera.
export const ELEMENTS = ['fire', 'ice', 'earth'];

export const SKILLS = [
  // OGIEŃ — obrażenia rozłożone w czasie
  { id: 'fire_spark', element: 'fire', tier: 1, type: 'active', reqLevel: 1, maxRank: 3, cd: 3,
    magic: [0.9, 1.15, 1.4], effects: [{ type: 'burn', chance: [0.6, 0.75, 0.9], power: [0.2, 0.25, 0.3], turns: 3 }] },
  { id: 'fire_ember', element: 'fire', tier: 2, type: 'passive', reqLevel: 5, maxRank: 3,
    passive: { fireDmg: [12, 24, 36], magicPct: [3, 6, 9] } },
  { id: 'fire_ball', element: 'fire', tier: 3, type: 'active', reqLevel: 12, maxRank: 3, cd: 5,
    magic: [1.8, 2.3, 2.8], atk: [0.3, 0.4, 0.5], effects: [{ type: 'burn', chance: [1, 1, 1], power: [0.3, 0.35, 0.4], turns: 3 }] },
  { id: 'fire_rage', element: 'fire', tier: 4, type: 'passive', reqLevel: 20, maxRank: 3,
    passive: { crit: [3, 6, 9] }, flags: { critBurn: [0.3, 0.45, 0.6] } },
  { id: 'fire_meteor', element: 'fire', tier: 5, type: 'active', reqLevel: 30, maxRank: 3, cd: 8,
    magic: [3.5, 4.3, 5.2], atk: [0.5, 0.6, 0.7],
    effects: [{ type: 'burn', chance: [1, 1, 1], power: [0.5, 0.6, 0.7], turns: 4 }, { type: 'stun', chance: [0.3, 0.4, 0.5], turns: 1 }] },
  // LÓD — spowolnienie i zamrożenie
  { id: 'ice_shard', element: 'ice', tier: 1, type: 'active', reqLevel: 1, maxRank: 3, cd: 3,
    magic: [0.8, 1.0, 1.25], effects: [{ type: 'chill', chance: [0.7, 0.85, 1], power: [0.2, 0.25, 0.3], turns: 2 }] },
  { id: 'ice_armor', element: 'ice', tier: 2, type: 'passive', reqLevel: 5, maxRank: 3,
    passive: { defPct: [8, 16, 24], iceDmg: [8, 16, 24] } },
  { id: 'ice_freeze', element: 'ice', tier: 3, type: 'active', reqLevel: 12, maxRank: 3, cd: 6,
    magic: [1.2, 1.5, 1.8], effects: [{ type: 'freeze', chance: [0.7, 0.85, 1], turns: 1 }] },
  { id: 'ice_heart', element: 'ice', tier: 4, type: 'passive', reqLevel: 20, maxRank: 3,
    passive: { hpPct: [8, 16, 24], regen: [2, 4, 6] } },
  { id: 'ice_winter', element: 'ice', tier: 5, type: 'active', reqLevel: 30, maxRank: 3, cd: 9,
    magic: [3.0, 3.8, 4.6],
    effects: [{ type: 'freeze', chance: [1, 1, 1], turns: 2 }, { type: 'chill', chance: [1, 1, 1], power: [0.3, 0.35, 0.4], turns: 4 }] },
  // ZIEMIA — obrona i ogłuszenie
  { id: 'earth_fist', element: 'earth', tier: 1, type: 'active', reqLevel: 1, maxRank: 3, cd: 4,
    magic: [0.5, 0.65, 0.8], atk: [0.6, 0.75, 0.9], effects: [{ type: 'stun', chance: [0.25, 0.35, 0.45], turns: 1 }] },
  { id: 'earth_skin', element: 'earth', tier: 2, type: 'passive', reqLevel: 5, maxRank: 3,
    passive: { def: [5, 12, 20], defPct: [5, 10, 15], earthDmg: [8, 16, 24] } },
  { id: 'earth_quake', element: 'earth', tier: 3, type: 'active', reqLevel: 12, maxRank: 3, cd: 6,
    magic: [1.3, 1.6, 1.9], atk: [0.4, 0.5, 0.6],
    effects: [{ type: 'stun', chance: [0.6, 0.75, 0.9], turns: 1 }, { type: 'bleed', chance: [0.6, 0.75, 0.9], power: [0.25, 0.3, 0.35], turns: 3 }] },
  { id: 'earth_roots', element: 'earth', tier: 4, type: 'passive', reqLevel: 20, maxRank: 3,
    passive: { lifesteal: [3, 5, 7], thorns: [10, 20, 30] } },
  { id: 'earth_wrath', element: 'earth', tier: 5, type: 'active', reqLevel: 30, maxRank: 3, cd: 9,
    magic: [2.0, 2.5, 3.0], def: [1.5, 2.0, 2.5], effects: [{ type: 'stun', chance: [1, 1, 1], turns: 2 }] }
];

// Synergie: wymagana liczba punktów w każdym z żywiołów.
export const SYNERGIES = [
  { id: 'steam', elements: ['fire', 'ice'], points: 3, stats: { magicPct: 15 } },
  { id: 'magma', elements: ['fire', 'earth'], points: 3, stats: { defPct: 5 }, flag: 'magma' },
  { id: 'permafrost', elements: ['ice', 'earth'], points: 3, stats: { hpPct: 5 }, flag: 'permafrost' },
  { id: 'harmony', elements: ['fire', 'ice', 'earth'], points: 5, stats: { allPct: 10 } }
];

export function getSkill(id) { return SKILLS.find((s) => s.id === id); }
