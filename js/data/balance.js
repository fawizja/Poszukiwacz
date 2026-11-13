// =====================================================================
//  BALANS GRY — wszystkie stałe i wzory w jednym miejscu.
//  Cel projektowy: ~2–3 godziny angażującej rozgrywki do pokonania
//  ostatniej lokacji (poziom ~50), przy ok. 20 walkach na poziom.
// =====================================================================

export const BALANCE = {
  // --- Czas ---
  TICK_MS: 100,                 // krok pętli gry
  ROUND_MS: 850,                // jedna runda walki (atak bohatera + atak wroga)
  PAUSE_MS: 1100,               // przerwa między walkami (regeneracja)
  RESPAWN_MS: 5000,             // czas odrodzenia po porażce
  AUTOSAVE_MS: 30000,           // auto-zapis co 30 s
  UI_UPDATE_MS: 250,            // odświeżanie dynamicznych elementów UI
  UI_UPDATE_MS_SAVER: 1000,     // ...w trybie oszczędzania baterii

  // --- AFK ---
  MAX_OFFLINE_MS: 8 * 3600 * 1000, // maks. 8 godzin nagród offline
  MIN_OFFLINE_MS: 60 * 1000,       // poniżej minuty nie pokazujemy raportu
  AFK_BASE_EFFICIENCY: 0.6,        // offline bohater walczy z 60% skutecznością
  AFK_EFF_PER_TOWNHALL: 0.06,      // +6% skuteczności za każdy poziom Ratusza
  AFK_MAX_ITEMS: 25,               // maks. liczba przedmiotów generowanych offline

  // --- Bohater ---
  MAX_LEVEL: 60,
  START_STATS: { str: 5, dex: 5, int: 5, end: 5 },
  STAT_POINTS_PER_LEVEL: 3,
  SKILL_POINT_EVERY: 3,          // punkt umiejętności co 3 poziomy
  PAUSE_HEAL_PCT: 0.4,           // leczenie po wygranej walce (% maks. HP)
  RESPEC_COST_PER_LEVEL: 25,     // koszt resetu umiejętności = poziom * 25 złota

  // --- Walka ---
  KILLS_PER_BOSS: 10,            // boss co 10 pokonanych wrogów
  BOSS_MULT: { hp: 3.2, atk: 1.2, def: 1.25, xp: 6, gold: 6 },
  ENEMY_DODGE: 3,                // % uniku wrogów
  DMG_VARIANCE: 0.1,             // ±10% losowości obrażeń
  CRIT_CAP: 60, DODGE_CAP: 45,

  // --- Łupy ---
  RARITIES: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
  RARITY_WEIGHTS: [60, 25, 10, 4, 1],           // szanse bazowe w %
  RARITY_STAT_MULT: [1, 1.2, 1.45, 1.75, 2.1],  // mnożnik statystyk bazowych
  RARITY_AFFIXES: [0, 1, 2, 3, 4],              // liczba losowych cech
  RARITY_SELL_MULT: [1, 2, 4, 8, 16],
  RARITY_ESSENCE: [1, 2, 4, 8, 15],             // esencja z rozbiórki
  ITEM_DROP_CHANCE: 0.3,          // szansa na przedmiot ze zwykłego wroga
  BOSS_ITEM_DROPS: 2,             // boss zawsze upuszcza 2 przedmioty
  BOSS_RARITY_SHIFT: 1,           // ...o co najmniej rzadkości "Niezwykły"
  RESOURCE_DROP_CHANCE: 0.55,
  ESSENCE_DROP_CHANCE: 0.08,

  // --- Ekwipunek ---
  BASE_BACKPACK: 30,
  BACKPACK_PER_WAREHOUSE: 6,
  UPGRADE_LEVELS_PER_FORGE: 2,    // maks. ulepszenie = poziom Kuźni * 2
  UPGRADE_STAT_BONUS: 0.08,       // +8% statystyk bazowych za poziom ulepszenia

  // --- Osada ---
  BUILDING_MAX_LEVEL: 5,
  BUILDING_COST_GROWTH: 1.9,

  // --- Crafting ---
  CRAFT_QUEUE_MAX: 3,
  PROFESSION_TIME_REDUCTION: 0.04, // -4% czasu za poziom profesji
  PROFESSION_MAX_LEVEL: 10
};

// Doświadczenie potrzebne do awansu z poziomu n na n+1:  n * 100 * (1 + 0.1n)
export function xpForLevel(n) {
  return Math.floor(n * 100 * (1 + n * 0.1));
}

// Statystyki wroga na poziomie L (mnożniki m z danych wroga)
//   HP  = (25 + 9 * L^1.35) * m.hp
//   ATK = (4 + 1.8 * L^1.08) * m.atk
//   DEF = (1 + 1.2 * L) * m.def
export function enemyStats(level, m = {}) {
  return {
    hp: Math.round((25 + 9 * Math.pow(level, 1.35)) * (m.hp ?? 1)),
    atk: Math.round((4 + 1.8 * Math.pow(level, 1.08)) * (m.atk ?? 1)),
    def: Math.round((1 + 1.2 * level) * (m.def ?? 1))
  };
}

// Nagrody: XP = 8 + 6L + 0.45L²,  złoto = 3 + 2.2L + 0.08L²
export function enemyXp(level) { return Math.floor(8 + 6 * level + 0.45 * level * level); }
export function enemyGold(level) { return Math.floor(3 + 2.2 * level + 0.08 * level * level); }

// Redukcja obrażeń przez obronę: dmg = atk * (1 - def / (def + 60 + 8 * poziomAtakującego))
// Redukcja jest ograniczona do 75%, obrażenia minimalne = 1.
export function applyDefense(atk, def, attackerLevel) {
  const red = Math.min(0.75, def / (def + 60 + 8 * attackerLevel));
  return Math.max(1, atk * (1 - red));
}

// Koszt ulepszenia przedmiotu (złoto + esencja)
export function upgradeCost(item) {
  const next = item.upgrade + 1;
  return {
    gold: Math.floor(30 * next * (1 + item.level * 0.3) * (1 + item.rarity * 0.5)),
    essence: next * (1 + item.rarity) + Math.floor(item.level / 10)
  };
}

// Cena sprzedaży: (5 + 2 * poziom) * mnożnik rzadkości * (1 + 0.1 ulepszenia) * bonus Targu
export function sellPrice(item, marketBonusPct = 0) {
  const base = (5 + 2 * item.level) * BALANCE.RARITY_SELL_MULT[item.rarity] * (1 + 0.1 * item.upgrade);
  return Math.floor(base * (1 + marketBonusPct / 100));
}

// Koszt budynku na poziom docelowy lvl: koszt bazowy * 1.9^(lvl-1)
export function buildingCost(def, lvl) {
  const f = Math.pow(BALANCE.BUILDING_COST_GROWTH, lvl - 1);
  const cost = {};
  for (const [k, v] of Object.entries(def.baseCost)) cost[k] = Math.floor(v * f);
  return cost;
}

// Profesje: XP do następnego poziomu = 40 * poziom^1.5
export function professionXpFor(level) { return Math.floor(40 * Math.pow(level, 1.5)); }
