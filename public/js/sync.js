// Keeps a student's progress (XP, streak, words, badges) on their account, so it follows them to any device
// and the teacher can see it. Local data stays the working copy; the server copy is merged in on login.
import { on, getSession, D, replaceData } from './store.js';
import { api, net } from './api.js';

const uniq = (a, b) => [...new Set([...(a || []), ...(b || [])])];
const num = (v) => (Number.isFinite(+v) ? +v : 0);

export function mergeProgress(a, b) {
  a = a || {}; b = b || {};
  const out = { ...b, ...a };
  out.favorites = uniq(a.favorites, b.favorites);
  out.saved = uniq(a.saved, b.saved);
  out.lessonsDone = uniq(a.lessonsDone, b.lessonsDone);
  out.seenHw = uniq(a.seenHw, b.seenHw);
  out.badges = uniq(a.badges, b.badges);
  out.xp = Math.max(num(a.xp), num(b.xp));
  out.played = Math.max(num(a.played), num(b.played));
  out.created = Math.min(num(a.created) || Date.now(), num(b.created) || Date.now());
  out.words = { ...(b.words || {}) };
  for (const [k, v] of Object.entries(a.words || {})) {
    const o = out.words[k];
    const score = (x) => num(x.right) + num(x.wrong);
    out.words[k] = !o || score(v) > score(o) || (score(v) === score(o) && num(v.box) >= num(o.box)) ? v : o;
  }
  out.days = { ...(b.days || {}) };
  for (const [k, v] of Object.entries(a.days || {})) out.days[k] = Math.max(num(v), num(out.days[k]));
  out.best = { ...(b.best || {}) };
  for (const [k, v] of Object.entries(a.best || {})) out.best[k] = Math.max(num(v), num(out.best[k]));
  const sa = a.streak || {}, sb = b.streak || {};
  out.streak = String(sa.last || '') > String(sb.last || '') || (sa.last === sb.last && num(sa.count) >= num(sb.count)) ? { last: sa.last || null, count: num(sa.count) } : { last: sb.last || null, count: num(sb.count) };
  out.learning = a.learning || b.learning || null;
  return out;
}

let timer = null, ready = false, pulledFor = null;
async function push() {
  const s = getSession();
  if (!s?.token || !ready) return;
  try { await api.put('/api/me/progress', { data: D() }); } catch { /* try again on the next change */ }
}
async function pull() {
  const s = getSession();
  if (!net.backend || !s?.user) { ready = false; pulledFor = null; return; }
  if (pulledFor === s.user.id) return;
  pulledFor = s.user.id;
  try {
    const { progress } = await api.get('/api/me/progress');
    replaceData(mergeProgress(D(), progress?.data));
    ready = true;
    await push();
  } catch { ready = false; pulledFor = null; }
}
export function startSync() {
  on('session', () => { clearTimeout(timer); pull(); });
  on('data', () => { if (!ready) return; clearTimeout(timer); timer = setTimeout(push, 2500); });
  addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && ready) { clearTimeout(timer); push(); } });
  pull();
}
