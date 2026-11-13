// Budynki osady. Koszt poziomu L = baseCost * 1.9^(L-1) (patrz balance.js).
// Poziom każdego budynku (poza Ratuszem) nie może przekroczyć poziomu Ratusza + 1.
// Opisy bonusów w i18n: building.<id>.name / .desc / .bonus
export const BUILDINGS = [
  { id: 'townhall', color: '#b08a4a', baseCost: { gold: 200, wood: 20, stone: 20 } },
  { id: 'forge', color: '#8a4b3a', baseCost: { gold: 80, wood: 12, stone: 8 } },
  { id: 'lab', color: '#4a7a8a', baseCost: { gold: 100, wood: 10, herbs: 10 } },
  { id: 'kitchen', color: '#a8743a', baseCost: { gold: 70, wood: 14, leather: 4 } },
  { id: 'warehouse', color: '#6a5a4a', baseCost: { gold: 120, wood: 20, stone: 12 } },
  { id: 'market', color: '#4a8a5a', baseCost: { gold: 150, wood: 15, leather: 8 } }
];

// Bonusy na poziom budynku
export const BUILDING_BONUS = {
  townhall: { xpPct: 5, goldPct: 5 },  // + skuteczność AFK (balance.js)
  forge: { maxUpgrade: 2 },
  lab: { potionPct: 10 },
  kitchen: { buffDurPct: 15 },
  warehouse: { backpack: 6 },
  market: { sellPct: 10 }
};

// Targ: ceny zakupu surowców za złoto (za sztukę), dostępne od 1 poziomu Targu,
// tańsze o 5% za każdy kolejny poziom.
export const MARKET_PRICES = { wood: 4, stone: 5, leather: 7, herbs: 6, iron: 12, crystals: 35 };
