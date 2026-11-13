// Punkt wejścia gry "Poszukiwacz".
import { game, createDefaultState } from './core/state.js';
import { rng } from './core/rng.js';
import { bus } from './core/eventBus.js';
import { startLoop } from './core/gameLoop.js';
import { loadGame, saveGame } from './core/saveManager.js';
import { checkClock, applyOfflineProgress } from './core/timeManager.js';
import { setVolume, playSound } from './core/audio.js';
import { BALANCE } from './data/balance.js';
import { t } from './i18n/i18n.js';
import { updateCombat } from './systems/combat.js';
import { advanceCrafting } from './systems/crafting.js';
import { tickBuffs, ensureHp } from './systems/hero.js';
import { itemName } from './systems/loot.js';
import { initNavigation, switchTab, currentTab, updateHeader } from './ui/navigation.js';
import { SCREENS, initScreens } from './ui/screens.js';
import { initModals, afkReportModal, toast, openModal, isModalOpen } from './ui/modals.js';

window.__POSZUKIWACZ_BOOTED = true;

const dirty = new Set();
const markDirty = (...ids) => ids.forEach((id) => dirty.add(id));

function rerender(id) {
  dirty.delete(id);
  SCREENS[id].render();
}

function applySettings() {
  const st = game.state.settings;
  setVolume(st.volume);
  document.body.classList.toggle('battery-saver', !!st.batterySaver);
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
  if (manipulated) { afkReportModal(null, true); return; }
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
      saveGame('replace');
      renderAll();
    }
  });

  if (source !== 'new') {
    const { elapsed, manipulated } = checkClock(state);
    handleOffline(elapsed, manipulated);
    if (source.startsWith('backup')) toast(t('settings.restoredBackup'), 'toast--warn');
  } else {
    setTimeout(() => openModal(`<h2 class="modal__title">${t('intro.title')}</h2><p>${t('intro.text1')}</p><p>${t('intro.text2')}</p>
      <div class="modal__actions"><button class="btn btn--primary" type="button" data-action="modal-close">${t('intro.start')}</button></div>`), 300);
  }
  saveGame('boot');

  // Zdarzenia -> oznaczanie ekranów do odświeżenia
  bus.on('hero:changed', () => markDirty('hero'));
  bus.on('inventory:changed', () => markDirty('backpack', 'combat', 'crafting', 'hero'));
  bus.on('crafting:changed', () => markDirty('crafting', 'settlement'));
  bus.on('settlement:changed', () => markDirty('settlement', 'crafting', 'backpack'));
  bus.on('combat:location', () => markDirty('combat'));
  bus.on('combat:unlocked', (id) => { markDirty('combat'); toast(t('toast.unlocked', { name: t(`location.${id}.name`) }), 'toast--ok'); });
  bus.on('hero:levelup', ({ level }) => { playSound('level'); toast(t('toast.levelUp', { n: level }), 'toast--level'); markDirty('hero', 'crafting'); });
  bus.on('loot:item', (item) => { if (item.rarity >= 3) toast(t('toast.rareLoot', { name: itemName(item) }), `toast--rarity-${item.rarity}`); });
  bus.on('crafting:done', (list) => list.forEach((r) => toast(t('toast.crafted', { name: t(`recipe.${r.recipeId}.name`) }), 'toast--ok')));
  bus.on('crafting:profLevel', ({ profession, level }) => toast(t('toast.profLevel', { name: t(`profession.${profession}`), n: level }), 'toast--level'));
  bus.on('save:error', () => toast(t('toast.saveError'), 'toast--warn'));
  bus.on('game:completed', () => openModal(`<h2 class="modal__title">${t('ending.title')}</h2><p>${t('ending.text')}</p>
    <div class="modal__actions"><button class="btn btn--primary" type="button" data-action="modal-close">${t('common.ok')}</button></div>`));
  bus.on('ui:tick', () => {
    const tab = currentTab();
    // Nie przebudowujemy ekranu, gdy użytkownik ma otwarte okno lub aktywny element formularza
    const busy = document.activeElement && ['SELECT', 'INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) && document.activeElement.closest('.screen');
    if (dirty.has(tab) && !busy) rerender(tab);
    else SCREENS[tab].update();
    updateHeader();
  });

  switchTab('combat');
  updateHeader();

  startLoop({
    update: (dt) => {
      const s = game.state;
      s.stats.playTimeMs += dt;
      updateCombat(s, dt);
      advanceCrafting(s, dt);
      tickBuffs(s, dt);
    },
    onLongGap: (ms) => { handleOffline(ms, false); renderAll(); },
    getUiInterval: () => (game.state.settings.batterySaver ? BALANCE.UI_UPDATE_MS_SAVER : BALANCE.UI_UPDATE_MS)
  });

  const persist = () => saveGame('leave');
  document.addEventListener('visibilitychange', () => { if (document.hidden) persist(); });
  window.addEventListener('pagehide', persist);
  window.addEventListener('beforeunload', persist);

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
  }
  document.getElementById('boot-screen')?.classList.add('boot-screen--hidden');
  window.__POSZUKIWACZ_DEBUG = { game, isModalOpen };
}

boot();
