import { h, icon, toast, confetti, beep } from '../ui.js';
import { content, D, save, toggleIn, addXP, getUser } from '../store.js';
import { api, fetchLessonFile, loadPdfJs, downloadLessonPptx } from '../api.js';
import { t, trLang } from '../i18n.js';

const mb = (n) => `${(n / 1048576).toFixed(1)} MB`;

export async function render(root, { id }) {
  const lesson = content.lessons.find((l) => l.id === id);
  if (!lesson) {
    root.append(h('div', { class: 'empty' }, h('div', { class: 'em' }, '🔭'), h('h1', { class: 'h1' }, t('Lesson not found')), h('a', { class: 'btn primary', href: '#/lessons' }, t('All lessons'))));
    return;
  }
  const d = D();
  d.learning = lesson.id; save();
  const user = getUser();
  const done = () => D().lessonsDone.includes(lesson.id);
  const showUz = trLang() === 'uz';

  const favBtn = h('button', { class: 'fav-btn', 'aria-pressed': String(d.favorites.includes(id)), 'aria-label': t('Favorite this lesson'), onclick: () => favBtn.setAttribute('aria-pressed', String(toggleIn('favorites', id))) }, icon('heart'));
  const doneBtn = h('button', { class: 'btn', onclick: () => {
    if (done()) return;
    D().lessonsDone.push(id); save(); addXP(25, 'lesson'); beep('win'); confetti(80);
    toast(t('Lesson marked as learned. +25 XP'), 'good'); paintDone();
  } });
  const paintDone = () => { doneBtn.replaceChildren(icon('check', 18), done() ? t('Learned') : t('I learned this')); doneBtn.classList.toggle('primary', !done()); };
  paintDone();

  const hasDeck = lesson.hasFile || lesson.hasPptx;
  const deckHost = h('div');
  root.append(
    h('a', { class: 'btn sm ghost', href: '#/lessons', style: { justifySelf: 'start' } }, icon('left', 16), t('All lessons')),
    h('header', { class: 'page-head', style: { marginTop: '12px' } },
      h('div', { class: 'row' }, h('span', { style: { fontSize: '3rem' } }, lesson.emoji), h('span', { class: 'chip' }, lesson.level), h('span', { class: 'chip' }, lesson.kind === 'vocab' ? t('Vocabulary') : t('Grammar')), favBtn),
      h('h1', { class: 'h1' }, lesson.title),
      lesson.summary ? h('p', { class: 'lede' }, lesson.summary) : null,
      showUz && lesson.summaryUz ? h('p', { class: 'uz' }, lesson.summaryUz) : null),
    hasDeck ? deckHost : null,
    lesson.notes?.length ? h('section', { class: 'stack', style: { marginTop: '28px' } },
      h('h2', { class: 'h2' }, t('Quick notes')),
      h('div', { class: 'notes' }, lesson.notes.map((n) => h('article', { class: 'note glass' },
        h('h3', { class: 'h3' }, n.h), h('p', { style: { marginTop: '4px' } }, n.t), n.ex ? h('p', { class: 'ex' }, n.ex) : null,
        showUz && n.uz ? h('p', { class: 'uz small', style: { marginTop: '6px' } }, '🇺🇿 ' + n.uz) : null)))) : null,
    h('div', { class: 'row', style: { marginTop: '28px' } }, doneBtn, h('a', { class: 'btn', href: '#/play' }, icon('play', 18), t('Practise with a game'))));

  if (hasDeck) await mountDeck(deckHost, lesson, user);
}

function askButton(lesson, user) {
  const ask = h('button', { class: 'btn primary', onclick: async () => {
    if (!user) { location.hash = '#/login'; return; }
    try { await api.post(`/api/lesson/${lesson.id}/request`); toast(t('Request sent. Your teacher will see it.'), 'good'); ask.disabled = true; ask.textContent = t('Requested'); } catch (e) { toast(e.message, 'bad'); }
  } }, icon('lock', 18), user ? t('Ask for access') : t('Log in to ask for access'));
  return ask;
}

// Presentation area: the PDF viewer (with a free preview while locked) and the PowerPoint download.
async function mountDeck(host, lesson, user) {
  host.append(h('h2', { class: 'h2', style: { margin: '28px 0 12px' } }, t('Presentation')));
  if (lesson.hasFile) await mountPdf(host, lesson, user);
  if (lesson.hasPptx) host.append(pptxCard(lesson, user));
}

