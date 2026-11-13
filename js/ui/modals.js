// Okna modalne: szczegóły przedmiotu z porównaniem, potwierdzenia, ustawienia,
// raport AFK, powiadomienia (toast).
import { t } from '../i18n/i18n.js';
import { game } from '../core/state.js';
import { bus } from '../core/eventBus.js';
import { BALANCE } from '../data/balance.js';
import { esc, fmt, fmtTime, itemIcon, itemStatsHtml, itemNameHtml, costHtml, resourceIcon, $ } from './renderer.js';
import { registerActions, registerChanges } from './navigation.js';
import { locateItem, findItem, equip, unequip, sellItem, salvageItem, salvageValue, upgradeItem, canUpgrade,
  toggleLock, itemSellPrice, slotsFor } from '../systems/inventory.js';
import { itemScore } from '../systems/loot.js';
import { exportSave, parseImport, resetGame, saveGame } from '../core/saveManager.js';
import { setVolume } from '../core/audio.js';

const root = () => $('#modal-root');
let onCloseCb = null;

export function openModal(html, { cls = '', onClose = null } = {}) {
  onCloseCb = onClose;
  root().innerHTML = `<div class="modal-backdrop" data-action="modal-close-backdrop">
    <div class="modal ${cls}" role="dialog" aria-modal="true">
      <button class="modal__close" type="button" data-action="modal-close" aria-label="${esc(t('common.close'))}">×</button>
      ${html}
    </div></div>`;
  root().classList.add('modal-root--open');
}

export function closeModal() {
  root().classList.remove('modal-root--open');
  root().innerHTML = '';
  const cb = onCloseCb;
  onCloseCb = null;
  if (cb) cb();
}

export function isModalOpen() { return root().classList.contains('modal-root--open'); }

export function toast(text, cls = '') {
  const el = document.createElement('div');
  el.className = `toast ${cls}`;
  el.textContent = text;
  $('#toast-root').appendChild(el);
  setTimeout(() => el.classList.add('toast--hide'), 2600);
  setTimeout(() => el.remove(), 3100);
}

let confirmCb = null;
export function confirmModal(title, text, onYes, { danger = false, yes = t('common.confirm') } = {}) {
  confirmCb = onYes;
  openModal(`<h2 class="modal__title">${esc(title)}</h2><p>${esc(text)}</p>
    <div class="modal__actions">
      <button class="btn" type="button" data-action="modal-close">${esc(t('common.cancel'))}</button>
      <button class="btn ${danger ? 'btn--danger' : 'btn--primary'}" type="button" data-action="confirm-yes">${esc(yes)}</button>
    </div>`, { cls: 'modal--small' });
}

// ---------------- Przedmiot ----------------
function isEquipped(item) {
  return Object.entries(game.state.equipment).find(([, i]) => i && i.uid === item.uid)?.[0] || null;
}

export function itemModal(uid) {
  const s = game.state;
  const item = locateItem(s, uid);
  if (!item) return closeModal();
  const eqSlot = isEquipped(item);
  const targetSlots = slotsFor(item);
  const compare = eqSlot ? null : targetSlots.map((sl) => s.equipment[sl]).filter(Boolean).sort((a, b) => itemScore(a) - itemScore(b))[0] || null;
  const up = canUpgrade(s, item);
  const sv = salvageValue(item);
  const scoreDiff = compare ? itemScore(item) - itemScore(compare) : null;

  const equipBtns = eqSlot
    ? `<button class="btn" type="button" data-action="item-unequip" data-slot="${eqSlot}">${t('item.unequip')}</button>`
    : targetSlots.length > 1
      ? targetSlots.map((sl) => `<button class="btn btn--primary" type="button" data-action="item-equip" data-uid="${uid}" data-slot="${sl}">${t('item.equipTo', { slot: t(`slot.${sl}`) })}</button>`).join('')
      : `<button class="btn btn--primary" type="button" data-action="item-equip" data-uid="${uid}">${t('item.equip')}</button>`;

  openModal(`
    <div class="item-detail">
      ${itemIcon(item, 'item-icon--large')}
      <div>
        <h2 class="modal__title">${itemNameHtml(item)}</h2>
        <div class="muted">${t(`rarity.${item.rarity}`)} · ${t(`slot.${item.slot}`)} · ${t('common.levelShort', { n: item.level })}${item.crafted ? ' · ' + t('item.crafted') : ''}</div>
      </div>
    </div>
    <div class="item-stats">${itemStatsHtml(item, compare)}</div>
    <div class="item-score">${t('item.power')}: <b>${fmt(itemScore(item))}</b>
      ${scoreDiff != null ? `<span class="${scoreDiff >= 0 ? 'diff--up' : 'diff--down'}">(${scoreDiff >= 0 ? '+' : ''}${scoreDiff} ${t('item.vsEquipped')})</span>` : ''}
      ${!eqSlot && !compare ? `<span class="diff--up">${t('item.emptySlot')}</span>` : ''}
    </div>
    ${compare ? `<details class="compare"><summary>${t('item.compareWith')}: ${itemNameHtml(compare)}</summary>${itemStatsHtml(compare)}</details>` : ''}
    <div class="upgrade-box">
      <div><b>${t('item.upgrade')}</b> (${item.upgrade}/${Math.max(0, s.settlement.forge * BALANCE.UPGRADE_LEVELS_PER_FORGE)})</div>
      ${up.reason === 'noForge' ? `<div class="muted">${t('item.needForge')}</div>` : up.reason === 'maxUpgrade' ? `<div class="muted">${t('item.maxUpgrade')}</div>`
        : `<div class="costs">${costHtml(s, up.cost)}</div>`}
      <button class="btn btn--accent" type="button" data-action="item-upgrade" data-uid="${uid}" ${up.ok ? '' : 'disabled'}>${t('item.upgradeBtn', { pct: BALANCE.UPGRADE_STAT_BONUS * 100 })}</button>
    </div>
    <div class="modal__actions modal__actions--wrap">
      ${equipBtns}
      ${eqSlot ? '' : `
      <button class="btn" type="button" data-action="item-lock" data-uid="${uid}">${item.locked ? t('item.unlock') : t('item.lock')}</button>
      <button class="btn btn--gold" type="button" data-action="item-sell" data-uid="${uid}" ${item.locked ? 'disabled' : ''}>${t('item.sell', { gold: fmt(itemSellPrice(s, item)) })}</button>
      <button class="btn" type="button" data-action="item-salvage" data-uid="${uid}" ${item.locked ? 'disabled' : ''}>${t('item.salvage', { essence: sv.essence })}</button>`}
    </div>`, { cls: 'modal--item' });
}

