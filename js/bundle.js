(() => {
  // js/data/balance.js
  var BALANCE = {
    // --- Czas ---
    TICK_MS: 100,
    // krok pętli gry
    ROUND_MS: 850,
    // jedna runda walki (atak bohatera + atak wroga)
    PAUSE_MS: 1100,
    // przerwa między walkami (regeneracja)
    RESPAWN_MS: 5e3,
    // czas odrodzenia po porażce
    AUTOSAVE_MS: 3e4,
    // auto-zapis co 30 s
    UI_UPDATE_MS: 250,
    // odświeżanie dynamicznych elementów UI
    UI_UPDATE_MS_SAVER: 1e3,
    // ...w trybie oszczędzania baterii
    // --- AFK ---
    MAX_OFFLINE_MS: 8 * 3600 * 1e3,
    // maks. 8 godzin nagród offline
    MIN_OFFLINE_MS: 60 * 1e3,
    // poniżej minuty nie pokazujemy raportu
    AFK_BASE_EFFICIENCY: 0.6,
    // offline bohater walczy z 60% skutecznością
    AFK_EFF_PER_TOWNHALL: 0.06,
    // +6% skuteczności za każdy poziom Ratusza
    AFK_MAX_ITEMS: 25,
    // maks. liczba przedmiotów generowanych offline
    // --- Bohater ---
    MAX_LEVEL: 60,
    START_STATS: { str: 5, dex: 5, int: 5, end: 5 },
    STAT_POINTS_PER_LEVEL: 3,
    SKILL_POINT_EVERY: 3,
    // punkt umiejętności co 3 poziomy
    PAUSE_HEAL_PCT: 0.4,
    // leczenie po wygranej walce (% maks. HP)
    RESPEC_COST_PER_LEVEL: 25,
    // koszt resetu umiejętności = poziom * 25 złota
    // --- Walka ---
    KILLS_PER_BOSS: 10,
    // boss co 10 pokonanych wrogów
    BOSS_MULT: { hp: 3.2, atk: 1.2, def: 1.25, xp: 6, gold: 6 },
    ENEMY_DODGE: 3,
    // % uniku wrogów
    DMG_VARIANCE: 0.1,
    // ±10% losowości obrażeń
    CRIT_CAP: 60,
    DODGE_CAP: 45,
    // --- Łupy ---
    RARITIES: ["common", "uncommon", "rare", "epic", "legendary"],
    RARITY_WEIGHTS: [60, 25, 10, 4, 1],
    // szanse bazowe w %
    RARITY_STAT_MULT: [1, 1.2, 1.45, 1.75, 2.1],
    // mnożnik statystyk bazowych
    RARITY_AFFIXES: [0, 1, 2, 3, 4],
    // liczba losowych cech
    RARITY_SELL_MULT: [1, 2, 4, 8, 16],
    RARITY_ESSENCE: [1, 2, 4, 8, 15],
    // esencja z rozbiórki
    ITEM_DROP_CHANCE: 0.3,
    // szansa na przedmiot ze zwykłego wroga
    BOSS_ITEM_DROPS: 2,
    // boss zawsze upuszcza 2 przedmioty
    BOSS_RARITY_SHIFT: 1,
    // ...o co najmniej rzadkości "Niezwykły"
    RESOURCE_DROP_CHANCE: 0.55,
    ESSENCE_DROP_CHANCE: 0.08,
    // --- Ekwipunek ---
    BASE_BACKPACK: 30,
    BACKPACK_PER_WAREHOUSE: 6,
    UPGRADE_LEVELS_PER_FORGE: 2,
    // maks. ulepszenie = poziom Kuźni * 2
    UPGRADE_STAT_BONUS: 0.08,
    // +8% statystyk bazowych za poziom ulepszenia
    // --- Osada ---
    BUILDING_MAX_LEVEL: 5,
    BUILDING_COST_GROWTH: 1.9,
    // --- Crafting ---
    CRAFT_QUEUE_MAX: 3,
    PROFESSION_TIME_REDUCTION: 0.04,
    // -4% czasu za poziom profesji
    PROFESSION_MAX_LEVEL: 10
  };
  function xpForLevel(n) {
    return Math.floor(n * 100 * (1 + n * 0.1));
  }
  function enemyStats(level, m = {}) {
    return {
      hp: Math.round((25 + 9 * Math.pow(level, 1.35)) * (m.hp ?? 1)),
      atk: Math.round((4 + 1.8 * Math.pow(level, 1.08)) * (m.atk ?? 1)),
      def: Math.round((1 + 1.2 * level) * (m.def ?? 1))
    };
  }
  function enemyXp(level) {
    return Math.floor(8 + 6 * level + 0.45 * level * level);
  }
  function enemyGold(level) {
    return Math.floor(3 + 2.2 * level + 0.08 * level * level);
  }
  function applyDefense(atk, def, attackerLevel) {
    const red = Math.min(0.75, def / (def + 60 + 8 * attackerLevel));
    return Math.max(1, atk * (1 - red));
  }
  function upgradeCost(item) {
    const next = item.upgrade + 1;
    return {
      gold: Math.floor(30 * next * (1 + item.level * 0.3) * (1 + item.rarity * 0.5)),
      essence: next * (1 + item.rarity) + Math.floor(item.level / 10)
    };
  }
  function sellPrice(item, marketBonusPct = 0) {
    const base = (5 + 2 * item.level) * BALANCE.RARITY_SELL_MULT[item.rarity] * (1 + 0.1 * item.upgrade);
    return Math.floor(base * (1 + marketBonusPct / 100));
  }
  function buildingCost(def, lvl) {
    const f = Math.pow(BALANCE.BUILDING_COST_GROWTH, lvl - 1);
    const cost = {};
    for (const [k, v] of Object.entries(def.baseCost)) cost[k] = Math.floor(v * f);
    return cost;
  }
  function professionXpFor(level) {
    return Math.floor(40 * Math.pow(level, 1.5));
  }

  // js/core/state.js
  var SAVE_VERSION = 2;
  var game = { state: null, runtime: { log: [], lastTick: 0 } };
  function createDefaultState(now = Date.now()) {
    const seed = (Math.floor(Math.random() * 4294967295) ^ now) >>> 0;
    return {
      version: SAVE_VERSION,
      seed,
      rngState: seed || 1,
      createdAt: now,
      lastTimestamp: now,
      maxSeenTimestamp: now,
      hero: {
        level: 1,
        xp: 0,
        statPoints: 0,
        skillPoints: 1,
        stats: { ...BALANCE.START_STATS },
        hp: null,
        gold: 25
      },
      resources: { wood: 0, stone: 0, iron: 0, herbs: 0, crystals: 0, leather: 0, essence: 0 },
      inventory: [],
      equipment: { head: null, chest: null, legs: null, boots: null, weapon: null, offhand: null, amulet: null, ring1: null, ring2: null },
      consumables: { hp_small: 3 },
      buffs: [],
      combat: {
        locationId: "forest",
        unlocked: 1,
        killsSinceBoss: 0,
        bossReady: false,
        bossesDefeated: {},
        phase: "pause",
        timer: 0,
        fight: null,
        autoBoss: true
      },
      crafting: {
        queue: [],
        professions: { smithing: { level: 1, xp: 0 }, alchemy: { level: 1, xp: 0 }, cooking: { level: 1, xp: 0 } }
      },
      settlement: { forge: 0, lab: 0, kitchen: 0, warehouse: 0, townhall: 1, market: 0 },
      skills: {},
      nextUid: 1,
      settings: { volume: 0.5, batterySaver: false, autoAdvance: true, autoPotion: true, potionThreshold: 35 },
      stats: { kills: 0, bossKills: 0, deaths: 0, goldEarned: 0, itemsFound: 0, crafted: 0, playTimeMs: 0 }
    };
  }

  // js/core/rng.js
  var Rng = class {
    constructor(seed = 1) {
      this.state = seed >>> 0 || 1;
    }
    next() {
      this.state = this.state + 1831565813 | 0;
      let t2 = this.state;
      t2 = Math.imul(t2 ^ t2 >>> 15, 1 | t2);
      t2 = t2 + Math.imul(t2 ^ t2 >>> 7, 61 | t2) ^ t2;
      return ((t2 ^ t2 >>> 14) >>> 0) / 4294967296;
    }
    int(min, max) {
      return min + Math.floor(this.next() * (max - min + 1));
    }
    float(min, max) {
      return min + this.next() * (max - min);
    }
    chance(p) {
      return this.next() < p;
    }
    pick(arr) {
      return arr[Math.floor(this.next() * arr.length)];
    }
    // entries: [[wartość, waga], ...]
    weighted(entries) {
      const total = entries.reduce((s, e) => s + e[1], 0);
      let r = this.next() * total;
      for (const [value, weight] of entries) {
        r -= weight;
        if (r < 0) return value;
      }
      return entries[entries.length - 1][0];
    }
  };
  var rng = new Rng(Date.now());
  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0).toString(16);
  }

  // js/core/eventBus.js
  var listeners = /* @__PURE__ */ new Map();
  var bus = {
    on(event, fn) {
      if (!listeners.has(event)) listeners.set(event, /* @__PURE__ */ new Set());
      listeners.get(event).add(fn);
      return () => listeners.get(event).delete(fn);
    },
    emit(event, payload) {
      const set = listeners.get(event);
      if (!set) return;
      for (const fn of [...set]) {
        try {
          fn(payload);
        } catch (err) {
          console.error(`[bus] ${event}`, err);
        }
      }
    },
    clear() {
      listeners.clear();
    }
  };

  // js/core/saveManager.js
  var KEY = "poszukiwacz_save";
  var BACKUPS = ["poszukiwacz_save_bak1", "poszukiwacz_save_bak2"];
  var BACKUP_INTERVAL_MS = 5 * 60 * 1e3;
  var lastBackupAt = 0;
  var MIGRATIONS = {
    1: (s) => {
      s.maxSeenTimestamp = s.maxSeenTimestamp || s.lastTimestamp || Date.now();
      s.settings = s.settings || {};
      if (s.settings.potionThreshold == null) s.settings.potionThreshold = 35;
      s.version = 2;
      return s;
    }
  };
  function migrate(data) {
    let s = data;
    let guard = 0;
    while ((s.version || 1) < SAVE_VERSION && guard++ < 50) {
      const fn = MIGRATIONS[s.version || 1];
      if (!fn) throw new Error("Brak migracji dla wersji " + s.version);
      s = fn(s);
    }
    return s;
  }
  function mergeDefaults(target, defaults) {
    for (const [k, v] of Object.entries(defaults)) {
      if (target[k] === void 0 || target[k] === null && v !== null) {
        target[k] = structuredCloneSafe(v);
      } else if (v && typeof v === "object" && !Array.isArray(v) && typeof target[k] === "object" && target[k] !== null) {
        mergeDefaults(target[k], v);
      }
    }
    return target;
  }
  function structuredCloneSafe(v) {
    return v === null || typeof v !== "object" ? v : JSON.parse(JSON.stringify(v));
  }
  function validateState(s) {
    return !!(s && typeof s === "object" && s.hero && typeof s.hero.level === "number" && Array.isArray(s.inventory) && s.equipment && s.combat && s.resources && s.settlement);
  }
  function wrap(state) {
    const data = JSON.stringify(state);
    return JSON.stringify({ v: state.version, sum: hashString(data), data });
  }
  function unwrap(raw) {
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || typeof obj.data !== "string" || hashString(obj.data) !== obj.sum) throw new Error("Z\u0142a suma kontrolna");
    return JSON.parse(obj.data);
  }
  function prepareState(raw) {
    let s = migrate(raw);
    s = mergeDefaults(s, createDefaultState(s.createdAt || Date.now()));
    if (!validateState(s)) throw new Error("Niepoprawna struktura zapisu");
    return s;
  }
  function saveGame(reason = "auto") {
    const s = game.state;
    if (!s) return false;
    s.rngState = rng.state;
    const now = Date.now();
    s.lastTimestamp = now;
    s.maxSeenTimestamp = Math.max(s.maxSeenTimestamp || 0, now);
    try {
      const payload = wrap(s);
      const prev = localStorage.getItem(KEY);
      if (prev && now - lastBackupAt > BACKUP_INTERVAL_MS) {
        const b1 = localStorage.getItem(BACKUPS[0]);
        if (b1) localStorage.setItem(BACKUPS[1], b1);
        localStorage.setItem(BACKUPS[0], prev);
        lastBackupAt = now;
      }
      localStorage.setItem(KEY, payload);
      bus.emit("save:done", reason);
      return true;
    } catch (err) {
      console.error("B\u0142\u0105d zapisu", err);
      bus.emit("save:error", err);
      return false;
    }
  }
  function loadGame() {
    const sources = [[KEY, "main"], [BACKUPS[0], "backup1"], [BACKUPS[1], "backup2"]];
    for (const [key, source] of sources) {
      try {
        const raw = unwrap(localStorage.getItem(key));
        if (raw) return { state: prepareState(raw), source };
      } catch (err) {
        console.warn(`Zapis ${key} uszkodzony`, err);
      }
    }
    return { state: createDefaultState(), source: "new" };
  }
  function toBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    bytes.forEach((b) => {
      bin += String.fromCharCode(b);
    });
    return btoa(bin);
  }
  function fromBase64(b64) {
    const bin = atob(b64.trim());
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }
  function exportSave() {
    game.state.rngState = rng.state;
    return toBase64(JSON.stringify({ game: "poszukiwacz", state: game.state }));
  }
  function parseImport(text) {
    if (!text || !text.trim()) throw new Error("empty");
    const obj = JSON.parse(fromBase64(text));
    if (!obj || obj.game !== "poszukiwacz") throw new Error("foreign");
    return prepareState(obj.state);
  }
  function resetGame() {
    localStorage.removeItem(KEY);
    BACKUPS.forEach((k) => localStorage.removeItem(k));
  }

  // js/core/gameLoop.js
  var LONG_GAP_MS = 60 * 1e3;
  var timer = null;
  var last = 0;
  var saveAcc = 0;
  var uiAcc = 0;
  function startLoop({ update, onLongGap, getUiInterval }) {
    stopLoop();
    last = performance.now();
    timer = setInterval(() => {
      const now = performance.now();
      let dt = now - last;
      last = now;
      if (dt <= 0) return;
      if (dt > LONG_GAP_MS) {
        onLongGap(dt);
        return;
      }
      update(dt);
      saveAcc += dt;
      if (saveAcc >= BALANCE.AUTOSAVE_MS) {
        saveAcc = 0;
        saveGame("auto");
      }
      uiAcc += dt;
      if (uiAcc >= getUiInterval()) {
        uiAcc = 0;
        bus.emit("ui:tick");
      }
    }, BALANCE.TICK_MS);
  }
  function stopLoop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  // js/data/locations.js
  var LOCATIONS = [
    {
      id: "forest",
      levels: [1, 5],
      color: "#3f7d3a",
      enemies: ["f_wolf", "f_boar", "f_sprite", "f_spider", "f_bandit", "f_shroom"],
      boss: "f_boss",
      resources: [["wood", 0.6, 1, 3], ["herbs", 0.35, 1, 2], ["leather", 0.25, 1, 2]]
    },
    {
      id: "swamp",
      levels: [5, 11],
      color: "#4d6b4a",
      enemies: ["s_toad", "s_leech", "s_wisp", "s_croc", "s_hag", "s_drowned"],
      boss: "s_boss",
      resources: [["herbs", 0.6, 1, 3], ["wood", 0.35, 1, 3], ["leather", 0.3, 1, 2]]
    },
    {
      id: "hills",
      levels: [11, 17],
      color: "#8a7d68",
      enemies: ["h_slinger", "h_golem", "h_harpy", "h_troll", "h_ram", "h_shaman"],
      boss: "h_boss",
      resources: [["stone", 0.6, 2, 4], ["iron", 0.35, 1, 2], ["leather", 0.25, 1, 3]]
    },
    {
      id: "catacombs",
      levels: [17, 24],
      color: "#5a5068",
      enemies: ["c_skeleton", "c_ghoul", "c_bat", "c_cultist", "c_wraith", "c_rats"],
      boss: "c_boss",
      resources: [["stone", 0.5, 2, 4], ["iron", 0.45, 1, 3], ["crystals", 0.15, 1, 1]]
    },
    {
      id: "ashlands",
      levels: [24, 31],
      color: "#a0522d",
      enemies: ["a_salamander", "a_imp", "a_scorpion", "a_nomad", "a_magma", "a_vulture"],
      boss: "a_boss",
      resources: [["iron", 0.55, 2, 4], ["stone", 0.4, 2, 5], ["crystals", 0.2, 1, 2]]
    },
    {
      id: "pass",
      levels: [31, 38],
      color: "#6fa3c7",
      enemies: ["i_giant", "i_wolf", "i_witch", "i_knight", "i_owl", "i_golem"],
      boss: "i_boss",
      resources: [["crystals", 0.35, 1, 2], ["leather", 0.5, 2, 4], ["iron", 0.4, 2, 4]]
    },
    {
      id: "depths",
      levels: [38, 46],
      color: "#7a5fc4",
      enemies: ["d_crawler", "d_mimic", "d_lurker", "d_mage", "d_worm", "d_sentinel"],
      boss: "d_boss",
      resources: [["crystals", 0.55, 1, 3], ["stone", 0.4, 3, 6], ["iron", 0.4, 2, 5]]
    },
    {
      id: "void",
      levels: [46, 55],
      color: "#2d2340",
      enemies: ["v_shade", "v_knight", "v_eye", "v_devourer", "v_herald", "v_twin"],
      boss: "v_boss",
      resources: [["crystals", 0.6, 2, 4], ["iron", 0.5, 3, 6], ["herbs", 0.4, 3, 5]]
    }
  ];
  function getLocation(id) {
    return LOCATIONS.find((l) => l.id === id) || LOCATIONS[0];
  }
  function locationIndex(id) {
    return Math.max(0, LOCATIONS.findIndex((l) => l.id === id));
  }

  // js/data/enemies.js
  var E = (id, hp, atk, def, color, effect = null) => ({ id, m: { hp, atk, def }, color, effect });
  var LIST = [
    // Szepczący Las
    E("f_wolf", 0.9, 1.1, 0.8, "#8d8d8d", { type: "bleed", chance: 0.15, power: 0.25, turns: 3 }),
    E("f_boar", 1.2, 1, 1.1, "#7a5230"),
    E("f_sprite", 0.7, 0.9, 0.6, "#9be38a", { type: "stun", chance: 0.08, power: 0, turns: 1 }),
    E("f_spider", 0.8, 0.95, 0.8, "#4a4a3a", { type: "poison", chance: 0.25, power: 0.2, turns: 3 }),
    E("f_bandit", 1, 1.15, 1, "#6b4b3a"),
    E("f_shroom", 1.3, 0.8, 1.2, "#c9744b", { type: "poison", chance: 0.2, power: 0.15, turns: 4 }),
    E("f_boss", 1, 1, 1.2, "#2f5a26", { type: "stun", chance: 0.12, power: 0, turns: 1 }),
    // Mgliste Bagna
    E("s_toad", 0.9, 1, 0.8, "#6c8c3c", { type: "poison", chance: 0.3, power: 0.2, turns: 3 }),
    E("s_leech", 1.1, 0.9, 0.7, "#4b2f2f", { type: "bleed", chance: 0.3, power: 0.2, turns: 3 }),
    E("s_wisp", 0.6, 1.2, 0.5, "#d6f27a", { type: "burn", chance: 0.2, power: 0.25, turns: 2 }),
    E("s_croc", 1.4, 1.1, 1.3, "#3d5c3a"),
    E("s_hag", 0.9, 1.2, 0.8, "#6a5a7a", { type: "poison", chance: 0.25, power: 0.25, turns: 3 }),
    E("s_drowned", 1.2, 1, 1, "#5d7a80", { type: "stun", chance: 0.1, power: 0, turns: 1 }),
    E("s_boss", 1, 1.05, 1, "#9fb3a8", { type: "poison", chance: 0.35, power: 0.25, turns: 3 }),
    // Kamienne Wzgórza
    E("h_slinger", 0.8, 1.2, 0.8, "#7a8f4a", { type: "stun", chance: 0.1, power: 0, turns: 1 }),
    E("h_golem", 1.5, 0.9, 1.6, "#9a9384"),
    E("h_harpy", 0.8, 1.15, 0.7, "#b58a6a", { type: "bleed", chance: 0.25, power: 0.25, turns: 3 }),
    E("h_troll", 1.6, 1.15, 1, "#6d7f5f"),
    E("h_ram", 1.2, 1, 1.5, "#cfc3a8", { type: "stun", chance: 0.12, power: 0, turns: 1 }),
    E("h_shaman", 0.9, 1.25, 0.8, "#8a6fb0", { type: "burn", chance: 0.25, power: 0.3, turns: 2 }),
    E("h_boss", 1.1, 1, 1.4, "#6e665a", { type: "stun", chance: 0.15, power: 0, turns: 1 }),
    // Zapomniane Katakumby
    E("c_skeleton", 1, 1.05, 1.2, "#d9d4c5"),
    E("c_ghoul", 1.2, 1.1, 0.9, "#7c8a6a", { type: "poison", chance: 0.25, power: 0.25, turns: 3 }),
    E("c_bat", 0.7, 1, 0.6, "#8a2b3a", { type: "bleed", chance: 0.35, power: 0.25, turns: 3 }),
    E("c_cultist", 0.9, 1.25, 0.9, "#3a2a4a", { type: "burn", chance: 0.2, power: 0.3, turns: 3 }),
    E("c_wraith", 0.8, 1.3, 0.6, "#a8b8d8", { type: "stun", chance: 0.12, power: 0, turns: 1 }),
    E("c_rats", 1.1, 0.9, 0.7, "#5e4e3e", { type: "bleed", chance: 0.3, power: 0.2, turns: 4 }),
    E("c_boss", 1, 1.05, 1.1, "#2a1f33", { type: "burn", chance: 0.3, power: 0.3, turns: 3 }),
    // Popielne Pustkowia
    E("a_salamander", 0.9, 1.1, 0.9, "#e0612f", { type: "burn", chance: 0.3, power: 0.3, turns: 3 }),
    E("a_imp", 0.7, 1.25, 0.6, "#c4302b", { type: "burn", chance: 0.25, power: 0.25, turns: 2 }),
    E("a_scorpion", 1.1, 1.1, 1.3, "#b3742a", { type: "poison", chance: 0.3, power: 0.3, turns: 3 }),
    E("a_nomad", 1, 1.2, 1, "#8d7b6a", { type: "bleed", chance: 0.2, power: 0.25, turns: 3 }),
    E("a_magma", 1.5, 1, 1.4, "#ff7a1a", { type: "burn", chance: 0.35, power: 0.3, turns: 3 }),
    E("a_vulture", 0.8, 1.1, 0.7, "#4f4640", { type: "bleed", chance: 0.25, power: 0.25, turns: 3 }),
    E("a_boss", 1.05, 1.05, 1.1, "#ffb347", { type: "burn", chance: 0.4, power: 0.35, turns: 3 }),
    // Lodowa Przełęcz
    E("i_giant", 1.6, 1.15, 1.1, "#e6f0f5", { type: "stun", chance: 0.15, power: 0, turns: 1 }),
    E("i_wolf", 0.9, 1.15, 0.8, "#b8d8e8", { type: "bleed", chance: 0.25, power: 0.25, turns: 3 }),
    E("i_witch", 0.8, 1.3, 0.7, "#7fb3d5", { type: "stun", chance: 0.12, power: 0, turns: 1 }),
    E("i_knight", 1.3, 1.05, 1.6, "#90a4ae"),
    E("i_owl", 0.7, 1.1, 0.6, "#f5f5f5", { type: "bleed", chance: 0.2, power: 0.25, turns: 2 }),
    E("i_golem", 1.5, 0.95, 1.7, "#a7d8f0"),
    E("i_boss", 1, 1.05, 1.2, "#d0f0ff", { type: "stun", chance: 0.18, power: 0, turns: 1 }),
    // Kryształowe Głębiny
    E("d_crawler", 1, 1.1, 1.2, "#b28fe8", { type: "bleed", chance: 0.25, power: 0.25, turns: 3 }),
    E("d_mimic", 1.2, 1.3, 1.1, "#c69b52"),
    E("d_lurker", 0.9, 1.25, 0.8, "#4a3d6a", { type: "poison", chance: 0.3, power: 0.3, turns: 3 }),
    E("d_mage", 0.8, 1.35, 0.7, "#9c6ade", { type: "burn", chance: 0.25, power: 0.3, turns: 3 }),
    E("d_worm", 1.6, 1, 1, "#8f6f8f", { type: "poison", chance: 0.25, power: 0.25, turns: 4 }),
    E("d_sentinel", 1.4, 1, 1.7, "#c8b6ff", { type: "stun", chance: 0.12, power: 0, turns: 1 }),
    E("d_boss", 1.05, 1.05, 1.2, "#e0c3ff", { type: "bleed", chance: 0.35, power: 0.3, turns: 3 }),
    // Tron Pustki
    E("v_shade", 0.8, 1.3, 0.7, "#3b2f5a", { type: "poison", chance: 0.3, power: 0.3, turns: 3 }),
    E("v_knight", 1.4, 1.1, 1.6, "#24203a"),
    E("v_eye", 0.9, 1.35, 0.8, "#d03a6a", { type: "stun", chance: 0.15, power: 0, turns: 1 }),
    E("v_devourer", 1.7, 1.15, 1.1, "#140f24", { type: "bleed", chance: 0.3, power: 0.3, turns: 3 }),
    E("v_herald", 1, 1.3, 1, "#6a4fb0", { type: "burn", chance: 0.3, power: 0.35, turns: 3 }),
    E("v_twin", 1.1, 1.2, 1.2, "#8a8aa8", { type: "bleed", chance: 0.25, power: 0.3, turns: 3 }),
    E("v_boss", 1.1, 1.1, 1.3, "#000000", { type: "stun", chance: 0.2, power: 0, turns: 1 })
  ];
  var ENEMIES = Object.fromEntries(LIST.map((e) => [e.id, e]));

  // js/data/skillTree.js
  var ELEMENTS = ["fire", "ice", "earth"];
  var SKILLS = [
    // OGIEŃ — obrażenia rozłożone w czasie
    {
      id: "fire_spark",
      element: "fire",
      tier: 1,
      type: "active",
      reqLevel: 1,
      maxRank: 3,
      cd: 3,
      magic: [0.9, 1.15, 1.4],
      effects: [{ type: "burn", chance: [0.6, 0.75, 0.9], power: [0.2, 0.25, 0.3], turns: 3 }]
    },
    {
      id: "fire_ember",
      element: "fire",
      tier: 2,
      type: "passive",
      reqLevel: 5,
      maxRank: 3,
      passive: { fireDmg: [12, 24, 36], magicPct: [3, 6, 9] }
    },
    {
      id: "fire_ball",
      element: "fire",
      tier: 3,
      type: "active",
      reqLevel: 12,
      maxRank: 3,
      cd: 5,
      magic: [1.8, 2.3, 2.8],
      atk: [0.3, 0.4, 0.5],
      effects: [{ type: "burn", chance: [1, 1, 1], power: [0.3, 0.35, 0.4], turns: 3 }]
    },
    {
      id: "fire_rage",
      element: "fire",
      tier: 4,
      type: "passive",
      reqLevel: 20,
      maxRank: 3,
      passive: { crit: [3, 6, 9] },
      flags: { critBurn: [0.3, 0.45, 0.6] }
    },
    {
      id: "fire_meteor",
      element: "fire",
      tier: 5,
      type: "active",
      reqLevel: 30,
      maxRank: 3,
      cd: 8,
      magic: [3.5, 4.3, 5.2],
      atk: [0.5, 0.6, 0.7],
      effects: [{ type: "burn", chance: [1, 1, 1], power: [0.5, 0.6, 0.7], turns: 4 }, { type: "stun", chance: [0.3, 0.4, 0.5], turns: 1 }]
    },
    // LÓD — spowolnienie i zamrożenie
    {
      id: "ice_shard",
      element: "ice",
      tier: 1,
      type: "active",
      reqLevel: 1,
      maxRank: 3,
      cd: 3,
      magic: [0.8, 1, 1.25],
      effects: [{ type: "chill", chance: [0.7, 0.85, 1], power: [0.2, 0.25, 0.3], turns: 2 }]
    },
    {
      id: "ice_armor",
      element: "ice",
      tier: 2,
      type: "passive",
      reqLevel: 5,
      maxRank: 3,
      passive: { defPct: [8, 16, 24], iceDmg: [8, 16, 24] }
    },
    {
      id: "ice_freeze",
      element: "ice",
      tier: 3,
      type: "active",
      reqLevel: 12,
      maxRank: 3,
      cd: 6,
      magic: [1.2, 1.5, 1.8],
      effects: [{ type: "freeze", chance: [0.7, 0.85, 1], turns: 1 }]
    },
    {
      id: "ice_heart",
      element: "ice",
      tier: 4,
      type: "passive",
      reqLevel: 20,
      maxRank: 3,
      passive: { hpPct: [8, 16, 24], regen: [2, 4, 6] }
    },
    {
      id: "ice_winter",
      element: "ice",
      tier: 5,
      type: "active",
      reqLevel: 30,
      maxRank: 3,
      cd: 9,
      magic: [3, 3.8, 4.6],
      effects: [{ type: "freeze", chance: [1, 1, 1], turns: 2 }, { type: "chill", chance: [1, 1, 1], power: [0.3, 0.35, 0.4], turns: 4 }]
    },
    // ZIEMIA — obrona i ogłuszenie
    {
      id: "earth_fist",
      element: "earth",
      tier: 1,
      type: "active",
      reqLevel: 1,
      maxRank: 3,
      cd: 4,
      magic: [0.5, 0.65, 0.8],
      atk: [0.6, 0.75, 0.9],
      effects: [{ type: "stun", chance: [0.25, 0.35, 0.45], turns: 1 }]
    },
    {
      id: "earth_skin",
      element: "earth",
      tier: 2,
      type: "passive",
      reqLevel: 5,
      maxRank: 3,
      passive: { def: [5, 12, 20], defPct: [5, 10, 15], earthDmg: [8, 16, 24] }
    },
    {
      id: "earth_quake",
      element: "earth",
      tier: 3,
      type: "active",
      reqLevel: 12,
      maxRank: 3,
      cd: 6,
      magic: [1.3, 1.6, 1.9],
      atk: [0.4, 0.5, 0.6],
      effects: [{ type: "stun", chance: [0.6, 0.75, 0.9], turns: 1 }, { type: "bleed", chance: [0.6, 0.75, 0.9], power: [0.25, 0.3, 0.35], turns: 3 }]
    },
    {
      id: "earth_roots",
      element: "earth",
      tier: 4,
      type: "passive",
      reqLevel: 20,
      maxRank: 3,
      passive: { lifesteal: [3, 5, 7], thorns: [10, 20, 30] }
    },
    {
      id: "earth_wrath",
      element: "earth",
      tier: 5,
      type: "active",
      reqLevel: 30,
      maxRank: 3,
      cd: 9,
      magic: [2, 2.5, 3],
      def: [1.5, 2, 2.5],
      effects: [{ type: "stun", chance: [1, 1, 1], turns: 2 }]
    }
  ];
  var SYNERGIES = [
    { id: "steam", elements: ["fire", "ice"], points: 3, stats: { magicPct: 15 } },
    { id: "magma", elements: ["fire", "earth"], points: 3, stats: { defPct: 5 }, flag: "magma" },
    { id: "permafrost", elements: ["ice", "earth"], points: 3, stats: { hpPct: 5 }, flag: "permafrost" },
    { id: "harmony", elements: ["fire", "ice", "earth"], points: 5, stats: { allPct: 10 } }
  ];
  function getSkill(id) {
    return SKILLS.find((s) => s.id === id);
  }

  // js/i18n/pl.js
  var pl_default = {
    nav: { hero: "Bohater", combat: "Walka", backpack: "Plecak", crafting: "Crafting", settlement: "Osada" },
    common: {
      level: "Poziom {n}",
      levelShort: "Poz. {n}",
      gold: "Z\u0142oto",
      xp: "PD",
      close: "Zamknij",
      confirm: "Potwierd\u017A",
      cancel: "Anuluj",
      ok: "OK",
      cannot: "Nie mo\u017Cna wykona\u0107 tej akcji."
    },
    time: { hm: "{h} godz. {m} min", ms: "{m} min {s} s", s: "{s} s" },
    intro: {
      title: "Witaj, Poszukiwaczu!",
      text1: "Tw\xF3j bohater walczy samodzielnie \u2014 nawet gdy zamkniesz gr\u0119, wci\u0105\u017C przemierza krainy (do 8 godzin).",
      text2: "Rozdawaj punkty statystyk, zak\u0142adaj lepszy ekwipunek, rozbudowuj osad\u0119 i ucz si\u0119 magii \u017Cywio\u0142\xF3w, by dotrze\u0107 do Tronu Pustki.",
      start: "Ruszam w drog\u0119"
    },
    ending: {
      title: "Pustka pokonana!",
      text: "W\u0142adca Pustki upad\u0142, a krainy odetchn\u0119\u0142y z ulg\u0105. Mo\u017Cesz dalej polowa\u0107 na legendarne \u0142upy i rozwija\u0107 bohatera."
    },
    hero: {
      name: "Poszukiwacz",
      tab: { stats: "Statystyki", skills: "Umiej\u0119tno\u015Bci" },
      attributes: "Atrybuty",
      points: "Punkty: {n}",
      derived: "Statystyki bojowe",
      buffs: "Aktywne wzmocnienia",
      noBuffs: "Brak aktywnych wzmocnie\u0144.",
      statistics: "Kronika",
      resetStats: "Reset atrybut\xF3w ({gold} z\u0142.)",
      resetStatsTitle: "Reset atrybut\xF3w",
      resetStatsConfirm: "Odzyskasz wszystkie rozdane punkty za {gold} z\u0142ota. Kontynuowa\u0107?",
      attrDesc: {
        str: "Zwi\u0119ksza atak (+2 za punkt).",
        dex: "Szansa na trafienie krytyczne, si\u0142a krytyka i unik.",
        int: "Moc magii \u2014 si\u0142a umiej\u0119tno\u015Bci i efekt\xF3w \u017Cywio\u0142\xF3w.",
        end: "Zdrowie (+10), obrona i regeneracja."
      },
      stat: {
        kills: "Pokonani wrogowie",
        bossKills: "Pokonani bossowie",
        deaths: "Pora\u017Cki",
        goldEarned: "Zdobyte z\u0142oto",
        itemsFound: "Znalezione przedmioty",
        crafted: "Wytworzone rzeczy",
        playTime: "Czas gry"
      }
    },
    stat: {
      str: "Si\u0142a",
      dex: "Zr\u0119czno\u015B\u0107",
      int: "Intelekt",
      end: "Wytrzyma\u0142o\u015B\u0107",
      hp: "Zdrowie",
      maxHp: "Maks. zdrowie",
      atk: "Atak",
      def: "Obrona",
      magic: "Moc magii",
      crit: "Szansa na krytyk",
      critMult: "Mno\u017Cnik krytyka",
      dodge: "Unik",
      regen: "Regeneracja / runda",
      lifesteal: "Kradzie\u017C \u017Cycia",
      thorns: "Odbicie obra\u017Ce\u0144",
      poisonChance: "Szansa na zatrucie",
      fireDmg: "Obra\u017Cenia od ognia",
      iceDmg: "Obra\u017Cenia od lodu",
      earthDmg: "Obra\u017Cenia od ziemi",
      goldFind: "Znajdowanie z\u0142ota",
      magicFind: "Szcz\u0119\u015Bcie (\u0142upy)",
      xpBonus: "Bonus PD",
      atkPct: "Atak",
      defPct: "Obrona",
      hpPct: "Zdrowie",
      magicPct: "Moc magii",
      allPct: "Wszystkie atrybuty"
    },
    rarity: { 0: "Zwyk\u0142y", 1: "Niezwyk\u0142y", 2: "Rzadki", 3: "Epicki", 4: "Legendarny" },
    slot: {
      head: "G\u0142owa",
      chest: "Tors",
      legs: "Nogi",
      boots: "Buty",
      weapon: "Bro\u0144",
      offhand: "Tarcza / druga r\u0119ka",
      amulet: "Amulet",
      ring: "Pier\u015Bcie\u0144",
      ring1: "Pier\u015Bcie\u0144 I",
      ring2: "Pier\u015Bcie\u0144 II"
    },
    resource: { wood: "Drewno", stone: "Kamie\u0144", iron: "\u017Belazo", herbs: "Zio\u0142a", crystals: "Kryszta\u0142y", leather: "Sk\xF3ra", essence: "Esencja" },
    effect: { burn: "Podpalenie", poison: "Trucizna", bleed: "Krwawienie", stun: "Og\u0142uszenie", freeze: "Zamro\u017Cenie", chill: "Wych\u0142odzenie" },
    element: { fire: "Ogie\u0144", ice: "L\xF3d", earth: "Ziemia" },
    profession: { smithing: "Kowalstwo", alchemy: "Alchemia", cooking: "Kuchnia" },
    combat: {
      locked: "Zablokowane",
      levels: "Poz. {a}\u2013{b}",
      bossProgress: "Post\u0119p do bossa",
      bossReady: "Boss gotowy!",
      challengeBoss: "Wyzwij bossa: {name}",
      consumables: "Mikstury i jedzenie",
      noConsumables: "Brak przedmiot\xF3w \u2014 wytw\xF3rz je w zak\u0142adce Crafting.",
      autoPotion: "Automatyczne mikstury (poni\u017Cej {n}% HP)",
      autoAdvance: "Automatyczne przej\u015Bcie do nowej lokacji",
      log: "Dziennik walki",
      boss: "BOSS",
      respawning: "Odpoczynek\u2026 powr\xF3t za {s} s",
      searching: "Szukanie przeciwnika\u2026",
      round: "Runda {n}"
    },
    log: {
      enemyAppears: "Pojawia si\u0119 {name} (poz. {level}).",
      bossAppears: "\u2694 BOSS: {name} (poz. {level}) staje do walki!",
      travel: "Wyruszasz do: {name}.",
      heroHit: "Zadajesz {dmg} obra\u017Ce\u0144 ({name}).",
      heroCrit: "TRAFIENIE KRYTYCZNE! {dmg} obra\u017Ce\u0144 ({name}).",
      skill: "{skill}: {dmg} obra\u017Ce\u0144.",
      skillCrit: "{skill}: KRYTYK! {dmg} obra\u017Ce\u0144.",
      enemyDodge: "{name} unika ciosu.",
      heroDodge: "Unikasz ataku ({name}).",
      enemyHit: "{name} zadaje ci {dmg} obra\u017Ce\u0144.",
      enemyStunned: "{name} nie mo\u017Ce si\u0119 ruszy\u0107.",
      heroStunned: "Jeste\u015B og\u0142uszony i tracisz tur\u0119.",
      thorns: "Kolce odbijaj\u0105 {dmg} obra\u017Ce\u0144.",
      effect: {
        burn: "{name} p\u0142onie!",
        poison: "{name} zostaje zatruty.",
        bleed: "{name} krwawi.",
        stun: "{name} zostaje og\u0142uszony!",
        freeze: "{name} zamarza!",
        chill: "{name} zostaje wych\u0142odzony."
      },
      heroEffect: { burn: "P\u0142oniesz!", poison: "Zostajesz zatruty!", bleed: "Krwawisz!", stun: "Zostajesz og\u0142uszony!" },
      dot: { burn: "Ogie\u0144 pali: {dmg} ({name}).", poison: "Trucizna: {dmg} ({name}).", bleed: "Krwawienie: {dmg} ({name})." },
      heroDot: { burn: "Ogie\u0144 parzy ci\u0119: {dmg}.", poison: "Trucizna: tracisz {dmg} HP.", bleed: "Krwawienie: tracisz {dmg} HP." },
      potion: "U\u017Cywasz: {name}.",
      victory: "Pokonano: {name}! +{xp} PD, +{gold} z\u0142ota.",
      loot: "\u0141up: {name} [{rarity}].",
      lootSold: "Plecak pe\u0142ny \u2014 \u0142up sprzedany za {gold} z\u0142ota.",
      resource: "Zebrano: {n}\xD7 {name}.",
      unlocked: "Odblokowano now\u0105 lokacj\u0119: {name}!",
      bossReady: "Stra\u017Cnik tej krainy czeka na wyzwanie!",
      defeat: "Przegrywasz z: {name}. Musisz odpocz\u0105\u0107.",
      defeatBoss: "{name} okaza\u0142 si\u0119 zbyt silny. Wzmocnij si\u0119 i wyzwij go ponownie.",
      respawn: "Wracasz do si\u0142 i ruszasz dalej."
    },
    location: {
      forest: { name: "Szepcz\u0105cy Las", desc: "Stare drzewa szumi\u0105 o tych, kt\xF3rzy zab\u0142\u0105dzili." },
      swamp: { name: "Mgliste Bagna", desc: "G\u0119sta mg\u0142a skrywa jadowite stwory i zdradliwe topiele." },
      hills: { name: "Kamienne Wzg\xF3rza", desc: "Wietrzne zbocza pe\u0142ne goblin\xF3w i o\u017Cywionych ska\u0142." },
      catacombs: { name: "Zapomniane Katakumby", desc: "Pod ziemi\u0105 \u015Bpi\u0105 ci, kt\xF3rzy nie powinni si\u0119 budzi\u0107." },
      ashlands: { name: "Popielne Pustkowia", desc: "Spalona ziemia, na kt\xF3rej nawet wiatr parzy." },
      pass: { name: "Lodowa Prze\u0142\u0119cz", desc: "Szlak skuty wiecznym lodem, strze\u017Cony przez mro\u017Ane bestie." },
      depths: { name: "Kryszta\u0142owe G\u0142\u0119biny", desc: "Jaskinie l\u015Bni\u0105ce kryszta\u0142ami, kt\xF3re \u015Bpiewaj\u0105 w ciemno\u015Bci." },
      void: { name: "Tron Pustki", desc: "Miejsce, gdzie ko\u0144czy si\u0119 \u015Bwiat i zaczyna nico\u015B\u0107." }
    },
    enemy: {
      f_wolf: "Szary wilk",
      f_boar: "Rozjuszony dzik",
      f_sprite: "Le\u015Bny chochlik",
      f_spider: "Paj\u0105k mchowy",
      f_bandit: "Le\u015Bny zb\xF3j",
      f_shroom: "W\u0119druj\u0105cy grzyb",
      f_boss: "Stary Korzeniec",
      s_toad: "Jadowita ropucha",
      s_leech: "Olbrzymia pijawka",
      s_wisp: "B\u0142\u0119dny ognik",
      s_croc: "Bagienny gad",
      s_hag: "Wied\u017Ama trzcin",
      s_drowned: "Topielec",
      s_boss: "Matka Mgie\u0142",
      h_slinger: "Gobli\u0144ski procarz",
      h_golem: "Ma\u0142y golem",
      h_harpy: "Harpia",
      h_troll: "Troll wzg\xF3rz",
      h_ram: "Pancerny baran",
      h_shaman: "Gobli\u0144ski szaman",
      h_boss: "Kr\xF3l Ska\u0142y Grumm",
      c_skeleton: "Szkielet stra\u017Cnik",
      c_ghoul: "Ghul",
      c_bat: "Krwawy nietoperz",
      c_cultist: "Kultysta cienia",
      c_wraith: "Upi\xF3r",
      c_rats: "Szczurzy r\xF3j",
      c_boss: "Kap\u0142an Bez Twarzy",
      a_salamander: "Salamandra",
      a_imp: "Ognisty bies",
      a_scorpion: "Skorpion \u017Caru",
      a_nomad: "Popielny koczownik",
      a_magma: "\u017Bywio\u0142ak magmy",
      a_vulture: "S\u0119p popio\u0142u",
      a_boss: "Po\u017Ceracz S\u0142o\u0144ca",
      i_giant: "\u015Anie\u017Cny olbrzym",
      i_wolf: "Wilk szronu",
      i_witch: "Lodowa wied\u017Ama",
      i_knight: "Zamarzni\u0119ty rycerz",
      i_owl: "Sowa zamieci",
      i_golem: "Golem lodu",
      i_boss: "Stra\u017Cniczka Wiecznej Zimy",
      d_crawler: "Kryszta\u0142owy pe\u0142zacz",
      d_mimic: "Mimik",
      d_lurker: "\u015Alepy czyhacz",
      d_mage: "Mag rezonansu",
      d_worm: "Czerw g\u0142\u0119bin",
      d_sentinel: "Kryszta\u0142owy wartownik",
      d_boss: "Serce G\u0142\u0119bin",
      v_shade: "Cie\u0144 pustki",
      v_knight: "Rycerz otch\u0142ani",
      v_eye: "Oko bezkresu",
      v_devourer: "Po\u017Ceracz gwiazd",
      v_herald: "Zwiastun ko\u0144ca",
      v_twin: "Bli\u017Aniak zmierzchu",
      v_boss: "W\u0142adca Pustki"
    },
    // Nazwy typów bazowych wg poziomu (tier 0–4) z rodzajem gramatycznym
    base: {
      sword: [{ n: "Kr\xF3tki miecz", g: "m" }, { n: "Miecz najemnika", g: "m" }, { n: "Miecz rycerski", g: "m" }, { n: "Miecz runiczny", g: "m" }, { n: "Miecz gwiazd", g: "m" }],
      axe: [{ n: "Siekiera drwala", g: "f" }, { n: "Top\xF3r bojowy", g: "m" }, { n: "Top\xF3r berserkera", g: "m" }, { n: "Top\xF3r runiczny", g: "m" }, { n: "Top\xF3r burzy", g: "m" }],
      dagger: [{ n: "N\xF3\u017C my\u015Bliwski", g: "m" }, { n: "Sztylet", g: "m" }, { n: "Sztylet skrytob\xF3jcy", g: "m" }, { n: "Sztylet cienia", g: "m" }, { n: "Kie\u0142 zmierzchu", g: "m" }],
      staff: [{ n: "Kij w\u0119drowca", g: "m" }, { n: "Kostur ucznia", g: "m" }, { n: "Kostur maga", g: "m" }, { n: "Kostur arcymaga", g: "m" }, { n: "Kostur gwiezdny", g: "m" }],
      shield: [{ n: "Drewniana tarcza", g: "f" }, { n: "Okuta tarcza", g: "f" }, { n: "Tarcza rycerska", g: "f" }, { n: "Tarcza runiczna", g: "f" }, { n: "Tarcza bastionu", g: "f" }],
      tome: [{ n: "Notatnik zielarza", g: "m" }, { n: "Ksi\u0119ga zakl\u0119\u0107", g: "f" }, { n: "Ksi\u0119ga m\u0119drca", g: "f" }, { n: "Ksi\u0119ga runiczna", g: "f" }, { n: "Ksi\u0119ga gwiazd", g: "f" }],
      helm: [{ n: "Sk\xF3rzany kaptur", g: "m" }, { n: "He\u0142m \u017Co\u0142nierski", g: "m" }, { n: "He\u0142m rycerski", g: "m" }, { n: "He\u0142m runiczny", g: "m" }, { n: "Korona gwiazd", g: "f" }],
      armor: [{ n: "Pikowany kaftan", g: "m" }, { n: "Kolczuga", g: "f" }, { n: "Zbroja p\u0142ytowa", g: "f" }, { n: "Zbroja runiczna", g: "f" }, { n: "Zbroja gwiazd", g: "f" }],
      greaves: [{ n: "Sk\xF3rzane spodnie", g: "pl" }, { n: "Nogawice kolcze", g: "pl" }, { n: "Nagolenniki p\u0142ytowe", g: "pl" }, { n: "Nagolenniki runiczne", g: "pl" }, { n: "Nagolenniki gwiazd", g: "pl" }],
      boots: [{ n: "\u0141apcie", g: "pl" }, { n: "Buty podr\xF3\u017Cne", g: "pl" }, { n: "Buty kawalerzysty", g: "pl" }, { n: "Buty runiczne", g: "pl" }, { n: "Buty gwiazd", g: "pl" }],
      amulet: [{ n: "Ko\u015Bciany amulet", g: "m" }, { n: "Srebrny amulet", g: "m" }, { n: "Z\u0142oty amulet", g: "m" }, { n: "Amulet runiczny", g: "m" }, { n: "Amulet gwiazd", g: "m" }],
      ring: [{ n: "Miedziany pier\u015Bcie\u0144", g: "m" }, { n: "Srebrny pier\u015Bcie\u0144", g: "m" }, { n: "Z\u0142oty pier\u015Bcie\u0144", g: "m" }, { n: "Pier\u015Bcie\u0144 runiczny", g: "m" }, { n: "Pier\u015Bcie\u0144 gwiazd", g: "m" }]
    },
    prefix: {
      sharp: { m: "Ostry", f: "Ostra", n: "Ostre", pl: "Ostre" },
      sturdy: { m: "Solidny", f: "Solidna", n: "Solidne", pl: "Solidne" },
      vital: { m: "\u017Bywotny", f: "\u017Bywotna", n: "\u017Bywotne", pl: "\u017Bywotne" },
      precise: { m: "Precyzyjny", f: "Precyzyjna", n: "Precyzyjne", pl: "Precyzyjne" },
      swift: { m: "Zwinny", f: "Zwinna", n: "Zwinne", pl: "Zwinne" },
      arcane: { m: "Tajemny", f: "Tajemna", n: "Tajemne", pl: "Tajemne" },
      venomous: { m: "Jadowity", f: "Jadowita", n: "Jadowite", pl: "Jadowite" },
      blazing: { m: "P\u0142on\u0105cy", f: "P\u0142on\u0105ca", n: "P\u0142on\u0105ce", pl: "P\u0142on\u0105ce" },
      frozen: { m: "Mro\u017Any", f: "Mro\u017Ana", n: "Mro\u017Ane", pl: "Mro\u017Ane" },
      earthen: { m: "Kamienny", f: "Kamienna", n: "Kamienne", pl: "Kamienne" },
      vampiric: { m: "Wampirzy", f: "Wampirza", n: "Wampirze", pl: "Wampirze" }
    },
    suffix: {
      bear: "Nied\u017Awiedzia",
      fox: "Lisa",
      owl: "Sowy",
      ox: "Tura",
      fortune: "Fortuny",
      seeker: "Poszukiwacza",
      sage: "M\u0119drca",
      troll: "Trolla",
      thorns: "Cierni"
    },
    consumable: {
      hp_small: { name: "Ma\u0142a mikstura leczenia", desc: "Przywraca 30% maks. zdrowia." },
      hp_medium: { name: "Mikstura leczenia", desc: "Przywraca 50% maks. zdrowia." },
      hp_large: { name: "Wielka mikstura leczenia", desc: "Przywraca 80% maks. zdrowia." },
      elixir_str: { name: "Eliksir si\u0142y", desc: "+15% ataku przez 10 minut." },
      elixir_stone: { name: "Eliksir kamiennej sk\xF3ry", desc: "+20% obrony przez 10 minut." },
      elixir_mind: { name: "Eliksir jasnego umys\u0142u", desc: "+25% mocy magii przez 10 minut." },
      elixir_fortune: { name: "Eliksir fortuny", desc: "+25% z\u0142ota i szcz\u0119\u015Bcia przez 15 minut." },
      food_stew: { name: "Gulasz my\u015Bliwego", desc: "+10% PD przez 15 minut." },
      food_fish: { name: "Pstr\u0105g z zio\u0142ami", desc: "+6 regeneracji na rund\u0119 przez 15 minut." },
      food_pie: { name: "Placek z dziczyzn\u0105", desc: "+15% zdrowia przez 20 minut." },
      food_feast: { name: "Uczta bohatera", desc: "+10% wszystkich atrybut\xF3w i +10% PD przez 30 minut." }
    },
    recipe: {
      smith_weapon: { name: "Wykuj bro\u0144", desc: "Bro\u0144 na twoim poziomie, co najmniej Niezwyk\u0142a." },
      smith_armor: { name: "Wykuj pancerz", desc: "Losowa cz\u0119\u015B\u0107 zbroi, co najmniej Niezwyk\u0142a." },
      smith_offhand: { name: "Wykuj drug\u0105 r\u0119k\u0119", desc: "Tarcza lub ksi\u0119ga, co najmniej Niezwyk\u0142a." },
      smith_jewel: { name: "Oprawa klejnotu", desc: "Amulet lub pier\u015Bcie\u0144, co najmniej Rzadki." },
      smith_essence: { name: "Destylacja esencji", desc: "Przetapia \u017Celazo i kamie\u0144 na 3 esencje." },
      smith_masterwork: { name: "Arcydzie\u0142o kowala", desc: "Dowolny przedmiot, co najmniej Epicki." },
      alch_hp_small: { name: "Ma\u0142a mikstura leczenia", desc: "Tworzy 2 sztuki." },
      alch_hp_medium: { name: "Mikstura leczenia", desc: "Tworzy 2 sztuki." },
      alch_elixir_str: { name: "Eliksir si\u0142y", desc: "+15% ataku na 10 minut." },
      alch_elixir_stone: { name: "Eliksir kamiennej sk\xF3ry", desc: "+20% obrony na 10 minut." },
      alch_hp_large: { name: "Wielka mikstura leczenia", desc: "Tworzy 2 sztuki." },
      alch_elixir_mind: { name: "Eliksir jasnego umys\u0142u", desc: "+25% mocy magii na 10 minut." },
      alch_elixir_fortune: { name: "Eliksir fortuny", desc: "+25% z\u0142ota i szcz\u0119\u015Bcia na 15 minut." },
      cook_stew: { name: "Gulasz my\u015Bliwego", desc: "+10% PD na 15 minut." },
      cook_fish: { name: "Pstr\u0105g z zio\u0142ami", desc: "+6 regeneracji na 15 minut." },
      cook_pie: { name: "Placek z dziczyzn\u0105", desc: "+15% zdrowia na 20 minut." },
      cook_feast: { name: "Uczta bohatera", desc: "+10% atrybut\xF3w i PD na 30 minut." }
    },
    building: {
      townhall: {
        name: "Ratusz",
        desc: "Serce osady. Ogranicza poziom pozosta\u0142ych budynk\xF3w (maks. poziom Ratusza + 1).",
        bonus: "+{xpPct}% PD, +{goldPct}% z\u0142ota, AFK {afk}%"
      },
      forge: { name: "Ku\u017Ania", desc: "Odblokowuje kowalstwo i ulepszanie przedmiot\xF3w.", bonus: "ulepszenia do +{maxUpgrade}" },
      lab: { name: "Laboratorium", desc: "Odblokowuje alchemi\u0119. Wzmacnia mikstury leczenia.", bonus: "+{potionPct}% si\u0142y leczenia" },
      kitchen: { name: "Kuchnia", desc: "Odblokowuje gotowanie. Wyd\u0142u\u017Ca dzia\u0142anie wzmocnie\u0144.", bonus: "+{buffDurPct}% czasu wzmocnie\u0144" },
      warehouse: { name: "Magazyn", desc: "Powi\u0119ksza plecak bohatera.", bonus: "+{backpack} miejsc w plecaku" },
      market: { name: "Targ", desc: "Lepsze ceny sprzeda\u017Cy i zakup surowc\xF3w za z\u0142oto.", bonus: "+{sellPct}% ceny sprzeda\u017Cy" }
    },
    skill: {
      fire_spark: { name: "Iskra", desc: "Zadaje {magic}% mocy magii, {chance}% szans na podpalenie ({power}% magii/rund\u0119). Odnowienie: {cd} rund." },
      fire_ember: { name: "Wewn\u0119trzny \u017Car", desc: "+{v1}% obra\u017Ce\u0144 od ognia i +{v2}% mocy magii." },
      fire_ball: { name: "Kula ognia", desc: "Zadaje {magic}% magii + {atk}% ataku i zawsze podpala. Odnowienie: {cd} rund." },
      fire_rage: { name: "Wrz\u0105cy gniew", desc: "+{v1}% szansy na krytyk; krytyki podpalaj\u0105 wroga ({flag}% magii/rund\u0119)." },
      fire_meteor: { name: "Deszcz meteor\xF3w", desc: "Zadaje {magic}% magii + {atk}% ataku, silnie podpala i mo\u017Ce og\u0142uszy\u0107. Odnowienie: {cd} rund." },
      ice_shard: { name: "Lodowy od\u0142amek", desc: "Zadaje {magic}% magii; {chance}% szans na wych\u0142odzenie (wr\xF3g zadaje -{power}% obra\u017Ce\u0144). Odnowienie: {cd} rund." },
      ice_armor: { name: "Mro\u017Any pancerz", desc: "+{v1}% obrony i +{v2}% obra\u017Ce\u0144 od lodu." },
      ice_freeze: { name: "Zamro\u017Cenie", desc: "Zadaje {magic}% magii; {chance}% szans na zamro\u017Cenie wroga. Odnowienie: {cd} rund." },
      ice_heart: { name: "Kryszta\u0142owe serce", desc: "+{v1}% zdrowia i +{v2} regeneracji na rund\u0119." },
      ice_winter: { name: "Wieczna zima", desc: "Zadaje {magic}% magii, zamra\u017Ca na {turns} rundy i wych\u0142adza wroga. Odnowienie: {cd} rund." },
      earth_fist: { name: "Kamienna pi\u0119\u015B\u0107", desc: "Zadaje {magic}% magii + {atk}% ataku; {chance}% szans na og\u0142uszenie. Odnowienie: {cd} rund." },
      earth_skin: { name: "Sk\xF3ra g\u0142azu", desc: "+{v1} obrony, +{v2}% obrony i +{v3}% obra\u017Ce\u0144 od ziemi." },
      earth_quake: { name: "Wstrz\u0105s", desc: "Zadaje {magic}% magii + {atk}% ataku; mo\u017Ce og\u0142uszy\u0107 i wywo\u0142a\u0107 krwawienie. Odnowienie: {cd} rund." },
      earth_roots: { name: "Pradawne korzenie", desc: "+{v1}% kradzie\u017Cy \u017Cycia i +{v2}% odbicia obra\u017Ce\u0144." },
      earth_wrath: { name: "Gniew g\xF3r", desc: "Zadaje {magic}% magii + {def}% obrony i og\u0142usza na {turns} rundy. Odnowienie: {cd} rund." }
    },
    synergy: {
      steam: { name: "Para", desc: "+15% mocy magii." },
      magma: { name: "Magma", desc: "Podpaleni wrogowie maj\u0105 -15% obrony; +5% obrony." },
      permafrost: { name: "Wieczna zmarzlina", desc: "Og\u0142uszenia i zamro\u017Cenia trwaj\u0105 o 1 rund\u0119 d\u0142u\u017Cej; +5% zdrowia." },
      harmony: { name: "Harmonia \u017Cywio\u0142\xF3w", desc: "+10% wszystkich atrybut\xF3w." }
    },
    skills: {
      title: "Magia \u017Cywio\u0142\xF3w",
      points: "Punkty: {n}",
      learn: "Naucz",
      hint: "Punkt umiej\u0119tno\u015Bci otrzymujesz co {n} poziomy. Umiej\u0119tno\u015Bci aktywne s\u0105 u\u017Cywane automatycznie w walce.",
      reset: "Zapomnij umiej\u0119tno\u015Bci ({gold} z\u0142.)",
      resetTitle: "Reset umiej\u0119tno\u015Bci",
      resetConfirm: "Odzyskasz wszystkie punkty umiej\u0119tno\u015Bci za {gold} z\u0142ota. Kontynuowa\u0107?",
      synergies: "Synergie",
      synergyReq: "Wymaga: {n} pkt. w: {list}",
      learned: "Poznano: {name}",
      type: { active: "aktywna", passive: "pasywna" },
      reason: { level: "Wymaga poziomu {n}.", prev: "Wymaga poprzedniej umiej\u0119tno\u015Bci.", points: "Brak punkt\xF3w umiej\u0119tno\u015Bci.", unknown: "" }
    },
    inventory: {
      equipment: "Ekwipunek",
      resources: "Surowce",
      consumables: "Mikstury i jedzenie",
      backpack: "Plecak",
      sort: "Sortowanie",
      sortBy: { rarity: "Wg rzadko\u015Bci", level: "Wg poziomu", slot: "Wg rodzaju", power: "Wg si\u0142y" },
      sellCommon: "Sprzedaj zwyk\u0142e",
      sellUncommon: "Sprzedaj do niezwyk\u0142ych",
      use: "U\u017Cyj",
      hint: "Dotknij przedmiotu, aby zobaczy\u0107 szczeg\xF3\u0142y i por\xF3wnanie. Zablokowane przedmioty nie s\u0105 sprzedawane hurtowo.",
      full: "Plecak jest pe\u0142ny!",
      used: "U\u017Cyto: {name}",
      sellAllTitle: "Sprzeda\u017C hurtowa",
      sellAllConfirm0: "Sprzeda\u0107 wszystkie niezablokowane zwyk\u0142e przedmioty?",
      sellAllConfirm1: "Sprzeda\u0107 wszystkie niezablokowane zwyk\u0142e i niezwyk\u0142e przedmioty?",
      soldAll: "Sprzedano {n} przedm. za {gold} z\u0142ota."
    },
    item: {
      equip: "Za\u0142\xF3\u017C",
      equipTo: "Za\u0142\xF3\u017C ({slot})",
      unequip: "Zdejmij",
      lock: "Zablokuj",
      unlock: "Odblokuj",
      sell: "Sprzedaj ({gold} z\u0142.)",
      salvage: "Rozbierz (+{essence} esencji)",
      crafted: "wykuty",
      power: "Si\u0142a przedmiotu",
      vsEquipped: "wzgl\u0119dem za\u0142o\u017Conego",
      emptySlot: "Pusty slot \u2014 warto za\u0142o\u017Cy\u0107!",
      compareWith: "Por\xF3wnaj z",
      upgrade: "Ulepszenie",
      upgradeBtn: "Ulepsz (+{pct}% statystyk bazowych)",
      needForge: "Zbuduj Ku\u017Ani\u0119 w Osadzie, aby ulepsza\u0107 przedmioty.",
      maxUpgrade: "Osi\u0105gni\u0119to limit ulepsze\u0144 \u2014 rozbuduj Ku\u017Ani\u0119.",
      upgraded: "Przedmiot ulepszony!",
      sold: "Sprzedano za {gold} z\u0142ota.",
      salvaged: "Odzyskano {essence} esencji.",
      sellConfirmTitle: "Cenny przedmiot",
      salvageConfirmTitle: "Cenny przedmiot",
      sellConfirm: "To rzadki \u0142up. Na pewno chcesz si\u0119 go pozby\u0107?"
    },
    crafting: {
      queue: "Kolejka (maks. 3)",
      recipes: "Receptury",
      craft: "Wytw\xF3rz",
      cancel: "Anuluj",
      emptySlot: "Wolne miejsce",
      waiting: "Oczekuje\u2026",
      maxLevel: "Maksymalny poziom",
      needBuilding: "Wymaga: {name} poz. {n}",
      profHint: "Ka\u017Cdy poziom profesji skraca czas pracy o {pct}%.",
      buildFirst: "Najpierw zbuduj: {name}.",
      started: "Rozpocz\u0119to: {name}"
    },
    settlement: {
      title: "Osada",
      hint: "Budynki daj\u0105 sta\u0142e bonusy i odblokowuj\u0105 rzemios\u0142o. Surowce zdobywasz w walce.",
      level: "Poz. {n}/{max}",
      current: "Obecnie",
      next: "Nast\u0119pny poziom",
      notBuilt: "nie zbudowano",
      maxed: "Maksymalny poziom!",
      needTownhall: "Najpierw rozbuduj Ratusz (wymagany poz. {n}).",
      build: "Zbuduj",
      upgrade: "Rozbuduj",
      built: "{name}: poziom {n}!",
      marketTitle: "Targ \u2014 zakup surowc\xF3w",
      marketHint: "Ka\u017Cdy poziom Targu powy\u017Cej pierwszego obni\u017Ca ceny o 5%.",
      pricePer: "{gold} z\u0142./szt.",
      marketLocked: "Zbuduj Targ, aby kupowa\u0107 surowce za z\u0142oto."
    },
    settings: {
      title: "Ustawienia",
      volume: "G\u0142o\u015Bno\u015B\u0107",
      batterySaver: "Oszcz\u0119dzanie baterii",
      batterySaverDesc: "Wy\u0142\u0105cza animacje i rzadziej od\u015Bwie\u017Ca ekran.",
      saveTitle: "Zapis gry",
      saveNow: "Zapisz teraz",
      export: "Eksportuj zapis",
      copy: "Kopiuj",
      import: "Importuj zapis",
      importPlaceholder: "Tu pojawi si\u0119 kod zapisu lub wklej w\u0142asny\u2026",
      dangerTitle: "Strefa niebezpieczna",
      reset: "Zresetuj gr\u0119",
      about: "Poszukiwacz \u2014 gra offline. Post\u0119p zapisywany automatycznie co 30 sekund w pami\u0119ci przegl\u0105darki.",
      saved: "Gra zapisana.",
      copied: "Skopiowano do schowka.",
      nothingToCopy: "Najpierw wyeksportuj lub wklej zapis.",
      importConfirmTitle: "Import zapisu",
      importConfirm: "Obecny post\u0119p zostanie zast\u0105piony. Kontynuowa\u0107?",
      imported: "Zapis wczytany!",
      importError: "Nieprawid\u0142owy kod zapisu.",
      resetTitle: "Reset gry",
      resetConfirm1: "Ca\u0142y post\u0119p zostanie usuni\u0119ty. Czy na pewno?",
      resetConfirm2: "To ostatnie ostrze\u017Cenie \u2014 tej operacji nie mo\u017Cna cofn\u0105\u0107!",
      resetFinal: "Usu\u0144 wszystko",
      resetDone: "Rozpocz\u0119to now\u0105 gr\u0119.",
      restoredBackup: "G\u0142\xF3wny zapis by\u0142 uszkodzony \u2014 przywr\xF3cono kopi\u0119 zapasow\u0105."
    },
    afk: {
      title: "Raport z wyprawy",
      away: "Nie by\u0142o ci\u0119 przez {time}.",
      capped: "(nagrody naliczono za maks. 8 godzin)",
      kills: "Pokonani wrogowie",
      xp: "Zdobyte PD",
      levels: "Nowe poziomy",
      gold: "Zdobyte z\u0142oto",
      items: "Znalezione przedmioty",
      converted: "{n} przedm. nie zmie\u015Bci\u0142o si\u0119 w plecaku i zamieniono je na esencj\u0119.",
      crafted: "Uko\u0144czone rzemios\u0142o",
      bossReady: "Boss lokacji czeka na wyzwanie!",
      nothing: "Tw\xF3j bohater nie zdo\u0142a\u0142 nikogo pokona\u0107.",
      collect: "Odbierz",
      clockWarning: "Wykryto cofni\u0119cie zegara systemowego. Nagrody offline nie zosta\u0142y przyznane."
    },
    toast: {
      levelUp: "Awans! Poziom {n}",
      unlocked: "Nowa lokacja: {name}",
      rareLoot: "Cenny \u0142up: {name}",
      crafted: "Gotowe: {name}",
      profLevel: "{name}: poziom {n}",
      saveError: "Nie uda\u0142o si\u0119 zapisa\u0107 gry!"
    }
  };

  // js/i18n/i18n.js
  var current = pl_default;
  function lookup(key) {
    return key.split(".").reduce((o, k) => o == null ? void 0 : o[k], current);
  }
  function t(key, params) {
    const v = lookup(key);
    if (v == null) return key;
    if (typeof v !== "string") return v;
    return params ? v.replace(/\{(\w+)\}/g, (_, k) => params[k] != null ? params[k] : "") : v;
  }

  // js/data/items.js
  var EQUIP_SLOTS = ["head", "chest", "legs", "boots", "weapon", "offhand", "amulet", "ring1", "ring2"];
  var BASES = [
    { id: "sword", slot: "weapon", stats: { atk: [4, 2.4] } },
    { id: "axe", slot: "weapon", stats: { atk: [5, 2.7], crit: [-2, 0] } },
    { id: "dagger", slot: "weapon", stats: { atk: [3, 2], crit: [3, 0.04] } },
    { id: "staff", slot: "weapon", stats: { atk: [2, 1.2], magic: [4, 2.4] } },
    { id: "shield", slot: "offhand", stats: { def: [2, 1.1], hp: [5, 3] } },
    { id: "tome", slot: "offhand", stats: { magic: [2, 1.5], int: [1, 0.15] } },
    { id: "helm", slot: "head", stats: { def: [1, 0.8], hp: [4, 2.5] } },
    { id: "armor", slot: "chest", stats: { def: [2, 1.3], hp: [6, 4] } },
    { id: "greaves", slot: "legs", stats: { def: [1.5, 1], hp: [4, 3] } },
    { id: "boots", slot: "boots", stats: { def: [1, 0.7], dodge: [1, 0.03] } },
    { id: "amulet", slot: "amulet", stats: { magic: [2, 1.2], hp: [5, 3] } },
    { id: "ring", slot: "ring", stats: { atk: [1, 0.8], crit: [1, 0.02] } }
  ];
  var AFFIXES = [
    { id: "sharp", kind: "prefix", stat: "atk", a: 2, b: 0.9 },
    { id: "sturdy", kind: "prefix", stat: "def", a: 1, b: 0.6 },
    { id: "vital", kind: "prefix", stat: "hp", a: 8, b: 4 },
    { id: "precise", kind: "prefix", stat: "crit", a: 1.5, b: 0.05, pct: true },
    { id: "swift", kind: "prefix", stat: "dodge", a: 1, b: 0.04, pct: true },
    { id: "arcane", kind: "prefix", stat: "magic", a: 2, b: 0.9 },
    { id: "venomous", kind: "prefix", stat: "poisonChance", a: 4, b: 0.1, pct: true, slots: ["weapon", "ring"] },
    { id: "blazing", kind: "prefix", stat: "fireDmg", a: 5, b: 0.2, pct: true },
    { id: "frozen", kind: "prefix", stat: "iceDmg", a: 5, b: 0.2, pct: true },
    { id: "earthen", kind: "prefix", stat: "earthDmg", a: 5, b: 0.2, pct: true },
    { id: "vampiric", kind: "prefix", stat: "lifesteal", a: 1.5, b: 0.04, pct: true, slots: ["weapon", "amulet", "ring"] },
    { id: "bear", kind: "suffix", stat: "str", a: 1, b: 0.25 },
    { id: "fox", kind: "suffix", stat: "dex", a: 1, b: 0.25 },
    { id: "owl", kind: "suffix", stat: "int", a: 1, b: 0.25 },
    { id: "ox", kind: "suffix", stat: "end", a: 1, b: 0.25 },
    { id: "fortune", kind: "suffix", stat: "goldFind", a: 4, b: 0.15, pct: true },
    { id: "seeker", kind: "suffix", stat: "magicFind", a: 4, b: 0.15, pct: true },
    { id: "sage", kind: "suffix", stat: "xpBonus", a: 3, b: 0.1, pct: true },
    { id: "troll", kind: "suffix", stat: "regen", a: 0.5, b: 0.12 },
    { id: "thorns", kind: "suffix", stat: "thorns", a: 4, b: 0.15, pct: true, slots: ["chest", "offhand", "legs", "head"] }
  ];
  var PERCENT_STATS = /* @__PURE__ */ new Set([
    "crit",
    "dodge",
    "poisonChance",
    "fireDmg",
    "iceDmg",
    "earthDmg",
    "lifesteal",
    "goldFind",
    "magicFind",
    "xpBonus",
    "thorns",
    "atkPct",
    "defPct",
    "hpPct",
    "magicPct",
    "allPct"
  ]);
  var STAT_WEIGHTS = {
    atk: 1.6,
    def: 1.4,
    hp: 0.25,
    magic: 1.4,
    crit: 3,
    dodge: 3,
    str: 3,
    dex: 3,
    int: 3,
    end: 3,
    poisonChance: 1.5,
    fireDmg: 1,
    iceDmg: 1,
    earthDmg: 1,
    lifesteal: 3,
    goldFind: 0.8,
    magicFind: 0.8,
    xpBonus: 1,
    regen: 3,
    thorns: 1
  };
  var CONSUMABLES = {
    hp_small: { kind: "potion", heal: 30, color: "#d9534f" },
    hp_medium: { kind: "potion", heal: 50, color: "#c9302c" },
    hp_large: { kind: "potion", heal: 80, color: "#a01f1b" },
    elixir_str: { kind: "elixir", stats: { atkPct: 15 }, duration: 10 * 6e4, color: "#e8803a" },
    elixir_stone: { kind: "elixir", stats: { defPct: 20 }, duration: 10 * 6e4, color: "#8a8f99" },
    elixir_mind: { kind: "elixir", stats: { magicPct: 25 }, duration: 10 * 6e4, color: "#5b7fd6" },
    elixir_fortune: { kind: "elixir", stats: { goldFind: 25, magicFind: 25 }, duration: 15 * 6e4, color: "#e6c34a" },
    food_stew: { kind: "food", stats: { xpBonus: 10 }, duration: 15 * 6e4, color: "#9c6b3e" },
    food_fish: { kind: "food", stats: { regen: 6 }, duration: 15 * 6e4, color: "#6fa8c7" },
    food_pie: { kind: "food", stats: { hpPct: 15 }, duration: 20 * 6e4, color: "#d9a54a" },
    food_feast: { kind: "food", stats: { allPct: 10, xpBonus: 10 }, duration: 30 * 6e4, color: "#c45a8a" }
  };
  var RESOURCES = ["wood", "stone", "iron", "herbs", "crystals", "leather", "essence"];

  // js/systems/loot.js
  var round1 = (v) => Math.round(v * 10) / 10;
  function rollRarity(magicFind = 0, shift = 0, r = rng) {
    const weights = BALANCE.RARITY_WEIGHTS.map((w, i) => [i, i === 0 ? w : w * (1 + magicFind / 100)]);
    return Math.min(4, r.weighted(weights) + shift);
  }
  function tierFor(level) {
    return Math.min(4, Math.floor((level - 1) / 11));
  }
  function generateItem(state, level, rarity, slot = null, r = rng) {
    const pool = BASES.filter((b) => !slot || b.slot === slot || slot.startsWith("ring") && b.slot === "ring");
    const base = r.pick(pool);
    const mult = BALANCE.RARITY_STAT_MULT[rarity];
    const baseStats = {};
    for (const [stat, [a, b]] of Object.entries(base.stats)) {
      const v = (a + b * level) * (stat === "crit" && a < 0 ? 1 : mult);
      baseStats[stat] = PERCENT_STATS.has(stat) || stat === "int" ? round1(v) : Math.round(v);
    }
    const allowed = AFFIXES.filter((a) => !a.slots || a.slots.includes(base.slot));
    const affixes = [];
    const count = BALANCE.RARITY_AFFIXES[rarity];
    for (let i = 0; i < count && allowed.length; i++) {
      const idx = Math.floor(r.next() * allowed.length);
      const a = allowed.splice(idx, 1)[0];
      const raw = (a.a + a.b * level) * r.float(0.8, 1.2) * (1 + 0.15 * rarity);
      affixes.push({ id: a.id, kind: a.kind, stat: a.stat, value: a.pct || a.stat === "regen" ? round1(raw) : Math.max(1, Math.round(raw)) });
    }
    return {
      uid: state.nextUid++,
      base: base.id,
      slot: base.slot,
      tier: tierFor(level),
      level,
      rarity,
      baseStats,
      affixes,
      upgrade: 0,
      locked: false
    };
  }
  function itemStats(item) {
    const out = {};
    const up = 1 + BALANCE.UPGRADE_STAT_BONUS * item.upgrade;
    for (const [k, v] of Object.entries(item.baseStats)) out[k] = (out[k] || 0) + (v > 0 ? v * up : v);
    for (const a of item.affixes) out[a.stat] = (out[a.stat] || 0) + a.value;
    for (const k of Object.keys(out)) out[k] = PERCENT_STATS.has(k) || k === "regen" || k === "int" ? round1(out[k]) : Math.round(out[k]);
    return out;
  }
  function itemScore(item) {
    if (!item) return 0;
    return Math.round(Object.entries(itemStats(item)).reduce((s, [k, v]) => s + v * (STAT_WEIGHTS[k] || 1), 0));
  }
  function itemName(item) {
    const baseInfo = t(`base.${item.base}`)[item.tier] || { n: item.base, g: "m" };
    const prefix = item.affixes.find((a) => a.kind === "prefix");
    const suffix = item.affixes.find((a) => a.kind === "suffix");
    let name = baseInfo.n;
    if (prefix) {
      const adj = t(`prefix.${prefix.id}`)[baseInfo.g] || "";
      name = `${adj} ${name.charAt(0).toLowerCase()}${name.slice(1)}`;
    }
    if (suffix) name += ` ${t(`suffix.${suffix.id}`)}`;
    if (item.upgrade > 0) name += ` +${item.upgrade}`;
    return name;
  }
  function rollResources(location2, r = rng) {
    const out = {};
    if (!r.chance(BALANCE.RESOURCE_DROP_CHANCE)) return out;
    for (const [res, chance, min, max] of location2.resources) {
      if (r.chance(chance)) out[res] = (out[res] || 0) + r.int(min, max);
    }
    return out;
  }
  function expectedResources(location2) {
    const out = {};
    for (const [res, chance, min, max] of location2.resources) {
      out[res] = (out[res] || 0) + BALANCE.RESOURCE_DROP_CHANCE * chance * (min + max) / 2;
    }
    return out;
  }
  function rollDrops(state, fight, derived) {
    const loc = getLocation(state.combat.locationId);
    const items = [];
    const mf = derived.magicFind;
    if (fight.boss) {
      for (let i = 0; i < BALANCE.BOSS_ITEM_DROPS; i++) items.push(generateItem(state, fight.level, rollRarity(mf, BALANCE.BOSS_RARITY_SHIFT)));
    } else if (rng.chance(BALANCE.ITEM_DROP_CHANCE)) {
      items.push(generateItem(state, fight.level, rollRarity(mf)));
    }
    const resources = rollResources(loc);
    if (fight.boss) {
      for (const [res, , min, max] of loc.resources) resources[res] = (resources[res] || 0) + max * 2;
      resources.essence = (resources.essence || 0) + 3 + Math.floor(fight.level / 5);
    } else if (rng.chance(BALANCE.ESSENCE_DROP_CHANCE)) {
      resources.essence = (resources.essence || 0) + 1;
    }
    return { items, resources };
  }

  // js/systems/skills.js
  function skillRank(state, id) {
    return state.skills[id] || 0;
  }
  function elementPoints(state) {
    const pts = Object.fromEntries(ELEMENTS.map((e) => [e, 0]));
    for (const s of SKILLS) pts[s.element] += skillRank(state, s.id);
    return pts;
  }
  function activeSynergies(state) {
    const pts = elementPoints(state);
    return SYNERGIES.filter((syn) => syn.elements.every((e) => pts[e] >= syn.points));
  }
  function canLearn(state, id) {
    const s = getSkill(id);
    if (!s) return { ok: false, reason: "unknown" };
    const rank = skillRank(state, id);
    if (rank >= s.maxRank) return { ok: false, reason: "maxRank" };
    if (state.hero.level < s.reqLevel) return { ok: false, reason: "level" };
    if (s.tier > 1) {
      const prev = SKILLS.find((x) => x.element === s.element && x.tier === s.tier - 1);
      if (prev && skillRank(state, prev.id) < 1) return { ok: false, reason: "prev" };
    }
    if (state.hero.skillPoints < 1) return { ok: false, reason: "points" };
    return { ok: true };
  }
  function learnSkill(state, id) {
    if (!canLearn(state, id).ok) return false;
    state.skills[id] = skillRank(state, id) + 1;
    state.hero.skillPoints--;
    bus.emit("hero:changed");
    return true;
  }
  function respecCost(state) {
    return state.hero.level * BALANCE.RESPEC_COST_PER_LEVEL;
  }
  function resetSkills(state) {
    const spent = Object.values(state.skills).reduce((a, b) => a + b, 0);
    const cost = respecCost(state);
    if (spent <= 0 || state.hero.gold < cost) return false;
    state.hero.gold -= cost;
    state.hero.skillPoints += spent;
    state.skills = {};
    bus.emit("hero:changed");
    return true;
  }
  function skillPassives(state) {
    const stats = {};
    const flags = {};
    for (const s of SKILLS) {
      const r = skillRank(state, s.id);
      if (!r || s.type !== "passive") continue;
      for (const [k, vals] of Object.entries(s.passive || {})) stats[k] = (stats[k] || 0) + vals[r - 1];
      for (const [k, vals] of Object.entries(s.flags || {})) flags[k] = vals[r - 1];
    }
    for (const syn of activeSynergies(state)) {
      for (const [k, v] of Object.entries(syn.stats)) stats[k] = (stats[k] || 0) + v;
      if (syn.flag) flags[syn.flag] = true;
    }
    return { stats, flags };
  }

  // js/systems/hero.js
  var STAT_KEYS = ["str", "dex", "int", "end"];
  function zero() {
    return {
      str: 0,
      dex: 0,
      int: 0,
      end: 0,
      hp: 0,
      atk: 0,
      def: 0,
      crit: 0,
      dodge: 0,
      magic: 0,
      fireDmg: 0,
      iceDmg: 0,
      earthDmg: 0,
      goldFind: 0,
      magicFind: 0,
      xpBonus: 0,
      lifesteal: 0,
      regen: 0,
      thorns: 0,
      poisonChance: 0,
      atkPct: 0,
      defPct: 0,
      hpPct: 0,
      magicPct: 0,
      allPct: 0
    };
  }
  function addInto(target, src) {
    for (const [k, v] of Object.entries(src)) if (typeof v === "number") target[k] = (target[k] || 0) + v;
  }
  function getDerived(state) {
    const h = state.hero;
    const add = zero();
    for (const item of Object.values(state.equipment)) if (item) addInto(add, itemStats(item));
    for (const b of state.buffs) addInto(add, b.stats);
    const passive = skillPassives(state);
    addInto(add, passive.stats);
    const all = 1 + add.allPct / 100;
    const str = (h.stats.str + add.str) * all;
    const dex = (h.stats.dex + add.dex) * all;
    const int = (h.stats.int + add.int) * all;
    const end = (h.stats.end + add.end) * all;
    const maxHp = Math.round((50 + end * 10 + h.level * 8 + add.hp) * (1 + add.hpPct / 100));
    return {
      str: Math.round(str),
      dex: Math.round(dex),
      int: Math.round(int),
      end: Math.round(end),
      maxHp,
      atk: Math.round((4 + str * 2 + add.atk) * (1 + add.atkPct / 100)),
      def: Math.round((end * 1.5 + add.def) * (1 + add.defPct / 100)),
      magic: Math.round((int * 2.5 + add.magic) * (1 + add.magicPct / 100)),
      crit: Math.min(BALANCE.CRIT_CAP, 5 + dex * 0.35 + add.crit),
      critMult: 1.5 + dex * 4e-3,
      dodge: Math.min(BALANCE.DODGE_CAP, 3 + dex * 0.25 + add.dodge),
      regen: Math.round((end * 0.2 + add.regen) * 10) / 10,
      lifesteal: Math.min(30, add.lifesteal),
      thorns: Math.min(60, add.thorns),
      poisonChance: Math.min(50, add.poisonChance),
      fireDmg: add.fireDmg,
      iceDmg: add.iceDmg,
      earthDmg: add.earthDmg,
      goldFind: add.goldFind,
      magicFind: add.magicFind,
      xpBonus: add.xpBonus,
      flags: passive.flags
    };
  }
  function ensureHp(state) {
    const max = getDerived(state).maxHp;
    if (state.hero.hp == null || state.hero.hp > max) state.hero.hp = max;
    return max;
  }
  function addXp(state, amount) {
    const h = state.hero;
    let gained = 0;
    if (h.level >= BALANCE.MAX_LEVEL) return 0;
    h.xp += Math.floor(amount);
    while (h.level < BALANCE.MAX_LEVEL && h.xp >= xpForLevel(h.level)) {
      h.xp -= xpForLevel(h.level);
      h.level++;
      gained++;
      h.statPoints += BALANCE.STAT_POINTS_PER_LEVEL;
      if (h.level % BALANCE.SKILL_POINT_EVERY === 0) h.skillPoints++;
    }
    if (h.level >= BALANCE.MAX_LEVEL) h.xp = 0;
    if (gained) {
      h.hp = getDerived(state).maxHp;
      bus.emit("hero:levelup", { level: h.level, gained });
    }
    bus.emit("hero:changed");
    return gained;
  }
  function allocateStat(state, stat, amount = 1) {
    const h = state.hero;
    if (!STAT_KEYS.includes(stat)) return false;
    const n = Math.min(amount, h.statPoints);
    if (n <= 0) return false;
    h.stats[stat] += n;
    h.statPoints -= n;
    bus.emit("hero:changed");
    return true;
  }
  function statResetCost(state) {
    return state.hero.level * 40;
  }
  function resetStats(state) {
    const h = state.hero;
    const cost = statResetCost(state);
    if (h.gold < cost) return false;
    const spent = STAT_KEYS.reduce((s, k) => s + (h.stats[k] - BALANCE.START_STATS[k]), 0);
    if (spent <= 0) return false;
    h.gold -= cost;
    h.stats = { ...BALANCE.START_STATS };
    h.statPoints += spent;
    ensureHp(state);
    bus.emit("hero:changed");
    return true;
  }
  function healHero(state, amount) {
    const max = getDerived(state).maxHp;
    state.hero.hp = Math.min(max, (state.hero.hp ?? max) + amount);
  }
  function applyBuff(state, buff) {
    state.buffs = state.buffs.filter((b) => b.kind !== buff.kind);
    state.buffs.push(buff);
    bus.emit("hero:changed");
  }
  function tickBuffs(state, ms) {
    const before = state.buffs.length;
    for (const b of state.buffs) b.remaining -= ms;
    state.buffs = state.buffs.filter((b) => b.remaining > 0);
    if (state.buffs.length !== before) bus.emit("hero:changed");
  }
  function xpProgress(state) {
    const need = xpForLevel(state.hero.level);
    return { xp: state.hero.xp, need, pct: state.hero.level >= BALANCE.MAX_LEVEL ? 100 : Math.min(100, state.hero.xp / need * 100) };
  }

  // js/data/buildings.js
  var BUILDINGS = [
    { id: "townhall", color: "#b08a4a", baseCost: { gold: 200, wood: 20, stone: 20 } },
    { id: "forge", color: "#8a4b3a", baseCost: { gold: 80, wood: 12, stone: 8 } },
    { id: "lab", color: "#4a7a8a", baseCost: { gold: 100, wood: 10, herbs: 10 } },
    { id: "kitchen", color: "#a8743a", baseCost: { gold: 70, wood: 14, leather: 4 } },
    { id: "warehouse", color: "#6a5a4a", baseCost: { gold: 120, wood: 20, stone: 12 } },
    { id: "market", color: "#4a8a5a", baseCost: { gold: 150, wood: 15, leather: 8 } }
  ];
  var BUILDING_BONUS = {
    townhall: { xpPct: 5, goldPct: 5 },
    // + skuteczność AFK (balance.js)
    forge: { maxUpgrade: 2 },
    lab: { potionPct: 10 },
    kitchen: { buffDurPct: 15 },
    warehouse: { backpack: 6 },
    market: { sellPct: 10 }
  };
  var MARKET_PRICES = { wood: 4, stone: 5, leather: 7, herbs: 6, iron: 12, crystals: 35 };

  // js/systems/settlement.js
  function getBuilding(id) {
    return BUILDINGS.find((b) => b.id === id);
  }
  function getBonuses(state) {
    const s = state.settlement;
    const out = { xpPct: 0, goldPct: 0, maxUpgrade: 0, potionPct: 0, buffDurPct: 0, backpack: 0, sellPct: 0 };
    for (const [id, bonus] of Object.entries(BUILDING_BONUS)) {
      for (const [k, v] of Object.entries(bonus)) out[k] += v * (s[id] || 0);
    }
    out.afkEff = Math.min(1, BALANCE.AFK_BASE_EFFICIENCY + BALANCE.AFK_EFF_PER_TOWNHALL * s.townhall);
    return out;
  }
  function nextCost(state, id) {
    const lvl = state.settlement[id] || 0;
    if (lvl >= BALANCE.BUILDING_MAX_LEVEL) return null;
    return buildingCost(getBuilding(id), lvl + 1);
  }
  function hasCost(state, cost) {
    return Object.entries(cost).every(([k, v]) => (k === "gold" ? state.hero.gold : state.resources[k] || 0) >= v);
  }
  function payCost(state, cost) {
    for (const [k, v] of Object.entries(cost)) {
      if (k === "gold") state.hero.gold -= v;
      else state.resources[k] -= v;
    }
  }
  function refundCost(state, cost) {
    for (const [k, v] of Object.entries(cost)) {
      if (k === "gold") state.hero.gold += v;
      else state.resources[k] = (state.resources[k] || 0) + v;
    }
  }
  function canUpgradeBuilding(state, id) {
    const lvl = state.settlement[id] || 0;
    const cost = nextCost(state, id);
    if (!cost) return { ok: false, reason: "max", cost: null };
    if (id !== "townhall" && lvl + 1 > state.settlement.townhall + 1) return { ok: false, reason: "townhall", cost };
    if (!hasCost(state, cost)) return { ok: false, reason: "cost", cost };
    return { ok: true, cost };
  }
  function upgradeBuilding(state, id) {
    const check = canUpgradeBuilding(state, id);
    if (!check.ok) return false;
    payCost(state, check.cost);
    state.settlement[id] = (state.settlement[id] || 0) + 1;
    bus.emit("settlement:changed", id);
    bus.emit("hero:changed");
    bus.emit("inventory:changed");
    return true;
  }
  function marketPrice(state, res) {
    const lvl = state.settlement.market;
    return Math.max(1, Math.round(MARKET_PRICES[res] * (1 - 0.05 * Math.max(0, lvl - 1))));
  }
  function marketBuy(state, res, amount) {
    if (state.settlement.market < 1 || !MARKET_PRICES[res]) return false;
    const total = marketPrice(state, res) * amount;
    if (state.hero.gold < total) return false;
    state.hero.gold -= total;
    state.resources[res] = (state.resources[res] || 0) + amount;
    bus.emit("settlement:changed", "market");
    return true;
  }

  // js/systems/inventory.js
  function capacity(state) {
    return BALANCE.BASE_BACKPACK + getBonuses(state).backpack;
  }
  function freeSlots(state) {
    return Math.max(0, capacity(state) - state.inventory.length);
  }
  var changed = () => {
    bus.emit("inventory:changed");
    bus.emit("hero:changed");
  };
  function addItem(state, item) {
    if (state.inventory.length >= capacity(state)) return false;
    state.inventory.push(item);
    return true;
  }
  function findItem(state, uid) {
    return state.inventory.find((i) => i.uid === uid);
  }
  function slotsFor(item) {
    return item.slot === "ring" ? ["ring1", "ring2"] : [item.slot];
  }
  function equip(state, uid, targetSlot = null) {
    const item = findItem(state, uid);
    if (!item) return false;
    const slots = slotsFor(item);
    const slot = targetSlot && slots.includes(targetSlot) ? targetSlot : slots.find((s) => !state.equipment[s]) || slots[0];
    state.inventory = state.inventory.filter((i) => i.uid !== uid);
    const prev = state.equipment[slot];
    state.equipment[slot] = item;
    if (prev) state.inventory.push(prev);
    clampHp(state);
    changed();
    return true;
  }
  function unequip(state, slot) {
    const item = state.equipment[slot];
    if (!item || state.inventory.length >= capacity(state)) return false;
    state.equipment[slot] = null;
    state.inventory.push(item);
    clampHp(state);
    changed();
    return true;
  }
  function clampHp(state) {
    const max = getDerived(state).maxHp;
    if (state.hero.hp > max) state.hero.hp = max;
  }
  function itemSellPrice(state, item) {
    return sellPrice(item, getBonuses(state).sellPct);
  }
  function autoSellValue(state, item) {
    return itemSellPrice(state, item);
  }
  function sellItem(state, uid) {
    const item = findItem(state, uid);
    if (!item || item.locked) return 0;
    const g = itemSellPrice(state, item);
    state.inventory = state.inventory.filter((i) => i.uid !== uid);
    state.hero.gold += g;
    state.stats.goldEarned += g;
    changed();
    return g;
  }
  function sellAllUpTo(state, maxRarity) {
    let total = 0, count = 0;
    for (const item of [...state.inventory]) {
      if (!item.locked && item.rarity <= maxRarity) {
        total += itemSellPrice(state, item);
        count++;
      }
    }
    state.inventory = state.inventory.filter((i) => i.locked || i.rarity > maxRarity);
    state.hero.gold += total;
    state.stats.goldEarned += total;
    changed();
    return { total, count };
  }
  function salvageValue(item) {
    return { essence: BALANCE.RARITY_ESSENCE[item.rarity] + item.upgrade, iron: item.level >= 11 ? 1 + Math.floor(item.level / 15) : 0 };
  }
  function salvageItem(state, uid) {
    const item = findItem(state, uid);
    if (!item || item.locked) return null;
    const v = salvageValue(item);
    state.inventory = state.inventory.filter((i) => i.uid !== uid);
    state.resources.essence += v.essence;
    state.resources.iron += v.iron;
    changed();
    return v;
  }
  function maxUpgrade(state) {
    return getBonuses(state).maxUpgrade;
  }
  function locateItem(state, uid) {
    const inv = findItem(state, uid);
    if (inv) return inv;
    return Object.values(state.equipment).find((i) => i && i.uid === uid) || null;
  }
  function canUpgrade(state, item) {
    const cost = upgradeCost(item);
    if (maxUpgrade(state) <= 0) return { ok: false, reason: "noForge", cost };
    if (item.upgrade >= maxUpgrade(state)) return { ok: false, reason: "maxUpgrade", cost };
    if (state.hero.gold < cost.gold) return { ok: false, reason: "noGold", cost };
    if (state.resources.essence < cost.essence) return { ok: false, reason: "noEssence", cost };
    return { ok: true, cost };
  }
  function upgradeItem(state, uid) {
    const item = locateItem(state, uid);
    if (!item) return false;
    const check = canUpgrade(state, item);
    if (!check.ok) return false;
    state.hero.gold -= check.cost.gold;
    state.resources.essence -= check.cost.essence;
    item.upgrade++;
    changed();
    return true;
  }
  function toggleLock(state, uid) {
    const item = findItem(state, uid);
    if (!item) return false;
    item.locked = !item.locked;
    bus.emit("inventory:changed");
    return true;
  }
  function bestPotion(state) {
    return ["hp_large", "hp_medium", "hp_small"].find((id) => (state.consumables[id] || 0) > 0) || null;
  }
  function useConsumable(state, id) {
    const def = CONSUMABLES[id];
    if (!def || !(state.consumables[id] > 0)) return false;
    const b = getBonuses(state);
    state.consumables[id]--;
    if (def.heal) {
      const max = getDerived(state).maxHp;
      healHero(state, max * def.heal / 100 * (1 + b.potionPct / 100));
    } else {
      applyBuff(state, { id, kind: def.kind, stats: { ...def.stats }, remaining: def.duration * (1 + b.buffDurPct / 100) });
    }
    bus.emit("inventory:changed");
    bus.emit("hero:changed");
    return true;
  }

  // js/core/audio.js
  var ctx = null;
  var volume = 0.5;
  var SOUNDS = {
    hit: { freq: 220, type: "square", dur: 0.05, gain: 0.08 },
    crit: { freq: 440, type: "sawtooth", dur: 0.09, gain: 0.1 },
    loot: { freq: 660, type: "triangle", dur: 0.12, gain: 0.12, slide: 990 },
    level: { freq: 523, type: "triangle", dur: 0.35, gain: 0.15, slide: 1046 },
    click: { freq: 800, type: "sine", dur: 0.03, gain: 0.06 },
    defeat: { freq: 300, type: "sawtooth", dur: 0.4, gain: 0.12, slide: 90 }
  };
  function setVolume(v) {
    volume = Math.max(0, Math.min(1, v));
  }
  function playSound(name) {
    if (volume <= 0) return;
    const s = SOUNDS[name];
    if (!s) return;
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === "suspended") ctx.resume();
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = s.type;
      osc.frequency.setValueAtTime(s.freq, ctx.currentTime);
      if (s.slide) osc.frequency.exponentialRampToValueAtTime(s.slide, ctx.currentTime + s.dur);
      g.gain.setValueAtTime(s.gain * volume, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(1e-4, ctx.currentTime + s.dur);
      osc.connect(g).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + s.dur + 0.02);
    } catch (e) {
    }
  }

  // js/systems/combat.js
  var DOT = ["burn", "poison", "bleed"];
  var LOG_MAX = 40;
  function log(textKey, params, cls = "") {
    game.runtime.log.push({ text: t(textKey, params), cls });
    if (game.runtime.log.length > LOG_MAX) game.runtime.log.shift();
    bus.emit("combat:log");
  }
  var enemyName = (f) => t(`enemy.${f.enemyId}`);
  var fmt = (n) => Math.round(n).toLocaleString("pl-PL");
  function spawnEnemy(state, boss = false) {
    const loc = getLocation(state.combat.locationId);
    const id = boss ? loc.boss : rng.pick(loc.enemies);
    const def = ENEMIES[id];
    const level = boss ? loc.levels[1] : rng.int(loc.levels[0], loc.levels[1]);
    const m = boss ? { hp: def.m.hp * BALANCE.BOSS_MULT.hp, atk: def.m.atk * BALANCE.BOSS_MULT.atk, def: def.m.def * BALANCE.BOSS_MULT.def } : def.m;
    const s = enemyStats(level, m);
    state.combat.fight = {
      enemyId: id,
      boss,
      level,
      hp: s.hp,
      maxHp: s.hp,
      atk: s.atk,
      def: s.def,
      effects: [],
      heroEffects: [],
      cooldowns: {},
      round: 0
    };
    state.combat.phase = "fighting";
    state.combat.timer = BALANCE.ROUND_MS;
    log(boss ? "log.bossAppears" : "log.enemyAppears", { name: t(`enemy.${id}`), level });
    bus.emit("combat:spawn");
  }
  function changeLocation(state, id) {
    const idx = locationIndex(id);
    if (idx >= state.combat.unlocked) return false;
    state.combat.locationId = id;
    state.combat.killsSinceBoss = 0;
    state.combat.bossReady = false;
    state.combat.autoBoss = true;
    state.combat.fight = null;
    state.combat.phase = "pause";
    state.combat.timer = 300;
    log("log.travel", { name: t(`location.${id}.name`) }, "log--info");
    bus.emit("combat:location");
    return true;
  }
  function challengeBoss(state) {
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
  var hasEffect = (list, type) => list.some((e) => e.type === type && e.turns > 0);
  function endRoundEffects(list) {
    for (const e of list) {
      if (e.fresh) {
        e.fresh = false;
        continue;
      }
      e.turns--;
    }
    return list.filter((e) => e.turns > 0);
  }
  function elementBonus(d, element) {
    return 1 + ((element === "fire" ? d.fireDmg : element === "ice" ? d.iceDmg : d.earthDmg) || 0) / 100;
  }
  function damageEnemy(f, amount) {
    f.hp = Math.max(0, f.hp - amount);
    return amount;
  }
  function heroLifesteal(state, d, dmg) {
    if (d.lifesteal > 0) state.hero.hp = Math.min(d.maxHp, state.hero.hp + dmg * d.lifesteal / 100);
  }
  function enemyDef(f, d) {
    return f.def * (d.flags.magma && hasEffect(f.effects, "burn") ? 0.85 : 1);
  }
  function castSkill(state, f, d, skill, rank) {
    const r = rank - 1;
    const ctrlBonus = d.flags.permafrost ? 1 : 0;
    let raw = d.magic * (skill.magic?.[r] || 0) + d.atk * (skill.atk?.[r] || 0) + d.def * (skill.def?.[r] || 0);
    raw *= elementBonus(d, skill.element) * rng.float(1 - BALANCE.DMG_VARIANCE, 1 + BALANCE.DMG_VARIANCE);
    const crit = rng.chance(d.crit / 100);
    if (crit) raw *= d.critMult;
    const dmg = Math.round(applyDefense(raw, enemyDef(f, d) * 0.5, state.hero.level));
    damageEnemy(f, dmg);
    heroLifesteal(state, d, dmg);
    log(crit ? "log.skillCrit" : "log.skill", { skill: t(`skill.${skill.id}.name`), dmg: fmt(dmg) }, `log--${skill.element}`);
    for (const eff of skill.effects || []) {
      if (!rng.chance(eff.chance?.[r] ?? 1)) continue;
      const isCtrl = !DOT.includes(eff.type);
      const power = DOT.includes(eff.type) ? Math.max(1, Math.round(d.magic * (eff.power?.[r] || 0.3) * elementBonus(d, skill.element))) : eff.power?.[r] || 0;
      addEffect(f.effects, { type: eff.type, power, turns: eff.turns + (isCtrl && eff.type !== "chill" ? ctrlBonus : 0) });
      log(`log.effect.${eff.type}`, { name: enemyName(f) }, "log--status");
    }
    playSound(crit ? "crit" : "hit");
  }
  function heroAct(state, f, d) {
    const actives = SKILLS.filter((s) => s.type === "active" && skillRank(state, s.id) > 0).sort((a, b) => b.tier - a.tier);
    for (const s of actives) {
      if ((f.cooldowns[s.id] || 0) <= 0) {
        castSkill(state, f, d, s, skillRank(state, s.id));
        f.cooldowns[s.id] = s.cd;
        return;
      }
    }
    if (rng.chance(BALANCE.ENEMY_DODGE / 100)) {
      log("log.enemyDodge", { name: enemyName(f) }, "log--miss");
      return;
    }
    const crit = rng.chance(d.crit / 100);
    let raw = d.atk * rng.float(1 - BALANCE.DMG_VARIANCE, 1 + BALANCE.DMG_VARIANCE);
    if (crit) raw *= d.critMult;
    const dmg = Math.round(applyDefense(raw, enemyDef(f, d), state.hero.level));
    damageEnemy(f, dmg);
    heroLifesteal(state, d, dmg);
    log(crit ? "log.heroCrit" : "log.heroHit", { name: enemyName(f), dmg: fmt(dmg) }, crit ? "log--crit" : "");
    if (crit && d.flags.critBurn) {
      addEffect(f.effects, { type: "burn", power: Math.max(1, Math.round(d.magic * d.flags.critBurn)), turns: 2 });
      log("log.effect.burn", { name: enemyName(f) }, "log--status");
    }
    if (d.poisonChance > 0 && rng.chance(d.poisonChance / 100)) {
      addEffect(f.effects, { type: "poison", power: Math.max(1, Math.round(d.atk * 0.15)), turns: 3 });
      log("log.effect.poison", { name: enemyName(f) }, "log--status");
    }
    playSound(crit ? "crit" : "hit");
  }
  function enemyAct(state, f, d) {
    if (hasEffect(f.effects, "stun") || hasEffect(f.effects, "freeze")) {
      log("log.enemyStunned", { name: enemyName(f) }, "log--status");
      return;
    }
    if (rng.chance(d.dodge / 100)) {
      log("log.heroDodge", { name: enemyName(f) }, "log--miss");
      return;
    }
    const chill = f.effects.find((e) => e.type === "chill");
    let raw = f.atk * rng.float(1 - BALANCE.DMG_VARIANCE, 1 + BALANCE.DMG_VARIANCE) * (chill ? 1 - chill.power : 1);
    const dmg = Math.round(applyDefense(raw, d.def, f.level));
    state.hero.hp = Math.max(0, state.hero.hp - dmg);
    log("log.enemyHit", { name: enemyName(f), dmg: fmt(dmg) }, "log--enemy");
    if (d.thorns > 0) {
      const back = Math.round(dmg * d.thorns / 100);
      if (back > 0) {
        damageEnemy(f, back);
        log("log.thorns", { dmg: fmt(back) }, "log--earth");
      }
    }
    const eff = ENEMIES[f.enemyId].effect;
    if (eff && rng.chance(eff.chance)) {
      addEffect(f.heroEffects, { type: eff.type, power: Math.max(1, Math.round(f.atk * eff.power)), turns: eff.turns }, true);
      log(`log.heroEffect.${eff.type}`, {}, "log--status");
    }
  }
  function tickDots(list, apply) {
    for (const e of list) if (DOT.includes(e.type) && !e.fresh) apply(e);
  }
  function tryAutoPotion(state, d) {
    if (!state.settings.autoPotion) return;
    if (state.hero.hp / d.maxHp * 100 > state.settings.potionThreshold) return;
    const id = bestPotion(state);
    if (id) {
      useConsumable(state, id);
      log("log.potion", { name: t(`consumable.${id}.name`) }, "log--heal");
    }
  }
  function round(state) {
    const f = state.combat.fight;
    const d = getDerived(state);
    f.round++;
    for (const k of Object.keys(f.cooldowns)) f.cooldowns[k]--;
    tickDots(f.effects, (e) => {
      damageEnemy(f, e.power);
      log(`log.dot.${e.type}`, { name: enemyName(f), dmg: fmt(e.power) }, "log--status");
    });
    if (f.hp <= 0) return victory(state, f, d);
    tickDots(f.heroEffects, (e) => {
      state.hero.hp = Math.max(0, state.hero.hp - e.power);
      log(`log.heroDot.${e.type}`, { dmg: fmt(e.power) }, "log--enemy");
    });
    if (state.hero.hp <= 0) return defeat(state, f);
    state.hero.hp = Math.min(d.maxHp, state.hero.hp + d.regen);
    tryAutoPotion(state, d);
    if (hasEffect(f.heroEffects, "stun")) log("log.heroStunned", {}, "log--status");
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
    log("log.victory", { name: enemyName(f), xp: fmt(xp), gold: fmt(gold) }, "log--victory");
    const drops = rollDrops(state, f, d);
    for (const item of drops.items) {
      state.stats.itemsFound++;
      if (addItem(state, item)) {
        log("log.loot", { name: itemName(item), rarity: t(`rarity.${item.rarity}`) }, `log--rarity-${item.rarity}`);
        bus.emit("loot:item", item);
      } else {
        const g = autoSellValue(state, item);
        state.hero.gold += g;
        log("log.lootSold", { gold: fmt(g) }, "log--info");
      }
    }
    for (const [res, n] of Object.entries(drops.resources)) {
      state.resources[res] = (state.resources[res] || 0) + n;
      log("log.resource", { n, name: t(`resource.${res}`) }, "log--resource");
    }
    if (drops.items.length) playSound("loot");
    bus.emit("inventory:changed");
    if (f.boss) {
      state.stats.bossKills++;
      c.killsSinceBoss = 0;
      c.bossReady = false;
      c.bossesDefeated[c.locationId] = (c.bossesDefeated[c.locationId] || 0) + 1;
      const idx = locationIndex(c.locationId);
      if (idx + 1 < LOCATIONS.length && c.unlocked <= idx + 1) {
        c.unlocked = idx + 2;
        const next = LOCATIONS[idx + 1];
        log("log.unlocked", { name: t(`location.${next.id}.name`) }, "log--victory");
        bus.emit("combat:unlocked", next.id);
        if (state.settings.autoAdvance) changeLocation(state, next.id);
      } else if (idx + 1 >= LOCATIONS.length && c.bossesDefeated[c.locationId] === 1) {
        bus.emit("game:completed");
      }
    } else {
      c.killsSinceBoss = Math.min(BALANCE.KILLS_PER_BOSS, c.killsSinceBoss + 1);
      if (c.killsSinceBoss >= BALANCE.KILLS_PER_BOSS && !c.bossReady) {
        c.bossReady = true;
        log("log.bossReady", {}, "log--info");
      }
    }
    addXp(state, xp);
    if (c.fight === f) c.fight = null;
    if (c.phase !== "pause" || c.timer < BALANCE.PAUSE_MS) {
      c.phase = "pause";
      c.timer = BALANCE.PAUSE_MS;
    }
    const max = getDerived(state).maxHp;
    state.hero.hp = Math.min(max, state.hero.hp + max * BALANCE.PAUSE_HEAL_PCT);
    bus.emit("combat:end", { win: true });
  }
  function defeat(state, f) {
    const c = state.combat;
    state.stats.deaths++;
    if (f.boss) c.autoBoss = false;
    c.fight = null;
    c.phase = "dead";
    c.timer = BALANCE.RESPAWN_MS;
    log(f.boss ? "log.defeatBoss" : "log.defeat", { name: enemyName(f) }, "log--enemy");
    playSound("defeat");
    bus.emit("combat:end", { win: false });
  }
  function updateCombat(state, dt) {
    const c = state.combat;
    ensureHp(state);
    c.timer -= dt;
    let guard = 0;
    while (c.timer <= 0 && guard++ < 30) {
      if (c.phase === "fighting" && c.fight) {
        c.timer += BALANCE.ROUND_MS;
        round(state);
      } else if (c.phase === "dead") {
        state.hero.hp = getDerived(state).maxHp;
        log("log.respawn", {}, "log--heal");
        spawnEnemy(state, false);
      } else {
        spawnEnemy(state, c.bossReady && c.autoBoss);
      }
    }
  }
  function estimateFight(state) {
    const loc = getLocation(state.combat.locationId);
    const d = getDerived(state);
    const lvl = (loc.levels[0] + loc.levels[1]) / 2;
    const avgM = { hp: 0, atk: 0, def: 0 };
    for (const id of loc.enemies) for (const k of Object.keys(avgM)) avgM[k] += ENEMIES[id].m[k] / loc.enemies.length;
    const es = enemyStats(lvl, avgM);
    let dpr = applyDefense(d.atk, es.def, state.hero.level) * (1 + d.crit / 100 * (d.critMult - 1)) * (1 - BALANCE.ENEMY_DODGE / 100);
    for (const s of SKILLS) {
      const r = skillRank(state, s.id);
      if (s.type === "active" && r > 0) dpr += (d.magic * (s.magic?.[r - 1] || 0) + d.atk * (s.atk?.[r - 1] || 0)) / s.cd * 0.7;
    }
    const rounds = Math.max(1, es.hp / Math.max(1, dpr));
    const taken = Math.max(0, applyDefense(es.atk, d.def, lvl) * (1 - d.dodge / 100) - d.regen) * rounds;
    const winRate = taken < d.maxHp ? 1 : Math.max(0.05, Math.min(1, d.maxHp / taken));
    return {
      location: loc,
      secondsPerKill: rounds * BALANCE.ROUND_MS / 1e3 + BALANCE.PAUSE_MS / 1e3,
      winRate,
      avgXp: enemyXp(Math.round(lvl)),
      avgGold: enemyGold(Math.round(lvl))
    };
  }

  // js/data/recipes.js
  var PROFESSIONS = {
    smithing: { building: "forge" },
    alchemy: { building: "lab" },
    cooking: { building: "kitchen" }
  };
  var RECIPES = [
    // Kowalstwo
    {
      id: "smith_weapon",
      profession: "smithing",
      level: 1,
      time: 30,
      xp: 10,
      cost: { gold: 60, iron: 4, wood: 4 },
      result: { type: "item", slots: ["weapon"], minRarity: 1 }
    },
    {
      id: "smith_armor",
      profession: "smithing",
      level: 1,
      time: 30,
      xp: 10,
      cost: { gold: 50, iron: 3, leather: 4 },
      result: { type: "item", slots: ["head", "chest", "legs", "boots"], minRarity: 1 }
    },
    {
      id: "smith_offhand",
      profession: "smithing",
      level: 2,
      time: 45,
      xp: 14,
      cost: { gold: 90, iron: 5, wood: 6 },
      result: { type: "item", slots: ["offhand"], minRarity: 1 }
    },
    {
      id: "smith_jewel",
      profession: "smithing",
      level: 3,
      time: 90,
      xp: 25,
      cost: { gold: 250, iron: 4, crystals: 4 },
      result: { type: "item", slots: ["amulet", "ring"], minRarity: 2 }
    },
    {
      id: "smith_essence",
      profession: "smithing",
      level: 2,
      time: 20,
      xp: 6,
      cost: { gold: 30, iron: 3, stone: 5 },
      result: { type: "resource", id: "essence", count: 3 }
    },
    {
      id: "smith_masterwork",
      profession: "smithing",
      level: 5,
      time: 240,
      xp: 60,
      cost: { gold: 1500, iron: 20, crystals: 12, essence: 15 },
      result: { type: "item", slots: null, minRarity: 3 }
    },
    // Alchemia
    {
      id: "alch_hp_small",
      profession: "alchemy",
      level: 1,
      time: 15,
      xp: 5,
      cost: { gold: 10, herbs: 3 },
      result: { type: "consumable", id: "hp_small", count: 2 }
    },
    {
      id: "alch_hp_medium",
      profession: "alchemy",
      level: 2,
      time: 30,
      xp: 10,
      cost: { gold: 40, herbs: 5, crystals: 1 },
      result: { type: "consumable", id: "hp_medium", count: 2 }
    },
    {
      id: "alch_elixir_str",
      profession: "alchemy",
      level: 2,
      time: 60,
      xp: 15,
      cost: { gold: 80, herbs: 6, iron: 2 },
      result: { type: "consumable", id: "elixir_str", count: 1 }
    },
    {
      id: "alch_elixir_stone",
      profession: "alchemy",
      level: 3,
      time: 60,
      xp: 15,
      cost: { gold: 90, herbs: 6, stone: 8 },
      result: { type: "consumable", id: "elixir_stone", count: 1 }
    },
    {
      id: "alch_hp_large",
      profession: "alchemy",
      level: 4,
      time: 60,
      xp: 20,
      cost: { gold: 150, herbs: 10, crystals: 3 },
      result: { type: "consumable", id: "hp_large", count: 2 }
    },
    {
      id: "alch_elixir_mind",
      profession: "alchemy",
      level: 4,
      time: 90,
      xp: 20,
      cost: { gold: 200, herbs: 8, crystals: 4 },
      result: { type: "consumable", id: "elixir_mind", count: 1 }
    },
    {
      id: "alch_elixir_fortune",
      profession: "alchemy",
      level: 5,
      time: 120,
      xp: 30,
      cost: { gold: 400, herbs: 12, crystals: 6, essence: 5 },
      result: { type: "consumable", id: "elixir_fortune", count: 1 }
    },
    // Kuchnia
    {
      id: "cook_stew",
      profession: "cooking",
      level: 1,
      time: 20,
      xp: 6,
      cost: { gold: 20, leather: 2, herbs: 2 },
      result: { type: "consumable", id: "food_stew", count: 1 }
    },
    {
      id: "cook_fish",
      profession: "cooking",
      level: 2,
      time: 40,
      xp: 10,
      cost: { gold: 50, herbs: 4, wood: 4 },
      result: { type: "consumable", id: "food_fish", count: 1 }
    },
    {
      id: "cook_pie",
      profession: "cooking",
      level: 3,
      time: 60,
      xp: 15,
      cost: { gold: 120, herbs: 6, leather: 4, wood: 4 },
      result: { type: "consumable", id: "food_pie", count: 1 }
    },
    {
      id: "cook_feast",
      profession: "cooking",
      level: 5,
      time: 180,
      xp: 40,
      cost: { gold: 600, herbs: 15, leather: 10, crystals: 3 },
      result: { type: "consumable", id: "food_feast", count: 1 }
    }
  ];
  function getRecipe(id) {
    return RECIPES.find((r) => r.id === id);
  }

  // js/systems/crafting.js
  function recipesFor(profession) {
    return RECIPES.filter((r) => r.profession === profession);
  }
  function craftDuration(state, recipe) {
    const prof = state.crafting.professions[recipe.profession];
    return Math.round(recipe.time * 1e3 * (1 - BALANCE.PROFESSION_TIME_REDUCTION * (prof.level - 1)));
  }
  function canCraft(state, recipeId) {
    const r = getRecipe(recipeId);
    if (!r) return { ok: false, reason: "unknown" };
    const building = PROFESSIONS[r.profession].building;
    if ((state.settlement[building] || 0) < r.level) return { ok: false, reason: "building" };
    if (state.crafting.queue.length >= BALANCE.CRAFT_QUEUE_MAX) return { ok: false, reason: "queue" };
    if (!hasCost(state, r.cost)) return { ok: false, reason: "cost" };
    return { ok: true };
  }
  function enqueue(state, recipeId) {
    if (!canCraft(state, recipeId).ok) return false;
    const r = getRecipe(recipeId);
    payCost(state, r.cost);
    const total = craftDuration(state, r);
    state.crafting.queue.push({ recipeId, remaining: total, total });
    bus.emit("crafting:changed");
    return true;
  }
  function cancelCraft(state, index) {
    const job = state.crafting.queue[index];
    if (!job) return false;
    refundCost(state, getRecipe(job.recipeId).cost);
    state.crafting.queue.splice(index, 1);
    bus.emit("crafting:changed");
    return true;
  }
  function produce(state, recipe) {
    const res = recipe.result;
    const out = { recipeId: recipe.id };
    if (res.type === "item") {
      const slot = res.slots ? res.slots[Math.floor(Math.random() * res.slots.length)] : null;
      const rarity = Math.max(res.minRarity, rollRarity(getDerived(state).magicFind));
      const item = generateItem(state, Math.max(1, state.hero.level), rarity, slot);
      item.crafted = true;
      if (addItem(state, item)) out.item = item;
      else {
        const g = autoSellValue(state, item);
        state.hero.gold += g;
        out.soldFor = g;
      }
    } else if (res.type === "consumable") {
      state.consumables[res.id] = (state.consumables[res.id] || 0) + res.count;
      out.consumable = res.id;
      out.count = res.count;
    } else if (res.type === "resource") {
      state.resources[res.id] = (state.resources[res.id] || 0) + res.count;
      out.resource = res.id;
      out.count = res.count;
    }
    const prof = state.crafting.professions[recipe.profession];
    if (prof.level < BALANCE.PROFESSION_MAX_LEVEL) {
      prof.xp += recipe.xp;
      while (prof.level < BALANCE.PROFESSION_MAX_LEVEL && prof.xp >= professionXpFor(prof.level)) {
        prof.xp -= professionXpFor(prof.level);
        prof.level++;
        bus.emit("crafting:profLevel", { profession: recipe.profession, level: prof.level });
      }
    }
    state.stats.crafted++;
    return out;
  }
  function advanceCrafting(state, ms) {
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
      bus.emit("crafting:done", done);
      bus.emit("crafting:changed");
      bus.emit("inventory:changed");
    }
    return done;
  }

  // js/core/timeManager.js
  function checkClock(state, now = Date.now()) {
    const ref = Math.max(state.lastTimestamp || now, state.maxSeenTimestamp || 0);
    if (now < ref) return { elapsed: 0, manipulated: true };
    return { elapsed: now - ref, manipulated: false };
  }
  function applyOfflineProgress(state, rawElapsed, now = Date.now()) {
    const elapsed = Math.min(rawElapsed, BALANCE.MAX_OFFLINE_MS);
    const report = {
      elapsed,
      capped: rawElapsed > BALANCE.MAX_OFFLINE_MS,
      kills: 0,
      xp: 0,
      gold: 0,
      levels: 0,
      resources: {},
      items: [],
      itemsConverted: 0,
      essence: 0,
      crafted: [],
      bossReady: false
    };
    if (elapsed <= 0) return report;
    report.crafted = advanceCrafting(state, elapsed);
    tickBuffs(state, elapsed);
    const bonuses = getBonuses(state);
    const efficiency = Math.min(1, BALANCE.AFK_BASE_EFFICIENCY + BALANCE.AFK_EFF_PER_TOWNHALL * state.settlement.townhall);
    const est = estimateFight(state);
    const r = new Rng((state.seed ^ Math.floor((state.lastTimestamp || now) / 1e3)) >>> 0);
    const expectedKills = elapsed / 1e3 / est.secondsPerKill * est.winRate * efficiency;
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
    const expectedItems = kills * BALANCE.ITEM_DROP_CHANCE;
    const itemCount = Math.floor(expectedItems);
    const toGenerate = Math.min(itemCount, BALANCE.AFK_MAX_ITEMS, freeSlots(state));
    const mf = d.magicFind;
    for (let i = 0; i < toGenerate; i++) {
      const lvl = r.int(est.location.levels[0], est.location.levels[1]);
      const item = generateItem(state, lvl, rollRarity(mf, 0, r), null, r);
      if (addItem(state, item)) {
        report.items.push(item);
        state.stats.itemsFound++;
      }
    }
    const leftover = itemCount - report.items.length;
    if (leftover > 0) {
      const ess = Math.ceil(leftover * 1.5);
      state.resources.essence += ess;
      report.itemsConverted = leftover;
      report.essence += ess;
    }
    state.combat.killsSinceBoss = Math.min(BALANCE.KILLS_PER_BOSS, state.combat.killsSinceBoss + kills);
    if (state.combat.killsSinceBoss >= BALANCE.KILLS_PER_BOSS) {
      state.combat.bossReady = true;
      report.bossReady = true;
    }
    return report;
  }

  // js/ui/renderer.js
  var esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function fmt2(n) {
    n = Math.floor(n);
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace(".", ",") + " mln";
    if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(1).replace(".", ",") + " tys.";
    return n.toLocaleString("pl-PL");
  }
  function fmtTime(ms) {
    const s = Math.max(0, Math.ceil(ms / 1e3));
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    if (h) return t("time.hm", { h, m });
    if (m) return t("time.ms", { m, s: sec });
    return t("time.s", { s: sec });
  }
  function fmtStat(key, v) {
    const sign = v > 0 ? "+" : "";
    const num = Number.isInteger(v) ? v : v.toFixed(1).replace(".", ",");
    return `${sign}${num}${PERCENT_STATS.has(key) ? "%" : ""}`;
  }
  function bar(pct, cls = "", id = "", label = "") {
    return `<div class="bar ${cls}"><div class="bar__fill" ${id ? `id="${id}"` : ""} style="width:${Math.max(0, Math.min(100, pct))}%"></div>${label ? `<span class="bar__label" ${id ? `id="${id}-label"` : ""}>${label}</span>` : ""}</div>`;
  }
  function itemIcon(item, extra = "") {
    return `<div class="item-icon item-icon--${item.slot} rarity-${item.rarity} ${extra}" data-item-base="${item.base}" data-slot="${item.slot}" data-rarity="${item.rarity}">
    <span class="item-icon__glyph"></span>${item.upgrade ? `<span class="item-icon__up">+${item.upgrade}</span>` : ""}${item.locked ? '<span class="item-icon__lock"></span>' : ""}</div>`;
  }
  function resourceIcon(res) {
    return `<span class="res-icon res-icon--${res}" data-resource="${res}"></span>`;
  }
  function costHtml(state, cost) {
    return Object.entries(cost).map(([k, v]) => {
      const have = k === "gold" ? state.hero.gold : state.resources[k] || 0;
      const icon = k === "gold" ? '<span class="icon icon--gold" data-icon="gold"></span>' : resourceIcon(k);
      return `<span class="cost ${have >= v ? "" : "cost--missing"}" title="${esc(k === "gold" ? t("common.gold") : t(`resource.${k}`))}">${icon}${fmt2(v)}</span>`;
    }).join("");
  }
  function itemStatsHtml(item, compareTo = null) {
    const s = itemStats(item);
    const c = compareTo ? itemStats(compareTo) : null;
    const keys = /* @__PURE__ */ new Set([...Object.keys(s), ...c ? Object.keys(c) : []]);
    return [...keys].map((k) => {
      const v = s[k] || 0;
      let diff = "";
      if (c) {
        const d = Math.round((v - (c[k] || 0)) * 10) / 10;
        if (d !== 0) diff = ` <small class="${d > 0 ? "diff--up" : "diff--down"}">(${fmtStat(k, d)})</small>`;
      }
      return `<div class="stat-line"><span>${esc(t(`stat.${k}`))}</span><b>${fmtStat(k, v)}${diff}</b></div>`;
    }).join("");
  }
  function itemNameHtml(item) {
    return `<span class="rarity-text-${item.rarity}">${esc(itemName(item))}</span>`;
  }
  var $ = (sel, root2 = document) => root2.querySelector(sel);

  // js/ui/navigation.js
  var TABS = ["hero", "combat", "backpack", "crafting", "settlement"];
  var actions = {};
  var changes = {};
  var current2 = "combat";
  var onSwitch = () => {
  };
  function registerActions(obj) {
    Object.assign(actions, obj);
  }
  function registerChanges(obj) {
    Object.assign(changes, obj);
  }
  function currentTab() {
    return current2;
  }
  function initNavigation(switchHandler) {
    onSwitch = switchHandler;
    $("#bottom-nav").innerHTML = TABS.map((id) => `
    <button class="nav-btn" type="button" data-action="nav" data-tab="${id}">
      <span class="nav-btn__icon icon icon--${id}" data-icon="${id}"></span>
      <span class="nav-btn__label">${t(`nav.${id}`)}</span>
    </button>`).join("");
    document.addEventListener("click", (e) => {
      const el2 = e.target.closest("[data-action]");
      if (!el2 || el2.disabled) return;
      const fn = actions[el2.dataset.action];
      if (fn) {
        playSound("click");
        fn(el2.dataset, el2, e);
      }
    });
    document.addEventListener("change", (e) => {
      const el2 = e.target.closest("[data-change]");
      if (el2 && changes[el2.dataset.change]) changes[el2.dataset.change](el2);
    });
    document.addEventListener("input", (e) => {
      const el2 = e.target.closest("[data-input]");
      if (el2 && changes[el2.dataset.input]) changes[el2.dataset.input](el2);
    });
    registerActions({ nav: (d) => switchTab(d.tab) });
  }
  function switchTab(id) {
    if (!TABS.includes(id)) return;
    current2 = id;
    document.querySelectorAll(".screen").forEach((s) => s.classList.toggle("screen--active", s.dataset.screen === id));
    document.querySelectorAll(".nav-btn").forEach((b) => b.classList.toggle("nav-btn--active", b.dataset.tab === id));
    onSwitch(id);
  }
  function updateHeader() {
    const s = game.state;
    const p = xpProgress(s);
    $("#hdr-level").textContent = t("common.levelShort", { n: s.hero.level });
    $("#hdr-xp").style.width = `${p.pct}%`;
    $("#hdr-gold").textContent = fmt2(s.hero.gold);
    const badge = s.hero.statPoints > 0 || s.hero.skillPoints > 0;
    document.querySelector('.nav-btn[data-tab="hero"]')?.classList.toggle("nav-btn--badge", badge);
  }

  // js/ui/modals.js
  var root = () => $("#modal-root");
  var onCloseCb = null;
  function openModal(html, { cls = "", onClose = null } = {}) {
    onCloseCb = onClose;
    root().innerHTML = `<div class="modal-backdrop" data-action="modal-close-backdrop">
    <div class="modal ${cls}" role="dialog" aria-modal="true">
      <button class="modal__close" type="button" data-action="modal-close" aria-label="${esc(t("common.close"))}">\xD7</button>
      ${html}
    </div></div>`;
    root().classList.add("modal-root--open");
  }
  function closeModal() {
    root().classList.remove("modal-root--open");
    root().innerHTML = "";
    const cb = onCloseCb;
    onCloseCb = null;
    if (cb) cb();
  }
  function isModalOpen() {
    return root().classList.contains("modal-root--open");
  }
  function toast(text, cls = "") {
    const el2 = document.createElement("div");
    el2.className = `toast ${cls}`;
    el2.textContent = text;
    $("#toast-root").appendChild(el2);
    setTimeout(() => el2.classList.add("toast--hide"), 2600);
    setTimeout(() => el2.remove(), 3100);
  }
  var confirmCb = null;
  function confirmModal(title, text, onYes, { danger = false, yes = t("common.confirm") } = {}) {
    confirmCb = onYes;
    openModal(`<h2 class="modal__title">${esc(title)}</h2><p>${esc(text)}</p>
    <div class="modal__actions">
      <button class="btn" type="button" data-action="modal-close">${esc(t("common.cancel"))}</button>
      <button class="btn ${danger ? "btn--danger" : "btn--primary"}" type="button" data-action="confirm-yes">${esc(yes)}</button>
    </div>`, { cls: "modal--small" });
  }
  function isEquipped(item) {
    return Object.entries(game.state.equipment).find(([, i]) => i && i.uid === item.uid)?.[0] || null;
  }
  function itemModal(uid) {
    const s = game.state;
    const item = locateItem(s, uid);
    if (!item) return closeModal();
    const eqSlot = isEquipped(item);
    const targetSlots = slotsFor(item);
    const compare = eqSlot ? null : targetSlots.map((sl) => s.equipment[sl]).filter(Boolean).sort((a, b) => itemScore(a) - itemScore(b))[0] || null;
    const up = canUpgrade(s, item);
    const sv = salvageValue(item);
    const scoreDiff = compare ? itemScore(item) - itemScore(compare) : null;
    const equipBtns = eqSlot ? `<button class="btn" type="button" data-action="item-unequip" data-slot="${eqSlot}">${t("item.unequip")}</button>` : targetSlots.length > 1 ? targetSlots.map((sl) => `<button class="btn btn--primary" type="button" data-action="item-equip" data-uid="${uid}" data-slot="${sl}">${t("item.equipTo", { slot: t(`slot.${sl}`) })}</button>`).join("") : `<button class="btn btn--primary" type="button" data-action="item-equip" data-uid="${uid}">${t("item.equip")}</button>`;
    openModal(`
    <div class="item-detail">
      ${itemIcon(item, "item-icon--large")}
      <div>
        <h2 class="modal__title">${itemNameHtml(item)}</h2>
        <div class="muted">${t(`rarity.${item.rarity}`)} \xB7 ${t(`slot.${item.slot}`)} \xB7 ${t("common.levelShort", { n: item.level })}${item.crafted ? " \xB7 " + t("item.crafted") : ""}</div>
      </div>
    </div>
    <div class="item-stats">${itemStatsHtml(item, compare)}</div>
    <div class="item-score">${t("item.power")}: <b>${fmt2(itemScore(item))}</b>
      ${scoreDiff != null ? `<span class="${scoreDiff >= 0 ? "diff--up" : "diff--down"}">(${scoreDiff >= 0 ? "+" : ""}${scoreDiff} ${t("item.vsEquipped")})</span>` : ""}
      ${!eqSlot && !compare ? `<span class="diff--up">${t("item.emptySlot")}</span>` : ""}
    </div>
    ${compare ? `<details class="compare"><summary>${t("item.compareWith")}: ${itemNameHtml(compare)}</summary>${itemStatsHtml(compare)}</details>` : ""}
    <div class="upgrade-box">
      <div><b>${t("item.upgrade")}</b> (${item.upgrade}/${Math.max(0, s.settlement.forge * BALANCE.UPGRADE_LEVELS_PER_FORGE)})</div>
      ${up.reason === "noForge" ? `<div class="muted">${t("item.needForge")}</div>` : up.reason === "maxUpgrade" ? `<div class="muted">${t("item.maxUpgrade")}</div>` : `<div class="costs">${costHtml(s, up.cost)}</div>`}
      <button class="btn btn--accent" type="button" data-action="item-upgrade" data-uid="${uid}" ${up.ok ? "" : "disabled"}>${t("item.upgradeBtn", { pct: BALANCE.UPGRADE_STAT_BONUS * 100 })}</button>
    </div>
    <div class="modal__actions modal__actions--wrap">
      ${equipBtns}
      ${eqSlot ? "" : `
      <button class="btn" type="button" data-action="item-lock" data-uid="${uid}">${item.locked ? t("item.unlock") : t("item.lock")}</button>
      <button class="btn btn--gold" type="button" data-action="item-sell" data-uid="${uid}" ${item.locked ? "disabled" : ""}>${t("item.sell", { gold: fmt2(itemSellPrice(s, item)) })}</button>
      <button class="btn" type="button" data-action="item-salvage" data-uid="${uid}" ${item.locked ? "disabled" : ""}>${t("item.salvage", { essence: sv.essence })}</button>`}
    </div>`, { cls: "modal--item" });
  }
  function settingsModal() {
    const st = game.state.settings;
    openModal(`
    <h2 class="modal__title">${t("settings.title")}</h2>
    <label class="setting"><span>${t("settings.volume")}</span>
      <input type="range" min="0" max="100" value="${Math.round(st.volume * 100)}" data-input="set-volume"></label>
    <label class="setting setting--toggle"><span>${t("settings.batterySaver")}<small>${t("settings.batterySaverDesc")}</small></span>
      <input type="checkbox" ${st.batterySaver ? "checked" : ""} data-change="set-battery"></label>
    <h3>${t("settings.saveTitle")}</h3>
    <div class="modal__actions modal__actions--wrap">
      <button class="btn" type="button" data-action="save-now">${t("settings.saveNow")}</button>
      <button class="btn" type="button" data-action="export-save">${t("settings.export")}</button>
    </div>
    <textarea id="save-text" class="save-text" rows="4" placeholder="${esc(t("settings.importPlaceholder"))}"></textarea>
    <div class="modal__actions modal__actions--wrap">
      <button class="btn" type="button" data-action="copy-save">${t("settings.copy")}</button>
      <button class="btn btn--primary" type="button" data-action="import-save">${t("settings.import")}</button>
    </div>
    <h3>${t("settings.dangerTitle")}</h3>
    <button class="btn btn--danger btn--block" type="button" data-action="reset-game">${t("settings.reset")}</button>
    <p class="muted small">${t("settings.about")}</p>`, { cls: "modal--settings" });
  }
  function doExport() {
    const ta = $("#save-text");
    ta.value = exportSave();
    ta.select();
    copyText(ta.value);
  }
  function copyText(text) {
    if (!text) return toast(t("settings.nothingToCopy"), "toast--warn");
    const done = () => toast(t("settings.copied"), "toast--ok");
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => {
      legacyCopy();
      done();
    });
    else {
      legacyCopy();
      done();
    }
  }
  function legacyCopy() {
    const ta = $("#save-text");
    if (!ta) return;
    ta.select();
    try {
      document.execCommand("copy");
    } catch (e) {
    }
  }
  function afkReportModal(report, manipulated = false) {
    if (manipulated) {
      openModal(`<h2 class="modal__title">${t("afk.title")}</h2><p class="warn">${t("afk.clockWarning")}</p>
      <div class="modal__actions"><button class="btn btn--primary" type="button" data-action="modal-close">${t("common.ok")}</button></div>`, { cls: "modal--small" });
      return;
    }
    const res = Object.entries(report.resources).map(([k, v]) => `<span class="cost">${resourceIcon(k)}${fmt2(v)}</span>`).join("");
    const crafted = report.crafted.length ? `<div class="stat-line"><span>${t("afk.crafted")}</span><b>${report.crafted.length}</b></div>` : "";
    openModal(`
    <h2 class="modal__title">${t("afk.title")}</h2>
    <p>${t("afk.away", { time: fmtTime(report.elapsed) })}${report.capped ? " " + t("afk.capped") : ""}</p>
    ${report.kills > 0 ? `
    <div class="stat-line"><span>${t("afk.kills")}</span><b>${fmt2(report.kills)}</b></div>
    <div class="stat-line"><span>${t("afk.xp")}</span><b>${fmt2(report.xp)}</b></div>
    ${report.levels ? `<div class="stat-line"><span>${t("afk.levels")}</span><b>+${report.levels}</b></div>` : ""}
    <div class="stat-line"><span>${t("afk.gold")}</span><b>${fmt2(report.gold)}</b></div>
    <div class="stat-line"><span>${t("afk.items")}</span><b>${report.items.length}</b></div>
    ${report.itemsConverted ? `<div class="muted small">${t("afk.converted", { n: report.itemsConverted })}</div>` : ""}
    <div class="stat-line"><span>${t("resource.essence")}</span><b>${fmt2(report.essence)}</b></div>
    <div class="costs">${res}</div>
    ${report.bossReady ? `<p class="info">${t("afk.bossReady")}</p>` : ""}` : `<p>${t("afk.nothing")}</p>`}
    ${crafted}
    <div class="afk-items">${report.items.slice(0, 25).map((i) => itemIcon(i)).join("")}</div>
    <div class="modal__actions"><button class="btn btn--primary" type="button" data-action="modal-close">${t("afk.collect")}</button></div>`);
  }
  function initModals({ onSettingsChanged, onStateReplaced }) {
    registerActions({
      "modal-close": () => closeModal(),
      "modal-close-backdrop": (d, el2, e) => {
        if (e.target === el2) closeModal();
      },
      "confirm-yes": () => {
        const cb = confirmCb;
        confirmCb = null;
        closeModal();
        if (cb) cb();
      },
      "open-item": (d) => itemModal(Number(d.uid)),
      "item-equip": (d) => {
        equip(game.state, Number(d.uid), d.slot || null);
        closeModal();
      },
      "item-unequip": (d) => {
        if (unequip(game.state, d.slot)) closeModal();
        else toast(t("inventory.full"), "toast--warn");
      },
      "item-upgrade": (d) => {
        if (upgradeItem(game.state, Number(d.uid))) {
          toast(t("item.upgraded"), "toast--ok");
          itemModal(Number(d.uid));
        }
      },
      "item-lock": (d) => {
        toggleLock(game.state, Number(d.uid));
        itemModal(Number(d.uid));
      },
      "item-sell": (d) => {
        const item = findItem(game.state, Number(d.uid));
        const sell = () => {
          const g = sellItem(game.state, Number(d.uid));
          toast(t("item.sold", { gold: fmt2(g) }), "toast--gold");
          closeModal();
        };
        if (item && item.rarity >= 3) confirmModal(t("item.sellConfirmTitle"), t("item.sellConfirm"), sell);
        else sell();
      },
      "item-salvage": (d) => {
        const item = findItem(game.state, Number(d.uid));
        const go = () => {
          const v = salvageItem(game.state, Number(d.uid));
          if (v) toast(t("item.salvaged", { essence: v.essence }), "toast--ok");
          closeModal();
        };
        if (item && item.rarity >= 3) confirmModal(t("item.salvageConfirmTitle"), t("item.sellConfirm"), go);
        else go();
      },
      "open-settings": () => settingsModal(),
      "save-now": () => {
        if (saveGame("manual")) toast(t("settings.saved"), "toast--ok");
      },
      "export-save": () => doExport(),
      "copy-save": () => copyText($("#save-text")?.value),
      "import-save": () => {
        try {
          const state = parseImport($("#save-text").value);
          confirmModal(t("settings.importConfirmTitle"), t("settings.importConfirm"), () => {
            onStateReplaced(state);
            toast(t("settings.imported"), "toast--ok");
          });
        } catch (err) {
          toast(t("settings.importError"), "toast--warn");
        }
      },
      "reset-game": () => {
        confirmModal(t("settings.resetTitle"), t("settings.resetConfirm1"), () => {
          confirmModal(t("settings.resetTitle"), t("settings.resetConfirm2"), () => {
            resetGame();
            onStateReplaced(null);
            toast(t("settings.resetDone"), "toast--ok");
          }, { danger: true, yes: t("settings.resetFinal") });
        }, { danger: true });
      }
    });
    registerChanges({
      "set-volume": (el2) => {
        game.state.settings.volume = Number(el2.value) / 100;
        setVolume(game.state.settings.volume);
      },
      "set-battery": (el2) => {
        game.state.settings.batterySaver = el2.checked;
        onSettingsChanged();
      }
    });
    bus.on("inventory:changed", () => {
      const modalItem = root().querySelector('[data-action="item-upgrade"]');
      if (modalItem && !locateItem(game.state, Number(modalItem.dataset.uid))) closeModal();
    });
  }

  // js/ui/screens.js
  var ui = { heroTab: "stats", craftTab: "smithing", sort: "rarity", logLen: -1 };
  var S = () => game.state;
  var el = (id) => document.getElementById(id);
  function renderHero() {
    const s = S(), h = s.hero, d = getDerived(s), p = xpProgress(s);
    const tabs = ["stats", "skills"].map((id) => `<button class="tab ${ui.heroTab === id ? "tab--active" : ""}" type="button" data-action="hero-tab" data-tab="${id}">${t(`hero.tab.${id}`)}${id === "skills" && h.skillPoints ? ` <span class="badge">${h.skillPoints}</span>` : ""}${id === "stats" && h.statPoints ? ` <span class="badge">${h.statPoints}</span>` : ""}</button>`).join("");
    const head = `
    <div class="card hero-card">
      <div class="portrait portrait--hero portrait--large" data-portrait="hero"></div>
      <div class="hero-card__info">
        <h2>${t("hero.name")}</h2>
        <div>${t("common.level", { n: h.level })}</div>
        ${bar(p.pct, "bar--xp", "", `${fmt2(p.xp)} / ${fmt2(p.need)} ${t("common.xp")}`)}
        ${bar(h.hp / d.maxHp * 100, "bar--hp", "hero-tab-hp", `${fmt2(h.hp)} / ${fmt2(d.maxHp)}`)}
      </div>
    </div>
    <div class="tabs">${tabs}</div>`;
    $("#screen-hero").innerHTML = head + (ui.heroTab === "stats" ? heroStatsHtml(s, d) : heroSkillsHtml(s));
  }
  function heroStatsHtml(s, d) {
    const h = s.hero;
    const base = STAT_KEYS.map((k) => `
    <div class="attr">
      <div class="attr__icon icon icon--${k}" data-icon="${k}"></div>
      <div class="attr__info"><b>${t(`stat.${k}`)}: ${d[k]}</b><small>${t(`hero.attrDesc.${k}`)}</small></div>
      <button class="btn btn--small btn--primary" type="button" data-action="alloc" data-stat="${k}" data-n="1" ${h.statPoints ? "" : "disabled"}>+1</button>
      <button class="btn btn--small" type="button" data-action="alloc" data-stat="${k}" data-n="5" ${h.statPoints >= 5 ? "" : "disabled"}>+5</button>
    </div>`).join("");
    const derived = [
      ["maxHp", fmt2(d.maxHp)],
      ["atk", fmt2(d.atk)],
      ["def", fmt2(d.def)],
      ["magic", fmt2(d.magic)],
      ["crit", d.crit.toFixed(1) + "%"],
      ["critMult", "\xD7" + d.critMult.toFixed(2)],
      ["dodge", d.dodge.toFixed(1) + "%"],
      ["regen", d.regen],
      ["lifesteal", d.lifesteal + "%"],
      ["thorns", d.thorns + "%"],
      ["fireDmg", "+" + d.fireDmg + "%"],
      ["iceDmg", "+" + d.iceDmg + "%"],
      ["earthDmg", "+" + d.earthDmg + "%"],
      ["goldFind", "+" + d.goldFind + "%"],
      ["magicFind", "+" + d.magicFind + "%"],
      ["xpBonus", "+" + d.xpBonus + "%"]
    ].map(([k, v]) => `<div class="stat-line"><span>${t(`stat.${k}`)}</span><b>${v}</b></div>`).join("");
    const buffs = s.buffs.length ? s.buffs.map((b) => `<div class="buff"><span class="consumable-icon" style="--c:${CONSUMABLES[b.id]?.color}"></span>
    <span>${t(`consumable.${b.id}.name`)}</span><b>${fmtTime(b.remaining)}</b></div>`).join("") : `<div class="muted">${t("hero.noBuffs")}</div>`;
    const st = s.stats;
    return `
    <div class="card"><div class="card__head"><h3>${t("hero.attributes")}</h3><span class="pill">${t("hero.points", { n: h.statPoints })}</span></div>${base}
      <button class="btn btn--small" type="button" data-action="reset-stats">${t("hero.resetStats", { gold: fmt2(statResetCost(s)) })}</button></div>
    <div class="card"><h3>${t("hero.derived")}</h3><div class="stat-grid">${derived}</div></div>
    <div class="card"><h3>${t("hero.buffs")}</h3><div id="buff-list">${buffs}</div></div>
    <div class="card"><h3>${t("hero.statistics")}</h3><div class="stat-grid">
      <div class="stat-line"><span>${t("hero.stat.kills")}</span><b>${fmt2(st.kills)}</b></div>
      <div class="stat-line"><span>${t("hero.stat.bossKills")}</span><b>${fmt2(st.bossKills)}</b></div>
      <div class="stat-line"><span>${t("hero.stat.deaths")}</span><b>${fmt2(st.deaths)}</b></div>
      <div class="stat-line"><span>${t("hero.stat.goldEarned")}</span><b>${fmt2(st.goldEarned)}</b></div>
      <div class="stat-line"><span>${t("hero.stat.itemsFound")}</span><b>${fmt2(st.itemsFound)}</b></div>
      <div class="stat-line"><span>${t("hero.stat.crafted")}</span><b>${fmt2(st.crafted)}</b></div>
      <div class="stat-line"><span>${t("hero.stat.playTime")}</span><b>${fmtTime(st.playTimeMs)}</b></div>
    </div></div>`;
  }
  function skillDesc(sk, rank) {
    const r = Math.max(0, rank - 1);
    const p = (arr) => arr ? Math.round(arr[r] * 100) : 0;
    const eff = sk.effects?.[0];
    return t(`skill.${sk.id}.desc`, {
      magic: p(sk.magic),
      atk: p(sk.atk),
      def: p(sk.def),
      cd: sk.cd,
      chance: eff ? p(eff.chance) : 0,
      power: eff ? p(eff.power) : 0,
      turns: eff?.turns,
      v1: sk.passive ? Object.values(sk.passive)[0][r] : "",
      v2: sk.passive ? (Object.values(sk.passive)[1] || [])[r] : "",
      v3: sk.passive ? (Object.values(sk.passive)[2] || [])[r] : "",
      flag: sk.flags ? Math.round(Object.values(sk.flags)[0][r] * 100) : ""
    });
  }
  function heroSkillsHtml(s) {
    const pts = elementPoints(s);
    const active = activeSynergies(s).map((x) => x.id);
    const syn = SYNERGIES.map((x) => `<div class="synergy ${active.includes(x.id) ? "synergy--active" : ""}">
    <b>${t(`synergy.${x.id}.name`)}</b><small>${t(`synergy.${x.id}.desc`)}</small>
    <small class="muted">${t("skills.synergyReq", { n: x.points, list: x.elements.map((e) => t(`element.${e}`)).join(" + ") })}</small></div>`).join("");
    const cols = ELEMENTS.map((e) => `
    <div class="element-col element-col--${e}">
      <h3 class="element-title"><span class="icon icon--${e}" data-icon="${e}"></span>${t(`element.${e}`)} <small>(${pts[e]})</small></h3>
      ${SKILLS.filter((sk) => sk.element === e).map((sk) => {
      const rank = skillRank(s, sk.id);
      const c = canLearn(s, sk.id);
      return `<div class="skill ${rank ? "skill--learned" : ""}" data-skill="${sk.id}">
          <div class="skill__icon skill-icon skill-icon--${e}" data-skill-icon="${sk.id}"></div>
          <div class="skill__body">
            <div class="skill__name"><b>${t(`skill.${sk.id}.name`)}</b> <span class="pill">${rank}/${sk.maxRank}</span>
              <span class="muted small">${t(`skills.type.${sk.type}`)}</span></div>
            <small>${skillDesc(sk, rank || 1)}</small>
            ${c.ok || c.reason === "maxRank" ? "" : `<small class="warn">${t(`skills.reason.${c.reason}`, { n: sk.reqLevel })}</small>`}
          </div>
          <button class="btn btn--small btn--primary" type="button" data-action="learn-skill" data-id="${sk.id}" ${c.ok ? "" : "disabled"}>${rank ? "+1" : t("skills.learn")}</button>
        </div>`;
    }).join("")}
    </div>`).join("");
    return `
    <div class="card"><div class="card__head"><h3>${t("skills.title")}</h3><span class="pill">${t("skills.points", { n: s.hero.skillPoints })}</span></div>
      <p class="muted small">${t("skills.hint", { n: BALANCE.SKILL_POINT_EVERY })}</p>
      <div class="skill-tree">${cols}</div>
      <button class="btn btn--small" type="button" data-action="reset-skills">${t("skills.reset", { gold: fmt2(respecCost(s)) })}</button></div>
    <div class="card"><h3>${t("skills.synergies")}</h3>${syn}</div>`;
  }
  function updateHero() {
    const s = S(), d = getDerived(s);
    const hp = el("hero-tab-hp");
    if (hp) {
      hp.style.width = `${s.hero.hp / d.maxHp * 100}%`;
      el("hero-tab-hp-label").textContent = `${fmt2(s.hero.hp)} / ${fmt2(d.maxHp)}`;
    }
  }
  var effectsHtml = (list) => (list || []).map((e) => `<span class="effect effect--${e.type}" title="${esc(t(`effect.${e.type}`))}">${t(`effect.${e.type}`)} ${e.turns}</span>`).join("");
  function renderCombat() {
    const s = S(), c = s.combat;
    const locs = LOCATIONS.map((l, i) => {
      const locked = i >= c.unlocked;
      return `<button class="loc ${l.id === c.locationId ? "loc--active" : ""} ${locked ? "loc--locked" : ""}" type="button"
      data-action="travel" data-id="${l.id}" ${locked ? "disabled" : ""} style="--loc-color:${l.color}">
      <span class="loc__art location-art location-art--${l.id}" data-location="${l.id}"></span>
      <span class="loc__name">${locked ? t("combat.locked") : t(`location.${l.id}.name`)}</span>
      <span class="loc__lvl">${t("combat.levels", { a: l.levels[0], b: l.levels[1] })}</span>
      ${c.bossesDefeated[l.id] ? '<span class="loc__done">\u2713</span>' : ""}
    </button>`;
    }).join("");
    const loc = getLocation(c.locationId);
    const potions = Object.keys(CONSUMABLES).filter((id) => (s.consumables[id] || 0) > 0).map((id) => `
    <button class="consumable" type="button" data-action="use-consumable" data-id="${id}" title="${esc(t(`consumable.${id}.desc`))}">
      <span class="consumable-icon" style="--c:${CONSUMABLES[id].color}" data-consumable="${id}"></span>
      <span>${t(`consumable.${id}.name`)}</span><b>\xD7${s.consumables[id]}</b></button>`).join("");
    $("#screen-combat").innerHTML = `
    <div class="loc-list">${locs}</div>
    <div class="card arena" style="--loc-color:${loc.color}">
      <div class="arena__bg location-art location-art--${loc.id}" data-location="${loc.id}"></div>
      <div class="arena__title"><b>${t(`location.${loc.id}.name`)}</b><small>${t(`location.${loc.id}.desc`)}</small></div>
      <div class="arena__fighters">
        <div class="fighter fighter--hero">
          <div class="portrait portrait--hero" data-portrait="hero" id="arena-hero"></div>
          <div class="fighter__name">${t("hero.name")}</div>
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
      <div class="card__head"><b>${t("combat.bossProgress")}</b><span id="boss-count"></span></div>
      <div id="boss-bar"></div>
      <button class="btn btn--danger btn--block" type="button" data-action="challenge-boss" id="btn-boss">${t("combat.challengeBoss", { name: t(`enemy.${loc.boss}`) })}</button>
    </div>
    <div class="card"><h3>${t("combat.consumables")}</h3><div class="consumables">${potions || `<span class="muted">${t("combat.noConsumables")}</span>`}</div>
      <label class="setting setting--toggle"><span>${t("combat.autoPotion", { n: s.settings.potionThreshold })}</span><input type="checkbox" data-change="auto-potion" ${s.settings.autoPotion ? "checked" : ""}></label>
      <label class="setting setting--toggle"><span>${t("combat.autoAdvance")}</span><input type="checkbox" data-change="auto-advance" ${s.settings.autoAdvance ? "checked" : ""}></label>
    </div>
    <div class="card"><h3>${t("combat.log")}</h3><div class="battle-log" id="battle-log"></div></div>`;
    ui.logLen = -1;
    updateCombat2();
  }
  function updateCombat2() {
    const s = S(), c = s.combat, d = getDerived(s), f = c.fight;
    const hp = el("arena-hero-hp");
    if (!hp) return;
    hp.innerHTML = bar(s.hero.hp / d.maxHp * 100, "bar--hp", "", `${fmt2(s.hero.hp)} / ${fmt2(d.maxHp)}`);
    el("arena-hero-effects").innerHTML = effectsHtml(f?.heroEffects);
    const ep = el("arena-enemy");
    if (f) {
      ep.dataset.portrait = f.enemyId;
      ep.style.setProperty("--enemy-color", ENEMIES[f.enemyId].color);
      ep.classList.toggle("portrait--boss", f.boss);
      ep.classList.remove("portrait--empty");
      el("arena-enemy-name").innerHTML = `${f.boss ? `<span class="boss-tag">${t("combat.boss")}</span> ` : ""}${esc(t(`enemy.${f.enemyId}`))} <small>${t("common.levelShort", { n: f.level })}</small>`;
      el("arena-enemy-hp").innerHTML = bar(f.hp / f.maxHp * 100, "bar--enemy", "", `${fmt2(f.hp)} / ${fmt2(f.maxHp)}`);
      el("arena-enemy-effects").innerHTML = effectsHtml(f.effects);
    } else {
      ep.classList.add("portrait--empty");
      ep.classList.remove("portrait--boss");
      el("arena-enemy-name").textContent = "";
      el("arena-enemy-hp").innerHTML = "";
      el("arena-enemy-effects").innerHTML = "";
    }
    el("arena-status").textContent = c.phase === "dead" ? t("combat.respawning", { s: Math.ceil(c.timer / 1e3) }) : c.phase === "pause" ? t("combat.searching") : t("combat.round", { n: f?.round || 0 });
    el("boss-count").textContent = c.bossReady ? t("combat.bossReady") : `${c.killsSinceBoss}/${BALANCE.KILLS_PER_BOSS}`;
    el("boss-bar").innerHTML = bar(c.killsSinceBoss / BALANCE.KILLS_PER_BOSS * 100, "bar--boss");
    el("btn-boss").disabled = !c.bossReady || !!(f && f.boss);
    const log2 = game.runtime.log;
    if (ui.logLen !== log2.length || ui.logLast !== log2[log2.length - 1]) {
      ui.logLen = log2.length;
      ui.logLast = log2[log2.length - 1];
      el("battle-log").innerHTML = log2.slice(-25).reverse().map((l) => `<div class="log-line ${l.cls}">${esc(l.text)}</div>`).join("");
    }
  }
  var SORTS = {
    rarity: (a, b) => b.rarity - a.rarity || b.level - a.level,
    level: (a, b) => b.level - a.level || b.rarity - a.rarity,
    slot: (a, b) => a.slot.localeCompare(b.slot) || b.rarity - a.rarity,
    power: (a, b) => itemScore(b) - itemScore(a)
  };
  function renderBackpack() {
    const s = S();
    const eq = EQUIP_SLOTS.map((slot) => {
      const it = s.equipment[slot];
      return `<button class="eq-slot eq-slot--${slot}" type="button" ${it ? `data-action="open-item" data-uid="${it.uid}"` : "disabled"}>
      ${it ? itemIcon(it) : `<div class="item-icon item-icon--empty item-icon--${slot.replace(/\d/, "")}" data-slot="${slot}"></div>`}
      <span class="eq-slot__label">${t(`slot.${slot}`)}</span></button>`;
    }).join("");
    const res = RESOURCES.map((r) => `<div class="res" title="${esc(t(`resource.${r}`))}">${resourceIcon(r)}<span>${t(`resource.${r}`)}</span><b>${fmt2(s.resources[r] || 0)}</b></div>`).join("");
    const cons = Object.keys(CONSUMABLES).filter((id) => (s.consumables[id] || 0) > 0).map((id) => `
    <div class="cons-row"><span class="consumable-icon" style="--c:${CONSUMABLES[id].color}" data-consumable="${id}"></span>
      <div><b>${t(`consumable.${id}.name`)} \xD7${s.consumables[id]}</b><small>${t(`consumable.${id}.desc`)}</small></div>
      <button class="btn btn--small" type="button" data-action="use-consumable" data-id="${id}">${t("inventory.use")}</button></div>`).join("");
    const items = [...s.inventory].sort(SORTS[ui.sort]);
    const cap = capacity(s);
    const grid = items.map((it) => `<button class="bag-slot" type="button" data-action="open-item" data-uid="${it.uid}">${itemIcon(it)}<span class="bag-slot__lvl">${it.level}</span></button>`).join("") + Array.from({ length: Math.max(0, cap - items.length) }, () => '<div class="bag-slot bag-slot--empty"></div>').join("");
    $("#screen-backpack").innerHTML = `
    <div class="card"><h3>${t("inventory.equipment")}</h3><div class="eq-grid">${eq}</div></div>
    <div class="card"><h3>${t("inventory.resources")}</h3><div class="res-grid">${res}</div></div>
    <div class="card"><h3>${t("inventory.consumables")}</h3>${cons || `<div class="muted">${t("combat.noConsumables")}</div>`}</div>
    <div class="card">
      <div class="card__head"><h3>${t("inventory.backpack")}</h3><span class="pill ${items.length >= cap ? "pill--warn" : ""}">${items.length}/${cap}</span></div>
      <div class="toolbar">
        <select data-change="sort" aria-label="${esc(t("inventory.sort"))}">${Object.keys(SORTS).map((k) => `<option value="${k}" ${ui.sort === k ? "selected" : ""}>${t(`inventory.sortBy.${k}`)}</option>`).join("")}</select>
        <button class="btn btn--small btn--gold" type="button" data-action="sell-all" data-max="0">${t("inventory.sellCommon")}</button>
        <button class="btn btn--small btn--gold" type="button" data-action="sell-all" data-max="1">${t("inventory.sellUncommon")}</button>
      </div>
      <div class="bag-grid">${grid}</div>
      <p class="muted small">${t("inventory.hint")}</p>
    </div>`;
  }
  function renderCrafting() {
    const s = S();
    const tabs = Object.keys(PROFESSIONS).map((p) => `<button class="tab ${ui.craftTab === p ? "tab--active" : ""}" type="button" data-action="craft-tab" data-tab="${p}">${t(`profession.${p}`)}</button>`).join("");
    const prof = s.crafting.professions[ui.craftTab];
    const building = PROFESSIONS[ui.craftTab].building;
    const bLvl = s.settlement[building];
    const recipes = recipesFor(ui.craftTab).map((r) => {
      const c = canCraft(s, r.id);
      return `<div class="recipe ${bLvl < r.level ? "recipe--locked" : ""}">
      <div class="recipe__icon recipe-icon recipe-icon--${r.result.type}" data-recipe="${r.id}" style="--c:${r.result.type === "consumable" ? CONSUMABLES[r.result.id].color : "var(--rarity-" + (r.result.minRarity ?? 0) + ")"}"></div>
      <div class="recipe__body">
        <b>${t(`recipe.${r.id}.name`)}</b><small>${t(`recipe.${r.id}.desc`)}</small>
        <div class="costs">${costHtml(s, r.cost)}<span class="cost">\u23F1 ${fmtTime(craftDuration(s, r))}</span></div>
        ${bLvl < r.level ? `<small class="warn">${t("crafting.needBuilding", { name: t(`building.${building}.name`), n: r.level })}</small>` : ""}
      </div>
      <button class="btn btn--small btn--primary" type="button" data-action="craft" data-id="${r.id}" ${c.ok ? "" : "disabled"}>${t("crafting.craft")}</button>
    </div>`;
    }).join("");
    const queue = Array.from({ length: BALANCE.CRAFT_QUEUE_MAX }, (_, i) => {
      const job = s.crafting.queue[i];
      if (!job) return `<div class="queue-slot queue-slot--empty">${t("crafting.emptySlot")}</div>`;
      return `<div class="queue-slot">
      <div class="queue-slot__info"><b>${t(`recipe.${job.recipeId}.name`)}</b><small id="q-time-${i}">${i === 0 ? fmtTime(job.remaining) : t("crafting.waiting")}</small></div>
      <div id="q-bar-${i}">${bar((1 - job.remaining / job.total) * 100, "bar--craft")}</div>
      <button class="btn btn--small" type="button" data-action="craft-cancel" data-index="${i}">${t("crafting.cancel")}</button></div>`;
    }).join("");
    $("#screen-crafting").innerHTML = `
    <div class="tabs">${tabs}</div>
    <div class="card">
      <div class="card__head"><h3>${t(`profession.${ui.craftTab}`)}</h3><span class="pill">${t("common.level", { n: prof.level })}</span></div>
      ${bar(prof.level >= BALANCE.PROFESSION_MAX_LEVEL ? 100 : prof.xp / professionXpFor(prof.level) * 100, "bar--xp", "", prof.level >= BALANCE.PROFESSION_MAX_LEVEL ? t("crafting.maxLevel") : `${prof.xp} / ${professionXpFor(prof.level)}`)}
      <p class="muted small">${t("crafting.profHint", { pct: Math.round(BALANCE.PROFESSION_TIME_REDUCTION * 100) })} ${bLvl < 1 ? t("crafting.buildFirst", { name: t(`building.${building}.name`) }) : ""}</p>
    </div>
    <div class="card"><h3>${t("crafting.queue")}</h3>${queue}</div>
    <div class="card"><h3>${t("crafting.recipes")}</h3>${recipes}</div>`;
  }
  function updateCrafting() {
    const q = S().crafting.queue;
    q.forEach((job, i) => {
      const tm = el(`q-time-${i}`), b = el(`q-bar-${i}`);
      if (tm && i === 0) tm.textContent = fmtTime(job.remaining);
      if (b) {
        const fill = b.querySelector(".bar__fill");
        if (fill) fill.style.width = `${(1 - job.remaining / job.total) * 100}%`;
      }
    });
  }
  function bonusText(id, lvl) {
    const b = BUILDING_BONUS[id];
    const params = Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v * lvl]));
    if (id === "townhall") params.afk = Math.round(Math.min(1, BALANCE.AFK_BASE_EFFICIENCY + BALANCE.AFK_EFF_PER_TOWNHALL * lvl) * 100);
    return t(`building.${id}.bonus`, params);
  }
  function renderSettlement() {
    const s = S();
    const cards = BUILDINGS.map((b) => {
      const lvl = s.settlement[b.id];
      const c = canUpgradeBuilding(s, b.id);
      return `<div class="card building ${lvl ? "" : "building--unbuilt"}">
      <div class="building__art building-art building-art--${b.id}" data-building="${b.id}" data-level="${lvl}" style="--b-color:${b.color}"><span>${lvl}</span></div>
      <div class="building__body">
        <div class="card__head"><b>${t(`building.${b.id}.name`)}</b><span class="pill">${t("settlement.level", { n: lvl, max: BALANCE.BUILDING_MAX_LEVEL })}</span></div>
        <small>${t(`building.${b.id}.desc`)}</small>
        <div class="small">${t("settlement.current")}: <b>${lvl ? bonusText(b.id, lvl) : t("settlement.notBuilt")}</b></div>
        ${c.cost ? `<div class="small">${t("settlement.next")}: ${bonusText(b.id, lvl + 1)}</div><div class="costs">${costHtml(s, c.cost)}</div>` : `<div class="small ok">${t("settlement.maxed")}</div>`}
        ${c.reason === "townhall" ? `<small class="warn">${t("settlement.needTownhall", { n: lvl })}</small>` : ""}
        ${c.cost ? `<button class="btn btn--primary btn--small" type="button" data-action="build" data-id="${b.id}" ${c.ok ? "" : "disabled"}>${lvl ? t("settlement.upgrade") : t("settlement.build")}</button>` : ""}
      </div></div>`;
    }).join("");
    const market = s.settlement.market >= 1 ? `
    <div class="card"><h3>${t("settlement.marketTitle")}</h3><p class="muted small">${t("settlement.marketHint")}</p>
      ${Object.keys(MARKET_PRICES).map((r) => `<div class="market-row">${resourceIcon(r)}<span>${t(`resource.${r}`)}</span>
        <small>${t("settlement.pricePer", { gold: marketPrice(s, r) })}</small>
        <button class="btn btn--small btn--gold" type="button" data-action="market-buy" data-res="${r}" data-n="10" ${s.hero.gold >= marketPrice(s, r) * 10 ? "" : "disabled"}>+10 (${fmt2(marketPrice(s, r) * 10)})</button></div>`).join("")}
    </div>` : `<div class="card muted">${t("settlement.marketLocked")}</div>`;
    $("#screen-settlement").innerHTML = `<div class="card"><h3>${t("settlement.title")}</h3><p class="muted small">${t("settlement.hint")}</p></div>${cards}${market}`;
  }
  var SCREENS = {
    hero: { render: renderHero, update: updateHero },
    combat: { render: renderCombat, update: updateCombat2 },
    backpack: { render: renderBackpack, update: () => {
    } },
    crafting: { render: renderCrafting, update: updateCrafting },
    settlement: { render: renderSettlement, update: () => {
    } }
  };
  function initScreens(rerender2) {
    registerActions({
      "hero-tab": (d) => {
        ui.heroTab = d.tab;
        rerender2("hero");
      },
      alloc: (d) => {
        allocateStat(S(), d.stat, Number(d.n));
      },
      "reset-stats": () => confirmModal(t("hero.resetStatsTitle"), t("hero.resetStatsConfirm", { gold: fmt2(statResetCost(S())) }), () => {
        if (!resetStats(S())) toast(t("common.cannot"), "toast--warn");
      }),
      "learn-skill": (d) => {
        if (learnSkill(S(), d.id)) toast(t("skills.learned", { name: t(`skill.${d.id}.name`) }), "toast--ok");
      },
      "reset-skills": () => confirmModal(t("skills.resetTitle"), t("skills.resetConfirm", { gold: fmt2(respecCost(S())) }), () => {
        if (!resetSkills(S())) toast(t("common.cannot"), "toast--warn");
      }),
      travel: (d) => {
        changeLocation(S(), d.id);
        rerender2("combat");
      },
      "challenge-boss": () => {
        challengeBoss(S());
        updateCombat2();
      },
      "use-consumable": (d) => {
        if (useConsumable(S(), d.id)) toast(t("inventory.used", { name: t(`consumable.${d.id}.name`) }), "toast--ok");
      },
      "sell-all": (d) => {
        const max = Number(d.max);
        confirmModal(t("inventory.sellAllTitle"), t(max ? "inventory.sellAllConfirm1" : "inventory.sellAllConfirm0"), () => {
          const r = sellAllUpTo(S(), max);
          toast(t("inventory.soldAll", { n: r.count, gold: fmt2(r.total) }), "toast--gold");
        });
      },
      "craft-tab": (d) => {
        ui.craftTab = d.tab;
        rerender2("crafting");
      },
      craft: (d) => {
        if (enqueue(S(), d.id)) toast(t("crafting.started", { name: t(`recipe.${d.id}.name`) }), "toast--ok");
      },
      "craft-cancel": (d) => {
        cancelCraft(S(), Number(d.index));
      },
      build: (d) => {
        if (upgradeBuilding(S(), d.id)) toast(t("settlement.built", { name: t(`building.${d.id}.name`), n: S().settlement[d.id] }), "toast--ok");
      },
      "market-buy": (d) => {
        marketBuy(S(), d.res, Number(d.n));
      }
    });
    registerChanges({
      sort: (e) => {
        ui.sort = e.value;
        rerender2("backpack");
      },
      "auto-potion": (e) => {
        S().settings.autoPotion = e.checked;
      },
      "auto-advance": (e) => {
        S().settings.autoAdvance = e.checked;
      }
    });
  }

  // js/main.js
  window.__POSZUKIWACZ_BOOTED = true;
  var dirty = /* @__PURE__ */ new Set();
  var markDirty = (...ids) => ids.forEach((id) => dirty.add(id));
  function rerender(id) {
    dirty.delete(id);
    SCREENS[id].render();
  }
  function applySettings() {
    const st = game.state.settings;
    setVolume(st.volume);
    document.body.classList.toggle("battery-saver", !!st.batterySaver);
  }
  function renderAll() {
    Object.keys(SCREENS).forEach((id) => dirty.add(id));
    rerender(currentTab());
    updateHeader();
  }
  function setState(state) {
    game.state = state;
    game.runtime.log = [];
    rng.state = state.rngState || 1;
    ensureHp(state);
    applySettings();
  }
  function handleOffline(elapsed, manipulated) {
    if (manipulated) {
      afkReportModal(null, true);
      return;
    }
    if (elapsed < BALANCE.MIN_OFFLINE_MS) return;
    const report = applyOfflineProgress(game.state, elapsed);
    ensureHp(game.state);
    if (report.kills > 0 || report.crafted.length) afkReportModal(report);
  }
  function boot() {
    const { state, source } = loadGame();
    setState(state);
    initNavigation((id) => rerender(id));
    initScreens(rerender);
    initModals({
      onSettingsChanged: applySettings,
      onStateReplaced: (newState) => {
        setState(newState || createDefaultState());
        saveGame("replace");
        renderAll();
      }
    });
    if (source !== "new") {
      const { elapsed, manipulated } = checkClock(state);
      handleOffline(elapsed, manipulated);
      if (source.startsWith("backup")) toast(t("settings.restoredBackup"), "toast--warn");
    } else {
      setTimeout(() => openModal(`<h2 class="modal__title">${t("intro.title")}</h2><p>${t("intro.text1")}</p><p>${t("intro.text2")}</p>
      <div class="modal__actions"><button class="btn btn--primary" type="button" data-action="modal-close">${t("intro.start")}</button></div>`), 300);
    }
    saveGame("boot");
    bus.on("hero:changed", () => markDirty("hero"));
    bus.on("inventory:changed", () => markDirty("backpack", "combat", "crafting", "hero"));
    bus.on("crafting:changed", () => markDirty("crafting", "settlement"));
    bus.on("settlement:changed", () => markDirty("settlement", "crafting", "backpack"));
    bus.on("combat:location", () => markDirty("combat"));
    bus.on("combat:unlocked", (id) => {
      markDirty("combat");
      toast(t("toast.unlocked", { name: t(`location.${id}.name`) }), "toast--ok");
    });
    bus.on("hero:levelup", ({ level }) => {
      playSound("level");
      toast(t("toast.levelUp", { n: level }), "toast--level");
      markDirty("hero", "crafting");
    });
    bus.on("loot:item", (item) => {
      if (item.rarity >= 3) toast(t("toast.rareLoot", { name: itemName(item) }), `toast--rarity-${item.rarity}`);
    });
    bus.on("crafting:done", (list) => list.forEach((r) => toast(t("toast.crafted", { name: t(`recipe.${r.recipeId}.name`) }), "toast--ok")));
    bus.on("crafting:profLevel", ({ profession, level }) => toast(t("toast.profLevel", { name: t(`profession.${profession}`), n: level }), "toast--level"));
    bus.on("save:error", () => toast(t("toast.saveError"), "toast--warn"));
    bus.on("game:completed", () => openModal(`<h2 class="modal__title">${t("ending.title")}</h2><p>${t("ending.text")}</p>
    <div class="modal__actions"><button class="btn btn--primary" type="button" data-action="modal-close">${t("common.ok")}</button></div>`));
    bus.on("ui:tick", () => {
      const tab = currentTab();
      const busy = document.activeElement && ["SELECT", "INPUT", "TEXTAREA"].includes(document.activeElement.tagName) && document.activeElement.closest(".screen");
      if (dirty.has(tab) && !busy) rerender(tab);
      else SCREENS[tab].update();
      updateHeader();
    });
    switchTab("combat");
    updateHeader();
    startLoop({
      update: (dt) => {
        const s = game.state;
        s.stats.playTimeMs += dt;
        updateCombat(s, dt);
        advanceCrafting(s, dt);
        tickBuffs(s, dt);
      },
      onLongGap: (ms) => {
        handleOffline(ms, false);
        renderAll();
      },
      getUiInterval: () => game.state.settings.batterySaver ? BALANCE.UI_UPDATE_MS_SAVER : BALANCE.UI_UPDATE_MS
    });
    const persist = () => saveGame("leave");
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) persist();
    });
    window.addEventListener("pagehide", persist);
    window.addEventListener("beforeunload", persist);
    if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("sw.js").catch((e) => console.warn("SW", e));
    }
    document.getElementById("boot-screen")?.classList.add("boot-screen--hidden");
    window.__POSZUKIWACZ_DEBUG = { game, isModalOpen };
  }
  boot();
})();
