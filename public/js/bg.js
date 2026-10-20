// The living background: a WebGL aurora (domain-warped noise ribbons + twinkling stars)
// with a layer of drifting English words that glow and connect near the pointer.
import { getSettings, effectiveTheme, on } from './store.js';

const VERT = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }';
const FRAG = `
precision highp float;
uniform vec2 r; uniform float t; uniform vec2 m; uniform vec3 c1, c2, c3, bg; uniform float light;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for(int i=0;i<4;i++){ s += a * vn(p); p = p*2.03 + 7.1; a *= .5; } return s; }
void main(){
  vec2 uv = gl_FragCoord.xy / r;
  vec2 p = (gl_FragCoord.xy - .5 * r) / r.y;
  vec2 q = vec2(fbm(p*1.3 + vec2(t*.03, 0.)), fbm(p*1.3 + vec2(4.2, 1.7) - t*.025));
  vec2 w = p + (q - .5) * .85 + (m - .5) * vec2(.12, .08);
  vec3 col = mix(bg * 1.35, bg, smoothstep(0., 1., uv.y));
  float glow = 0.;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float y = w.y - (.18 - fi * .26) + .16 * sin(w.x * (1.5 + fi * .45) + t * (.11 + fi * .04) + fi * 2.1);
    float band = exp(-pow(y * (3.2 + fi * 1.1), 2.));
    float streak = .55 + .45 * vn(vec2(w.x * 9. + fi * 13., t * .08));
    vec3 c = i == 0 ? c1 : (i == 1 ? c2 : c3);
    col += c * band * streak * (.55 - fi * .08);
    glow += band;
  }
  col += q.x * .06 * c1 + q.y * .05 * c3;
  // stars (dark mode only)
  vec2 g = gl_FragCoord.xy / 3.2; vec2 id = floor(g); vec2 f = fract(g) - .5;
  float rnd = h21(id);
  float star = step(.985, rnd) * smoothstep(.34, 0., length(f)) * (.5 + .5 * sin(t * (1. + rnd * 3.) + rnd * 40.));
  col += vec3(.9, .92, 1.) * star * (1. - light) * (1. - clamp(glow, 0., 1.) * .6);
  // pointer halo
  float d = length(uv * vec2(r.x / r.y, 1.) - m * vec2(r.x / r.y, 1.));
  col += c1 * .12 * exp(-d * 3.2) * (1. - light * .4);
  // light mode: lift toward pastel
  col = mix(col, mix(vec3(.93, .92, 1.), col * .9 + .2, .55), light);
  col *= 1. - .35 * dot(uv - .5, uv - .5);
  gl_FragColor = vec4(col, 1.);
}`;

const hex = (h) => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
const mix = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

let gl, prog, U = {}, canvas, wcanvas, wctx, running = false, raf = 0;
const pointer = { x: .5, y: .5, tx: .5, ty: .5, px: -999, py: -999 };
let words = [];
let list = ['hello', 'curious', 'journey', 'brilliant', 'whisper', 'horizon'];
let W = 0, H = 0, dpr = 1, start = performance.now();

// New word lists only change the words that appear next. Re-seeding here made every word jump while the page was loading.
let introStart = 0;
export function setWordList(l) {
  if (!l?.length) return;
  list = l;
  // while the background is still fading in, swap the text quietly so the starter words never show
  if (words.length && (!introStart || performance.now() - introStart < 2500)) for (const w of words) w.text = list[(Math.random() * list.length) | 0];
}

export function startBackground() {
  canvas = document.getElementById('bg');
  wcanvas = document.getElementById('words');
  wctx = wcanvas.getContext('2d');
  try {
    gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'low-power' });
    if (gl) initGL();
  } catch { gl = null; }
  if (!gl) canvas.style.background = 'radial-gradient(circle at 30% 20%, color-mix(in oklab, var(--accent) 40%, var(--bg)), var(--bg) 70%)';
  resize();
  seedWords();
  addEventListener('resize', resize);
  addEventListener('pointermove', (e) => { pointer.tx = e.clientX / innerWidth; pointer.ty = 1 - e.clientY / innerHeight; pointer.px = e.clientX; pointer.py = e.clientY; }, { passive: true });
  addEventListener('pointerleave', () => { pointer.px = pointer.py = -999; });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : go()));
  on('settings', () => { if (words.length !== wordCount()) seedWords(); go(); });
  go();
}

function initGL() {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog); gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  for (const n of ['r', 't', 'm', 'c1', 'c2', 'c3', 'bg', 'light']) U[n] = gl.getUniformLocation(prog, n);
}

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  const scale = gl ? Math.min(1, 900 / Math.max(W, H)) : 1; // render the shader at lower resolution; it is all soft gradients
  canvas.width = Math.round(W * scale); canvas.height = Math.round(H * scale);
  wcanvas.width = W * dpr; wcanvas.height = H * dpr;
  wctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (gl) gl.viewport(0, 0, canvas.width, canvas.height);
  // Keep the words where they are when the window changes (phone address bars resize it constantly).
  if (words.length && oldW && oldH) for (const w of words) { w.x *= W / oldW; w.y *= H / oldH; }
  if (!words.length || Math.abs(W - oldW) > 200) seedWords();
  oldW = W; oldH = H;
}
let oldW = 0, oldH = 0;

