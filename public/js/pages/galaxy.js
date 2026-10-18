// WORD GALAXY. Every vocabulary set is a constellation, every word a star.
// Open a word and it is discovered; get it right and it grows from a faint dot to a golden sun.
// Words you stop revisiting fade and pulse, asking to be pulled back in.
import { h, icon, speak, toast, confetti, beep } from '../ui.js';
import { content, D, allWords, wordKey, wordState, markWord, discoverWord, isDue, toggleIn, addXP, on, level } from '../store.js';
import { shareSky } from '../share.js';
import { uzOf, t } from '../i18n.js';

const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const seeded = (str) => { let x = 0; for (const c of str) x = (x * 31 + c.charCodeAt(0)) >>> 0; return () => { x = (x * 1664525 + 1013904223) >>> 0; return x / 4294967296; }; };
const GOLD = '#ffc65c';

function layout() {
  const sets = content.vocab;
  const n = sets.length;
  const stars = [], clusters = [];
  const ring = n <= 1 ? 0 : Math.max(330, n * 95);
  sets.forEach((set, i) => {
    const a = (i / Math.max(1, n)) * Math.PI * 2 - Math.PI / 2;
    const cx = Math.cos(a) * ring * 1.25, cy = Math.sin(a) * ring * .85;
    const rnd = seeded(set.id);
    const c = { set, cx, cy, stars: [], r: 0 };
    set.words.forEach((w, k) => {
      const ang = k * 2.39996 + rnd() * .5, rad = 46 * Math.sqrt(k + 1.2) + rnd() * 18;
      const s = { w, set, key: wordKey(set.id, w.w), x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad, tw: rnd() * 6.28, cluster: c };
      c.stars.push(s); stars.push(s); c.r = Math.max(c.r, rad);
    });
    clusters.push(c);
  });
  // synonym links between words that exist as stars
  const byWord = new Map(stars.map((s) => [s.w.w.toLowerCase(), s]));
  const links = [];
  for (const s of stars) for (const syn of s.w.syn || []) { const t = byWord.get(syn.toLowerCase()); if (t && t !== s) links.push([s, t]); }
  return { stars, clusters, links };
}

