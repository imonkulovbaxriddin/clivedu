// Page-open transition: an iris blooms out of the orb and shows a word with its meaning,
// so every click is a tiny English lesson. Swap happens while the iris is full.
import { TRANSITION_WORDS } from './data/seed.js';
import { content, getSettings } from './store.js';
import { pick } from './ui.js';
import { uzOf } from './i18n.js';

let last = '';
const iris = () => document.getElementById('iris');

function nextWord() {
  // Prefer words from the teacher's vocab sets; fall back to the starter list.
  const pool = [];
  for (const s of content.vocab) for (const w of s.words) pool.push([w.w, uzOf(w) ? `${w.def} · ${w.uz}` : w.def]);
  const src = pool.length > 20 ? pool : TRANSITION_WORDS;
  let w;
  do { w = pick(src); } while (w[0] === last && src.length > 1);
  last = w[0];
  return w;
}

export async function transition(swap, { quick = false } = {}) {
  const el = iris();
  const calm = getSettings().motion === 'calm' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (calm || !el.animate) { await swap(); return; }
  const orb = document.querySelector('.orb')?.getBoundingClientRect();
  const ox = orb ? orb.left + orb.width / 2 : innerWidth / 2;
  const oy = orb ? orb.top + orb.height / 2 : innerHeight;
  const R = Math.hypot(Math.max(ox, innerWidth - ox), Math.max(oy, innerHeight - oy)) + 40;

  const [word, def] = nextWord();
  const b = el.querySelector('b'), s = el.querySelector('small');
  b.replaceChildren(...[...word].map((ch) => { const sp = document.createElement('span'); sp.textContent = ch; return sp; }));
  s.textContent = def;
  el.style.visibility = 'visible';

  const open = el.animate([{ clipPath: `circle(0px at ${ox}px ${oy}px)` }, { clipPath: `circle(${R}px at ${ox}px ${oy}px)` }], { duration: quick ? 280 : 400, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
  await open.finished;
  const letters = [...b.children];
  letters.forEach((sp, i) => sp.animate([{ opacity: 0, transform: 'translateY(30px) rotate(6deg)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: i * 38, easing: 'cubic-bezier(.34,1.56,.64,1)', fill: 'forwards' }));
  s.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 180 + letters.length * 30, fill: 'forwards' });
  await swap();
  await new Promise((r) => setTimeout(r, quick ? 260 : 480));
  const close = el.animate([{ clipPath: `circle(${R}px at 50% 50%)` }, { clipPath: 'circle(0px at 50% 50%)' }], { duration: 380, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' });
  await close.finished;
  el.getAnimations().forEach((a) => a.cancel());
  b.querySelectorAll('span').forEach((sp) => sp.getAnimations().forEach((a) => a.cancel()));
  s.getAnimations().forEach((a) => a.cancel());
  el.style.visibility = 'hidden';
}
