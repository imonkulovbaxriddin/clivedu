import { applySettings, content, on, allWords } from './store.js';
import { boot } from './api.js';
import { initRouter } from './router.js';
import { initNav } from './nav.js';
import { initPalette } from './palette.js';
import { startBackground, setWordList } from './bg.js';
import { startHomeworkWatcher } from './notify.js';
import { toast, confetti } from './ui.js';
import { on as onEvt, getUser } from './store.js';
import { askLevelOnce } from './levelpicker.js';

applySettings();
addEventListener('error', (e) => console.error(e.error || e.message));

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
  askLevelOnce(getUser());
  onEvt('session', (s) => { if (s?.user) setTimeout(() => askLevelOnce(getUser()), 600); });
  onEvt('badges', (list) => { list.forEach((b) => toast(`${b.em} Badge earned: ${b.name}`, 'good')); confetti(90); });
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
})();
