import { h, icon, shuffle, pick, speak, toast, confetti, beep, sleep } from '../ui.js';
import { content, D, save, allWords, markWord, addXP, discoverWord, getUser } from '../store.js';
import { clue, t } from '../i18n.js';
import { fitsLevel } from '../data/levels.js';

const GAMES = [
  { id: 'quiz', em: '⚡', name: 'Quick quiz', text: 'Read the meaning, pick the word before time runs out.' },
  { id: 'unscramble', em: '🔀', name: 'Unscramble', text: 'Put the letters back in order. The meaning is your clue.' },
  { id: 'match', em: '🧲', name: 'Star match', text: 'Connect each word to its meaning. Beat the clock.' },
  { id: 'spell', em: '🎧', name: 'Listen & spell', text: 'Hear the word, type how it is spelled.' },
];

let setChoice = null; // chosen on first visit: the student's own level when logged in
function pool() {
  let w = allWords();
  if (setChoice === 'mine') { const lv = getUser()?.level || 'A1'; const mine = w.filter((x) => fitsLevel(x.set.level, lv)); w = mine.length >= 6 ? mine : w; }
  if (setChoice === 'saved') w = w.filter((x) => D().saved.includes(x.key));
  else if (setChoice !== 'all' && setChoice !== 'mine') w = w.filter((x) => x.setId === setChoice);
  return w;
}

export function render(root, params, query) {
  if (setChoice === null) setChoice = getUser() && getUser().role !== 'teacher' ? 'mine' : 'all';
  if (query?.get('set')) setChoice = query.get('set');
  if (params.game) return playGame(root, params.game);
  root.append(
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, t('Play')), h('p', { class: 'lede' }, t('Short games with your words. Every right answer helps a star shine in your galaxy.'))),
    h('div', { class: 'toolbar' }, setPicker(() => render2()), h('a', { class: 'btn', href: '#/arena' }, icon('trophy', 18), t('Class arena (group games)'))),
    h('div', { class: 'game-grid' }, GAMES.map((g) => h('a', { class: 'game glass', href: `#/play/${g.id}`, style: { textDecoration: 'none' } },
      h('div', { class: 'em' }, g.em), h('h2', { class: 'h2' }, t(g.name)), h('p', { class: 'muted' }, t(g.text)), h('span', { class: 'chip', style: { justifySelf: 'start' } }, `${t('Best')}: ${D().best[g.id] ?? 0}`)))));
  function render2() { /* re-render same route to refresh counts */ }
}

function setPicker(onChange) {
  const box = h('div', { class: 'chips' });
  const paint = () => box.replaceChildren(
    ...[...(getUser() && getUser().role !== 'teacher' ? [['mine', t('My level')]] : []), ['all', t('All words')], ['saved', '💜 ' + t('Saved')], ...content.vocab.map((s) => [s.id, `${s.emoji} ${s.title}`])].map(([id, label]) =>
      h('button', { class: `chip${setChoice === id ? ' on' : ''}`, 'aria-pressed': String(setChoice === id), onclick: () => { setChoice = id; paint(); onChange?.(); } }, label)));
  paint();
  return box;
}

