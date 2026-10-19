import { h, icon, toast, avatarEl, fmtDate } from '../ui.js';
import { getUser, D, level, content, allWords, BADGES, updateUser, todayKey, isDue } from '../store.js';
import { api, net } from '../api.js';
import { homeworkState, refreshHomework } from '../notify.js';
import { shareSky } from '../share.js';
import { t } from '../i18n.js';

const EMOJI = ['🦊', '🐼', '🦁', '🐯', '🐙', '🦄', '🐲', '🦉', '🐬', '🦋', '🐢', '🦖', '🚀', '🌟', '🎧', '🎨', '📚', '⚽', '🎸', '🌈', '🍀', '🔥', '🌙', '🧠'];
const COLORS = ['#7b6cff', '#2fd3b5', '#ff7a6b', '#ffb84d', '#4db8ff', '#f06bd0', '#8bd450', '#9a6bff'];

export function render(root, _p, query) {
  const user = getUser();
  let tab = query?.get('tab') || 'progress';
  const body = h('div');
  const tabs = h('div', { class: 'tabs seg', role: 'tablist' });
  const top = h('section', { class: 'profile-top glass' });

  const paintTop = () => {
    const u = getUser(); const d = D(); const lv = level(d.xp);
    top.replaceChildren(
      avatarEl(u, { large: true }),
      h('div', { class: 'grow stack', style: { gap: '4px' } },
        h('h1', { class: 'h1' }, u ? u.displayName : 'Guest learner'),
        u?.bio ? h('p', { class: 'lede' }, u.bio) : h('p', { class: 'muted' }, u ? 'Add a short bio in Customize.' : 'Log in to pick a name and customise your profile.'),
        h('div', { class: 'row' },
          u ? h('span', { class: 'chip on', title: t('Your English level. Your teacher sets it.') }, `🎓 ${u.level || 'A1'}`) : null, h('span', { class: 'chip' }, `${t('Level')} ${lv.lv}`), h('span', { class: 'chip' }, `${d.xp} XP`), h('span', { class: 'chip' }, `🔥 ${d.streak.count} ${t('day streak')}`),
          u?.goal ? h('span', { class: 'chip' }, `🎯 ${u.goal}`) : null),
        h('div', { class: 'timer', style: { marginTop: '8px', maxWidth: '340px' }, role: 'progressbar', 'aria-valuenow': lv.pct, 'aria-label': 'Progress to next level' }, h('i', { style: { transform: `scaleX(${lv.pct / 100})` } })),
        h('span', { class: 'small muted' }, `${lv.need - lv.into} XP ${t('to level')} ${lv.lv + 1}`)),
      h('div', { class: 'stack' }, h('button', { class: 'btn primary', onclick: shareSky }, icon('share', 18), t('Show off my sky')), !u ? h('a', { class: 'btn', href: '#/login' }, 'Log in') : null));
  };

  const setTab = (t) => { tab = t; paintTabs(); body.replaceChildren(({ progress, homework, customize }[t])()); };
  const paintTabs = () => tabs.replaceChildren(...[['progress', t('Progress')], ['homework', t('Homework')], ['customize', t('Customize')]].map(([v, l]) => h('button', { role: 'tab', 'aria-pressed': String(tab === v), onclick: () => setTab(v) }, l, v === 'homework' && homeworkState.list.filter((x) => !x.done).length ? ` (${homeworkState.list.filter((x) => !x.done).length})` : '')));

  // ----- progress -----
  function progress() {
    const d = D(); const words = allWords();
    const known = words.filter((w) => d.words[w.key]?.seen).length;
    const mastered = words.filter((w) => (d.words[w.key]?.box || 0) >= 5).length;
    const due = words.filter((w) => isDue(w.key)).length;
    const pct = (n) => Math.round((n / Math.max(1, words.length)) * 100);
    const learning = d.learning && content.lessons.find((l) => l.id === d.learning);
    const days = Array.from({ length: 7 }, (_, i) => { const dt = new Date(Date.now() - (6 - i) * 864e5); return { k: todayKey(dt), l: dt.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2) }; });
    const max = Math.max(20, ...days.map((x) => d.days[x.k] || 0));
    return h('div', { class: 'stack' },
      h('section', { class: 'glass card' }, h('h2', { class: 'h2' }, t('Learning right now')),
        learning ? h('div', { class: 'row between', style: { marginTop: '12px' } }, h('div', h('div', { style: { fontSize: '2.2rem' } }, learning.emoji), h('h3', { class: 'h2' }, learning.title), h('p', { class: 'muted' }, learning.summary)), h('a', { class: 'btn primary', href: `#/lesson/${learning.id}` }, t('Continue lesson')))
          : h('p', { class: 'muted', style: { marginTop: '8px' } }, 'You have not opened a lesson yet. ', h('a', { href: '#/lessons' }, 'Pick one to start.'))),
      h('div', { class: 'grid', style: { gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' } },
        h('section', { class: 'glass card row', style: { flexWrap: 'nowrap' } }, h('div', { class: 'ring', style: { '--p': pct(known) } }, h('b', `${pct(known)}%`)), h('div', h('h3', { class: 'h3' }, t('Stars discovered')), h('p', { class: 'muted' }, `${known} of ${words.length} words`))),
        h('section', { class: 'glass card row', style: { flexWrap: 'nowrap' } }, h('div', { class: 'ring', style: { '--p': pct(mastered) } }, h('b', `${pct(mastered)}%`)), h('div', h('h3', { class: 'h3' }, t('Words mastered')), h('p', { class: 'muted' }, `${mastered} golden suns`))),
        h('section', { class: 'glass card stack' }, h('h3', { class: 'h3' }, t('This week')), h('div', { class: 'bars', role: 'img', 'aria-label': 'XP earned in the last 7 days' }, days.map((x) => h('div', h('i', { style: { height: `${Math.max(4, ((d.days[x.k] || 0) / max) * 100)}%` }, title: `${d.days[x.k] || 0} XP` }), x.l)))),
      ),
      due ? h('a', { class: 'glass card row between', href: '#/words?review=1', style: { textDecoration: 'none', borderColor: 'var(--coral)' } }, h('span', h('b', `${due} words are fading.`), ' A quick orbit review brings them back.'), h('span', { class: 'btn sm' }, 'Review now')) : null,
      h('section', { class: 'glass card stack' }, h('h2', { class: 'h2' }, t('Badges')),
        h('div', { class: 'badges' }, BADGES.map((b) => { const got = d.badges.includes(b.id); return h('div', { class: `badge glass${got ? '' : ' locked'}`, title: b.desc }, h('div', { class: 'em' }, b.em), h('b', { class: 'small' }, b.name), h('span', { class: 'hint' }, b.desc)); }))),
      h('section', { class: 'glass card stack' }, h('h2', { class: 'h2' }, t('Lessons')), h('div', { class: 'chips' }, d.favorites.length ? d.favorites.map((id) => { const l = content.lessons.find((x) => x.id === id); return l ? h('a', { class: 'chip', href: `#/lesson/${id}` }, `💜 ${l.title}`) : null; }) : h('span', { class: 'muted' }, 'Favorite lessons will appear here.')),
        d.lessonsDone.length ? h('p', { class: 'muted' }, `${d.lessonsDone.length} lesson${d.lessonsDone.length === 1 ? '' : 's'} learned.`) : null));
  }

  // ----- homework (compact) -----
  function homework() {
    const box = h('div', { class: 'stack' });
    if (!user) { box.append(h('div', { class: 'empty glass card' }, h('p', { class: 'muted' }, 'Log in to see homework from your teacher.'), h('a', { class: 'btn primary', href: '#/login?next=/homework' }, 'Log in'))); return box; }
    const paint = () => {
      const open = homeworkState.list.filter((x) => !x.done);
      box.replaceChildren(
        open.length ? open.slice(0, 5).map((x) => h('article', { class: `hw glass${x.due && x.due < Date.now() ? ' late' : ''}` }, h('b', x.title), x.body ? h('p', { class: 'muted small' }, x.body.slice(0, 140) + (x.body.length > 140 ? '…' : '')) : null, x.due ? h('span', { class: 'small muted' }, `Due ${fmtDate(x.due)}`) : null))
          : h('div', { class: 'empty glass card' }, h('div', { class: 'em' }, '🎉'), h('p', { class: 'lede' }, net.backend ? 'No homework waiting.' : 'Connect the server to load homework.')),
        h('a', { class: 'btn', href: '#/homework' }, t('Open all homework')));
    };
    paint(); refreshHomework({ announce: false }).then(() => { if (tab === 'homework') { paint(); paintTabs(); } });
    return box;
  }

  // ----- customize -----
  function customize() {
    if (!user) return h('div', { class: 'empty glass card' }, h('div', { class: 'em' }, '🎨'), h('h2', { class: 'h2' }, 'Log in to customise your profile'), h('p', { class: 'muted' }, 'Choose how you want to be called, pick an avatar and write a short bio.'), h('a', { class: 'btn primary', href: '#/login?signup=1' }, 'Create account'));
    const u = getUser();
    const draft = { displayName: u.displayName, bio: u.bio || '', goal: u.goal || '', avatar: { ...u.avatar } };
    const preview = h('div', { class: 'row' });
    const paintPreview = () => preview.replaceChildren(avatarEl({ avatar: draft.avatar }, { large: true }), h('div', h('b', { class: 'h2' }, draft.displayName || '…'), h('div', { class: 'muted' }, draft.bio)));
    const emojiBox = h('div', { class: 'emoji-pick' }), colorBox = h('div', { class: 'swatches' }), frameBox = h('div', { class: 'seg' });
    const paintPickers = () => {
      emojiBox.replaceChildren(...EMOJI.map((e) => h('button', { 'aria-pressed': String(draft.avatar.emoji === e), 'aria-label': `Avatar ${e}`, onclick: () => { draft.avatar.emoji = e; paintPickers(); paintPreview(); } }, e)));
      colorBox.replaceChildren(...COLORS.map((c) => h('button', { class: 'swatch', style: { background: c }, 'aria-label': `Avatar colour ${c}`, 'aria-pressed': String(draft.avatar.color === c), onclick: () => { draft.avatar.color = c; paintPickers(); paintPreview(); } })));
      frameBox.replaceChildren(...[['ring', 'Ring'], ['glow', 'Glow'], ['dash', 'Dashed'], ['none', 'None']].map(([v, l]) => h('button', { 'aria-pressed': String(draft.avatar.frame === v), onclick: () => { draft.avatar.frame = v; paintPickers(); paintPreview(); } }, l)));
    };
    const err = h('p', { class: 'error', role: 'alert' });
    const saveBtn = h('button', { class: 'btn primary', onclick: async () => {
      err.textContent = ''; saveBtn.disabled = true;
      try { const { user: nu } = await api.patch('/api/me', draft); updateUser(nu); paintTop(); toast('Profile saved', 'good'); } catch (e) { err.textContent = e.message; }
      saveBtn.disabled = false;
    } }, t('Save profile'));
    paintPickers(); paintPreview();
    return h('div', { class: 'glass card stack' },
      preview,
      h('div', { class: 'field' }, h('label', { for: 'dn' }, t('What should we call you?')), h('input', { id: 'dn', value: draft.displayName, maxlength: 32, oninput: (e) => { draft.displayName = e.target.value; paintPreview(); } }), h('span', { class: 'hint' }, 'This name shows on your profile and on the poster you share.')),
      h('div', { class: 'field' }, h('label', { for: 'bio' }, 'Short bio'), h('input', { id: 'bio', value: draft.bio, maxlength: 160, placeholder: 'e.g. Learning English for my university exams', oninput: (e) => { draft.bio = e.target.value; paintPreview(); } })),
      h('div', { class: 'field' }, h('label', { for: 'goal' }, 'My goal'), h('input', { id: 'goal', value: draft.goal, maxlength: 80, placeholder: 'e.g. IELTS 7.0 by June', oninput: (e) => { draft.goal = e.target.value; } })),
      h('div', { class: 'field' }, h('label', t('Avatar')), emojiBox), h('div', { class: 'field' }, h('label', t('Colour')), colorBox), h('div', { class: 'field' }, h('label', t('Frame')), frameBox),
      err, h('div', { class: 'row' }, saveBtn),
      passwordBox());
  }

  function passwordBox() {
    const cur = h('input', { type: 'password', autocomplete: 'current-password', id: 'pw0' });
    const nw = h('input', { type: 'password', autocomplete: 'new-password', id: 'pw1', minlength: 8 });
    const msg = h('p', { class: 'error', role: 'alert' });
    const go = h('button', { class: 'btn', onclick: async () => {
      msg.textContent = ''; go.disabled = true;
      try { await api.post('/api/me/password', { current: cur.value, next: nw.value }); cur.value = ''; nw.value = ''; toast(t('Password changed'), 'good'); } catch (e) { msg.textContent = e.message; }
      go.disabled = false;
    } }, t('Change password'));
    return h('div', { class: 'stack', style: { borderTop: '1px solid var(--line)', paddingTop: '16px' } },
      h('h3', { class: 'h3' }, t('Password')),
      h('div', { class: 'field' }, h('label', { for: 'pw0' }, t('Current password (leave empty if you signed in with Google)')), cur),
      h('div', { class: 'field' }, h('label', { for: 'pw1' }, t('New password (at least 8 characters)')), nw),
      msg, h('div', { class: 'row' }, go));
  }

  root.append(top, tabs, body);
  paintTop(); setTab(tab);
}
