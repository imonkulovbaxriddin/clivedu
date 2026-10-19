import { getSession, setSession, content, emit } from './store.js';
import { SEED_LESSONS, SEED_VOCAB } from './data/seed.js';

export const net = { backend: null, googleClientId: null, groups: [], askGroup: false, signupOpen: true, welcome: '' };

async function request(method, path, body, opts = {}) {
  const headers = {};
  const s = getSession();
  if (s?.token) headers.authorization = `Bearer ${s.token}`;
  let payload;
  if (body instanceof Uint8Array || body instanceof Blob) { payload = body; headers['content-type'] = 'application/octet-stream'; }
  else if (body !== undefined) { payload = JSON.stringify(body); headers['content-type'] = 'application/json'; }
  let res;
  try { res = await fetch(path, { method, headers, body: payload }); }
  catch { throw new Error('Cannot reach the server. Check your internet connection.'); }
  if (opts.raw) return res;
  const type = res.headers.get('content-type') || '';
  if (!type.includes('json')) throw new Error('The server is not set up yet (no API found). See the README.');
  const data = await res.json();
  if (res.status === 401 && s) { setSession(null); }
  if (!res.ok) throw new Error(data.error || 'Something went wrong.');
  return data;
}
export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b ?? {}),
  put: (p, b) => request('PUT', p, b),
  patch: (p, b) => request('PATCH', p, b),
  del: (p) => request('DELETE', p),
  bytes: (p, b) => request('POST', p, b),
  raw: (method, p, b) => request(method, p, b, { raw: true }),
};

export async function boot() {
  try {
    const cfg = await api.get('/api/config');
    net.backend = true;
    net.googleClientId = cfg.googleClientId;
    net.groups = cfg.groups || []; net.askGroup = !!cfg.askGroup; net.signupOpen = cfg.signupOpen !== false; net.welcome = cfg.welcome || '';
  } catch { net.backend = false; }
  await loadContent();
  if (net.backend && getSession()) {
    try { const { user } = await api.get('/api/me'); setSession({ ...getSession(), user }); } catch { /* token expired: api() already cleared it */ }
  }
}

export async function loadContent() {
  let lessons = [], vocab = [], site = {};
  if (net.backend) {
    try {
      const r = await api.get('/api/content');
      lessons = r.lessons; vocab = r.vocab; site = r.site || {};
      content.fromServer = true;
    } catch { /* fall back to starter content */ }
  }
  content.starter = !lessons.length && !vocab.length;
  if (!lessons.length) lessons = SEED_LESSONS.map((l) => ({ ...l, unlocked: true, previewPages: 0, pages: 0, hasFile: false, published: true }));
  if (!vocab.length) vocab = SEED_VOCAB;
  content.lessons = lessons; content.vocab = vocab; content.site = site; content.loaded = true;
  emit('content', content);
}

// Sign in helpers
export async function login(email, password) { setSession(await api.post('/api/auth/login', { email, password })); }
export async function register(name, email, password, pick) { setSession(await api.post('/api/auth/register', { name, email, password, ...(pick || {}) })); }
export async function googleLogin(credential) { setSession(await api.post('/api/auth/google', { credential })); }
export function logout() { setSession(null); }

// Google Identity Services button (loaded only when needed)
let gsiPromise;
export function loadGoogle() {
  return (gsiPromise ||= new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = resolve;
    s.onerror = () => reject(new Error('Google sign-in could not load.'));
    document.head.append(s);
  }));
}

// Lesson file -> blob (needs login + access)
export async function fetchLessonFile(id) {
  const res = await api.raw('GET', `/api/lesson/${id}/file`);
  if (!res.ok) {
    let msg = 'Could not open the presentation.';
    try { msg = (await res.json()).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  return new Uint8Array(await res.arrayBuffer());
}

// PowerPoint file -> saved to the student's device (needs login + access)
export async function downloadLessonPptx(id, name = 'presentation.pptx') {
  const res = await api.raw('GET', `/api/lesson/${id}/pptx`);
  if (!res.ok) {
    let msg = 'Could not download the presentation.';
    try { msg = (await res.json()).error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

let pdfPromise;
export function loadPdfJs() {
  return (pdfPromise ||= new Promise((resolve, reject) => {
    if (window.pdfjsLib) return resolve(window.pdfjsLib);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      resolve(window.pdfjsLib);
    };
    s.onerror = () => reject(new Error('The slide viewer could not load. Check your connection.'));
    document.head.append(s);
  }));
}
