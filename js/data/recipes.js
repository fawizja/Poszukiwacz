// Receptury rzemiosła. building/level — wymagany budynek osady.
// result: item (slots, minRarity) | consumable (id, count) | resource (id, count)
// time — sekundy (skracane o poziom profesji). Nazwy w i18n: recipe.<id>.
export const PROFESSIONS = {
  smithing: { building: 'forge' },
  alchemy: { building: 'lab' },
  cooking: { building: 'kitchen' }
};

export const RECIPES = [
  // Kowalstwo
  { id: 'smith_weapon', profession: 'smithing', level: 1, time: 30, xp: 10,
    cost: { gold: 60, iron: 4, wood: 4 }, result: { type: 'item', slots: ['weapon'], minRarity: 1 } },
  { id: 'smith_armor', profession: 'smithing', level: 1, time: 30, xp: 10,
    cost: { gold: 50, iron: 3, leather: 4 }, result: { type: 'item', slots: ['head', 'chest', 'legs', 'boots'], minRarity: 1 } },
  { id: 'smith_offhand', profession: 'smithing', level: 2, time: 45, xp: 14,
    cost: { gold: 90, iron: 5, wood: 6 }, result: { type: 'item', slots: ['offhand'], minRarity: 1 } },
  { id: 'smith_jewel', profession: 'smithing', level: 3, time: 90, xp: 25,
    cost: { gold: 250, iron: 4, crystals: 4 }, result: { type: 'item', slots: ['amulet', 'ring'], minRarity: 2 } },
  { id: 'smith_essence', profession: 'smithing', level: 2, time: 20, xp: 6,
    cost: { gold: 30, iron: 3, stone: 5 }, result: { type: 'resource', id: 'essence', count: 3 } },
  { id: 'smith_masterwork', profession: 'smithing', level: 5, time: 240, xp: 60,
    cost: { gold: 1500, iron: 20, crystals: 12, essence: 15 }, result: { type: 'item', slots: null, minRarity: 3 } },
  // Alchemia
  { id: 'alch_hp_small', profession: 'alchemy', level: 1, time: 15, xp: 5,
    cost: { gold: 10, herbs: 3 }, result: { type: 'consumable', id: 'hp_small', count: 2 } },
  { id: 'alch_hp_medium', profession: 'alchemy', level: 2, time: 30, xp: 10,
    cost: { gold: 40, herbs: 5, crystals: 1 }, result: { type: 'consumable', id: 'hp_medium', count: 2 } },
  { id: 'alch_elixir_str', profession: 'alchemy', level: 2, time: 60, xp: 15,
    cost: { gold: 80, herbs: 6, iron: 2 }, result: { type: 'consumable', id: 'elixir_str', count: 1 } },
  { id: 'alch_elixir_stone', profession: 'alchemy', level: 3, time: 60, xp: 15,
    cost: { gold: 90, herbs: 6, stone: 8 }, result: { type: 'consumable', id: 'elixir_stone', count: 1 } },
  { id: 'alch_hp_large', profession: 'alchemy', level: 4, time: 60, xp: 20,
    cost: { gold: 150, herbs: 10, crystals: 3 }, result: { type: 'consumable', id: 'hp_large', count: 2 } },
  { id: 'alch_elixir_mind', profession: 'alchemy', level: 4, time: 90, xp: 20,
    cost: { gold: 200, herbs: 8, crystals: 4 }, result: { type: 'consumable', id: 'elixir_mind', count: 1 } },
  { id: 'alch_elixir_fortune', profession: 'alchemy', level: 5, time: 120, xp: 30,
    cost: { gold: 400, herbs: 12, crystals: 6, essence: 5 }, result: { type: 'consumable', id: 'elixir_fortune', count: 1 } },
  // Kuchnia
  { id: 'cook_stew', profession: 'cooking', level: 1, time: 20, xp: 6,
    cost: { gold: 20, leather: 2, herbs: 2 }, result: { type: 'consumable', id: 'food_stew', count: 1 } },
  { id: 'cook_fish', profession: 'cooking', level: 2, time: 40, xp: 10,
    cost: { gold: 50, herbs: 4, wood: 4 }, result: { type: 'consumable', id: 'food_fish', count: 1 } },
  { id: 'cook_pie', profession: 'cooking', level: 3, time: 60, xp: 15,
    cost: { gold: 120, herbs: 6, leather: 4, wood: 4 }, result: { type: 'consumable', id: 'food_pie', count: 1 } },
  { id: 'cook_feast', profession: 'cooking', level: 5, time: 180, xp: 40,
    cost: { gold: 600, herbs: 15, leather: 10, crystals: 3 }, result: { type: 'consumable', id: 'food_feast', count: 1 } }
];

export function getRecipe(id) { return RECIPES.find((r) => r.id === id); }