function playGame(root, id) {
  const g = GAMES.find((x) => x.id === id);
  const words = pool();
  const need = id === 'match' ? 6 : 4;
  if (!g) { root.append(h('p', 'Game not found.'), h('a', { class: 'btn', href: '#/play' }, 'Back')); return; }
  if (words.length < need) {
    root.append(h('div', { class: 'empty glass card' }, h('div', { class: 'em' }, '🪐'), h('h2', { class: 'h2' }, 'Not enough words yet'),
      h('p', { class: 'muted' }, setChoice === 'saved' ? 'Save at least 4 words in the galaxy to play with them.' : 'Pick a bigger set to play this game.'),
      h('div', { class: 'row' }, h('a', { class: 'btn primary', href: '#/words' }, 'Open galaxy'), h('a', { class: 'btn', href: '#/play' }, 'Back to games'))));
    return;
  }
  const stage = h('div', { class: 'arena' });
  const top = h('div', { class: 'row between' }, h('a', { class: 'btn sm ghost', href: '#/play' }, icon('left', 16), 'Games'), h('b', { class: 'h3' }, `${g.em} ${g.name}`), h('span', { class: 'chip' }, setChoice === 'all' ? t('All words') : setChoice === 'mine' ? t('My level') : setChoice === 'saved' ? 'Saved' : content.vocab.find((s) => s.id === setChoice)?.title));
  root.append(top, stage);
  let alive = true;
  const finish = ({ correct, total, extra = 0 }) => {
    if (!alive) return;
    const xp = Math.min(40, correct * 2 + extra);
    const d = D(); d.played++; d.best[id] = Math.max(d.best[id] || 0, correct); save();
    addXP(xp, 'game');
    const perfect = correct === total;
    beep('win'); if (perfect || correct / total > .7) confetti(perfect ? 160 : 70);
    stage.replaceChildren(h('div', { class: 'glass card', style: { textAlign: 'center', display: 'grid', gap: '14px', justifyItems: 'center', padding: '34px' } },
      h('div', { style: { fontSize: '3.4rem' } }, perfect ? '🌟' : correct / total > .5 ? '🎉' : '💪'),
      h('div', { class: 'bigscore' }, `${correct}/${total}`),
      h('p', { class: 'lede' }, perfect ? 'Perfect round. Your stars are blazing.' : correct / total > .5 ? 'Nice work. Most of these are shining now.' : 'Good practice. Those words will come back to help you.'),
      h('span', { class: 'chip' }, `+${xp} XP`),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => { stage.replaceChildren(); start(); } }, 'Play again'), h('a', { class: 'btn', href: '#/play' }, 'Other games'), h('a', { class: 'btn ghost', href: '#/words' }, 'See my galaxy'))));
  };
  const start = () => ({ quiz, unscramble, match, spell }[id])(stage, words, finish, () => alive);
  start();
  return () => { alive = false; speechSynthesis?.cancel?.(); };
}

// ---------- helpers ----------
function timerBar(ms, onEnd) {
  const bar = h('div', { class: 'timer', role: 'progressbar', 'aria-label': 'Time left' }, h('i'));
  const anim = bar.firstChild.animate([{ transform: 'scaleX(1)' }, { transform: 'scaleX(0)' }], { duration: ms, easing: 'linear', fill: 'forwards' });
  anim.onfinish = onEnd;
  return { el: bar, stop: () => { anim.onfinish = null; anim.pause(); } };
}
const header = (i, n, score) => h('div', { class: 'row between' }, h('span', { class: 'chip' }, `Question ${i + 1} of ${n}`), h('span', { class: 'chip' }, `⭐ ${score}`));

// ---------- 1. quick quiz ----------
function quiz(stage, words, finish, alive) {
  const qs = shuffle(words).slice(0, 10);
  let i = 0, score = 0, streak = 0, bonus = 0;
  const next = () => {
    if (!alive()) return;
    if (i >= qs.length) return finish({ correct: score, total: qs.length, extra: bonus });
    const q = qs[i];
    const forward = Math.random() < .7; // meaning -> word, or word -> meaning
    const distract = shuffle(words.filter((w) => w.key !== q.key)).slice(0, 3);
    const options = shuffle([q, ...distract]);
    let locked = false;
    const t = timerBar(forward ? 12000 : 14000, () => settle(null));
    const settle = async (choice) => {
      if (locked) return; locked = true; t.stop();
      const ok = choice?.key === q.key;
      markWord(q.key, ok);
      if (ok) { score++; streak++; if (streak >= 3) bonus++; beep('good'); } else { streak = 0; beep('bad'); }
      btns.forEach((b, k) => { if (options[k].key === q.key) b.classList.add('right'); else if (options[k] === choice) b.classList.add('wrong'); });
      await sleep(ok ? 650 : 1300); i++; next();
    };
    const btns = options.map((o) => h('button', { class: 'opt', onclick: () => settle(o) }, forward ? o.w : clue(o)));
    stage.replaceChildren(header(i, qs.length, score + (streak >= 3 ? ` · 🔥${streak}` : '')), t.el,
      h('div', { class: 'glass card', style: { padding: '30px 22px' } }, forward ? h('p', { class: 'q-word', style: { fontSize: 'clamp(1.4rem,3.8vw,2.4rem)', fontWeight: 700 } }, clue(q)) : h('p', { class: 'q-word' }, q.w)),
      h('div', { class: 'opts' }, btns));
  };
  next();
}

