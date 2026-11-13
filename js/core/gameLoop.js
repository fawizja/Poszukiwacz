// Pętla gry oparta o rzeczywisty upływ czasu (performance.now), odporna na
// zmianę zegara systemowego. Długie przerwy (uśpiona karta) trafiają do
// mechanizmu AFK zamiast symulacji każdej rundy.
import { BALANCE } from '../data/balance.js';
import { saveGame } from './saveManager.js';
import { bus } from './eventBus.js';

const LONG_GAP_MS = 60 * 1000;
let timer = null;
let last = 0;
let saveAcc = 0;
let uiAcc = 0;

export function startLoop({ update, onLongGap, getUiInterval }) {
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
    if (saveAcc >= BALANCE.AUTOSAVE_MS) { saveAcc = 0; saveGame('auto'); }
    uiAcc += dt;
    if (uiAcc >= getUiInterval()) { uiAcc = 0; bus.emit('ui:tick'); }
  }, BALANCE.TICK_MS);
}

export function stopLoop() {
  if (timer) clearInterval(timer);
  timer = null;
}