export function render(root, _p, query) {
  const world = layout();
  const view = { mode: 'galaxy', set: null };
  let selected = null, hovered = null, review = null, revealed = false;

  const canvas = h('canvas', { tabindex: '0', 'aria-label': 'Word galaxy. Drag to move, scroll to zoom, select a star to open a word. Use the List view for a keyboard-friendly version.' });
  const wrap = h('div', { class: 'galaxy-wrap' }, canvas);
  const card = h('div', { class: 'wordcard glass', role: 'dialog', 'aria-label': 'Word details' });
  const hud = h('div', { class: 'gal-hud' });
  const legend = h('div', { class: 'gal-legend glass small' },
    h('span', h('i', { style: { background: '#8883b8' } }), 'new'), h('span', h('i', { style: { background: '#7b6cff' } }), 'learning'), h('span', h('i', { style: { background: GOLD } }), 'mastered'), h('span', h('i', { style: { background: '#ff7a6b' } }), 'fading'));
  wrap.append(hud, legend, card);

  const body = h('div');
  const tabs = h('div', { class: 'seg', role: 'tablist' });
  const stats = h('div', { class: 'row muted small' });
  const paintTabs = () => tabs.replaceChildren(...[['galaxy', '🌌 Galaxy'], ['list', '☰ List'], ['saved', '💜 Saved']].map(([m, label0]) => [m, t(label0)]).map(([m, label]) => h('button', { role: 'tab', 'aria-pressed': String(view.mode === m), onclick: () => setMode(m) }, label)));
  const paintStats = () => {
    const d = D(), known = Object.keys(d.words).length, total = world.stars.length;
    const mastered = Object.values(d.words).filter((x) => x.box >= 5).length;
    const due = world.stars.filter((s) => isDue(s.key)).length;
    stats.replaceChildren(h('span', `⭐ ${known} of ${total} discovered`), h('span', `☀️ ${mastered} mastered`), due ? h('span', { style: { color: 'var(--coral)' } }, `${due} fading`) : null);
  };

  root.append(
    h('header', { class: 'page-head' },
      h('h1', { class: 'h1' }, t('Word Galaxy')),
      h('p', { class: 'lede' }, t('Every word is a star. Open it to discover it, get it right to make it shine, and come back before it fades.'))),
    h('div', { class: 'toolbar' }, tabs, stats,
      h('button', { class: 'btn sm', onclick: () => startReview() }, icon('galaxy', 16), 'Orbit review'),
      h('button', { class: 'btn sm', onclick: () => shareSky() }, icon('share', 16), 'Share my sky')),
    body);

  function setMode(m) {
    view.mode = m; paintTabs();
    stopLoop();
    body.replaceChildren();
    if (m === 'galaxy') { body.append(wrap); resize(); startLoop(); }
    if (m === 'list') body.append(listView());
    if (m === 'saved') body.append(savedView());
  }

  // ----- list + saved views (also the accessible alternative) -----
  function listView() {
    return h('div', { class: 'stack' }, world.clusters.map((c) => h('section', { class: 'glass card' },
      h('h2', { class: 'h2' }, `${c.set.emoji} ${c.set.title}`),
      h('div', { class: 'chips', style: { marginTop: '12px' } }, c.stars.map((s) => {
        const st = wordState(s.key);
        return h('button', { class: `chip${st.box >= 5 ? ' on' : ''}`, style: st.seen && st.box < 5 ? { borderColor: c.set.color } : (!st.seen ? { opacity: .6 } : {}), onclick: () => { setMode('galaxy'); select(s, true); } },
          st.box >= 5 ? '☀️' : st.seen ? '⭐' : '·', ' ', s.w.w);
      })))));
  }
  function savedView() {
    const keys = D().saved;
    const items = allWords().filter((w) => keys.includes(w.key));
    if (!items.length) return h('div', { class: 'empty glass card' }, h('div', { class: 'em' }, '💜'), h('h2', { class: 'h2' }, 'No saved words yet'), h('p', { class: 'muted' }, 'Open any star and tap the heart to keep a word here.'), h('button', { class: 'btn primary', onclick: () => setMode('galaxy') }, 'Explore the galaxy'));
    return h('div', { class: 'saved-list' }, items.map((w) => h('article', { class: 'saved-word glass' },
      h('div', { class: 'row between' }, h('b', { class: 'h3' }, w.w), h('span', { class: 'row' },
        h('button', { class: 'fav-btn', 'aria-label': `Say ${w.w}`, onclick: () => speak(w.w) }, icon('sound')),
        h('button', { class: 'fav-btn', 'aria-pressed': 'true', 'aria-label': `Remove ${w.w}`, onclick: () => { toggleIn('saved', w.key); setMode('saved'); } }, icon('heart')))),
      h('span', { class: 'muted small' }, w.pos),
      uzOf(w) ? h('p', { class: 'uz' }, w.uz) : null, h('p', w.def), h('p', { class: 'muted small', style: { fontStyle: 'italic' } }, w.ex))));
  }

  // ----- camera -----
  const cam = { x: 0, y: 0, z: .5, tx: 0, ty: 0, tz: .5 };
  let W = 0, H = 0, dpr = 1, ctx = canvas.getContext('2d');
  function fit() {
    if (!world.stars.length) return;
    const xs = world.stars.map((s) => s.x), ys = world.stars.map((s) => s.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    cam.tz = Math.min(1.2, Math.min(W / (maxX - minX + 220), (H - 70) / (maxY - minY + 220)));
    cam.tx = (minX + maxX) / 2; cam.ty = (minY + maxY) / 2 - 24 / cam.tz;
  }
  function resize() {
    const r = wrap.getBoundingClientRect(); if (!r.width) return;
    dpr = Math.min(2, devicePixelRatio || 1); W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!selected && !didFit) { fit(); cam.x = cam.tx; cam.y = cam.ty; cam.z = cam.tz; didFit = true; }
  }
  let didFit = false;
  const toScreen = (x, y) => [(x - cam.x) * cam.z + W / 2, (y - cam.y) * cam.z + H / 2];
  const toWorld = (sx, sy) => [(sx - W / 2) / cam.z + cam.x, (sy - H / 2) / cam.z + cam.y];

  // ----- drawing -----
  let raf = 0, running = false;
  const starStyle = (s) => {
    const st = wordState(s.key);
    const due = isDue(s.key);
    let r, col;
    if (!st.seen) { r = 2.4; col = '#8883b8'; }
    else if (st.box >= 5) { r = 10; col = GOLD; }
    else { r = 3.6 + st.box * 1.5; col = s.set.color; }
    return { st, due, r, col };
  };
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    cam.x += (cam.tx - cam.x) * .12; cam.y += (cam.ty - cam.y) * .12; cam.z += (cam.tz - cam.z) * .12;
    const d = D();
    // nebulae, brighter with progress
    ctx.globalCompositeOperation = 'lighter';
    for (const c of world.clusters) {
      const known = c.stars.filter((s) => d.words[s.key]?.seen).length / Math.max(1, c.stars.length);
      const [sx, sy] = toScreen(c.cx, c.cy);
      const R = (c.r + 90) * cam.z;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
      g.addColorStop(0, rgba(c.set.color, .1 + known * .3)); g.addColorStop(1, rgba(c.set.color, 0));
      ctx.fillStyle = g; ctx.fillRect(sx - R, sy - R, R * 2, R * 2);
    }
    ctx.globalCompositeOperation = 'source-over';
    // links: chain inside constellations + synonym arcs
    ctx.lineWidth = 1;
    for (const c of world.clusters) {
      ctx.strokeStyle = rgba(c.set.color, .22); ctx.beginPath();
      c.stars.forEach((s, i) => { if (i === 0) return; const p = c.stars[i - 1]; const [a, b] = toScreen(p.x, p.y), [e, f] = toScreen(s.x, s.y); ctx.moveTo(a, b); ctx.lineTo(e, f); });
      ctx.stroke();
    }
    ctx.setLineDash([3, 5]); ctx.strokeStyle = 'rgba(255,255,255,.18)';
    for (const [a, b] of world.links) { const [x1, y1] = toScreen(a.x, a.y), [x2, y2] = toScreen(b.x, b.y); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 - 40 * cam.z, x2, y2); ctx.stroke(); }
    ctx.setLineDash([]);
    // stars
    const light = document.documentElement.dataset.theme === 'light' || (document.documentElement.dataset.theme === 'auto' && matchMedia('(prefers-color-scheme: light)').matches);
    const ink = light ? '#1a1640' : '#f1eeff';
    for (const s of world.stars) {
      if (view.set && s.set.id !== view.set) continue;
      const { st, due, r: base, col } = starStyle(s);
      const [sx, sy] = toScreen(s.x, s.y);
      if (sx < -60 || sy < -60 || sx > W + 60 || sy > H + 60) continue;
      const tw = .75 + .25 * Math.sin(t / 700 + s.tw);
      const r = base * (.65 + .35 * Math.min(2, cam.z)) * (st.seen ? tw : 1);
      if (st.seen) {
        const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4.2);
        g.addColorStop(0, rgba(col, .55)); g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, r * 4.2, 0, 6.283); ctx.fill();
        if (st.box >= 5) { ctx.strokeStyle = rgba(GOLD, .7); ctx.lineWidth = 1.5; for (let k = 0; k < 8; k++) { const a = k * .785 + t / 4000; ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * r * 1.4, sy + Math.sin(a) * r * 1.4); ctx.lineTo(sx + Math.cos(a) * r * 2.6, sy + Math.sin(a) * r * 2.6); ctx.stroke(); } }
      }
      ctx.fillStyle = st.seen ? (light && st.box < 5 ? col : '#fff') : (light ? '#6d68a0' : col);
      ctx.beginPath(); ctx.arc(sx, sy, r, 0, 6.283); ctx.fill();
      if (st.seen) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(sx, sy, r * .62, 0, 6.283); ctx.fill(); }
      if (due) { const p = (t % 1600) / 1600; ctx.strokeStyle = rgba('#ff7a6b', 1 - p); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, r + 5 + p * 16, 0, 6.283); ctx.stroke(); }
      if (D().saved.includes(s.key)) { ctx.fillStyle = '#ff7a6b'; ctx.font = '12px sans-serif'; ctx.fillText('♥', sx + r + 3, sy - r); }
      if (selected === s) { ctx.strokeStyle = ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(sx, sy, r + 8, 0, 6.283); ctx.stroke(); }
      // labels: discovered words when zoomed in, everything on hover/select
      if ((st.seen && cam.z > .55) || cam.z > 1.15 || hovered === s || selected === s) {
        ctx.font = `600 ${Math.round(12 + Math.min(6, cam.z * 3))}px "Bricolage Grotesque", system-ui, sans-serif`;
        ctx.fillStyle = st.seen || hovered === s || selected === s ? ink : (light ? 'rgba(26,22,64,.45)' : 'rgba(241,238,255,.5)');
        ctx.textAlign = 'center'; ctx.fillText(st.seen || hovered === s || selected === s || cam.z > 1.15 ? s.w.w : '', sx, sy + r + 18); ctx.textAlign = 'start';
      }
    }
    // constellation names when zoomed out
    if (cam.z < .85) for (const c of world.clusters) {
      if (view.set && c.set.id !== view.set) continue;
      const [sx, sy] = toScreen(c.cx, c.cy - c.r - 36);
      const known = c.stars.filter((s) => d.words[s.key]?.seen).length;
      ctx.textAlign = 'center'; ctx.fillStyle = ink; ctx.globalAlpha = Math.min(1, (.85 - cam.z) * 4);
      ctx.font = '800 17px "Bricolage Grotesque", system-ui, sans-serif'; ctx.fillText(`${c.set.emoji} ${c.set.title}`, sx, sy);
      ctx.font = '500 12px system-ui, sans-serif'; ctx.fillText(`${known} / ${c.stars.length} discovered`, sx, sy + 18);
      ctx.globalAlpha = 1; ctx.textAlign = 'start';
    }
  }
  const loop = (t) => { if (!running) return; draw(t); raf = requestAnimationFrame(loop); };
  const startLoop = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };
  const stopLoop = () => { running = false; cancelAnimationFrame(raf); };

  // ----- input -----
  const pts = new Map();
  let moved = 0, pinch = 0;
  const hit = (sx, sy) => {
    let best = null, bd = 1e9;
    for (const s of world.stars) {
      if (view.set && s.set.id !== view.set) continue;
      const [x, y] = toScreen(s.x, s.y); const d = Math.hypot(x - sx, y - sy);
      const r = starStyle(s).r * (.65 + .35 * Math.min(2, cam.z)) + 10;
      if (d < r && d < bd) { best = s; bd = d; }
    }
    return best;
  };
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  canvas.addEventListener('pointerdown', (e) => { canvas.setPointerCapture(e.pointerId); const [x, y] = pos(e); pts.set(e.pointerId, { x, y }); moved = 0; if (pts.size === 2) { const [a, b] = [...pts.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); } });
  canvas.addEventListener('pointermove', (e) => {
    const [x, y] = pos(e);
    if (!pts.has(e.pointerId)) { const s = hit(x, y); if (s !== hovered) { hovered = s; canvas.style.cursor = s ? 'pointer' : ''; } return; }
    const p = pts.get(e.pointerId); const dx = x - p.x, dy = y - p.y; p.x = x; p.y = y;
    if (pts.size === 1) { moved += Math.abs(dx) + Math.abs(dy); cam.x -= dx / cam.z; cam.y -= dy / cam.z; cam.tx = cam.x; cam.ty = cam.y; }
    else if (pts.size === 2) { const [a, b] = [...pts.values()]; const dist = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) zoomAt((a.x + b.x) / 2, (b.y + a.y) / 2, dist / pinch); pinch = dist; moved = 99; }
  });
  const up = (e) => { const [x, y] = pos(e); const wasOne = pts.size === 1; pts.delete(e.pointerId); pinch = 0; if (wasOne && moved < 6) { const s = hit(x, y); s ? select(s) : closeCard(); } };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', (e) => { pts.delete(e.pointerId); });
  function zoomAt(sx, sy, k) {
    const [wx, wy] = toWorld(sx, sy);
    cam.z = cam.tz = Math.min(3.2, Math.max(.22, cam.z * k));
    cam.x = cam.tx = wx - (sx - W / 2) / cam.z; cam.y = cam.ty = wy - (sy - H / 2) / cam.z;
  }
  canvas.addEventListener('wheel', (e) => { e.preventDefault(); const [x, y] = pos(e); zoomAt(x, y, Math.exp(-e.deltaY * .0015)); }, { passive: false });
  canvas.addEventListener('keydown', (e) => {
    const step = 60 / cam.z;
    if (e.key === 'ArrowLeft') cam.tx -= step; else if (e.key === 'ArrowRight') cam.tx += step; else if (e.key === 'ArrowUp') cam.ty -= step; else if (e.key === 'ArrowDown') cam.ty += step;
    else if (e.key === '+' || e.key === '=') cam.tz = Math.min(3.2, cam.tz * 1.2); else if (e.key === '-') cam.tz = Math.max(.22, cam.tz / 1.2);
    else if (e.key === 'Escape') closeCard(); else return;
    e.preventDefault();
  });

  // ----- HUD controls -----
  const setChips = () => hud.replaceChildren(
    h('button', { class: 'btn sm glass', onclick: () => { view.set = null; selected = null; closeCard(); fit(); setChips(); } }, icon('expand', 15), 'Fit all'),
    ...world.clusters.map((c) => h('button', { class: `chip${view.set === c.set.id ? ' on' : ''}`, onclick: () => { view.set = view.set === c.set.id ? null : c.set.id; if (view.set) { cam.tx = c.cx; cam.ty = c.cy; cam.tz = Math.min(1.5, Math.min(W, H) / (c.r * 2 + 200)); } else fit(); setChips(); } }, `${c.set.emoji} ${c.set.title}`)));

  // ----- word card -----
  function closeCard() { selected = null; review = review && review.idx < review.queue.length ? review : null; card.classList.remove('show'); }
  function select(s, fly = true) {
    selected = s; revealed = !review;
    if (discoverWord(s.key)) { addXP(3, 'discover'); beep('good'); }
    if (fly) { cam.tx = s.x + (W > 700 ? 90 / 1.6 : 0); cam.ty = s.y + (W > 700 ? 0 : 70); cam.tz = Math.max(cam.tz, 1.5); }
    paintCard(); paintStats();
  }
  function paintCard() {
    const s = selected; if (!s) return card.classList.remove('show');
    const st = wordState(s.key), saved = D().saved.includes(s.key);
    const boxes = h('div', { class: 'boxes', title: `Level ${st.box} of 5` }, [1, 2, 3, 4, 5].map((i) => h('i', { class: i <= st.box ? 'on' : '' })));
    const showAll = revealed;
    card.replaceChildren(
      h('div', { class: 'row between' }, h('span', { class: 'chip', style: { borderColor: s.set.color } }, `${s.set.emoji} ${s.set.title}`), h('button', { class: 'fav-btn', 'aria-label': 'Close', onclick: () => { review = null; closeCard(); } }, icon('x'))),
      h('div', { class: 'row', style: { margin: '10px 0 2px' } }, h('span', { class: 'w' }, s.w.w), h('button', { class: 'fav-btn', 'aria-label': `Hear ${s.w.w}`, onclick: () => speak(s.w.w) }, icon('sound')),
        h('button', { class: 'fav-btn', 'aria-pressed': String(saved), 'aria-label': saved ? 'Unsave word' : 'Save word', onclick: () => { const on = toggleIn('saved', s.key); toast(on ? 'Saved to your words' : 'Removed from saved'); paintCard(); } }, icon('heart'))),
      h('div', { class: 'pos' }, s.w.pos),
      boxes,
      showAll ? h('div', uzOf(s.w) ? h('p', { class: 'uz' }, s.w.uz) : null, h('p', s.w.def), s.w.ex ? h('p', { class: 'ex' }, s.w.ex) : null,
        s.w.syn?.length ? h('div', { class: 'chips', style: { marginTop: '10px' } }, h('span', { class: 'small muted' }, t('Similar') + ':'), s.w.syn.map((x) => { const t = world.stars.find((q) => q.w.w.toLowerCase() === x.toLowerCase()); return t ? h('button', { class: 'chip', onclick: () => select(t) }, x) : h('span', { class: 'chip' }, x); })) : null)
        : h('button', { class: 'btn', style: { marginTop: '6px' }, onclick: () => { revealed = true; paintCard(); } }, t('Show meaning')),
      showAll ? h('div', { class: 'row', style: { marginTop: '14px' } },
        h('button', { class: 'btn primary', onclick: () => answer(true) }, icon('check', 18), t('I know it')),
        h('button', { class: 'btn', onclick: () => answer(false) }, t('Still learning'))) : null,
      review ? h('p', { class: 'small muted', style: { marginTop: '10px' } }, `Orbit review: ${Math.min(review.idx + 1, review.queue.length)} of ${review.queue.length}`) : null);
    card.classList.add('show');
  }
  function answer(ok) {
    const s = selected;
    const before = wordState(s.key).box;
    const st = markWord(s.key, ok);
    addXP(ok ? 2 : 1, 'word');
    beep(ok ? 'good' : 'bad');
    if (ok && st.box === 5 && before < 5) { toast(`☀️ “${s.w.w}” is now a sun. Mastered!`, 'good'); confetti(60); }
    else toast(ok ? 'Got it. The star grows brighter.' : 'No problem. It will come back soon.', ok ? 'good' : '');
    paintStats();
    if (review) { review.done++; nextReview(); } else paintCard();
  }

  // ----- Orbit review: fly from star to star -----
  function startReview() {
    if (view.mode !== 'galaxy') setMode('galaxy');
    let q = world.stars.filter((s) => isDue(s.key));
    if (!q.length) q = world.stars.filter((s) => wordState(s.key).seen && wordState(s.key).box < 5).sort((a, b) => wordState(a.key).box - wordState(b.key).box).slice(0, 8);
    if (!q.length) q = world.stars.filter((s) => !wordState(s.key).seen).slice(0, 6);
    if (!q.length) { toast('Everything is shining. Nothing to review right now.', 'good'); return; }
    review = { queue: q.slice(0, 10), idx: 0, done: 0 };
    view.set = null; setChips();
    nextReview(true);
  }
  function nextReview(first) {
    if (!first) review.idx++;
    if (review.idx >= review.queue.length) {
      const n = review.done; review = null; closeCard(); fit();
      addXP(5 + n * 2, 'review'); confetti(120); beep('win');
      toast(`Orbit complete. You reviewed ${n} words.`, 'good');
      return;
    }
    revealed = false; selected = review.queue[review.idx];
    cam.tx = selected.x + (W > 700 ? 56 : 0); cam.ty = selected.y + (W > 700 ? 0 : 70); cam.tz = 1.6;
    paintCard();
  }

  // ----- boot -----
  paintTabs(); paintStats(); setChips();
  const unsub = on('data', () => { if (view.mode === 'galaxy') paintStats(); });
  const ro = new ResizeObserver(() => { resize(); });
  setMode(query?.get('list') ? 'list' : 'galaxy');
  ro.observe(wrap);
  const focusKey = query?.get('w');
  if (focusKey) { const s = world.stars.find((x) => x.key === focusKey); if (s) setTimeout(() => select(s), 350); }
  if (query?.get('review')) setTimeout(startReview, 450);
  return () => { stopLoop(); ro.disconnect(); unsub(); };
}