// ---------- 2. unscramble ----------
function unscramble(stage, words, finish, alive) {
  const qs = shuffle(words.filter((w) => /^[a-z]{4,10}$/i.test(w.w))).slice(0, 8);
  let i = 0, score = 0;
  const next = () => {
    if (!alive()) return;
    if (i >= qs.length) return finish({ correct: score, total: qs.length });
    const q = qs[i], target = q.w.toLowerCase();
    let letters = shuffle([...target].map((c, k) => ({ c, k })));
    if (letters.map((l) => l.c).join('') === target) letters = letters.reverse();
    const slots = Array(target.length).fill(null);
    let hints = 0, locked = false;
    const slotRow = h('div', { class: 'tiles', 'aria-label': 'Your answer' });
    const bank = h('div', { class: 'tiles', 'aria-label': 'Letters to use' });
    const paint = () => {
      slotRow.replaceChildren(...slots.map((l, p) => l ? h('button', { class: 'tile', 'aria-label': `Remove ${l.c}`, onclick: () => { if (!locked) { slots[p] = null; paint(); } } }, l.c) : h('span', { class: 'tile slot' })));
      bank.replaceChildren(...letters.map((l) => slots.includes(l) ? h('span', { class: 'tile slot' }) : h('button', { class: 'tile', onclick: () => place(l) }, l.c)));
    };
    const place = (l) => { if (locked) return; const p = slots.indexOf(null); if (p < 0) return; slots[p] = l; paint(); if (slots.every(Boolean)) check(); };
    const check = async () => {
      locked = true;
      const ok = slots.map((l) => l.c).join('') === target;
      markWord(q.key, ok && hints === 0);
      if (ok) { score += hints ? .5 : 1; beep('good'); slotRow.querySelectorAll('.tile').forEach((t, n) => t.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-14px)' }, { transform: 'none' }], { duration: 400, delay: n * 50 })); }
      else { beep('bad'); slotRow.animate([{ transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'none' }], { duration: 300 }); }
      status.textContent = ok ? 'Correct!' : `Not quite. It was “${q.w}”.`;
      await sleep(ok ? 800 : 1500); i++; next();
    };
    const hint = h('button', { class: 'btn sm', onclick: () => { if (locked) return; const p = slots.findIndex((l, n) => !l || l.c !== target[n]); if (p < 0) return; const need = letters.find((l) => l.c === target[p] && !slots.includes(l)) || letters.find((l) => slots.includes(l) && l.c === target[p]); const cur = slots.indexOf(need); if (cur >= 0) slots[cur] = null; slots[p] = need; hints++; paint(); if (slots.every(Boolean)) check(); } }, 'Hint: place a letter');
    const status = h('p', { class: 'lede', style: { textAlign: 'center', minHeight: '1.6em' } });
    stage.replaceChildren(header(i, qs.length, score),
      h('div', { class: 'glass card', style: { textAlign: 'center', display: 'grid', gap: '10px' } }, h('p', { class: 'small muted' }, q.pos), h('p', { class: 'h2' }, clue(q))),
      slotRow, bank, h('div', { class: 'row', style: { justifyContent: 'center' } }, hint, h('button', { class: 'btn sm ghost', onclick: () => { if (!locked) { slots.fill(null); paint(); } } }, 'Clear')), status);
    paint();
    const onKey = (e) => {
      if (!alive() || !document.body.contains(slotRow)) return removeEventListener('keydown', onKey);
      if (/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return;
      if (e.key === 'Backspace') { const p = [...slots].reverse().findIndex(Boolean); if (p >= 0 && !locked) { slots[slots.length - 1 - p] = null; paint(); } return; }
      if (/^[a-z]$/i.test(e.key)) { const l = letters.find((x) => x.c === e.key.toLowerCase() && !slots.includes(x)); if (l) place(l); }
    };
    addEventListener('keydown', onKey);
  };
  next();
}

// ---------- 3. star match ----------
function match(stage, words, finish, alive) {
  const picks = shuffle(words).slice(0, 6);
  const short = (d) => (d.length > 62 ? d.slice(0, 60) + '…' : d);
  let left = null, right = null, matched = 0, wrong = 0;
  const t0 = performance.now();
  const L = shuffle(picks), R = shuffle(picks);
  const cardL = L.map((w) => h('button', { class: 'mcard', onclick: () => pickSide('L', w, cardL[L.indexOf(w)]) }, w.w));
  const cardR = R.map((w) => h('button', { class: 'mcard', onclick: () => pickSide('R', w, cardR[R.indexOf(w)]) }, short(clue(w))));
  const timer = timerBar(75000, () => end());
  const score = h('span', { class: 'chip' }, `0 / ${picks.length} matched`);
  const pickSide = (side, w, el) => {
    if (side === 'L') { cardL.forEach((c) => c.classList.remove('sel')); left = { w, el }; } else { cardR.forEach((c) => c.classList.remove('sel')); right = { w, el }; }
    el.classList.add('sel');
    if (left && right) {
      const ok = left.w.key === right.w.key;
      const a = left, b = right; left = right = null;
      if (ok) { a.el.classList.replace('sel', 'done'); b.el.classList.replace('sel', 'done'); matched++; markWord(a.w.key, true); beep('good'); score.textContent = `${matched} / ${picks.length} matched`; if (matched === picks.length) end(); }
      else { wrong++; markWord(a.w.key, false); beep('bad'); [a.el, b.el].forEach((e) => { e.classList.add('bad'); setTimeout(() => e.classList.remove('bad', 'sel'), 420); }); }
    }
  };
  let ended = false;
  const end = () => { if (ended || !alive()) return; ended = true; timer.stop(); const secs = (performance.now() - t0) / 1000; finish({ correct: matched, total: picks.length, extra: matched === picks.length ? Math.max(0, Math.round((60 - secs) / 10)) : 0 }); };
  stage.replaceChildren(h('div', { class: 'row between' }, score, h('span', { class: 'chip' }, `Mistakes: ${wrong}`)), timer.el,
    h('div', { class: 'match' }, h('div', { class: 'col' }, cardL), h('div', { class: 'col' }, cardR)));
}

// ---------- 4. listen & spell ----------
function spell(stage, words, finish, alive) {
  const qs = shuffle(words.filter((w) => /^[a-z' -]{3,16}$/i.test(w.w))).slice(0, 8);
  let i = 0, score = 0;
  const next = () => {
    if (!alive()) return;
    if (i >= qs.length) return finish({ correct: score, total: qs.length });
    const q = qs[i];
    const input = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Type the word you heard', placeholder: 'Type what you hear', style: { fontSize: '1.4rem', textAlign: 'center', maxWidth: '420px' } });
    const out = h('p', { class: 'lede', style: { textAlign: 'center', minHeight: '1.6em' } });
    let done = false;
    const check = async () => {
      if (done || !input.value.trim()) return; done = true;
      const ok = input.value.trim().toLowerCase() === q.w.toLowerCase();
      markWord(q.key, ok); discoverWord(q.key);
      if (ok) { score++; beep('good'); out.textContent = 'Correct!'; out.style.color = 'var(--mint)'; } else { beep('bad'); out.textContent = `It is spelled “${q.w}”.`; out.style.color = 'var(--coral)'; }
      input.disabled = true; await sleep(ok ? 800 : 1700); i++; next();
    };
    stage.replaceChildren(header(i, qs.length, score),
      h('div', { class: 'glass card', style: { textAlign: 'center', display: 'grid', gap: '14px', justifyItems: 'center' } },
        h('button', { class: 'btn primary', style: { width: '96px', height: '96px', borderRadius: '50%' }, 'aria-label': 'Hear the word again', onclick: () => speak(q.w) }, icon('sound', 40)),
        h('p', { class: 'muted' }, 'Tap to hear it again'), h('p', { class: 'small muted' }, `Clue: ${q.pos}, “${clue(q)}”`)),
      h('div', { style: { display: 'grid', justifyItems: 'center', gap: '12px' } }, input, h('button', { class: 'btn primary', onclick: check }, 'Check')), out);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
    setTimeout(() => { input.focus(); speak(q.w); }, 250);
  };
  next();
}
