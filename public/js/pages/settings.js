import { h, icon, toast, confirmBox } from '../ui.js';
import { getSettings, setSetting, defaultSettings, D, getUser, setSession, save } from '../store.js';
import { logout } from '../api.js';
import { enableNotifications, disableNotifications, notificationPermission, notificationsSupported } from '../notify.js';
import { t } from '../i18n.js';
import { levelInfo } from '../data/levels.js';

const ACCENTS = ['#7b6cff', '#2fd3b5', '#ff7a6b', '#ffb84d', '#4db8ff', '#f06bd0', '#8bd450'];

const sw = (checked, onChange, label) => h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked, 'aria-label': label, onchange: (e) => onChange(e.target.checked, e) }), h('span'));
const row = (title, hint, control) => h('div', { class: 'setting' }, h('div', h('b', title), hint ? h('span', { class: 'hint' }, hint) : null), control);

export function render(root) {
  const s = getSettings();
  const user = getUser();
  const accentRow = h('div', { class: 'swatches' });
  const paintAccent = () => accentRow.replaceChildren(
    ...ACCENTS.map((c) => h('button', { class: 'swatch', style: { background: c }, 'aria-label': `Use colour ${c}`, 'aria-pressed': String(getSettings().accent === c), onclick: () => { setSetting('accent', c); paintAccent(); } })),
    h('input', { type: 'color', value: getSettings().accent, 'aria-label': 'Pick any colour', style: { width: '48px' }, oninput: (e) => setSetting('accent', e.target.value), onchange: paintAccent }));
  paintAccent();

  const themeSeg = h('div', { class: 'seg' });
  const paintTheme = () => themeSeg.replaceChildren(...[['auto', t('Auto')], ['light', '☀️ ' + t('Day')], ['dark', '🌙 ' + t('Night')]].map(([v, l]) => h('button', { 'aria-pressed': String(getSettings().theme === v), onclick: () => { setSetting('theme', v); paintTheme(); } }, l)));
  paintTheme();

  const langSeg = (key) => {
    const box = h('div', { class: 'seg' });
    const paint = () => box.replaceChildren(...[['uz', 'O‘zbekcha'], ['en', 'English']].map(([v, l]) => h('button', { 'aria-pressed': String(getSettings()[key] === v), onclick: () => { setSetting(key, v); if (key === 'ui') location.reload(); else paint(); } }, l)));
    paint(); return box;
  };
  const perm = notificationPermission();
  root.append(
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('Settings')), h('p', { class: 'lede' }, t('Make ClivEdu feel like yours. Changes apply straight away.'))),
    h('div', { class: 'stack' },
      h('section', { class: 'glass card' }, h('h2', { class: 'h2' }, t('Language')),
        row(t('Website language'), t('Menus and buttons.'), langSeg('ui')),
        row(t('Word translations'), t('Show the Uzbek meaning of English words.'), langSeg('tr'))),
      user && h('section', { class: 'glass card' }, h('h2', { class: 'h2' }, t('My English level')),
        h('p', { class: 'muted' }, `${user.level || 'A1'} · ${levelInfo(user.level).name}. ${t('Your teacher sets your level. Ask them if you think it should change.')}`)),
      h('section', { class: 'glass card' }, h('h2', { class: 'h2' }, t('Look')),
        row(t('Theme'), t('Auto follows your device.'), themeSeg),
        row(t('Accent colour'), t('Used for buttons, stars and highlights.'), accentRow),
        row(t('Reading mode'), t('Quiet paper-like colours, a serif font and no moving background. Good for long notes.'), sw(s.reading, (v) => setSetting('reading', v), 'Reading mode')),
        row(t('Calm motion'), t('Fewer animations and a still background.'), sw(s.motion === 'calm', (v) => setSetting('motion', v ? 'calm' : 'full'), 'Calm motion'))),
      h('section', { class: 'glass card' }, h('h2', { class: 'h2' }, t('Sound and alerts')),
        row(t('Game sounds'), t('Short sound effects for right and wrong answers.'), sw(s.sound, (v) => setSetting('sound', v), 'Game sounds')),
        row('Homework notifications', !notificationsSupported() ? 'Not supported by this browser.' : perm === 'denied' ? 'Blocked. Allow notifications for this site in your browser settings.' : 'Get a notification when your teacher posts homework.',
          sw(s.notify && perm === 'granted', async (v, e) => { if (v) { const ok = await enableNotifications(); e.target.checked = ok; } else disableNotifications(); }, 'Homework notifications'))),
      h('section', { class: 'glass card' }, h('h2', { class: 'h2' }, t('Your progress')),
        h('p', { class: 'muted' }, 'Your stars, XP, favorites and saved words live on this device. Back them up to move to another phone or computer.'),
        h('div', { class: 'row', style: { marginTop: '12px' } },
          h('button', { class: 'btn', onclick: exportData }, 'Download backup'),
          h('label', { class: 'btn', style: { cursor: 'pointer' } }, 'Restore backup', h('input', { type: 'file', accept: 'application/json', class: 'sr', onchange: importData })),
          h('button', { class: 'btn danger', onclick: async () => { if (await confirmBox('Erase all progress on this device?', 'Erase')) { const d = D(); Object.keys(d).forEach((k) => delete d[k]); localStorage.removeItem(`clivedu:data:${user?.id || 'guest'}`); location.reload(); } } }, 'Erase progress'))),
      h('section', { class: 'glass card' }, h('h2', { class: 'h2' }, t('Account')),
        user ? h('div', { class: 'row between', style: { marginTop: '8px' } }, h('span', `Signed in as ${user.email}`), h('button', { class: 'btn', onclick: () => { logout(); toast(t('Logged out')); location.hash = '#/'; } }, t('Log out')))
          : h('div', { class: 'row', style: { marginTop: '8px' } }, h('a', { class: 'btn primary', href: '#/login' }, 'Log in'), h('a', { class: 'btn', href: '#/login?signup=1' }, 'Create account'))),
      h('section', { class: 'glass card' }, h('h2', { class: 'h2' }, 'Shortcuts'),
        h('div', { class: 'stack small', style: { marginTop: '8px' } },
          h('div', h('kbd', 'M'), ' open the menu, then ', h('kbd', '1'), '–', h('kbd', '6'), ' to jump'),
          h('div', h('kbd', '/'), ' or ', h('kbd', 'Ctrl'), ' + ', h('kbd', 'K'), ' search everything'),
          h('div', h('kbd', 'Esc'), ' close anything that is open'),
          h('div', 'In slides: ', h('kbd', '←'), ' ', h('kbd', '→'), ' to change slide')),
        h('p', { class: 'hint', style: { marginTop: '10px' } }, 'Tip: use your browser’s “Install” or “Add to Home Screen” to open ClivEdu like an app.')),
      h('p', { class: 'hint', style: { textAlign: 'center' } }, 'ClivEdu · ', h('button', { class: 'btn sm ghost', onclick: () => { Object.entries(defaultSettings).forEach(([k, v]) => setSetting(k, v)); toast('Settings reset'); location.reload(); } }, 'Reset all settings'))));
}

function exportData() {
  const user = getUser();
  const blob = new Blob([JSON.stringify({ app: 'clivedu', version: 1, exported: new Date().toISOString(), data: D() }, null, 2)], { type: 'application/json' });
  const a = h('a', { href: URL.createObjectURL(blob), download: `clivedu-progress-${user?.displayName || 'guest'}.json` }); a.click();
  toast('Backup downloaded', 'good');
}
async function importData(e) {
  const file = e.target.files?.[0]; if (!file) return;
  try {
    const j = JSON.parse(await file.text());
    if (j.app !== 'clivedu' || !j.data || typeof j.data !== 'object') throw new Error('bad');
    Object.assign(D(), j.data); save(); toast('Progress restored', 'good');
  } catch { toast('That file is not a ClivEdu backup.', 'bad'); }
}
