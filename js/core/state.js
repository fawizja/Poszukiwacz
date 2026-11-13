// Domyślny stan gry oraz globalny uchwyt do bieżącego stanu.
import { BALANCE } from '../data/balance.js';

export const SAVE_VERSION = 2;

export const game = { state: null, runtime: { log: [], lastTick: 0 } };

export function createDefaultState(now = Date.now()) {
  const seed = (Math.floor(Math.random() * 0xffffffff) ^ now) >>> 0;
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
      locationId: 'forest',
      unlocked: 1,
      killsSinceBoss: 0,
      bossReady: false,
      bossesDefeated: {},
      phase: 'pause',
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
