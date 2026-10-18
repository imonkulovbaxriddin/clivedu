import { transition } from './transition.js';
import { h, clear, safe } from './ui.js';
import { emit } from './store.js';

// path pattern -> lazy page module. Pages export render(root, params) and may return a cleanup fn.
const ROUTES = [
  ['/', () => import('./pages/home.js')],
  ['/lessons', () => import('./pages/lessons.js')],
  ['/lesson/:id', () => import('./pages/lesson.js')],
  ['/words', () => import('./pages/galaxy.js')],
  ['/play', () => import('./pages/play.js')],
  ['/play/:game', () => import('./pages/play.js')],
  ['/arena', () => import('./pages/arena.js')],
  ['/homework', () => import('./pages/homework.js')],
  ['/me', () => import('./pages/profile.js')],
  ['/settings', () => import('./pages/settings.js')],
  ['/login', () => import('./pages/auth.js')],
  ['/teacher', () => import('./pages/teacher.js')],
  ['/s/:code', () => import('./pages/shared.js')],
];
const compiled = ROUTES.map(([p, load]) => {
  const keys = [];
  const re = new RegExp('^' + p.replace(/:[a-z]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)'; }) + '/?$');
  return { p, re, keys, load };
});

let cur = { path: '/', params: {} };
let cleanup = null;
let busy = false, pending = null;
export const current = () => cur;
export const go = (path) => { location.hash = '#' + path; };

function parse() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const path = raw.split('?')[0] || '/';
  for (const r of compiled) {
    const m = path.match(r.re);
    if (m) { const params = {}; r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1]))); return { path, params, load: r.load, query: new URLSearchParams(raw.split('?')[1] || '') }; }
  }
  return { path: '/404', params: {}, load: null, query: new URLSearchParams() };
}

const section = (p) => '/' + (p.split('/')[1] || '');
let first = true;

async function show() {
  if (busy) { pending = true; return; }
  busy = true;
  const next = parse();
  const view = document.getElementById('view');
  const same = !first && section(next.path) === section(cur.path);
  const swap = async () => {
    cleanup?.(); cleanup = null;
    clear(view);
    cur = { path: next.path, params: next.params, query: next.query };
    scrollTo(0, 0);
    document.body.dataset.page = section(next.path).slice(1) || 'home';
    if (!next.load) {
      view.append(h('div', { class: 'empty page-enter' }, h('div', { class: 'em' }, '🛰️'), h('h1', { class: 'h1' }, 'Lost in space'), h('p', { class: 'lede' }, 'This page does not exist.'), h('a', { class: 'btn primary', href: '#/' }, 'Back home')));
      return;
    }
    view.append(h('div', { class: 'empty' }, h('p', { class: 'muted' }, 'Loading…')));
    try {
      const mod = await next.load();
      clear(view);
      const root = safe(h('div', { class: 'page-enter' }));
      view.append(root);
      cleanup = (await mod.render(root, next.params, next.query)) || null;
    } catch (e) {
      console.error(e);
      clear(view);
      view.append(h('div', { class: 'empty' }, h('div', { class: 'em' }, '⚠️'), h('h2', { class: 'h2' }, 'This page did not load'), h('p', { class: 'muted' }, e.message || 'Reload the page and try again.'), h('button', { class: 'btn primary', onclick: () => location.reload() }, 'Reload')));
    }
    view.focus({ preventScroll: true });
    emit('route', cur);
    document.title = (document.body.dataset.page === 'home' ? 'ClivEdu' : 'ClivEdu · ' + document.body.dataset.page);
  };
  if (first) { first = false; await swap(); }
  else await transition(swap, { quick: same });
  busy = false;
  if (pending) { pending = null; show(); }
}

export function initRouter() {
  addEventListener('hashchange', show);
  return show();
}
export const rerender = () => { first = false; return show(); };
