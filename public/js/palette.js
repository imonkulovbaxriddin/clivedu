// Search everything: pages, lessons and words. Open with / or Ctrl/Cmd+K.
import { h, modal, icon } from './ui.js';
import { content } from './store.js';
import { go } from './router.js';
import { uzOf } from './i18n.js';

export function openPalette() {
  const pages = [
    ['Home', '/'], ['Lessons', '/lessons'], ['Word Galaxy', '/words'], ['Games', '/play'], ['Class arena (host)', '/arena'],
    ['Homework', '/homework'], ['My profile', '/me'], ['Settings', '/settings'],
  ].map(([t, to]) => ({ t, to, kind: 'page' }));
  const lessons = content.lessons.map((l) => ({ t: l.title, to: `/lesson/${l.id}`, kind: l.kind === 'vocab' ? 'vocabulary lesson' : 'grammar', em: l.emoji }));
  const words = content.vocab.flatMap((s) => s.words.map((w) => ({ t: w.w, sub: uzOf(w) ? `${w.uz} · ${w.def}` : w.def, to: `/words?w=${encodeURIComponent(s.id + ':' + w.w)}`, kind: 'word', em: s.emoji })));
  const all = [...pages, ...lessons, ...words];

  modal((sheet, close) => {
    let sel = 0, results = [];
    const input = h('input', { class: 'pal-input', placeholder: 'Search lessons, words, pages…', 'aria-label': 'Search', autofocus: true });
    const list = h('div', { class: 'pal-list', role: 'listbox' });
    const draw = () => {
      const q = input.value.trim().toLowerCase();
      results = (q ? all.filter((x) => (x.t + ' ' + (x.sub || '')).toLowerCase().includes(q)) : all.slice(0, 14)).slice(0, 30);
      sel = Math.min(sel, Math.max(0, results.length - 1));
      list.replaceChildren(...(results.length ? results.map((r, i) => h('button', {
        class: 'pal-item', role: 'option', 'aria-selected': String(i === sel), onclick: () => { close(); go(r.to); },
      }, h('span', r.em || '➜'), h('span', h('b', r.t), r.sub ? h('div', { class: 'small muted' }, r.sub) : null), h('small', r.kind))) : [h('p', { class: 'muted', style: { padding: '14px' } }, 'Nothing found. Try another word.')]));
    };
    input.addEventListener('input', () => { sel = 0; draw(); });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { sel = Math.min(results.length - 1, sel + 1); draw(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
      if (e.key === 'Enter' && results[sel]) { close(); go(results[sel].to); }
    });
    sheet.append(h('div', { class: 'row' }, icon('search', 22), h('span', { class: 'muted small' }, 'Press Esc to close')), input, list);
    draw();
  });
}

export function initPalette() {
  document.addEventListener('keydown', (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName);
    if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') || (!typing && e.key === '/')) { e.preventDefault(); openPalette(); }
  });
}