function pptxCard(lesson, user) {
  const name = lesson.pptxName || `${lesson.id}.pptx`;
  const btn = lesson.unlocked
    ? h('button', { class: 'btn primary', onclick: async () => { btn.disabled = true; try { await downloadLessonPptx(lesson.id, name); toast(t('Downloaded'), 'good'); } catch (e) { toast(e.message, 'bad'); } btn.disabled = false; } }, icon('book', 18), t('Download PowerPoint'))
    : (lesson.hasFile ? h('span', { class: 'chip' }, icon('lock', 14), t('Unlocks with the slides')) : askButton(lesson, user));
  return h('div', { class: 'glass card row between', style: { marginTop: '14px' } },
    h('div', h('b', '📊 ' + t('PowerPoint presentation')), h('p', { class: 'small muted' }, `${name}${lesson.pptxBytes ? ' · ' + mb(lesson.pptxBytes) : ''}`)), btn);
}

async function mountPdf(host, lesson, user) {
  const deck = h('div', { class: 'deck' });
  host.append(deck);
  const status = h('div', { class: 'loading' }, t('Loading slides…'));
  deck.append(status);

  if (!lesson.unlocked) {
    // preview images are public; the rest of the deck stays on the server
    if (!lesson.previewPages) { status.textContent = t('This presentation is shared by your teacher.'); }
    else {
      let i = 0;
      const img = h('img', { alt: t('Slide preview'), src: `/api/preview/${lesson.id}/0` });
      const counter = h('span', { class: 'pill glass' }, `${t('Preview')} 1 / ${lesson.previewPages}`);
      const go = (n) => { i = (n + lesson.previewPages) % lesson.previewPages; img.src = `/api/preview/${lesson.id}/${i}`; counter.textContent = `${t('Preview')} ${i + 1} / ${lesson.previewPages}`; };
      status.replaceWith(img);
      deck.append(h('div', { class: 'deck-bar top' }, h('button', { class: 'btn iconbtn glass', 'aria-label': t('Previous slide'), onclick: () => go(i - 1) }, icon('left')), counter, h('button', { class: 'btn iconbtn glass', 'aria-label': t('Next slide'), onclick: () => go(i + 1) }, icon('right'))));
    }
    deck.append(h('div', { class: 'deck-fade' }, h('div', { class: 'stack' }, h('h3', { class: 'h2', style: { color: '#fff' } }, t('The full presentation is locked')), h('p', { style: { color: '#cfcaf5' } }, t('You are seeing a preview. Your teacher unlocks the whole deck for the students in class.')), askButton(lesson, user))));
    return;
  }

  try {
    const [pdfjs, bytes] = await Promise.all([loadPdfJs(), fetchLessonFile(lesson.id)]);
    const pdf = await pdfjs.getDocument({ data: bytes }).promise;
    const canvas = h('canvas');
    status.replaceWith(canvas);
    let page = 1, rendering = false, queued = null;
    const counter = h('span', { class: 'pill glass' });
    const draw = async (n) => {
      if (rendering) { queued = n; return; }
      rendering = true; page = Math.min(pdf.numPages, Math.max(1, n));
      const p = await pdf.getPage(page);
      const box = deck.getBoundingClientRect();
      const base = p.getViewport({ scale: 1 });
      const scale = Math.min(box.width / base.width, box.height / base.height) * (window.devicePixelRatio || 1);
      const vp = p.getViewport({ scale });
      canvas.width = vp.width; canvas.height = vp.height;
      canvas.style.width = `${vp.width / (window.devicePixelRatio || 1)}px`; canvas.style.height = `${vp.height / (window.devicePixelRatio || 1)}px`;
      await p.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
      counter.textContent = `${page} / ${pdf.numPages}`;
      rendering = false;
      if (queued != null) { const q = queued; queued = null; draw(q); }
    };
    const fs = h('button', { class: 'btn iconbtn glass', 'aria-label': t('Full screen'), onclick: () => { deck.classList.toggle('full'); setTimeout(() => draw(page), 60); } }, icon('expand'));
    deck.append(h('div', { class: 'deck-bar' }, h('button', { class: 'btn iconbtn glass', 'aria-label': t('Previous slide'), onclick: () => draw(page - 1) }, icon('left')), counter, h('span', { class: 'row' }, fs, h('button', { class: 'btn iconbtn glass', 'aria-label': t('Next slide'), onclick: () => draw(page + 1) }, icon('right')))));
    const onKey = (e) => {
      if (!document.body.contains(deck)) return removeEventListener('keydown', onKey);
      if (/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return;
      if (e.key === 'ArrowRight') draw(page + 1); else if (e.key === 'ArrowLeft') draw(page - 1);
      else if (e.key === 'Escape' && deck.classList.contains('full')) { deck.classList.remove('full'); setTimeout(() => draw(page), 60); }
    };
    addEventListener('keydown', onKey);
    addEventListener('resize', () => document.body.contains(deck) && draw(page));
    deck.addEventListener('contextmenu', (e) => e.preventDefault());
    await draw(1);
  } catch (e) {
    status.textContent = e.message;
  }
}
