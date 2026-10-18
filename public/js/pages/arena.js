// CLASS ARENA: the teacher hosts, teams compete. Runs fully on one screen (project it),
// no student devices needed. Keyboard: Space reveal/next, 1-6 award team, Shift+1-6 minus, P pause, R replay, H hint.
import { h, icon, shuffle, speak, toast, confetti, beep, sleep } from '../ui.js';
import { content, allWords } from '../store.js';
import { uzOf } from '../i18n.js';
const both = (w) => (uzOf(w) ? `${w.def} (${w.uz})` : w.def);

const COLORS = ['#ff7a6b', '#2fd3b5', '#7b6cff', '#ffc65c', '#4db8ff', '#f06bd0'];
const MODES = [
  { id: 'fire', em: '⚡', name: 'Quick fire', text: 'The meaning appears. First team to say the word scores.' },
  { id: 'describe', em: '🗣️', name: 'Describe it', text: 'One player explains the word without using the banned words. Team guesses.' },
  { id: 'bee', em: '🐝', name: 'Spelling bee', text: 'The word is spoken aloud. Teams write it down, then the spelling is revealed.' },
  { id: 'mystery', em: '🔤', name: 'Mystery letters', text: 'Letters appear one by one. The fewer you need, the more points you win.' },
];
const LS = 'clivedu:arena';
const load = () => { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch { return {}; } };

export function render(root) {
  const saved = load();
  const cfg = { mode: saved.mode || 'fire', set: saved.set || 'all', teams: saved.teams || ['Team Sun', 'Team Moon'], rounds: saved.rounds || 10, secs: saved.secs || 30 };
  const body = h('div', { class: 'stack' });
  let cleanup = null;

  const paintSetup = () => {
    const persist = () => localStorage.setItem(LS, JSON.stringify(cfg));
    const pool = () => (cfg.set === 'all' ? allWords() : allWords().filter((w) => w.setId === cfg.set));
    body.replaceChildren(
      h('section', { class: 'stack' }, h('h2', { class: 'h2' }, '1. Choose a game'),
        h('div', { class: 'game-grid' }, MODES.map((m) => h('button', { class: 'game glass', 'aria-pressed': String(cfg.mode === m.id), style: cfg.mode === m.id ? { borderColor: 'var(--accent)', boxShadow: '0 0 0 3px color-mix(in oklab, var(--accent) 40%, transparent)' } : {}, onclick: () => { cfg.mode = m.id; persist(); paintSetup(); } },
          h('div', { class: 'em' }, m.em), h('h3', { class: 'h2' }, m.name), h('p', { class: 'muted' }, m.text))))),
      h('section', { class: 'stack' }, h('h2', { class: 'h2' }, '2. Words'),
        h('div', { class: 'chips' }, [['all', 'All words'], ...content.vocab.map((s) => [s.id, `${s.emoji} ${s.title}`])].map(([id, label]) => h('button', { class: `chip${cfg.set === id ? ' on' : ''}`, onclick: () => { cfg.set = id; persist(); paintSetup(); } }, label))),
        h('p', { class: 'hint' }, `${pool().length} words in this pool.`)),
      h('section', { class: 'stack' }, h('h2', { class: 'h2' }, '3. Teams'),
        h('div', { class: 'teams' }, cfg.teams.map((t, i) => h('div', { class: 'team', style: { '--tc': COLORS[i] } },
          h('input', { value: t, 'aria-label': `Team ${i + 1} name`, style: { textAlign: 'center', fontWeight: 700 }, oninput: (e) => { cfg.teams[i] = e.target.value; persist(); } }),
          cfg.teams.length > 2 ? h('button', { class: 'btn sm ghost', onclick: () => { cfg.teams.splice(i, 1); persist(); paintSetup(); } }, 'Remove') : null))),
        cfg.teams.length < 6 ? h('button', { class: 'btn sm', style: { justifySelf: 'start' }, onclick: () => { cfg.teams.push(['Team Star', 'Team Comet', 'Team Nova', 'Team Orbit'][cfg.teams.length - 2] || `Team ${cfg.teams.length + 1}`); persist(); paintSetup(); } }, '+ Add team') : null),
      h('section', { class: 'row' },
        h('div', { class: 'field' }, h('label', 'Rounds'), h('div', { class: 'seg' }, [6, 10, 15, 20].map((n) => h('button', { 'aria-pressed': String(cfg.rounds === n), onclick: () => { cfg.rounds = n; persist(); paintSetup(); } }, n)))),
        h('div', { class: 'field' }, h('label', 'Seconds per round'), h('div', { class: 'seg' }, [15, 30, 45, 60].map((n) => h('button', { 'aria-pressed': String(cfg.secs === n), onclick: () => { cfg.secs = n; persist(); paintSetup(); } }, n))))),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', style: { padding: '16px 30px', fontSize: '1.1rem' }, onclick: () => { const words = pool(); if (words.length < 4) return toast('Choose a set with at least 4 words.', 'bad'); persist(); cleanup = startGame(root, cfg, words, () => { cleanup = null; paintSetup(); stage?.remove(); }); } }, 'Start the game')));
  };
  let stage;
  root.append(
    h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, 'Class arena'), h('p', { class: 'lede' }, 'Host a word battle for your class. Project this page, split students into teams, and award points with one key.')),
    body);
  paintSetup();
  return () => cleanup?.();
}

