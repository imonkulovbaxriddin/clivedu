import { h, icon, toast, fmtDate, confetti, beep } from '../ui.js';
import { getUser, addXP } from '../store.js';
import { api, net } from '../api.js';
import { refreshHomework, homeworkState, markHomeworkSeen, enableNotifications, disableNotifications, notificationPermission, notificationsSupported } from '../notify.js';
import { getSettings, content } from '../store.js';
import { t } from '../i18n.js';

export async function render(root) {
  const user = getUser();
  if (!user) {
    root.append(h('div', { class: 'empty glass card' }, h('div', { class: 'em' }, '📝'), h('h1', { class: 'h1' }, t('Your homework lives here')), h('p', { class: 'lede' }, t('Log in to see the tasks your teacher gives you.')), h('div', { class: 'row' }, h('a', { class: 'btn primary', href: '#/login?next=/homework' }, t('Log in')), h('a', { class: 'btn', href: '#/login?signup=1' }, t('Create account')))));
    return;
  }
  const list = h('div', { class: 'stack' });
  let filter = 'todo';
  root.append(
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('Homework')), h('p', { class: 'lede' }, t('Tasks from your teacher. Tick them off when you are done.'))),
    notifyCard(),
    h('div', { class: 'toolbar' }, seg()),
    list);

  function seg() {
    const box = h('div', { class: 'seg' });
    const paint = () => box.replaceChildren(...[['todo', t('To do')], ['done', t('Done')], ['all', t('All')]].map(([v, l]) => h('button', { 'aria-pressed': String(filter === v), onclick: () => { filter = v; paint(); draw(); } }, l)));
    paint(); return box;
  }
  function draw() {
    if (!net.backend) { list.replaceChildren(h('div', { class: 'empty glass card' }, h('div', { class: 'em' }, '🔌'), h('p', { class: 'muted' }, 'The server is not connected, so homework cannot load right now.'))); return; }
    const all = homeworkState.list;
    const items = all.filter((x) => filter === 'all' || (filter === 'done' ? x.done : !x.done));
    if (!items.length) { list.replaceChildren(h('div', { class: 'empty glass card' }, h('div', { class: 'em' }, filter === 'done' ? '📭' : '🎉'), h('h2', { class: 'h2' }, filter === 'done' ? t('Nothing finished yet') : t('You are all caught up')), h('p', { class: 'muted' }, filter === 'done' ? t('Completed homework will show up here.') : t('No homework waiting. Why not play a quick game?')), h('a', { class: 'btn', href: '#/play' }, t('Play a game')))); return; }
    list.replaceChildren(...items.map(card));
  }
  function card(x) {
    const late = !x.done && x.due && x.due < Date.now();
    const lesson = x.lessonId && content.lessons.find((l) => l.id === x.lessonId);
    const box = h('input', { type: 'checkbox', checked: !!x.done, 'aria-label': `Mark ${x.title} as ${x.done ? 'not done' : 'done'}`, onchange: async (e) => {
      const done = e.target.checked;
      try {
        await api.post(`/api/homework/${x.id}/done`, { done });
        x.done = done ? Date.now() : null;
        if (done) { addXP(10, 'homework'); beep('win'); confetti(60); toast('Homework done. +10 XP', 'good'); }
        refreshHomework({ announce: false }).then(draw);
      } catch (ex) { e.target.checked = !done; toast(ex.message, 'bad'); }
    } });
    return h('article', { class: `hw glass${x.done ? ' done' : ''}${late ? ' late' : ''}` },
      h('div', { class: 'row between' }, h('h2', { class: 'h3' }, x.title), h('label', { class: 'row small' }, box, x.done ? t('Done') : t('Mark done'))),
      x.body ? h('p', { style: { whiteSpace: 'pre-wrap' } }, x.body) : null,
      h('div', { class: 'row small muted' },
        h('span', `${t('Given')} ${fmtDate(x.created)}`),
        x.due ? h('span', { style: late ? { color: 'var(--coral)', fontWeight: 700 } : {} }, `${late ? t('Was due') : t('Due')} ${fmtDate(x.due)}`) : null,
        lesson ? h('a', { href: `#/lesson/${lesson.id}` }, `${t('Lesson')}: ${lesson.title}`) : null));
  }
  function notifyCard() {
    const perm = notificationPermission();
    const on = getSettings().notify && perm === 'granted';
    const sw = h('input', { type: 'checkbox', checked: on, 'aria-label': 'Notify me about new homework', onchange: async (e) => { if (e.target.checked) { const ok = await enableNotifications(); e.target.checked = ok; } else disableNotifications(); } });
    return h('div', { class: 'glass card setting', style: { marginBottom: '16px' } },
      h('div', h('b', icon('bell', 18), ' ' + t('Tell me when new homework arrives')), h('span', { class: 'hint' }, !notificationsSupported() ? 'This browser does not support notifications. You will still see a badge here.' : perm === 'denied' ? 'Notifications are blocked for this site. Allow them in your browser settings first.' : 'You will get a notification while ClivEdu is open or installed as an app.')),
      h('label', { class: 'switch' }, sw, h('span')));
  }

  draw();
  await refreshHomework({ announce: false });
  draw();
  markHomeworkSeen();
}
