// Service worker: pełna praca offline (cache-first dla zasobów aplikacji).
const CACHE = 'poszukiwacz-v1';
const ASSETS = [
  './', './index.html', './manifest.json', './css/variables.css', './css/style.css',
  './assets/icons/icon.svg', './js/bundle.js',
  './js/main.js', './js/core/eventBus.js', './js/core/rng.js', './js/core/state.js', './js/core/gameLoop.js',
  './js/core/saveManager.js', './js/core/timeManager.js', './js/core/audio.js',
  './js/systems/hero.js', './js/systems/combat.js', './js/systems/loot.js', './js/systems/inventory.js',
  './js/systems/crafting.js', './js/systems/settlement.js', './js/systems/skills.js',
  './js/data/balance.js', './js/data/locations.js', './js/data/enemies.js', './js/data/items.js',
  './js/data/recipes.js', './js/data/buildings.js', './js/data/skillTree.js',
  './js/ui/renderer.js', './js/ui/screens.js', './js/ui/navigation.js', './js/ui/modals.js',
  './js/i18n/i18n.js', './js/i18n/pl.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((res) => {
    if (res.ok && new URL(e.request.url).origin === location.origin) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(e.request, copy));
    }
    return res;
  }).catch(() => caches.match('./index.html'))));
});