// ---------------- Ustawienia ----------------
export function settingsModal() {
  const st = game.state.settings;
  openModal(`
    <h2 class="modal__title">${t('settings.title')}</h2>
    <label class="setting"><span>${t('settings.volume')}</span>
      <input type="range" min="0" max="100" value="${Math.round(st.volume * 100)}" data-input="set-volume"></label>
    <label class="setting setting--toggle"><span>${t('settings.batterySaver')}<small>${t('settings.batterySaverDesc')}</small></span>
      <input type="checkbox" ${st.batterySaver ? 'checked' : ''} data-change="set-battery"></label>
    <h3>${t('settings.saveTitle')}</h3>
    <div class="modal__actions modal__actions--wrap">
      <button class="btn" type="button" data-action="save-now">${t('settings.saveNow')}</button>
      <button class="btn" type="button" data-action="export-save">${t('settings.export')}</button>
    </div>
    <textarea id="save-text" class="save-text" rows="4" placeholder="${esc(t('settings.importPlaceholder'))}"></textarea>
    <div class="modal__actions modal__actions--wrap">
      <button class="btn" type="button" data-action="copy-save">${t('settings.copy')}</button>
      <button class="btn btn--primary" type="button" data-action="import-save">${t('settings.import')}</button>
    </div>
    <h3>${t('settings.dangerTitle')}</h3>
    <button class="btn btn--danger btn--block" type="button" data-action="reset-game">${t('settings.reset')}</button>
    <p class="muted small">${t('settings.about')}</p>`, { cls: 'modal--settings' });
}

function doExport() {
  const ta = $('#save-text');
  ta.value = exportSave();
  ta.select();
  copyText(ta.value);
}

function copyText(text) {
  if (!text) return toast(t('settings.nothingToCopy'), 'toast--warn');
  const done = () => toast(t('settings.copied'), 'toast--ok');
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done, () => { legacyCopy(); done(); });
  else { legacyCopy(); done(); }
}

function legacyCopy() {
  const ta = $('#save-text');
  if (!ta) return;
  ta.select();
  try { document.execCommand('copy'); } catch (e) { /* zaznaczony tekst można skopiować ręcznie */ }
}