function startGame(root, cfg, words, onExit) {
  const queue = shuffle(words).slice(0, cfg.rounds);
  const teams = cfg.teams.map((name, i) => ({ name: name || `Team ${i + 1}`, pts: 0, color: COLORS[i] }));
  const total = queue.length;
  let idx = 0, revealed = false, left = cfg.secs, paused = false, active = 0, hint = false, shown = 0, tick = null;

  const screen = h('div', { class: 'arena-screen glass' });
  const teamRow = h('div', { class: 'teams' });
  const info = h('div', { class: 'row between' });
  const timerEl = h('div', { class: 'timer' }, h('i'));
  const controls = h('div', { class: 'row', style: { justifyContent: 'center' } });
  const overlay = h('div', { class: 'fullscreen-fix', role: 'dialog', 'aria-label': 'Class arena game' }, h('div', { style: { maxWidth: '1100px', margin: '0 auto', display: 'grid', gap: '16px' } }, info, timerEl, screen, teamRow, controls));
  document.body.append(overlay);
  const q = () => queue[idx];
  const award = (i, n) => { teams[i].pts += n; beep(n > 0 ? 'good' : 'bad'); paintTeams(i); };

  function paintTeams(bumped) {
    teamRow.replaceChildren(...teams.map((t, i) => h('div', { class: 'team', style: { '--tc': t.color, outline: cfg.mode === 'describe' && active === i ? `3px solid ${t.color}` : 'none', outlineOffset: '3px' } },
      h('b', t.name), h('div', { class: `pts${bumped === i ? ' bump' : ''}` }, t.pts),
      h('div', { class: 'team-actions' }, h('button', { class: 'btn sm primary', style: { background: t.color, color: '#0b0920' }, 'aria-label': `Give ${t.name} 10 points`, onclick: () => award(i, 10) }, `+10 (${i + 1})`), h('button', { class: 'btn sm', 'aria-label': `Take 5 points from ${t.name}`, onclick: () => award(i, -5) }, '−5')),
      cfg.mode === 'describe' ? h('div', { class: 'small muted' }, active === i ? 'Describing now' : '') : null)));
  }

  function wordMask() {
    const w = q().w; const cnt = Math.min(w.length, shown);
    return [...w].map((c, k) => (c === ' ' || c === '-' ? c : k < cnt ? c.toUpperCase() : '_')).join(' ');
  }

  function paintScreen() {
    const w = q();
    info.replaceChildren(h('b', { class: 'h3' }, `Round ${idx + 1} of ${total}`), h('span', { class: 'chip' }, MODES.find((m) => m.id === cfg.mode).name), h('button', { class: 'btn sm ghost', onclick: exit }, icon('x', 16), 'Exit game'));
    const el = [];
    if (cfg.mode === 'fire') {
      el.push(h('p', { class: 'small muted' }, `${w.pos} · ${w.set.title}`), h('p', { class: 'clue' }, both(w)));
      if (hint) el.push(h('p', { class: 'h2 muted' }, `Starts with “${w.w[0].toUpperCase()}”, ${w.w.length} letters`));
      if (revealed) el.push(h('p', { class: 'answer' }, w.w), h('p', { class: 'lede' }, `“${w.ex}”`));
    } else if (cfg.mode === 'describe') {
      el.push(h('p', { class: 'small muted' }, `${teams[active].name}: choose a describer. Only they look at the screen!`), h('p', { class: 'answer', style: { color: 'var(--ink)' } }, w.w),
        h('div', { class: 'chips', style: { justifyContent: 'center' } }, h('span', { class: 'chip', style: { background: 'var(--coral)', color: '#fff' } }, 'Do not say'), ...[w.w, ...(w.syn || [])].map((x) => h('span', { class: 'chip' }, x))), h('p', { class: 'muted' }, both(w)));
    } else if (cfg.mode === 'bee') {
      el.push(h('p', { class: 'small muted' }, 'Listen carefully. Write it down!'), h('button', { class: 'btn primary', style: { width: '120px', height: '120px', borderRadius: '50%' }, 'aria-label': 'Say the word again', onclick: () => speak(w.w) }, icon('sound', 52)),
        hint ? h('p', { class: 'clue' }, `${w.pos}: ${both(w)}`) : h('p', { class: 'muted' }, 'Press H for a meaning hint'),
        revealed ? h('p', { class: 'answer' }, [...w.w.toUpperCase()].join(' ')) : null);
    } else {
      el.push(h('p', { class: 'small muted' }, `${w.pos} · ${both(w)}`), h('p', { class: 'answer', style: { letterSpacing: '.12em', color: 'var(--ink)' } }, wordMask()),
        h('p', { class: 'h2' }, revealed ? '' : `Worth ${Math.max(2, (w.w.length - shown) * 2 + 4)} points right now`),
        revealed ? h('p', { class: 'answer' }, w.w) : null);
    }
    screen.replaceChildren(...el);
    controls.replaceChildren(
      h('button', { class: 'btn primary', onclick: advance }, revealed || cfg.mode === 'describe' ? (idx + 1 >= total ? 'Finish (Space)' : 'Next round (Space)') : 'Reveal answer (Space)'),
      cfg.mode === 'describe' ? h('button', { class: 'btn', onclick: () => { award(active, 10); toast(`${teams[active].name} guessed it!`, 'good'); } }, 'Guessed! +10 (Enter)') : null,
      cfg.mode !== 'describe' && cfg.mode !== 'mystery' ? h('button', { class: 'btn', onclick: () => { hint = true; paintScreen(); } }, 'Hint (H)') : null,
      cfg.mode === 'bee' ? h('button', { class: 'btn', onclick: () => speak(q().w) }, 'Say again (R)') : null,
      h('button', { class: 'btn', onclick: () => { paused = !paused; toast(paused ? 'Paused' : 'Resumed'); } }, 'Pause (P)'));
  }

  function startRound() {
    revealed = false; hint = false; shown = 0; left = cfg.secs; paused = false;
    paintScreen(); paintTeams();
    timerEl.firstChild.getAnimations().forEach((a) => a.cancel());
    clearInterval(tick);
    const t0 = cfg.secs;
    if (cfg.mode === 'bee') setTimeout(() => speak(q().w), 400);
    tick = setInterval(() => {
      if (paused || revealed) return;
      left -= .1;
      timerEl.firstChild.style.transform = `scaleX(${Math.max(0, left / t0)})`;
      if (cfg.mode === 'mystery') { const target = Math.floor((t0 - left) / (t0 / (q().w.length + 1))); if (target > shown && shown < q().w.length - 1) { shown = target; paintScreen(); beep('tick'); } }
      if (left <= 0) { beep('bad'); reveal(); }
    }, 100);
  }
  function reveal() { revealed = true; clearInterval(tick); if (cfg.mode === 'mystery') shown = 0; paintScreen(); }
  function advance() {
    if (!revealed && cfg.mode !== 'describe') return reveal();
    if (idx + 1 >= total) return finish();
    idx++; if (cfg.mode === 'describe') active = (active + 1) % teams.length;
    startRound();
  }
  async function finish() {
    clearInterval(tick);
    const sorted = [...teams].sort((a, b) => b.pts - a.pts);
    const order = [sorted[1], sorted[0], sorted[2]].filter(Boolean);
    const heights = { [sorted[0].name]: 230, [sorted[1]?.name]: 170, [sorted[2]?.name]: 120 };
    overlay.replaceChildren(h('div', { style: { maxWidth: '900px', margin: '0 auto', textAlign: 'center', display: 'grid', gap: '16px', justifyItems: 'center' } },
      h('h1', { class: 'display', style: { fontSize: 'clamp(2.4rem,7vw,5rem)' } }, sorted[0].pts === sorted[1]?.pts ? 'It is a tie!' : `${sorted[0].name} wins!`),
      h('div', { class: 'podium' }, order.map((t) => h('div', { style: { '--tc': t.color, height: `${heights[t.name]}px` } }, h('span', { style: { fontSize: '2rem' } }, t === sorted[0] ? '🏆' : t === sorted[1] ? '🥈' : '🥉'), h('b', t.name), h('span', { class: 'h2' }, t.pts)))),
      sorted.length > 3 ? h('p', { class: 'muted' }, sorted.slice(3).map((t) => `${t.name}: ${t.pts}`).join(' · ')) : null,
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: exit }, 'Back to setup'))));
    beep('win'); confetti(220); await sleep(700); confetti(120);
  }
  const onKey = (e) => {
    if (/INPUT|TEXTAREA/.test(document.activeElement?.tagName)) return;
    if (e.code === 'Space') { e.preventDefault(); advance(); }
    else if (e.key === 'Enter' && cfg.mode === 'describe') award(active, 10);
    else if (/^[1-6]$/.test(e.key) && teams[+e.key - 1]) award(+e.key - 1, 10);
    else if (/^[!@#$%^]$/.test(e.key)) { const i = '!@#$%^'.indexOf(e.key); if (teams[i]) award(i, -5); }
    else if (e.key.toLowerCase() === 'p') { paused = !paused; toast(paused ? 'Paused' : 'Resumed'); }
    else if (e.key.toLowerCase() === 'h') { hint = true; paintScreen(); }
    else if (e.key.toLowerCase() === 'r') speak(q().w);
    else if (e.key === 'Escape') exit();
  };
  addEventListener('keydown', onKey);
  function exit() { clearInterval(tick); removeEventListener('keydown', onKey); overlay.remove(); speechSynthesis?.cancel?.(); onExit(); }
  startRound();
  return () => { clearInterval(tick); removeEventListener('keydown', onKey); overlay.remove(); };
}