const wordCount = () => (getSettings().motion === 'calm' ? 14 : Math.round(Math.min(46, Math.max(18, (W * H) / 38000))));
function seedWords() {
  const n = wordCount();
  words = Array.from({ length: n }, () => {
    const z = Math.random();
    return {
      text: list[(Math.random() * list.length) | 0], x: Math.random() * W, y: Math.random() * H, z,
      size: 13 + z * z * 40, vx: (Math.random() - .5) * .12 * (.4 + z), vy: -(.04 + Math.random() * .16) * (.4 + z), a: .07 + z * .3, rot: (Math.random() - .5) * .25, glow: 0,
    };
  });
}

function stop() { running = false; cancelAnimationFrame(raf); }
function go() { if (running || document.hidden) return; running = true; raf = requestAnimationFrame(frame); }

function palette() {
  const light = effectiveTheme() === 'light';
  const accent = hex(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7b6cff');
  return {
    light, bg: light ? [.93, .92, 1] : [.043, .035, .125],
    c1: accent, c2: [.18, .83, .71], c3: mix([1, .48, .42], accent, .25),
  };
}

let lastNow = 0;
function frame(now) {
  if (!running) return;
  if (!introStart) introStart = now;
  // time-based movement so 90/120 Hz screens are not twice as fast, and a gentle start instead of a rush
  const k = Math.min(3, lastNow ? (now - lastNow) / 16.67 : 1); lastNow = now;
  const intro = Math.min(1, (now - introStart) / 3000);
  const ease = intro * intro * (3 - 2 * intro);
  const reading = document.documentElement.dataset.reading === 'on';
  const calm = getSettings().motion === 'calm' || matchMedia('(prefers-reduced-motion: reduce)').matches;
  pointer.x += (pointer.tx - pointer.x) * .05; pointer.y += (pointer.ty - pointer.y) * .05;
  const t = calm ? 12 : (now - start) / 1000;
  if (!reading) {
    if (gl) {
      const P = palette();
      gl.uniform2f(U.r, canvas.width, canvas.height); gl.uniform1f(U.t, t); gl.uniform2f(U.m, pointer.x, pointer.y);
      gl.uniform3fv(U.c1, P.c1); gl.uniform3fv(U.c2, P.c2); gl.uniform3fv(U.c3, P.c3); gl.uniform3fv(U.bg, P.bg); gl.uniform1f(U.light, P.light ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    drawWords(calm, k, ease);
  }
  raf = requestAnimationFrame(frame);
}

function drawWords(calm, k = 1, ease = 1) {
  const ctx = wctx;
  ctx.clearRect(0, 0, W, H);
  const light = effectiveTheme() === 'light';
  const ink = light ? '40,30,120' : '230,226,255';
  const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7b6cff';
  const mx = pointer.px, my = pointer.py;
  const ox = (pointer.x - .5) * -30, oy = (.5 - pointer.y) * -30;
  const near = [];
  for (const w of words) {
    if (!calm) { w.x += w.vx * k * (.2 + .8 * ease); w.y += w.vy * k * (.2 + .8 * ease); }
    if (w.y < -60) { w.y = H + 40; w.x = Math.random() * W; w.text = list[(Math.random() * list.length) | 0]; }
    if (w.x < -200) w.x = W + 100; if (w.x > W + 200) w.x = -100;
    const sx = w.x + ox * w.z, sy = w.y + oy * w.z;
    const d = Math.hypot(sx - mx, sy - my);
    const target = d < 170 ? 1 - d / 170 : 0;
    w.glow += (target - w.glow) * Math.min(1, .1 * k);
    if (w.glow > .25) near.push([sx, sy, w.glow]);
    ctx.save();
    ctx.translate(sx, sy); ctx.rotate(w.rot);
    ctx.font = `${w.glow > .3 ? 700 : 500} ${w.size * (1 + w.glow * .25)}px "Bricolage Grotesque", system-ui, sans-serif`;
    ctx.globalAlpha = Math.min(1, (w.a * (light ? .75 : 1) + w.glow * .7) * ease);
    ctx.fillStyle = w.glow > .15 ? accent : `rgb(${ink})`;
    if (w.glow > .15) { ctx.shadowColor = accent; ctx.shadowBlur = 18 * w.glow; }
    ctx.fillText(w.text, 0, 0);
    ctx.restore();
  }
  // constellation lines between glowing words
  ctx.lineWidth = 1;
  for (let i = 0; i < near.length; i++) for (let j = i + 1; j < near.length; j++) {
    ctx.globalAlpha = Math.min(near[i][2], near[j][2]) * .6;
    ctx.strokeStyle = accent;
    ctx.beginPath(); ctx.moveTo(near[i][0], near[i][1]); ctx.lineTo(near[j][0], near[j][1]); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
