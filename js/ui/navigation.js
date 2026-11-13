// Nawigacja: dolny pasek z 5 zakładkami, nagłówek oraz delegacja zdarzeń
// (data-action dla kliknięć, data-change dla pól formularzy).
import { t } from '../i18n/i18n.js';
import { game } from '../core/state.js';
import { xpProgress } from '../systems/hero.js';
import { fmt, $ } from './renderer.js';
import { playSound } from '../core/audio.js';

export const TABS = ['hero', 'combat', 'backpack', 'crafting', 'settlement'];
const actions = {};
const changes = {};
let current = 'combat';
let onSwitch = () => {};

export function registerActions(obj) { Object.assign(actions, obj); }
export function registerChanges(obj) { Object.assign(changes, obj); }
export function currentTab() { return current; }

export function initNavigation(switchHandler) {
  onSwitch = switchHandler;
  $('#bottom-nav').innerHTML = TABS.map((id) => `
    <button class="nav-btn" type="button" data-action="nav" data-tab="${id}">
      <span class="nav-btn__icon icon icon--${id}" data-icon="${id}"></span>
      <span class="nav-btn__label">${t(`nav.${id}`)}</span>
    </button>`).join('');

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const fn = actions[el.dataset.action];
    if (fn) { playSound('click'); fn(el.dataset, el, e); }
  });
  document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (el && changes[el.dataset.change]) changes[el.dataset.change](el);
  });
  document.addEventListener('input', (e) => {
    const el = e.target.closest('[data-input]');
    if (el && changes[el.dataset.input]) changes[el.dataset.input](el);
  });
  registerActions({ nav: (d) => switchTab(d.tab) });
}

export function switchTab(id) {
  if (!TABS.includes(id)) return;
  current = id;
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('screen--active', s.dataset.screen === id));
  document.querySelectorAll('.nav-btn').forEach((b) => b.classList.toggle('nav-btn--active', b.dataset.tab === id));
  onSwitch(id);
}

export function updateHeader() {
  const s = game.state;
  const p = xpProgress(s);
  $('#hdr-level').textContent = t('common.levelShort', { n: s.hero.level });
  $('#hdr-xp').style.width = `${p.pct}%`;
  $('#hdr-gold').textContent = fmt(s.hero.gold);
  const badge = s.hero.statPoints > 0 || s.hero.skillPoints > 0;
  document.querySelector('.nav-btn[data-tab="hero"]')?.classList.toggle('nav-btn--badge', badge);
}
