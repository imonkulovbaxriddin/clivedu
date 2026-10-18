import { h, icon } from '../ui.js';
import { content, D, toggleIn, isTeacher, getUser } from '../store.js';
import { t } from '../i18n.js';

import { trLang } from '../i18n.js';
const trOn = () => trLang() === 'uz';

export function lessonCard(l, onFav) {
  const d = D();
  const fav = d.favorites.includes(l.id);
  const done = d.lessonsDone.includes(l.id);
  const favBtn = h('button', { class: 'fav-btn fav', 'aria-pressed': String(fav), 'aria-label': fav ? `Remove ${l.title} from favorites` : `Add ${l.title} to favorites`, onclick: (e) => {
    e.preventDefault(); e.stopPropagation();
    const on = toggleIn('favorites', l.id);
    favBtn.setAttribute('aria-pressed', String(on));
    favBtn.setAttribute('aria-label', on ? `Remove ${l.title} from favorites` : `Add ${l.title} to favorites`);
    onFav?.();
  } }, icon('heart'));
  return h('a', { class: 'lesson glass', href: `#/lesson/${l.id}` },
    favBtn,
    h('span', { class: 'em', 'aria-hidden': 'true' }, l.emoji || '📘'),
    h('h3', { class: 'h2' }, l.title),
    h('p', { class: 'muted small' }, (l.summaryUz && trOn() ? l.summaryUz : l.summary) || (l.kind === 'vocab' ? t('Vocabulary lesson') : t('Grammar lesson'))),
    h('div', { class: 'row' },
      h('span', { class: `chip${getUser()?.level === l.level ? ' on' : ''}` }, l.level),
      h('span', { class: 'chip' }, l.kind === 'vocab' ? t('Vocabulary') : t('Grammar')),
      done ? h('span', { class: 'chip', style: { color: 'var(--mint)' } }, '✓ ' + t('Learned')) : null,
      (l.hasFile || l.hasPptx) ? (l.unlocked ? h('span', { class: 'lock', style: { color: 'var(--mint)' } }, icon('book', 16), t('Slides open')) : h('span', { class: 'lock muted' }, icon('lock', 16), t('Preview'))) : null));
}

export function render(root) {
  const state = { kind: 'all', level: getUser() && !isTeacher() ? 'mine' : 'all', fav: false, q: '' };
  const grid = h('div', { class: 'grid' });
  const count = h('span', { class: 'muted small' });
  const levels = [...(getUser() && !isTeacher() ? ['mine'] : []), 'all', ...new Set(content.lessons.map((l) => l.level))];

  const draw = () => {
    const list = content.lessons.filter((l) =>
      (state.kind === 'all' || l.kind === state.kind) && (state.level === 'all' || l.level === (state.level === 'mine' ? (getUser()?.level || 'A1') : state.level)) &&
      (!state.fav || D().favorites.includes(l.id)) && (!state.q || (l.title + ' ' + l.summary).toLowerCase().includes(state.q)));
    count.textContent = `${list.length} ${list.length === 1 ? t('lesson') : t('lessons')}`;
    grid.replaceChildren(...(list.length ? list.map((l) => lessonCard(l, state.fav ? draw : undefined)) : [h('div', { class: 'empty glass card', style: { gridColumn: '1 / -1' } },
      h('div', { class: 'em' }, state.fav ? '💜' : '🔎'), h('h3', { class: 'h2' }, state.fav ? t('No favorites yet') : t('No lessons match')),
      h('p', { class: 'muted' }, state.fav ? t('Tap the heart on any lesson to keep it here.') : t('Try a different level or clear the search.')), state.level === 'mine' ? h('button', { class: 'btn', onclick: () => { state.level = 'all'; levelBox.paint(); draw(); } }, t('Show all levels')) : null)]));
  };

  const seg = (key, options) => {
    const box = h('div', { class: 'seg', role: 'group' });
    const paint = () => box.replaceChildren(...options.map(([v, label]) => h('button', { 'aria-pressed': String(state[key] === v), onclick: () => { state[key] = v; paint(); draw(); } }, label)));
    paint();
    box.paint = paint;
    return box;
  };

  const levelBox = seg('level', levels.map((x) => [x, x === 'all' ? t('Any level') : x === 'mine' ? `⭐ ${t('My level')} (${getUser()?.level || 'A1'})` : x]));

  root.append(
    h('header', { class: 'page-head' },
      h('h1', { class: 'h1' }, t('Lessons')),
      h('p', { class: 'lede' }, t('Grammar and vocabulary. Open any lesson for quick notes; slides unlock when your teacher shares them with you.'))),
    content.starter && isTeacher() ? h('div', { class: 'glass card', style: { marginBottom: '16px' } }, h('b', 'You are seeing starter lessons. '), h('a', { href: '#/teacher' }, 'Open the Teacher desk'), ' to publish your own.') : null,
    h('div', { class: 'toolbar' },
      seg('kind', [['all', t('All')], ['grammar', t('Grammar')], ['vocab', t('Vocabulary')]]),
      levelBox,
      h('button', { class: 'chip', 'aria-pressed': 'false', onclick: (e) => { state.fav = !state.fav; e.currentTarget.classList.toggle('on', state.fav); e.currentTarget.setAttribute('aria-pressed', String(state.fav)); draw(); } }, icon('heart', 15), t('Favorites')),
      h('input', { type: 'search', placeholder: t('Search lessons'), 'aria-label': t('Search lessons'), style: { maxWidth: '220px' }, oninput: (e) => { state.q = e.target.value.toLowerCase(); draw(); } }),
      count),
    grid);
  draw();
}
