// Navigation without a bar: the orbit dial. One orb at the bottom; it blooms into
// six labelled petals on an arc. Plus a tiny top corner (profile, settings, search).
import { h, icon, avatarEl, $ } from './ui.js';
import { getUser, isTeacher, on, getSettings, setSetting } from './store.js';
import { t, uiLang } from './i18n.js';
import { go, current } from './router.js';
import { openPalette } from './palette.js';

const ITEMS = [
  { to: '/', label: 'Home', icon: 'home', key: '1' },
  { to: '/lessons', label: 'Lessons', icon: 'book', key: '2' },
  { to: '/words', label: 'Words', icon: 'galaxy', key: '3' },
  { to: '/play', label: 'Play', icon: 'play', key: '4' },
  { to: '/homework', label: 'Homework', icon: 'pencil', key: '5' },
  { to: '/me', label: 'Me', icon: 'user', key: '6' },
];
let badge = 0;
export const setHomeworkBadge = (n) => { badge = n; renderDial(); };

const dial = () => document.getElementById('dial');

function arc(i, n, radius) {
  // fan from 190deg to -10deg so petals clear the orb and the screen edges
  const a0 = Math.PI * 1.03, a1 = -Math.PI * 0.03;
  const a = a0 + (a1 - a0) * (i / (n - 1));
  const x = Math.cos(a) * radius, y = -Math.sin(a) * radius - 6;
  return [Math.round(x), Math.round(y)];
}

export function renderDial() {
  const el = dial();
  const open = el.classList.contains('open');
  const narrow = innerWidth < 760;
  const radius = narrow ? Math.min(150, innerWidth / 2 - 44) : 176;
  const cur = current();
  const active = ITEMS.find((i) => (i.to === '/' ? cur.path === '/' : cur.path.startsWith(i.to)));
  const petals = ITEMS.map((it, i) => {
    const [x, y] = arc(i, ITEMS.length, radius);
    const a = h('a', {
      class: 'petal', href: `#${it.to}`, style: { '--x': `${x}px`, '--y': `${y - (narrow ? 70 : 30)}px`, '--i': i },
      'aria-label': t(it.label), 'aria-current': active === it ? 'page' : null, tabindex: open ? 0 : -1,
      onclick: () => toggle(false),
    }, icon(it.icon), h('b', t(it.label)));
    if (it.to === '/homework' && badge > 0) a.append(h('span', { class: 'dot' }, String(badge)));
    return a;
  });
  const orb = h('button', {
    class: 'orb', 'aria-expanded': String(open), 'aria-label': open ? t('Close menu') : t('Open menu'),
    onclick: () => toggle(),
  }, icon('menu'));
  const label = h('div', { class: 'orb-label glass' }, active ? t(active.label) : (cur.path.startsWith('/lesson') ? t('Lesson') : 'ClivEdu'));
  el.replaceChildren(h('div', { class: 'scrim', onclick: () => toggle(false) }), ...petals, label, orb);
}

export function toggle(force) {
  const el = dial();
  const open = force ?? !el.classList.contains('open');
  el.classList.toggle('open', open);
  el.querySelector('.orb')?.setAttribute('aria-expanded', String(open));
  el.querySelectorAll('.petal').forEach((p) => (p.tabIndex = open ? 0 : -1));
  if (open) el.querySelector('.petal[aria-current="page"], .petal')?.focus();
}

export function renderTop() {
  const user = getUser();
  const top = $('#top');
  top.replaceChildren(
    h('a', { class: 'mark', href: '#/', 'aria-label': 'ClivEdu home' }, h('i'), h('span', 'ClivEdu')),
    h('div', { class: 'topright' },
      isTeacher() ? h('a', { class: 'btn sm', href: '#/teacher' }, icon('desk', 18), t('Teacher desk')) : null,
      h('button', { class: 'btn iconbtn glass', 'aria-label': t('Search (press /)'), onclick: openPalette }, icon('search', 20)),
      h('button', { class: 'btn sm glass', style: { fontWeight: 800, minWidth: '46px' }, 'aria-label': 'Language: Uzbek or English', title: 'O‘zbekcha / English', onclick: () => { setSetting('ui', uiLang() === 'uz' ? 'en' : 'uz'); location.reload(); } }, uiLang() === 'uz' ? 'UZ' : 'EN'),
      h('a', { class: 'btn iconbtn glass', href: '#/settings', 'aria-label': t('Settings') }, icon('gear', 20)),
      user
        ? h('a', { href: '#/me', 'aria-label': t('Your profile'), style: { textDecoration: 'none' } }, avatarEl(user))
        : h('a', { class: 'btn primary sm', href: '#/login' }, t('Log in'))));
}

export function initNav() {
  renderTop(); renderDial();
  on('session', () => { renderTop(); renderDial(); });
  addEventListener('resize', renderDial);
  on('route', renderDial);
  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
    if (e.key === 'Escape') toggle(false);
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'm' || e.key === 'M') toggle();
    if (dial().classList.contains('open')) {
      const it = ITEMS.find((i) => i.key === e.key);
      if (it) { toggle(false); go(it.to); }
    }
  });
}
