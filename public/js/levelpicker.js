// "What is your English level?" cards, used at sign-up and in the first-login prompt.
import { h, toast, modal } from './ui.js';
import { LEVELS } from './data/levels.js';
import { t, uiLang } from './i18n.js';
import { api, net } from './api.js';
import { getSession, updateUser } from './store.js';

// Returns { el, get() }. Starts with nothing chosen so students make a real choice.
export function levelPicker(initial = null) {
  let value = initial;
  const box = h('div', { class: 'levels', role: 'radiogroup', 'aria-label': t('Your English level') });
  const paint = () => box.replaceChildren(...LEVELS.map((l) => {
    const on = value === l.id;
    return h('button', { type: 'button', class: `level${on ? ' on' : ''}`, role: 'radio', 'aria-checked': String(on), onclick: () => { value = l.id; paint(); } },
      h('div', { class: 'row', style: { flexWrap: 'nowrap', gap: '10px' } },
        h('span', { class: 'lv-badge' }, l.emoji, h('b', l.id)),
        h('div', h('b', uiLang() === 'uz' ? `${l.uz} · ${l.name}` : l.name), h('div', { class: 'small muted' }, uiLang() === 'uz' ? l.uzText : l.en))),
      h('div', { class: 'lv-words' },
        ...l.words.map(([en, uz]) => h('span', { class: 'chip' }, en, h('i', ` · ${uz}`))),
        h('span', { class: 'lv-say' }, `“${l.say}”`)));
  }));
  paint();
  return {
    el: h('div', { class: 'stack' }, box,
      h('p', { class: 'hint' }, t('Not sure? Choose A1. Your teacher will move you to the right level after your first lessons.'))),
    get: () => value,
  };
}

// "Which group are you in?" The teacher names the groups, so they come from the server.
export function groupPicker(initial = null) {
  let value = initial;
  const box = h('div', { class: 'levels', role: 'radiogroup', 'aria-label': t('Your group') });
  const paint = () => box.replaceChildren(...net.groups.map((g) => {
    const on = value === g.id;
    const l = LEVELS.find((x) => x.id === g.level);
    return h('button', { type: 'button', class: `level${on ? ' on' : ''}`, role: 'radio', 'aria-checked': String(on), onclick: () => { value = g.id; paint(); } },
      h('div', { class: 'row', style: { flexWrap: 'nowrap', gap: '10px' } },
        h('span', { class: 'lv-badge' }, l ? l.emoji : '👥', l ? h('b', l.id) : null),
        h('div', h('b', g.name), l ? h('div', { class: 'small muted' }, uiLang() === 'uz' ? l.uzText : l.en) : null)),
      l ? h('div', { class: 'lv-words' }, ...l.words.map(([en, uz]) => h('span', { class: 'chip' }, en, h('i', ` · ${uz}`))), h('span', { class: 'lv-say' }, `“${l.say}”`)) : null);
  }));
  paint();
  return { el: h('div', { class: 'stack' }, box, h('p', { class: 'hint' }, t('Not sure which group? Ask your teacher. They can move you later.'))), get: () => value };
}

// First-login prompt for accounts that have not chosen a level yet (for example Google sign-ups).
export function askLevelOnce(user) {
  if (!user || user.role === 'teacher') return;
  const useGroups = net.askGroup && net.groups.length;
  if (useGroups ? user.groupSet : user.levelSet) return;
  modal((sheet, close) => {
    const picker = useGroups ? groupPicker() : levelPicker();
    const err = h('p', { class: 'error', role: 'alert' });
    sheet.append(
      h('h2', { class: 'h2' }, useGroups ? t('Which group are you in?') : t('What is your English level?')),
      h('p', { class: 'muted', style: { margin: '6px 0 14px' } }, useGroups ? t('Choose the group your teacher put you in.') : t('Pick the box that sounds most like you. You can start with A1 if you are new.')),
      picker.el, err,
      h('div', { class: 'row', style: { marginTop: '14px' } }, h('button', { class: 'btn primary', onclick: async () => {
        if (!picker.get()) { err.textContent = useGroups ? t('Please choose a group.') : t('Please choose a level.'); return; }
        try {
          const r = useGroups ? await api.post('/api/me/group', { groupId: picker.get() }) : await api.post('/api/me/level', { level: picker.get() });
          updateUser(r.user); toast(t('Saved'), 'good'); close();
        } catch (e) { err.textContent = e.message; }
      } }, t('Save'))));
  });
}
