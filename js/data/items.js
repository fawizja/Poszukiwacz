// Dane przedmiotów: sloty, typy bazowe, cechy losowe (afiksy) i przedmioty zużywalne.
// Nazwy (z rodzajem gramatycznym) znajdują się w i18n: base.<id>[tier], prefix.<id>, suffix.<id>.

export const EQUIP_SLOTS = ['head', 'chest', 'legs', 'boots', 'weapon', 'offhand', 'amulet', 'ring1', 'ring2'];

// stats: { statystyka: [a, b] } => wartość = (a + b * poziom) * mnożnik rzadkości
export const BASES = [
  { id: 'sword', slot: 'weapon', stats: { atk: [4, 2.4] } },
  { id: 'axe', slot: 'weapon', stats: { atk: [5, 2.7], crit: [-2, 0] } },
  { id: 'dagger', slot: 'weapon', stats: { atk: [3, 2.0], crit: [3, 0.04] } },
  { id: 'staff', slot: 'weapon', stats: { atk: [2, 1.2], magic: [4, 2.4] } },
  { id: 'shield', slot: 'offhand', stats: { def: [2, 1.1], hp: [5, 3] } },
  { id: 'tome', slot: 'offhand', stats: { magic: [2, 1.5], int: [1, 0.15] } },
  { id: 'helm', slot: 'head', stats: { def: [1, 0.8], hp: [4, 2.5] } },
  { id: 'armor', slot: 'chest', stats: { def: [2, 1.3], hp: [6, 4] } },
  { id: 'greaves', slot: 'legs', stats: { def: [1.5, 1.0], hp: [4, 3] } },
  { id: 'boots', slot: 'boots', stats: { def: [1, 0.7], dodge: [1, 0.03] } },
  { id: 'amulet', slot: 'amulet', stats: { magic: [2, 1.2], hp: [5, 3] } },
  { id: 'ring', slot: 'ring', stats: { atk: [1, 0.8], crit: [1, 0.02] } }
];

// Afiksy: kind prefix/suffix, wartość = (a + b * poziom) * losowo 0.8–1.2 * (1 + 0.15 * rzadkość)
export const AFFIXES = [
  { id: 'sharp', kind: 'prefix', stat: 'atk', a: 2, b: 0.9 },
  { id: 'sturdy', kind: 'prefix', stat: 'def', a: 1, b: 0.6 },
  { id: 'vital', kind: 'prefix', stat: 'hp', a: 8, b: 4 },
  { id: 'precise', kind: 'prefix', stat: 'crit', a: 1.5, b: 0.05, pct: true },
  { id: 'swift', kind: 'prefix', stat: 'dodge', a: 1, b: 0.04, pct: true },
  { id: 'arcane', kind: 'prefix', stat: 'magic', a: 2, b: 0.9 },
  { id: 'venomous', kind: 'prefix', stat: 'poisonChance', a: 4, b: 0.1, pct: true, slots: ['weapon', 'ring'] },
  { id: 'blazing', kind: 'prefix', stat: 'fireDmg', a: 5, b: 0.2, pct: true },
  { id: 'frozen', kind: 'prefix', stat: 'iceDmg', a: 5, b: 0.2, pct: true },
  { id: 'earthen', kind: 'prefix', stat: 'earthDmg', a: 5, b: 0.2, pct: true },
  { id: 'vampiric', kind: 'prefix', stat: 'lifesteal', a: 1.5, b: 0.04, pct: true, slots: ['weapon', 'amulet', 'ring'] },
  { id: 'bear', kind: 'suffix', stat: 'str', a: 1, b: 0.25 },
  { id: 'fox', kind: 'suffix', stat: 'dex', a: 1, b: 0.25 },
  { id: 'owl', kind: 'suffix', stat: 'int', a: 1, b: 0.25 },
  { id: 'ox', kind: 'suffix', stat: 'end', a: 1, b: 0.25 },
  { id: 'fortune', kind: 'suffix', stat: 'goldFind', a: 4, b: 0.15, pct: true },
  { id: 'seeker', kind: 'suffix', stat: 'magicFind', a: 4, b: 0.15, pct: true },
  { id: 'sage', kind: 'suffix', stat: 'xpBonus', a: 3, b: 0.1, pct: true },
  { id: 'troll', kind: 'suffix', stat: 'regen', a: 0.5, b: 0.12 },
  { id: 'thorns', kind: 'suffix', stat: 'thorns', a: 4, b: 0.15, pct: true, slots: ['chest', 'offhand', 'legs', 'head'] }
];

export const PERCENT_STATS = new Set(['crit', 'dodge', 'poisonChance', 'fireDmg', 'iceDmg', 'earthDmg', 'lifesteal',
  'goldFind', 'magicFind', 'xpBonus', 'thorns', 'atkPct', 'defPct', 'hpPct', 'magicPct', 'allPct']);

// Wagi statystyk do oceny siły przedmiotu (porównania i sortowanie)
export const STAT_WEIGHTS = { atk: 1.6, def: 1.4, hp: 0.25, magic: 1.4, crit: 3, dodge: 3, str: 3, dex: 3, int: 3, end: 3,
  poisonChance: 1.5, fireDmg: 1, iceDmg: 1, earthDmg: 1, lifesteal: 3, goldFind: 0.8, magicFind: 0.8, xpBonus: 1,
  regen: 3, thorns: 1 };

// Przedmioty zużywalne. heal = % maks. HP; stats + duration (ms) = wzmocnienie.
export const CONSUMABLES = {
  hp_small: { kind: 'potion', heal: 30, color: '#d9534f' },
  hp_medium: { kind: 'potion', heal: 50, color: '#c9302c' },
  hp_large: { kind: 'potion', heal: 80, color: '#a01f1b' },
  elixir_str: { kind: 'elixir', stats: { atkPct: 15 }, duration: 10 * 60000, color: '#e8803a' },
  elixir_stone: { kind: 'elixir', stats: { defPct: 20 }, duration: 10 * 60000, color: '#8a8f99' },
  elixir_mind: { kind: 'elixir', stats: { magicPct: 25 }, duration: 10 * 60000, color: '#5b7fd6' },
  elixir_fortune: { kind: 'elixir', stats: { goldFind: 25, magicFind: 25 }, duration: 15 * 60000, color: '#e6c34a' },
  food_stew: { kind: 'food', stats: { xpBonus: 10 }, duration: 15 * 60000, color: '#9c6b3e' },
  food_fish: { kind: 'food', stats: { regen: 6 }, duration: 15 * 60000, color: '#6fa8c7' },
  food_pie: { kind: 'food', stats: { hpPct: 15 }, duration: 20 * 60000, color: '#d9a54a' },
  food_feast: { kind: 'food', stats: { allPct: 10, xpBonus: 10 }, duration: 30 * 60000, color: '#c45a8a' }
};

export const RESOURCES = ['wood', 'stone', 'iron', 'herbs', 'crystals', 'leather', 'essence'];
