// Local state. Settings are per device; learning progress is per account
// (or "guest") so two students can share one computer.
const SETTINGS_KEY = 'clivedu:settings';
const SESSION_KEY = 'clivedu:session';
const listeners = {};

export const on = (evt, fn) => { (listeners[evt] ||= new Set()).add(fn); return () => listeners[evt].delete(fn); };
export const emit = (evt, data) => (listeners[evt] || []).forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } });

const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } };
const write = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* storage full or blocked */ } };

// ---------- settings ----------
export const defaultSettings = { theme: 'auto', accent: '#7b6cff', reading: false, motion: 'full', sound: true, notify: false, background: 'full', ui: 'uz', tr: 'uz' };
let settings = { ...defaultSettings, ...read(SETTINGS_KEY, {}) };
export const getSettings = () => settings;
export function setSetting(key, value) {
  settings = { ...settings, [key]: value };
  write(SETTINGS_KEY, settings);
  applySettings();
  emit('settings', settings);
}
export function applySettings() {
  const r = document.documentElement;
  r.dataset.theme = settings.theme;
  r.dataset.reading = settings.reading ? 'on' : 'off';
  r.dataset.motion = settings.motion;
  r.style.setProperty('--accent', settings.accent);
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = effectiveTheme() === 'light' ? '#eeebff' : '#0b0920';
}
export function effectiveTheme() {
  if (settings.theme !== 'auto') return settings.theme;
  return matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

// ---------- session ----------
let session = read(SESSION_KEY, null); // { token, user }
export const getSession = () => session;
export const getUser = () => session?.user || null;
export const isTeacher = () => session?.user?.role === 'teacher';
export function setSession(s) {
  session = s;
  s ? write(SESSION_KEY, s) : localStorage.removeItem(SESSION_KEY);
  data = null; // reload per-user data
  emit('session', s);
}
export function updateUser(user) { if (session) { session = { ...session, user }; write(SESSION_KEY, session); emit('session', session); } }

// ---------- learning data ----------
const blank = () => ({
  favorites: [], saved: [], words: {}, xp: 0, days: {}, streak: { last: null, count: 0 },
  learning: null, lessonsDone: [], seenHw: [], played: 0, best: {}, badges: [], created: Date.now(),
});
let data = null;
const dataKey = () => `clivedu:data:${session?.user?.id || 'guest'}`;
export function D() {
  if (!data) data = { ...blank(), ...read(dataKey(), {}) };
  return data;
}
export function save() { write(dataKey(), D()); emit('data', D()); }

export const todayKey = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

export function addXP(n, reason) {
  const d = D();
  d.xp += n;
  const t = todayKey();
  d.days[t] = (d.days[t] || 0) + n;
  // streak
  if (d.streak.last !== t) {
    const y = todayKey(new Date(Date.now() - 864e5));
    d.streak.count = d.streak.last === y ? d.streak.count + 1 : 1;
    d.streak.last = t;
  }
  save();
  const earned = checkBadges();
  emit('xp', { n, reason });
  return earned;
}

export const level = (xp) => {
  // each level needs a little more than the last
  let lv = 1, need = 100, left = xp;
  while (left >= need) { left -= need; lv++; need = Math.round(need * 1.18); }
  return { lv, into: left, need, pct: Math.round((left / need) * 100) };
};

// ---------- words (a simple 5-box Leitner system) ----------
export const wordKey = (setId, w) => `${setId}:${w}`;
const GAPS = [0, 1, 2, 4, 8, 16]; // days between reviews per box
export function wordState(key) { return D().words[key] || { box: 0, seen: false, right: 0, wrong: 0, next: 0 }; }
export function markWord(key, correct) {
  const d = D();
  const s = { ...wordState(key), seen: true };
  if (correct) { s.box = Math.min(5, s.box + 1); s.right++; } else { s.box = Math.max(1, s.box - 1); s.wrong++; }
  s.next = Date.now() + GAPS[s.box] * 864e5;
  d.words[key] = s;
  save();
  return s;
}
export function discoverWord(key) {
  const d = D();
  if (!d.words[key]) { d.words[key] = { box: 1, seen: true, right: 0, wrong: 0, next: Date.now() + 864e5 }; save(); return true; }
  return false;
}
export const isDue = (key) => { const s = D().words[key]; return !!s && s.seen && s.box < 5 && s.next <= Date.now(); };
export function toggleIn(listName, id) {
  const d = D();
  const i = d[listName].indexOf(id);
  i >= 0 ? d[listName].splice(i, 1) : d[listName].push(id);
  save();
  return i < 0;
}

// ---------- badges ----------
export const BADGES = [
  { id: 'first-star', em: '⭐', name: 'First star', desc: 'Discover your first word', test: (d) => Object.keys(d.words).length >= 1 },
  { id: 'ten-stars', em: '🌟', name: 'Constellation', desc: 'Discover 10 words', test: (d) => Object.keys(d.words).length >= 10 },
  { id: 'fifty-stars', em: '🌌', name: 'Galaxy maker', desc: 'Discover 50 words', test: (d) => Object.keys(d.words).length >= 50 },
  { id: 'bright', em: '☀️', name: 'Shining bright', desc: 'Master 5 words', test: (d) => Object.values(d.words).filter((w) => w.box >= 5).length >= 5 },
  { id: 'streak3', em: '🔥', name: 'On fire', desc: '3-day streak', test: (d) => d.streak.count >= 3 },
  { id: 'streak7', em: '🏆', name: 'One full week', desc: '7-day streak', test: (d) => d.streak.count >= 7 },
  { id: 'player', em: '🎮', name: 'Game on', desc: 'Play 5 games', test: (d) => d.played >= 5 },
  { id: 'reader', em: '📖', name: 'Bookworm', desc: 'Finish 3 lessons', test: (d) => d.lessonsDone.length >= 3 },
  { id: 'collector', em: '💜', name: 'Collector', desc: 'Save 10 words', test: (d) => d.saved.length >= 10 },
  { id: 'xp500', em: '🚀', name: 'Rocket', desc: 'Earn 500 XP', test: (d) => d.xp >= 500 },
];
function checkBadges() {
  const d = D();
  const fresh = BADGES.filter((b) => !d.badges.includes(b.id) && b.test(d));
  if (fresh.length) { d.badges.push(...fresh.map((b) => b.id)); save(); emit('badges', fresh); }
  return fresh;
}

// ---------- content cache (filled by api.js) ----------
export const content = { lessons: [], vocab: [], site: {}, fromServer: false, loaded: false };
export function allWords() {
  const out = [];
  for (const set of content.vocab) for (const w of set.words) out.push({ ...w, setId: set.id, set, key: wordKey(set.id, w.w) });
  return out;
}
