// Wrogowie: mnożniki statystyk względem wzoru z balance.js oraz efekty przy trafieniu.
// effect: { type: poison|burn|bleed|stun, chance, power (mnożnik ATK na rundę), turns }
// Nazwy w i18n: enemy.<id>
const E = (id, hp, atk, def, color, effect = null) => ({ id, m: { hp, atk, def }, color, effect });

const LIST = [
  // Szepczący Las
  E('f_wolf', 0.9, 1.1, 0.8, '#8d8d8d', { type: 'bleed', chance: 0.15, power: 0.25, turns: 3 }),
  E('f_boar', 1.2, 1.0, 1.1, '#7a5230'),
  E('f_sprite', 0.7, 0.9, 0.6, '#9be38a', { type: 'stun', chance: 0.08, power: 0, turns: 1 }),
  E('f_spider', 0.8, 0.95, 0.8, '#4a4a3a', { type: 'poison', chance: 0.25, power: 0.2, turns: 3 }),
  E('f_bandit', 1.0, 1.15, 1.0, '#6b4b3a'),
  E('f_shroom', 1.3, 0.8, 1.2, '#c9744b', { type: 'poison', chance: 0.2, power: 0.15, turns: 4 }),
  E('f_boss', 1.0, 1.0, 1.2, '#2f5a26', { type: 'stun', chance: 0.12, power: 0, turns: 1 }),
  // Mgliste Bagna
  E('s_toad', 0.9, 1.0, 0.8, '#6c8c3c', { type: 'poison', chance: 0.3, power: 0.2, turns: 3 }),
  E('s_leech', 1.1, 0.9, 0.7, '#4b2f2f', { type: 'bleed', chance: 0.3, power: 0.2, turns: 3 }),
  E('s_wisp', 0.6, 1.2, 0.5, '#d6f27a', { type: 'burn', chance: 0.2, power: 0.25, turns: 2 }),
  E('s_croc', 1.4, 1.1, 1.3, '#3d5c3a'),
  E('s_hag', 0.9, 1.2, 0.8, '#6a5a7a', { type: 'poison', chance: 0.25, power: 0.25, turns: 3 }),
  E('s_drowned', 1.2, 1.0, 1.0, '#5d7a80', { type: 'stun', chance: 0.1, power: 0, turns: 1 }),
  E('s_boss', 1.0, 1.05, 1.0, '#9fb3a8', { type: 'poison', chance: 0.35, power: 0.25, turns: 3 }),
  // Kamienne Wzgórza
  E('h_slinger', 0.8, 1.2, 0.8, '#7a8f4a', { type: 'stun', chance: 0.1, power: 0, turns: 1 }),
  E('h_golem', 1.5, 0.9, 1.6, '#9a9384'),
  E('h_harpy', 0.8, 1.15, 0.7, '#b58a6a', { type: 'bleed', chance: 0.25, power: 0.25, turns: 3 }),
  E('h_troll', 1.6, 1.15, 1.0, '#6d7f5f'),
  E('h_ram', 1.2, 1.0, 1.5, '#cfc3a8', { type: 'stun', chance: 0.12, power: 0, turns: 1 }),
  E('h_shaman', 0.9, 1.25, 0.8, '#8a6fb0', { type: 'burn', chance: 0.25, power: 0.3, turns: 2 }),
  E('h_boss', 1.1, 1.0, 1.4, '#6e665a', { type: 'stun', chance: 0.15, power: 0, turns: 1 }),
  // Zapomniane Katakumby
  E('c_skeleton', 1.0, 1.05, 1.2, '#d9d4c5'),
  E('c_ghoul', 1.2, 1.1, 0.9, '#7c8a6a', { type: 'poison', chance: 0.25, power: 0.25, turns: 3 }),
  E('c_bat', 0.7, 1.0, 0.6, '#8a2b3a', { type: 'bleed', chance: 0.35, power: 0.25, turns: 3 }),
  E('c_cultist', 0.9, 1.25, 0.9, '#3a2a4a', { type: 'burn', chance: 0.2, power: 0.3, turns: 3 }),
  E('c_wraith', 0.8, 1.3, 0.6, '#a8b8d8', { type: 'stun', chance: 0.12, power: 0, turns: 1 }),
  E('c_rats', 1.1, 0.9, 0.7, '#5e4e3e', { type: 'bleed', chance: 0.3, power: 0.2, turns: 4 }),
  E('c_boss', 1.0, 1.05, 1.1, '#2a1f33', { type: 'burn', chance: 0.3, power: 0.3, turns: 3 }),
  // Popielne Pustkowia
  E('a_salamander', 0.9, 1.1, 0.9, '#e0612f', { type: 'burn', chance: 0.3, power: 0.3, turns: 3 }),
  E('a_imp', 0.7, 1.25, 0.6, '#c4302b', { type: 'burn', chance: 0.25, power: 0.25, turns: 2 }),
  E('a_scorpion', 1.1, 1.1, 1.3, '#b3742a', { type: 'poison', chance: 0.3, power: 0.3, turns: 3 }),
  E('a_nomad', 1.0, 1.2, 1.0, '#8d7b6a', { type: 'bleed', chance: 0.2, power: 0.25, turns: 3 }),
  E('a_magma', 1.5, 1.0, 1.4, '#ff7a1a', { type: 'burn', chance: 0.35, power: 0.3, turns: 3 }),
  E('a_vulture', 0.8, 1.1, 0.7, '#4f4640', { type: 'bleed', chance: 0.25, power: 0.25, turns: 3 }),
  E('a_boss', 1.05, 1.05, 1.1, '#ffb347', { type: 'burn', chance: 0.4, power: 0.35, turns: 3 }),
  // Lodowa Przełęcz
  E('i_giant', 1.6, 1.15, 1.1, '#e6f0f5', { type: 'stun', chance: 0.15, power: 0, turns: 1 }),
  E('i_wolf', 0.9, 1.15, 0.8, '#b8d8e8', { type: 'bleed', chance: 0.25, power: 0.25, turns: 3 }),
  E('i_witch', 0.8, 1.3, 0.7, '#7fb3d5', { type: 'stun', chance: 0.12, power: 0, turns: 1 }),
  E('i_knight', 1.3, 1.05, 1.6, '#90a4ae'),
  E('i_owl', 0.7, 1.1, 0.6, '#f5f5f5', { type: 'bleed', chance: 0.2, power: 0.25, turns: 2 }),
  E('i_golem', 1.5, 0.95, 1.7, '#a7d8f0'),
  E('i_boss', 1.0, 1.05, 1.2, '#d0f0ff', { type: 'stun', chance: 0.18, power: 0, turns: 1 }),
  // Kryształowe Głębiny
  E('d_crawler', 1.0, 1.1, 1.2, '#b28fe8', { type: 'bleed', chance: 0.25, power: 0.25, turns: 3 }),
  E('d_mimic', 1.2, 1.3, 1.1, '#c69b52'),
  E('d_lurker', 0.9, 1.25, 0.8, '#4a3d6a', { type: 'poison', chance: 0.3, power: 0.3, turns: 3 }),
  E('d_mage', 0.8, 1.35, 0.7, '#9c6ade', { type: 'burn', chance: 0.25, power: 0.3, turns: 3 }),
  E('d_worm', 1.6, 1.0, 1.0, '#8f6f8f', { type: 'poison', chance: 0.25, power: 0.25, turns: 4 }),
  E('d_sentinel', 1.4, 1.0, 1.7, '#c8b6ff', { type: 'stun', chance: 0.12, power: 0, turns: 1 }),
  E('d_boss', 1.05, 1.05, 1.2, '#e0c3ff', { type: 'bleed', chance: 0.35, power: 0.3, turns: 3 }),
  // Tron Pustki
  E('v_shade', 0.8, 1.3, 0.7, '#3b2f5a', { type: 'poison', chance: 0.3, power: 0.3, turns: 3 }),
  E('v_knight', 1.4, 1.1, 1.6, '#24203a'),
  E('v_eye', 0.9, 1.35, 0.8, '#d03a6a', { type: 'stun', chance: 0.15, power: 0, turns: 1 }),
  E('v_devourer', 1.7, 1.15, 1.1, '#140f24', { type: 'bleed', chance: 0.3, power: 0.3, turns: 3 }),
  E('v_herald', 1.0, 1.3, 1.0, '#6a4fb0', { type: 'burn', chance: 0.3, power: 0.35, turns: 3 }),
  E('v_twin', 1.1, 1.2, 1.2, '#8a8aa8', { type: 'bleed', chance: 0.25, power: 0.3, turns: 3 }),
  E('v_boss', 1.1, 1.1, 1.3, '#000000', { type: 'stun', chance: 0.2, power: 0, turns: 1 })
];

export const ENEMIES = Object.fromEntries(LIST.map((e) => [e.id, e]));
