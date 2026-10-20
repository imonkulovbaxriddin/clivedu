import { avatarSvg, hasAvatar } from './avatars.js';
import { getSettings } from './store.js';

// DOM append/replaceChildren print the text "null" for null children. Make them skip null/false and flatten arrays.
for (const name of ['append', 'prepend', 'replaceChildren']) {
  const native = Element.prototype[name];
  Element.prototype[name] = function (...kids) { return native.apply(this, kids.flat(2).filter((k) => k != null && k !== false)); };
}

// Tiny hyperscript: h('div', { class: 'x', onclick }, 'text', child, ...)
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props && (typeof props !== 'object' || props instanceof Node || Array.isArray(props))) { kids.unshift(props); props = null; }
  for (const [k, v] of Object.entries(props || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) sk.startsWith('--') ? el.style.setProperty(sk, sv) : (el.style[sk] = sv); }
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'value') el.value = v;
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  const add = (kid) => {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) return kid.forEach(add);
    el.append(kid instanceof Node ? kid : document.createTextNode(String(kid)));
  };
  kids.forEach(add);
  return el;
}
// Element.append() turns null into the text "null"; this makes append ignore null/false and flatten arrays.
export function safe(el) {
  const native = el.append.bind(el);
  el.append = (...kids) => native(...kids.flat(2).filter((k) => k != null && k !== false));
  return el;
}
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const clear = (el) => { el.replaceChildren(); return el; };
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- icons (24px stroke set) ----------
const P = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M9 7h6"/>',
  galaxy: '<circle cx="12" cy="12" r="2.2"/><path d="M12 3c5 0 9 4 9 9"/><path d="M12 21c-5 0-9-4-9-9"/><path d="M6.5 6.5c3-2 7-.5 8.5 2.5"/><path d="M17.5 17.5c-3 2-7 .5-8.5-2.5"/>',
  play: '<rect x="3" y="7" width="18" height="11" rx="4"/><path d="M8 10v5M5.5 12.5h5"/><circle cx="16" cy="11.5" r=".8"/><circle cx="18" cy="14" r=".8"/>',
  pencil: '<path d="M4 20l4-1 11-11a2.1 2.1 0 0 0-3-3L5 16z"/><path d="M14 6l3 3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4.5 4-6 8-6s7 1.5 8 6"/>',
  menu: '<path d="M12 4v16M4 12h16"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
  heart: '<path d="M12 21s-8-5.3-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.700-8 11-8 11z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  sound: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.500 9a4 4 0 0 1 0 6"/>',
  check: '<path d="M5 12.500l4.500 4.500L19 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  left: '<path d="M15 5l-7 7 7 7"/>', right: '<path d="M9 5l7 7-7 7"/>',
  share: '<circle cx="6" cy="12" r="2.500"/><circle cx="18" cy="6" r="2.500"/><circle cx="18" cy="18" r="2.500"/><path d="M8.300 11l7.400-4M8.300 13l7.400 4"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  desk: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  trophy: '<path d="M8 4h8v6a4 4 0 0 1-8 0z"/><path d="M8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 14v4M8 20h8"/>',
};
export const icon = (name, size) => {
  const wrap = document.createElement('span');
  wrap.style.display = 'contents';
  wrap.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"${size ? ` width="${size}" height="${size}"` : ''}>${P[name] || ''}</svg>`;
  return wrap.firstChild;
};

// ---------- toast ----------
export function toast(msg, kind = '') {
  const root = document.getElementById('toasts');
  const t = h('div', { class: `toast glass ${kind}` }, msg);
  root.append(t);
  setTimeout(() => { t.style.transition = 'opacity .4s, transform .4s'; t.style.opacity = '0'; t.style.transform = 'translateY(-8px)'; setTimeout(() => t.remove(), 400); }, 3200);
}

