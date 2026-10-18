import { h } from '../ui.js';
import { unb64, drawCard } from '../share.js';

export function render(root, { code }) {
  const s = unb64(code);
  if (!s || typeof s.n !== 'string') {
    root.append(h('div', { class: 'empty' }, h('div', { class: 'em' }, '🔗'), h('h1', { class: 'h1' }, 'This share link is broken'), h('p', { class: 'muted' }, 'Ask your friend to share their sky again.'), h('a', { class: 'btn primary', href: '#/' }, 'Go to ClivEdu')));
    return;
  }
  const clean = { n: String(s.n).slice(0, 16), e: String(s.e || '🦊').slice(0, 8), c: /^#[0-9a-f]{6}$/i.test(s.c) ? s.c : '#7b6cff', l: +s.l || 1, x: +s.x || 0, s: +s.s || 0, w: +s.w || 0, m: +s.m || 0, b: +s.b || 0, bb: Array.isArray(s.bb) ? s.bb.slice(0, 8).map(String) : [], k: String(s.k || '').replace(/[^0-5]/g, '').slice(0, 80) };
  const canvas = document.createElement('canvas');
  drawCard(canvas, clean);
  canvas.className = 'share-img';
  canvas.style.height = 'auto';
  root.append(
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, `${clean.n}’s sky`), h('p', { class: 'lede' }, `${clean.w} words discovered, ${clean.m} mastered. Can you beat that?`)),
    canvas,
    h('div', { class: 'row', style: { marginTop: '20px' } }, h('a', { class: 'btn primary', href: '#/login' }, 'Create your own sky'), h('a', { class: 'btn', href: '#/' }, 'Look around')));
}
