import { h, icon, speak, toast, pick } from '../ui.js';
import { content, D, getUser, level, allWords, wordKey, discoverWord, toggleIn, addXP, isDue, todayKey } from '../store.js';
import { HELLOS } from '../data/seed.js';
import { homeworkState } from '../notify.js';
import { uzOf, t } from '../i18n.js';

function wordOfTheDay() {
  const words = allWords();
  if (!words.length) return null;
  const forced = content.site?.wordOfTheDay?.toLowerCase();
  const hit = forced && words.find((w) => w.w.toLowerCase() === forced);
  if (hit) return hit;
  const n = [...todayKey()].reduce((a, c) => a + c.charCodeAt(0) * 31, 7);
  return words[n % words.length];
}

export function render(root) {
  const user = getUser();
  const d = D();
  const lv = level(d.xp);
  const name = user?.displayName;
  const words = Object.keys(d.words).length;
  const due = allWords().filter((w) => isDue(w.key)).length;
  const hwOpen = homeworkState.list.filter((x) => !x.done).length;
  const wod = wordOfTheDay();

  // greeting that cycles through languages
  const lang = h('span', { class: 'lang' }, 'Hello');
  let i = 0;
  const timer = setInterval(() => {
    i = (i + 1) % HELLOS.length;
    lang.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-14px)' }], { duration: 220, fill: 'forwards' }).finished.then(() => {
      lang.textContent = HELLOS[i][0]; lang.title = HELLOS[i][1];
      lang.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'forwards' });
    });
  }, 2400);

  const headline = t('Your English, one star at a time.');
  const glyphs = [...headline].map((c, k) => (c === ' ' ? ' ' : h('span', { class: 'glyph', style: { transitionDelay: `${(k % 5) * 12}ms` } }, c)));

  const revealed = h('div', { class: 'small muted', style: { minHeight: '3.2em' } }, t('Tap the word to hear it and see what it means.'));
  let open = false;
  const star = wod && h('div', { class: 'star-card glass' },
    h('div', { class: 'small muted' }, t('Star of the day')),
    h('button', { class: 'word', style: { background: 'none', border: 0, padding: 0, textAlign: 'left', color: 'inherit' }, 'aria-label': `${wod.w}. Tap to hear it and see its meaning`, onclick: () => {
      speak(wod.w);
      open = true; discoverWord(wod.key);
      revealed.replaceChildren(h('b', `${wod.pos} · `), uzOf(wod) ? h('span', { class: 'uz' }, `${wod.uz} · `) : null, wod.def, h('div', { class: 'muted', style: { fontStyle: 'italic', marginTop: '4px' } }, `“${wod.ex}”`));
    } }, wod.w),
    revealed,
    h('div', { class: 'row', style: { marginTop: '10px' } },
      h('button', { class: 'btn sm', onclick: () => { const on = toggleIn('saved', wod.key); if (on) addXP(2, 'save'); toast(on ? t('Saved to your words') : t('Removed from saved'), on ? 'good' : ''); } }, icon('heart', 16), t('Save word')),
      h('a', { class: 'btn sm ghost', href: `#/words?w=${encodeURIComponent(wod.key)}` }, t('See it in the galaxy'))));

  const learning = d.learning && content.lessons.find((l) => l.id === d.learning);
  const primary = learning
    ? h('a', { class: 'btn primary', href: `#/lesson/${learning.id}` }, `${t('Continue')}: ${learning.title}`)
    : h('a', { class: 'btn primary', href: '#/lessons' }, t('Start a lesson'));

  root.append(
    content.site?.announcement ? h('div', { class: 'glass', style: { padding: '12px 18px', borderRadius: '18px', marginBottom: '14px' } }, '📣 ', content.site.announcement) : null,
    h('section', { class: 'hero' },
      h('div', { class: 'hello h2' }, h('span', lang, name ? `, ${name}` : ', ' + t('welcome'))),
      h('h1', { class: 'display', 'aria-label': headline }, glyphs),
      h('p', { class: 'lede' }, user ? t('Pick up where you left off, review the words that are fading, or just wander.') : t('Lessons from your teacher, a galaxy that grows with every word you learn, and games to play together.')),
      h('div', { class: 'row' }, primary, h('a', { class: 'btn', href: '#/words' }, icon('galaxy', 18), t('Open my galaxy')), !user && h('a', { class: 'btn ghost', href: '#/login?signup=1' }, t('Create account'))),
      star),
    h('section', { class: 'strip' },
      stat(`🔥 ${d.streak.count}`, d.streak.count === 1 ? t('day streak') : t('days streak')),
      stat(`${t('Level')} ${lv.lv}`, `${lv.into} / ${lv.need} XP`),
      stat(`⭐ ${words}`, words === 1 ? t('star discovered') : t('stars discovered')),
      due ? h('a', { class: 'stat glass', href: '#/words?review=1', style: { textDecoration: 'none', borderColor: 'var(--coral)' } }, h('b', `${due}`), h('span', t('words are fading. Tap to review.'))) : stat('✨ 0', t('words to review'))),
    h('section', { class: 'doors' },
      door('a', '#/lessons', '📘', t('Lessons'), t('Grammar and vocabulary, with slides from your teacher.'), '#7b6cff'),
      door('b', '#/words', '🌌', t('Word Galaxy'), t('Every word is a star. Learn it and it shines.'), '#2fd3b5'),
      door('c', '#/play', '🎮', t('Play'), t('Quick games to warm up your words.'), '#ff7a6b'),
      door('d', '#/homework', '📝', t('Homework'), hwOpen ? `${hwOpen} ${t('to do right now.')}` : t('Nothing waiting. Nice.'), '#ffc65c')));

  return () => clearInterval(timer);
}

const stat = (big, small) => h('div', { class: 'stat glass' }, h('b', big), h('span', { class: 'muted' }, small));
const door = (cls, href, em, title, text, tint) => h('a', { class: `door glass ${cls}`, href, style: { '--tint': tint } },
  h('span', { class: 'big', 'aria-hidden': 'true' }, em), h('h2', { class: 'h1' }, title), h('p', { class: 'muted' }, text));