// ---------- modal ----------
export function modal(build, { onClose } = {}) {
  const root = document.getElementById('modal-root');
  const prevFocus = document.activeElement;
  const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); prevFocus?.focus?.(); onClose?.(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const sheet = safe(h('div', { class: 'sheet', role: 'dialog', 'aria-modal': 'true' }));
  const wrap = h('div', { class: 'modal', onclick: (e) => { if (e.target === wrap) close(); } }, sheet);
  build(sheet, close);
  root.append(wrap);
  document.addEventListener('keydown', onKey);
  setTimeout(() => (sheet.querySelector('[autofocus]') || sheet.querySelector('input,button,textarea'))?.focus(), 50);
  return close;
}
export function confirmBox(message, okLabel = 'Confirm') {
  return new Promise((resolve) => {
    modal((sheet, close) => {
      sheet.append(
        h('h3', { class: 'h2' }, message),
        h('div', { class: 'row', style: { marginTop: '20px' } },
          h('button', { class: 'btn primary', onclick: () => { close(); resolve(true); } }, okLabel),
          h('button', { class: 'btn ghost', onclick: () => { close(); resolve(false); } }, 'Cancel')));
    }, { onClose: () => resolve(false) });
  });
}

// ---------- speech ----------
export function speak(text, lang = 'en-GB') {
  if (!('speechSynthesis' in window)) { toast('Your browser cannot read words aloud.', 'bad'); return; }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; u.rate = .9;
  const v = speechSynthesis.getVoices().find((x) => x.lang.startsWith('en') && /Google|Natural|Samantha|Daniel/.test(x.name)) || speechSynthesis.getVoices().find((x) => x.lang.startsWith('en'));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}

// ---------- tiny sounds (WebAudio, no files) ----------
let ac;
export function beep(kind = 'good') {
  if (!getSettings().sound) return;
  try {
    ac ||= new (window.AudioContext || window.webkitAudioContext)();
    const notes = { good: [660, 880], bad: [220, 170], tick: [520], win: [523, 659, 784, 1047] }[kind] || [440];
    notes.forEach((f, i) => {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = kind === 'bad' ? 'sawtooth' : 'sine'; o.frequency.value = f;
      const t0 = ac.currentTime + i * 0.09;
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.12, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
      o.connect(g).connect(ac.destination); o.start(t0); o.stop(t0 + 0.3);
    });
  } catch { /* audio blocked */ }
}

// ---------- confetti ----------
export function confetti(count = 140) {
  if (getSettings().motion === 'calm' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = h('canvas', { class: 'confetti' });
  c.width = innerWidth; c.height = innerHeight;
  document.body.append(c);
  const ctx = c.getContext('2d');
  const cols = ['#7b6cff', '#2fd3b5', '#ff7a6b', '#ffc65c', '#4db8ff'];
  const ps = Array.from({ length: count }, () => ({ x: c.width / 2 + (Math.random() - .5) * 200, y: c.height * .62, vx: (Math.random() - .5) * 16, vy: -Math.random() * 18 - 6, s: 6 + Math.random() * 8, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[(Math.random() * cols.length) | 0] }));
  let frames = 0;
  (function tick() {
    ctx.clearRect(0, 0, c.width, c.height);
    ps.forEach((p) => { p.vy += .5; p.x += p.vx; p.y += p.vy; p.vx *= .99; p.r += p.vr; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
    if (++frames < 170) requestAnimationFrame(tick); else c.remove();
  })();
}

export const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
export const fmtDateTime = (ts) => new Date(ts).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
// A long name gets a smaller type size so it fits on one or two tidy lines.
export function nameScale(name) {
  const n = String(name || '').length;
  return n > 26 ? 'clamp(.88rem, 4.4vw, 1.05rem)' : n > 20 ? 'clamp(1.1rem, 5.5vw, 1.4rem)' : n > 14 ? 'clamp(1.3rem, 6.5vw, 1.9rem)' : '';
}
export function avatarEl(user, { large = false } = {}) {
  const a = user?.avatar || { emoji: '🙂', color: '#7b6cff', frame: 'ring' };
  const el = h('span', { class: `avatar${large ? ' lg' : ''}`, 'data-frame': a.frame, style: { background: `linear-gradient(145deg, ${a.color}, color-mix(in oklab, ${a.color} 55%, #000))`, color: a.color }, 'aria-hidden': 'true' });
  if (a.pic && hasAvatar(a.pic)) {
    el.classList.add('pic');
    const art = h('span', { class: 'art' }); art.innerHTML = avatarSvg(a.pic);   // our own drawings, never user text
    el.append(art);
  } else el.append(h('span', { style: { color: '#fff' } }, a.emoji));
  return el;
}
