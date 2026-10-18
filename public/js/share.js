// "Show off" sharing: a poster image of the student's sky, and a link that shows the same card.
// Progress stays in localStorage; only the summary numbers go into the link.
import { h, modal, toast, icon } from './ui.js';
import { D, getUser, level, BADGES, allWords } from './store.js';

const b64 = (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export const unb64 = (s) => { try { return JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))))); } catch { return null; } };

export function summary() {
  const d = D(), u = getUser();
  const lv = level(d.xp);
  const boxes = allWords().map((w) => d.words[w.key]?.box || 0);
  return {
    n: u?.displayName || 'A ClivEdu learner',
    e: u?.avatar?.emoji || '🦊', c: u?.avatar?.color || '#7b6cff',
    l: lv.lv, x: d.xp, s: d.streak.count, w: Object.keys(d.words).length, m: Object.values(d.words).filter((x) => x.box >= 5).length,
    b: d.badges.length, bb: d.badges.slice(0, 8), k: boxes.slice(0, 80).join(''),
  };
}
export const shareLink = (s = summary()) => `${location.origin}${location.pathname}#/s/${b64(s)}`;

const rnd = (seed) => () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };

export function drawCard(canvas, s) {
  const W = canvas.width = 1080, H = canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#0b0920'); g.addColorStop(.55, '#1a1250'); g.addColorStop(1, '#0b0920');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // aurora ribbons
  ctx.globalCompositeOperation = 'lighter';
  [[s.c, 380, .5], ['#2fd3b5', 760, .35], ['#ff7a6b', 1080, .28]].forEach(([col, y, a], i) => {
    const gr = ctx.createRadialGradient(W * (.25 + i * .3), y, 0, W * (.25 + i * .3), y, 520);
    gr.addColorStop(0, col + Math.round(a * 255).toString(16).padStart(2, '0')); gr.addColorStop(1, col + '00');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  });
  ctx.globalCompositeOperation = 'source-over';
  const r = rnd(s.w * 977 + s.x * 13 + 7);
  for (let i = 0; i < 160; i++) { ctx.fillStyle = `rgba(255,255,255,${.1 + r() * .5})`; ctx.beginPath(); ctx.arc(r() * W, r() * H, r() * 1.6 + .3, 0, 7); ctx.fill(); }
  // the sky: one star per word, brighter with mastery
  const boxes = (s.k || '').split('').map(Number);
  const r2 = rnd(42);
  boxes.forEach((b, i) => {
    const x = 90 + r2() * (W - 180), y = 560 + r2() * 420;
    const col = b >= 5 ? '#ffc65c' : b > 0 ? s.c : '#6f6a9c';
    const size = b === 0 ? 2.2 : 4 + b * 2.4;
    if (b > 0) { const gr = ctx.createRadialGradient(x, y, 0, x, y, size * 5); gr.addColorStop(0, col + 'aa'); gr.addColorStop(1, col + '00'); ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(x, y, size * 5, 0, 7); ctx.fill(); }
    ctx.fillStyle = b > 0 ? '#fff' : col; ctx.beginPath(); ctx.arc(x, y, size, 0, 7); ctx.fill();
  });
  ctx.strokeStyle = 'rgba(190,180,255,.12)'; ctx.lineWidth = 1.5; ctx.beginPath();
  const r3 = rnd(42); const pts = boxes.map(() => [90 + r3() * (W - 180), 560 + r3() * 420]);
  pts.forEach((p, i) => { if (boxes[i] && boxes[i + 1]) { ctx.moveTo(p[0], p[1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); } }); ctx.stroke();

  // avatar + name
  ctx.beginPath(); ctx.arc(160, 190, 86, 0, 7); ctx.fillStyle = s.c; ctx.fill();
  ctx.lineWidth = 6; ctx.strokeStyle = '#ffffff55'; ctx.stroke();
  ctx.font = '96px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(s.e, 160, 196);
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.fillStyle = '#f1eeff';
  ctx.font = '800 76px "Bricolage Grotesque", system-ui, sans-serif'; ctx.fillText(s.n.slice(0, 16), 280, 190);
  ctx.font = '500 34px system-ui, sans-serif'; ctx.fillStyle = '#a7a1cf'; ctx.fillText(`Level ${s.l} · ${s.x} XP`, 282, 240);
  // headline numbers
  const stat = (x, big, small) => { ctx.fillStyle = '#f1eeff'; ctx.font = '800 108px "Bricolage Grotesque", system-ui, sans-serif'; ctx.fillText(String(big), x, 470); ctx.fillStyle = '#a7a1cf'; ctx.font = '500 30px system-ui, sans-serif'; ctx.fillText(small, x, 512); };
  stat(70, s.w, 'stars discovered'); stat(430, s.m, 'words mastered'); stat(790, `${s.s}🔥`, 'day streak');
  // badges
  ctx.font = '56px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  (s.bb || []).forEach((id, i) => { const b = BADGES.find((x) => x.id === id); if (b) ctx.fillText(b.em, 70 + i * 84, 1110); });
  ctx.fillStyle = '#a7a1cf'; ctx.font = '500 30px system-ui, sans-serif';
  ctx.fillText(s.b ? `${s.b} badge${s.b === 1 ? '' : 's'} earned` : 'Badges are waiting to be earned', 70, 1160);
  // footer
  ctx.fillStyle = '#f1eeff'; ctx.font = '800 54px "Bricolage Grotesque", system-ui, sans-serif'; ctx.fillText('ClivEdu', 70, 1270);
  ctx.fillStyle = '#a7a1cf'; ctx.font = '500 30px system-ui, sans-serif'; ctx.fillText('Learn English among the stars', 70, 1312);
  return canvas;
}

export function shareSky() {
  const s = summary();
  const canvas = document.createElement('canvas');
  drawCard(canvas, s);
  const link = shareLink(s);
  modal((sheet, close) => {
    const img = h('img', { class: 'share-img', alt: 'Your sky as a poster', src: canvas.toDataURL('image/png') });
    const toBlob = () => new Promise((res) => canvas.toBlob(res, 'image/png'));
    sheet.append(
      h('h2', { class: 'h2', style: { marginBottom: '14px' } }, 'Show off your sky'),
      h('div', { style: { display: 'grid', justifyItems: 'center', gap: '16px' } }, img,
        h('div', { class: 'row' },
          h('button', { class: 'btn primary', onclick: async () => {
            const blob = await toBlob();
            const file = new File([blob], 'my-clivedu-sky.png', { type: 'image/png' });
            if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: 'My ClivEdu sky', text: `I have discovered ${s.w} words on ClivEdu!`, url: link }); return; } catch { return; } }
            const a = h('a', { href: URL.createObjectURL(blob), download: 'my-clivedu-sky.png' }); a.click(); toast('Image saved.', 'good');
          } }, icon('share', 18), 'Share or save image'),
          h('button', { class: 'btn', onclick: async () => { try { await navigator.clipboard.writeText(link); toast('Link copied.', 'good'); } catch { prompt('Copy this link', link); } } }, 'Copy link'),
          h('button', { class: 'btn ghost', onclick: close }, 'Close')),
        h('p', { class: 'hint' }, 'The link shows only the numbers on this poster. Your full progress stays on your device.')));
  });
}
