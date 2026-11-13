// Pomocnicze funkcje renderujące (HTML jako tekst + formatowanie).
// Grafiki zastępcze: elementy z klasami .portrait / .item-icon / .icon i atrybutami data-*,
// które można łatwo podmienić na obrazy w css/variables.css i css/style.css.
import { t } from '../i18n/i18n.js';
import { PERCENT_STATS } from '../data/items.js';
import { itemName, itemStats } from '../systems/loot.js';

export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function fmt(n) {
  n = Math.floor(n);
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1).replace('.', ',') + ' mln';
  if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(1).replace('.', ',') + ' tys.';
  return n.toLocaleString('pl-PL');
}

export function fmtTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  if (h) return t('time.hm', { h, m });
  if (m) return t('time.ms', { m, s: sec });
  return t('time.s', { s: sec });
}

export function fmtStat(key, v) {
  const sign = v > 0 ? '+' : '';
  const num = Number.isInteger(v) ? v : v.toFixed(1).replace('.', ',');
  return `${sign}${num}${PERCENT_STATS.has(key) ? '%' : ''}`;
}

export function statLine(key, v, cls = '') {
  return `<div class="stat-line ${cls}"><span>${esc(t(`stat.${key}`))}</span><b>${fmtStat(key, v)}</b></div>`;
}

export function bar(pct, cls = '', id = '', label = '') {
  return `<div class="bar ${cls}"><div class="bar__fill" ${id ? `id="${id}"` : ''} style="width:${Math.max(0, Math.min(100, pct))}%"></div>${label ? `<span class="bar__label" ${id ? `id="${id}-label"` : ''}>${label}</span>` : ''}</div>`;
}

export function itemIcon(item, extra = '') {
  return `<div class="item-icon item-icon--${item.slot} rarity-${item.rarity} ${extra}" data-item-base="${item.base}" data-slot="${item.slot}" data-rarity="${item.rarity}">
    <span class="item-icon__glyph"></span>${item.upgrade ? `<span class="item-icon__up">+${item.upgrade}</span>` : ''}${item.locked ? '<span class="item-icon__lock"></span>' : ''}</div>`;
}

export function resourceIcon(res) {
  return `<span class="res-icon res-icon--${res}" data-resource="${res}"></span>`;
}

// Koszt z oznaczeniem brakujących składników
export function costHtml(state, cost) {
  return Object.entries(cost).map(([k, v]) => {
    const have = k === 'gold' ? state.hero.gold : state.resources[k] || 0;
    const icon = k === 'gold' ? '<span class="icon icon--gold" data-icon="gold"></span>' : resourceIcon(k);
    return `<span class="cost ${have >= v ? '' : 'cost--missing'}" title="${esc(k === 'gold' ? t('common.gold') : t(`resource.${k}`))}">${icon}${fmt(v)}</span>`;
  }).join('');
}

export function itemStatsHtml(item, compareTo = null) {
  const s = itemStats(item);
  const c = compareTo ? itemStats(compareTo) : null;
  const keys = new Set([...Object.keys(s), ...(c ? Object.keys(c) : [])]);
  return [...keys].map((k) => {
    const v = s[k] || 0;
    let diff = '';
    if (c) {
      const d = Math.round((v - (c[k] || 0)) * 10) / 10;
      if (d !== 0) diff = ` <small class="${d > 0 ? 'diff--up' : 'diff--down'}">(${fmtStat(k, d)})</small>`;
    }
    return `<div class="stat-line"><span>${esc(t(`stat.${k}`))}</span><b>${fmtStat(k, v)}${diff}</b></div>`;
  }).join('');
}

export function itemNameHtml(item) {
  return `<span class="rarity-text-${item.rarity}">${esc(itemName(item))}</span>`;
}

export function set(el, html) { if (el) el.innerHTML = html; }
export const $ = (sel, root = document) => root.querySelector(sel);
