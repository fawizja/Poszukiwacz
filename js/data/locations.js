// Lokacje: zakres poziomów wrogów, lista przeciwników, boss i surowce.
// Nazwy i opisy znajdują się w i18n (location.<id>.name / .desc).
// "resources" — [surowiec, szansa, min, max] przy zdobyciu surowca po walce.
export const LOCATIONS = [
  { id: 'forest', levels: [1, 5], color: '#3f7d3a',
    enemies: ['f_wolf', 'f_boar', 'f_sprite', 'f_spider', 'f_bandit', 'f_shroom'], boss: 'f_boss',
    resources: [['wood', 0.6, 1, 3], ['herbs', 0.35, 1, 2], ['leather', 0.25, 1, 2]] },
  { id: 'swamp', levels: [5, 11], color: '#4d6b4a',
    enemies: ['s_toad', 's_leech', 's_wisp', 's_croc', 's_hag', 's_drowned'], boss: 's_boss',
    resources: [['herbs', 0.6, 1, 3], ['wood', 0.35, 1, 3], ['leather', 0.3, 1, 2]] },
  { id: 'hills', levels: [11, 17], color: '#8a7d68',
    enemies: ['h_slinger', 'h_golem', 'h_harpy', 'h_troll', 'h_ram', 'h_shaman'], boss: 'h_boss',
    resources: [['stone', 0.6, 2, 4], ['iron', 0.35, 1, 2], ['leather', 0.25, 1, 3]] },
  { id: 'catacombs', levels: [17, 24], color: '#5a5068',
    enemies: ['c_skeleton', 'c_ghoul', 'c_bat', 'c_cultist', 'c_wraith', 'c_rats'], boss: 'c_boss',
    resources: [['stone', 0.5, 2, 4], ['iron', 0.45, 1, 3], ['crystals', 0.15, 1, 1]] },
  { id: 'ashlands', levels: [24, 31], color: '#a0522d',
    enemies: ['a_salamander', 'a_imp', 'a_scorpion', 'a_nomad', 'a_magma', 'a_vulture'], boss: 'a_boss',
    resources: [['iron', 0.55, 2, 4], ['stone', 0.4, 2, 5], ['crystals', 0.2, 1, 2]] },
  { id: 'pass', levels: [31, 38], color: '#6fa3c7',
    enemies: ['i_giant', 'i_wolf', 'i_witch', 'i_knight', 'i_owl', 'i_golem'], boss: 'i_boss',
    resources: [['crystals', 0.35, 1, 2], ['leather', 0.5, 2, 4], ['iron', 0.4, 2, 4]] },
  { id: 'depths', levels: [38, 46], color: '#7a5fc4',
    enemies: ['d_crawler', 'd_mimic', 'd_lurker', 'd_mage', 'd_worm', 'd_sentinel'], boss: 'd_boss',
    resources: [['crystals', 0.55, 1, 3], ['stone', 0.4, 3, 6], ['iron', 0.4, 2, 5]] },
  { id: 'void', levels: [46, 55], color: '#2d2340',
    enemies: ['v_shade', 'v_knight', 'v_eye', 'v_devourer', 'v_herald', 'v_twin'], boss: 'v_boss',
    resources: [['crystals', 0.6, 2, 4], ['iron', 0.5, 3, 6], ['herbs', 0.4, 3, 5]] }
];

export function getLocation(id) {
  return LOCATIONS.find((l) => l.id === id) || LOCATIONS[0];
}

export function locationIndex(id) {
  return Math.max(0, LOCATIONS.findIndex((l) => l.id === id));
}
