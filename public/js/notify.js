// Homework notifications. While the site is open (or installed as an app), it checks for
// new homework every minute: an in-app toast + badge always, and a system notification
// when the student has switched notifications on.
import { api, net } from './api.js';
import { D, save, getSession, getSettings, setSetting, on } from './store.js';
import { setHomeworkBadge } from './nav.js';
import { toast } from './ui.js';

export const homeworkState = { list: [], loaded: false };
let timer = null;

export function notificationsSupported() { return 'Notification' in window; }
export const notificationPermission = () => (notificationsSupported() ? Notification.permission : 'unsupported');

export async function enableNotifications() {
  if (!notificationsSupported()) { toast('This browser does not support notifications.', 'bad'); return false; }
  const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
  if (perm !== 'granted') {
    setSetting('notify', false);
    toast('Notifications are blocked. Allow them in your browser’s site settings, then try again.', 'bad');
    return false;
  }
  setSetting('notify', true);
  toast('Done. You will be told when new homework arrives.', 'good');
  show('ClivEdu notifications are on', 'You will see new homework here.');
  return true;
}
export function disableNotifications() { setSetting('notify', false); }

async function show(title, body) {
  if (!getSettings().notify || notificationPermission() !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) return reg.showNotification(title, { body, icon: 'assets/icon.svg', badge: 'assets/icon.svg', tag: 'clivedu-hw', data: { url: '#/homework' } });
    new Notification(title, { body, icon: 'assets/icon.svg' });
  } catch { /* ignore */ }
}

export async function refreshHomework({ announce = true } = {}) {
  if (!net.backend || !getSession()) { homeworkState.list = []; setHomeworkBadge(0); return []; }
  try {
    const { homework } = await api.get('/api/homework');
    homeworkState.list = homework; homeworkState.loaded = true;
    const d = D();
    const fresh = homework.filter((h) => !d.seenHw.includes(h.id) && !h.done);
    if (announce && fresh.length) {
      // Only announce homework from the last 3 days, so old tasks do not pop up after a fresh login.
      const newest = fresh.filter((h) => Date.now() - h.created < 3 * 864e5);
      if (newest.length) {
        toast(`📝 New homework: ${newest[0].title}${newest.length > 1 ? ` (+${newest.length - 1} more)` : ''}`, 'good');
        show('New homework from your teacher', newest[0].title);
      }
    }
    homeworkState.announcedOnce = true;
    setHomeworkBadge(homework.filter((h) => !h.done && !d.seenHw.includes(h.id)).length);
    return homework;
  } catch { return homeworkState.list; }
}

export function markHomeworkSeen() {
  const d = D();
  let changed = false;
  for (const h of homeworkState.list) if (!d.seenHw.includes(h.id)) { d.seenHw.push(h.id); changed = true; }
  if (changed) { save(); setHomeworkBadge(0); }
}

export function startHomeworkWatcher() {
  const tick = () => refreshHomework();
  tick();
  clearInterval(timer);
  timer = setInterval(() => { if (!document.hidden) tick(); }, 60000);
  on('session', () => { homeworkState.announcedOnce = false; tick(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
}
