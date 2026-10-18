import { applySettings, content, on, allWords, setSetting } from './store.js';
import { boot } from './api.js';
import { initRouter } from './router.js';
import { initNav } from './nav.js';
import { initPalette } from './palette.js';
import { startBackground, setWordList } from './bg.js';
import { startHomeworkWatcher } from './notify.js';
import { toast, confetti, modal, h } from './ui.js';
import { on as onEvt, getUser } from './store.js';
import { askLevelOnce } from './levelpicker.js';

applySettings();
addEventListener('error', (e) => console.error(e.error || e.message));

// First visit: ask (in Uzbek) whether to keep full animations or lighten them for a weaker device.
function askPerfOnce(next) {
  let seen = false;
  try { seen = !!localStorage.getItem('clivedu.perfAsked'); } catch {}
  if (seen) return next();
  const mark = () => { try { localStorage.setItem('clivedu.perfAsked', '1'); } catch {} };
  const pick = (motion, close) => { setSetting('motion', motion); mark(); close(); };
  modal((sheet, close) => sheet.append(
    h('h2', { class: 'h2' }, 'Animatsiyalar qanday bo‘lsin?'),
    h('p', { class: 'muted', style: { margin: '6px 0 14px' } }, 'Telefoningiz yoki kompyuteringiz sekin ishlasa, animatsiyalarni kamaytiring. Qurilmangizga ishonchingiz komil bo‘lsa, to‘liq animatsiyani tanlang. Buni keyin Sozlamalarda o‘zgartirish mumkin.'),
    h('div', { class: 'stack' },
      h('button', { class: 'btn primary', onclick: () => pick('full', close) }, '✨ To‘liq animatsiya (qurilmam kuchli)'),
      h('button', { class: 'btn glass', onclick: () => pick('calm', close) }, '🍃 Kamroq animatsiya (tezroq ishlashi uchun)'))),
    { onClose: () => { mark(); next(); } });
}

(async function start() {
  await boot();
  startBackground();
  const feed = () => setWordList(allWords().map((w) => w.w));
  feed();
  on('content', feed);
  initNav();
  initPalette();
  await initRouter();
  startHomeworkWatcher();
  askPerfOnce(() => askLevelOnce(getUser()));
  onEvt('session', (s) => { if (s?.user) setTimeout(() => askLevelOnce(getUser()), 600); });
  onEvt('badges', (list) => { list.forEach((b) => toast(`${b.em} Badge earned: ${b.name}`, 'good')); confetti(90); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();

// Remove the "Powered by Netlify" badge Netlify may inject into the page.
(function hideNetlifyBadge() {
  const sweep = () => document.querySelectorAll('a[href*="netlify.com"], [id*="netlify" i], [class*="netlify" i], iframe[src*="netlify"]').forEach((el) => { if (!el.closest('#view')) el.style.setProperty('display', 'none', 'important'); });
  new MutationObserver(sweep).observe(document.documentElement, { childList: true, subtree: true });
  sweep();
})();