// ---------------- Raport AFK ----------------
export function afkReportModal(report, manipulated = false) {
  if (manipulated) {
    openModal(`<h2 class="modal__title">${t('afk.title')}</h2><p class="warn">${t('afk.clockWarning')}</p>
      <div class="modal__actions"><button class="btn btn--primary" type="button" data-action="modal-close">${t('common.ok')}</button></div>`, { cls: 'modal--small' });
    return;
  }
  const res = Object.entries(report.resources).map(([k, v]) => `<span class="cost">${resourceIcon(k)}${fmt(v)}</span>`).join('');
  const crafted = report.crafted.length ? `<div class="stat-line"><span>${t('afk.crafted')}</span><b>${report.crafted.length}</b></div>` : '';
  openModal(`
    <h2 class="modal__title">${t('afk.title')}</h2>
    <p>${t('afk.away', { time: fmtTime(report.elapsed) })}${report.capped ? ' ' + t('afk.capped') : ''}</p>
    ${report.kills > 0 ? `
    <div class="stat-line"><span>${t('afk.kills')}</span><b>${fmt(report.kills)}</b></div>
    <div class="stat-line"><span>${t('afk.xp')}</span><b>${fmt(report.xp)}</b></div>
    ${report.levels ? `<div class="stat-line"><span>${t('afk.levels')}</span><b>+${report.levels}</b></div>` : ''}
    <div class="stat-line"><span>${t('afk.gold')}</span><b>${fmt(report.gold)}</b></div>
    <div class="stat-line"><span>${t('afk.items')}</span><b>${report.items.length}</b></div>
    ${report.itemsConverted ? `<div class="muted small">${t('afk.converted', { n: report.itemsConverted })}</div>` : ''}
    <div class="stat-line"><span>${t('resource.essence')}</span><b>${fmt(report.essence)}</b></div>
    <div class="costs">${res}</div>
    ${report.bossReady ? `<p class="info">${t('afk.bossReady')}</p>` : ''}` : `<p>${t('afk.nothing')}</p>`}
    ${crafted}
    <div class="afk-items">${report.items.slice(0, 25).map((i) => itemIcon(i)).join('')}</div>
    <div class="modal__actions"><button class="btn btn--primary" type="button" data-action="modal-close">${t('afk.collect')}</button></div>`);
}

export function initModals({ onSettingsChanged, onStateReplaced }) {
  registerActions({
    'modal-close': () => closeModal(),
    'modal-close-backdrop': (d, el, e) => { if (e.target === el) closeModal(); },
    'confirm-yes': () => { const cb = confirmCb; confirmCb = null; closeModal(); if (cb) cb(); },
    'open-item': (d) => itemModal(Number(d.uid)),
    'item-equip': (d) => { equip(game.state, Number(d.uid), d.slot || null); closeModal(); },
    'item-unequip': (d) => {
      if (unequip(game.state, d.slot)) closeModal(); else toast(t('inventory.full'), 'toast--warn');
    },
    'item-upgrade': (d) => {
      if (upgradeItem(game.state, Number(d.uid))) { toast(t('item.upgraded'), 'toast--ok'); itemModal(Number(d.uid)); }
    },
    'item-lock': (d) => { toggleLock(game.state, Number(d.uid)); itemModal(Number(d.uid)); },
    'item-sell': (d) => {
      const item = findItem(game.state, Number(d.uid));
      const sell = () => { const g = sellItem(game.state, Number(d.uid)); toast(t('item.sold', { gold: fmt(g) }), 'toast--gold'); closeModal(); };
      if (item && item.rarity >= 3) confirmModal(t('item.sellConfirmTitle'), t('item.sellConfirm'), sell);
      else sell();
    },
    'item-salvage': (d) => {
      const item = findItem(game.state, Number(d.uid));
      const go = () => { const v = salvageItem(game.state, Number(d.uid)); if (v) toast(t('item.salvaged', { essence: v.essence }), 'toast--ok'); closeModal(); };
      if (item && item.rarity >= 3) confirmModal(t('item.salvageConfirmTitle'), t('item.sellConfirm'), go);
      else go();
    },
    'open-settings': () => settingsModal(),
    'save-now': () => { if (saveGame('manual')) toast(t('settings.saved'), 'toast--ok'); },
    'export-save': () => doExport(),
    'copy-save': () => copyText($('#save-text')?.value),
    'import-save': () => {
      try {
        const state = parseImport($('#save-text').value);
        confirmModal(t('settings.importConfirmTitle'), t('settings.importConfirm'), () => { onStateReplaced(state); toast(t('settings.imported'), 'toast--ok'); });
      } catch (err) {
        toast(t('settings.importError'), 'toast--warn');
      }
    },
    'reset-game': () => {
      confirmModal(t('settings.resetTitle'), t('settings.resetConfirm1'), () => {
        confirmModal(t('settings.resetTitle'), t('settings.resetConfirm2'), () => {
          resetGame();
          onStateReplaced(null);
          toast(t('settings.resetDone'), 'toast--ok');
        }, { danger: true, yes: t('settings.resetFinal') });
      }, { danger: true });
    }
  });
  registerChanges({
    'set-volume': (el) => { game.state.settings.volume = Number(el.value) / 100; setVolume(game.state.settings.volume); },
    'set-battery': (el) => { game.state.settings.batterySaver = el.checked; onSettingsChanged(); }
  });
  bus.on('inventory:changed', () => {
    const modalItem = root().querySelector('[data-action="item-upgrade"]');
    if (modalItem && !locateItem(game.state, Number(modalItem.dataset.uid))) closeModal();
  });
}
