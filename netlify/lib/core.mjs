// ClivEdu API core. Pure logic over a tiny storage interface, so the same code
// runs on Netlify Blobs (production) and on plain files (local dev server).
//
// db interface:
//   getJSON(store,key) setJSON(store,key,val) del(store,key) keys(store,prefix?)
//   getBin(store,key) -> Uint8Array|null   setBin(store,key,bytes)
//   streamBin(store,key) -> ReadableStream|null

import crypto from 'node:crypto';

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
const fail = (status, message) => json({ error: message }, status);

const b64u = (buf) => Buffer.from(buf).toString('base64url');
const uid = () => crypto.randomBytes(7).toString('hex');
const now = () => Date.now();
const clean = (s, max = 200) => String(s ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'];
const DEFAULT_GROUPS = [
  { id: 'beginner', name: 'Beginner', level: 'A1' },
  { id: 'elementary', name: 'Elementary', level: 'A2' },
  { id: 'intermediate', name: 'Intermediate', level: 'B1' },
  { id: 'upper-intermediate', name: 'Upper-intermediate', level: 'B2' },
  { id: 'advanced', name: 'Advanced', level: 'C1' },
];
const DEFAULT_SETTINGS = { signupOpen: true, askGroup: true, studentsChangeGroup: false, newLessonAccess: 'private', hwDefaultDays: 3, welcome: '' };
const pickLevel = (v) => (LEVELS.includes(String(v).toUpperCase()) ? String(v).toUpperCase() : null);

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}
function checkPassword(password, user) {
  if (!user.hash) return false;
  const { hash } = hashPassword(password, user.salt);
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(user.hash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function createApp(db, env = () => undefined) {
  let secretCache = null;
  async function secret() {
    if (secretCache) return secretCache;
    const fromEnv = env('AUTH_SECRET');
    if (fromEnv) return (secretCache = fromEnv);
    let s = await db.getJSON('config', 'secret');
    if (!s) {
      s = { value: crypto.randomBytes(32).toString('hex') };
      await db.setJSON('config', 'secret', s);
    }
    return (secretCache = s.value);
  }
  async function sign(payload, days = 30) {
    const body = b64u(JSON.stringify({ ...payload, exp: now() + days * 864e5 }));
    const sig = crypto.createHmac('sha256', await secret()).update(body).digest('base64url');
    return `${body}.${sig}`;
  }
  async function verify(token) {
    if (!token || !token.includes('.')) return null;
    const [body, sig] = token.split('.');
    const expect = crypto.createHmac('sha256', await secret()).update(body).digest('base64url');
    const a = Buffer.from(sig), b = Buffer.from(expect);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    try {
      const p = JSON.parse(Buffer.from(body, 'base64url').toString());
      return p.exp > now() ? p : null;
    } catch { return null; }
  }
  async function authUser(req) {
    const h = req.headers.get('authorization') || '';
    const p = await verify(h.startsWith('Bearer ') ? h.slice(7) : '');
    if (!p) return null;
    return (await db.getJSON('users', p.sub)) || null;
  }
  const publicUser = (u) => ({
    id: u.id, email: u.email, role: u.role, displayName: u.displayName, fullName: u.fullName,
    avatar: u.avatar, bio: u.bio, goal: u.goal, level: u.level || 'A1', levelSet: !!u.levelSet, groupId: u.groupId || null, groupSet: !!u.groupSet, created: u.created, google: !!u.googleSub, picture: u.picture || null,
  });
  async function startSession(u) {
    return { token: await sign({ sub: u.id }), user: publicUser(u) };
  }
  async function roleForNewUser(email) {
    const teacherEmail = (env('TEACHER_EMAIL') || '').toLowerCase().trim();
    if (teacherEmail) return teacherEmail === email ? 'teacher' : 'student';
    // Without TEACHER_EMAIL the very first account becomes the teacher. A claim record makes sure only one ever does.
    const existing = await db.keys('users');
    if (existing.length === 0 && !(await db.getJSON('config', 'teacher-claim'))) {
      await db.setJSON('config', 'teacher-claim', { at: now() });
      return 'teacher';
    }
    return 'student';
  }
  async function createUser({ email, fullName, password, googleSub, picture, level, groupId }) {
    const id = uid();
    const role = await roleForNewUser(email);
    const user = {
      id, email, role, fullName, displayName: fullName.split(' ')[0] || fullName,
      avatar: { emoji: '🦊', color: '#7b6cff', frame: 'ring' }, bio: '', goal: '',
      created: now(), googleSub: googleSub || null, picture: picture || null,
      level: level || 'A1', levelSet: !!level, groupId: groupId || null, groupSet: !!groupId,
    };
    if (password) Object.assign(user, hashPassword(password));
    await db.setJSON('users', id, user);
    await db.setJSON('emails', email, { id });
    if (googleSub) await db.setJSON('google', googleSub, { id });
    return user;
  }

  const requireTeacher = async (req) => {
    const u = await authUser(req);
    return u && u.role === 'teacher' ? u : null;
  };

  const emailKey = (email) => crypto.createHash('sha256').update(email).digest('hex').slice(0, 40);
  const LOCK_AFTER = 6, LOCK_MS = 10 * 60 * 1000;
  async function lockedOut(email) {
    const r = await db.getJSON('attempts', emailKey(email));
    return !!r && r.n >= LOCK_AFTER && now() - r.t < LOCK_MS;
  }
  async function noteFailure(email) {
    const k = emailKey(email);
    const r = (await db.getJSON('attempts', k)) || { n: 0, t: 0 };
    await db.setJSON('attempts', k, { n: now() - r.t > LOCK_MS ? 1 : r.n + 1, t: now() });
  }
  const clearFailures = (email) => db.del('attempts', emailKey(email));
  const goodPassword = (pw) => String(pw || '').length >= 8 && String(pw).length <= 200;

  async function getGroups() {
    const g = await db.getJSON('config', 'groups');
    return g && Array.isArray(g.groups) && g.groups.length ? g.groups : DEFAULT_GROUPS;
  }
  async function getSettings() { return { ...DEFAULT_SETTINGS, ...((await db.getJSON('config', 'settings')) || {}) }; }
  // Sign-up is allowed unless the teacher closed it. The very first account and the TEACHER_EMAIL account always can.
  async function signupAllowed(email) {
    const st = await getSettings();
    if (st.signupOpen) return true;
    const teacherEmail = (env('TEACHER_EMAIL') || '').toLowerCase().trim();
    if (teacherEmail && teacherEmail === email) return true;
    return (await db.keys('users')).length === 0;
  }

  async function lessonAccess(lesson, user) {
    if (lesson.access !== 'private') return true;
    if (!user) return false;
    if (user.role === 'teacher') return true;
    const grant = (await db.getJSON('access', lesson.id)) || { all: false, users: [] };
    return grant.all || grant.users.includes(user.id) || (!!user.groupId && (grant.groups || []).includes(user.groupId));
  }

  async function allOf(store) {
    const ks = await db.keys(store);
    const items = await Promise.all(ks.map((k) => db.getJSON(store, k)));
    return items.filter(Boolean);
  }

  // ----- route table -----
  const routes = [];
  const route = (method, pattern, handler) => {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:[a-z]+/gi, (m) => { keys.push(m.slice(1)); return '([^/]+)'; }) + '/?$');
    routes.push({ method, re, keys, handler });
  };

  route('GET', '/api/config', async () => {
    const st = await getSettings();
    return json({ googleClientId: env('GOOGLE_CLIENT_ID') || null, backend: true, groups: await getGroups(), askGroup: !!st.askGroup, signupOpen: !!st.signupOpen, welcome: st.welcome || '' });
  });

  route('POST', '/api/auth/register', async (req) => {
    const b = await req.json().catch(() => ({}));
    const email = clean(b.email, 120).toLowerCase();
    const fullName = clean(b.name, 60);
    const password = String(b.password || '');
    if (!EMAIL.test(email)) return fail(400, 'Enter a valid email address.');
    if (fullName.length < 2) return fail(400, 'Enter your name.');
    if (password.length < 8) return fail(400, 'Use a password with at least 8 characters.');
    if (await db.getJSON('emails', email)) return fail(409, 'An account with this email already exists. Try logging in.');
    if (!(await signupAllowed(email))) return fail(403, 'Sign-up is closed right now. Ask your teacher to open it or to make an account for you.');
    const group = (await getGroups()).find((g) => g.id === b.groupId);
    const user = await createUser({ email, fullName, password, level: pickLevel(b.level) || (group && pickLevel(group.level)), groupId: group ? group.id : null });
    return json(await startSession(user), 201);
  });

  route('POST', '/api/auth/login', async (req) => {
    const b = await req.json().catch(() => ({}));
    const email = clean(b.email, 120).toLowerCase();
    const ref = await db.getJSON('emails', email);
    const user = ref && (await db.getJSON('users', ref.id));
    await new Promise((r) => setTimeout(r, 250));
    if (user && (await lockedOut(email))) return fail(429, 'Too many wrong passwords. Wait 10 minutes and try again, or ask your teacher to reset your password.');
    if (!user) return fail(401, 'There is no account with this email on this site yet. Choose “Create an account” to make one.');
    if (!user.hash) return fail(401, 'This account was made with Google. Use the Google button to sign in.');
    if (!checkPassword(String(b.password || ''), user)) { await noteFailure(email); return fail(401, 'The password is not right. Try again.'); }
    await clearFailures(email);
    return json(await startSession(user));
  });

  route('POST', '/api/auth/google', async (req) => {
    const clientId = env('GOOGLE_CLIENT_ID');
    if (!clientId) return fail(501, 'Google sign-in is not set up yet.');
    const b = await req.json().catch(() => ({}));
    const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(String(b.credential || '')));
    if (!r.ok) return fail(401, 'Google could not verify this sign-in. Try again.');
    const info = await r.json();
    if (info.aud !== clientId || !(info.email_verified === 'true' || info.email_verified === true)) {
      return fail(401, 'This Google sign-in is not valid for this site.');
    }
    const email = String(info.email).toLowerCase();
    let user;
    const g = await db.getJSON('google', info.sub);
    if (g) user = await db.getJSON('users', g.id);
    if (!user) {
      const ref = await db.getJSON('emails', email);
      if (ref) {
        user = await db.getJSON('users', ref.id);
        user.googleSub = info.sub;
        user.picture = user.picture || info.picture || null;
        await db.setJSON('users', user.id, user);
        await db.setJSON('google', info.sub, { id: user.id });
      } else {
        if (!(await signupAllowed(email))) return fail(403, 'Sign-up is closed right now. Ask your teacher to open it.');
        user = await createUser({ email, fullName: clean(info.name || email.split('@')[0], 60), googleSub: info.sub, picture: info.picture });
      }
    }
    return json(await startSession(user));
  });

  route('GET', '/api/me', async (req) => {
    const u = await authUser(req);
    return u ? json({ user: publicUser(u) }) : fail(401, 'Please log in.');
  });

  // a student picks a starting level once; after that only the teacher can change it
  route('POST', '/api/me/level', async (req) => {
    const u = await authUser(req);
    if (!u) return fail(401, 'Please log in.');
    const b = await req.json().catch(() => ({}));
    const level = pickLevel(b.level);
    if (!level) return fail(400, 'Choose one of the levels.');
    if (u.levelSet && u.role !== 'teacher') return fail(403, 'Your level is set. Ask your teacher to change it.');
    u.level = level; u.levelSet = true;
    await db.setJSON('users', u.id, u);
    return json({ user: publicUser(u) });
  });

  route('POST', '/api/me/group', async (req) => {
    const u = await authUser(req);
    if (!u) return fail(401, 'Please log in.');
    const b = await req.json().catch(() => ({}));
    const group = (await getGroups()).find((g) => g.id === b.groupId);
    if (!group) return fail(400, 'Choose one of the groups.');
    if (u.groupSet && u.role !== 'teacher' && !(await getSettings()).studentsChangeGroup) return fail(403, 'Your group is set. Ask your teacher to change it.');
    u.groupId = group.id; u.groupSet = true;
    if (!u.levelSet && pickLevel(group.level)) { u.level = pickLevel(group.level); u.levelSet = true; }
    await db.setJSON('users', u.id, u);
    return json({ user: publicUser(u) });
  });

  route('POST', '/api/me/password', async (req) => {
    const u = await authUser(req);
    if (!u) return fail(401, 'Please log in.');
    const b = await req.json().catch(() => ({}));
    if (u.hash && !checkPassword(String(b.current || ''), u)) { await noteFailure(u.email); return fail(403, 'Your current password is not right.'); }
    if (!goodPassword(b.next)) return fail(400, 'Use a new password with at least 8 characters.');
    Object.assign(u, hashPassword(String(b.next)));
    await db.setJSON('users', u.id, u);
    await clearFailures(u.email);
    return json({ ok: true });
  });

  // learning progress (XP, streaks, words, badges) kept on the account so it follows the student to any device
  route('GET', '/api/me/progress', async (req) => {
    const u = await authUser(req);
    if (!u) return fail(401, 'Please log in.');
    return json({ progress: (await db.getJSON('progress', u.id)) || null });
  });
  route('PUT', '/api/me/progress', async (req) => {
    const u = await authUser(req);
    if (!u) return fail(401, 'Please log in.');
    const text = await req.text();
    if (text.length > 400000) return fail(413, 'Progress is too large.');
    let b; try { b = JSON.parse(text); } catch { return fail(400, 'Bad progress.'); }
    const d = b && b.data;
    if (!d || typeof d !== 'object' || Array.isArray(d)) return fail(400, 'Bad progress.');
    await db.setJSON('progress', u.id, { data: d, updated: now() });
    return json({ ok: true });
  });

  route('PATCH', '/api/me', async (req) => {
    const u = await authUser(req);
    if (!u) return fail(401, 'Please log in.');
    const b = await req.json().catch(() => ({}));
    if (b.displayName !== undefined) u.displayName = clean(b.displayName, 32) || u.displayName;
    if (b.bio !== undefined) u.bio = clean(b.bio, 160);
    if (b.goal !== undefined) u.goal = clean(b.goal, 80);
    if (b.avatar && typeof b.avatar === 'object') {
      u.avatar = {
        emoji: clean(b.avatar.emoji, 8) || u.avatar.emoji,
        color: /^#[0-9a-f]{6}$/i.test(b.avatar.color) ? b.avatar.color : u.avatar.color,
        frame: ['ring', 'glow', 'dash', 'none'].includes(b.avatar.frame) ? b.avatar.frame : u.avatar.frame,
      };
    }
    await db.setJSON('users', u.id, u);
    return json({ user: publicUser(u) });
  });

  route('GET', '/api/content', async (req) => {
    const user = await authUser(req);
    const lessons = (await allOf('lessons'))
      .filter((l) => l.published !== false || user?.role === 'teacher')
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.title.localeCompare(b.title));
    const out = [];
    for (const l of lessons) {
      const unlocked = await lessonAccess(l, user);
      const item = { ...l, unlocked };
      if (!unlocked && l.notesOpen === false) { item.noteCount = (l.notes || []).length; item.notes = []; }
      out.push(item);
    }
    const vocab = (await allOf('vocab')).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const meta = (await db.getJSON('config', 'site')) || {};
    return json({ lessons: out, vocab, site: meta, serverTime: now() });
  });

  route('GET', '/api/preview/:id/:n', async (req, p) => {
    const bytes = await db.getBin('previews', `${p.id}-${p.n}`);
    if (!bytes) return fail(404, 'No preview.');
    return new Response(bytes, { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=300' } });
  });

  route('GET', '/api/lesson/:id/file', async (req, p) => {
    const user = await authUser(req);
    const lesson = await db.getJSON('lessons', p.id);
    if (!lesson || !lesson.hasFile) return fail(404, 'This lesson has no file yet.');
    if (!(await lessonAccess(lesson, user))) return fail(403, 'Ask your teacher for access to this lesson.');
    const stream = await db.streamBin('files', lesson.id);
    if (!stream) return fail(404, 'File missing.');
    return new Response(stream, { headers: { 'content-type': 'application/pdf', 'cache-control': 'private, max-age=60' } });
  });

  route('GET', '/api/lesson/:id/pptx', async (req, p) => {
    const user = await authUser(req);
    const lesson = await db.getJSON('lessons', p.id);
    if (!lesson || !lesson.hasPptx) return fail(404, 'This lesson has no PowerPoint file yet.');
    if (!(await lessonAccess(lesson, user))) return fail(403, 'Ask your teacher for access to this lesson.');
    const stream = await db.streamBin('files', `${lesson.id}.pptx`);
    if (!stream) return fail(404, 'File missing.');
    const name = (lesson.pptxName || `${lesson.id}.pptx`).replace(/[^\w.\- ]+/g, '_');
    return new Response(stream, { headers: {
      'content-type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'content-disposition': `attachment; filename="${name}"`, 'cache-control': 'private, max-age=60' } });
  });

  route('POST', '/api/lesson/:id/request', async (req, p) => {
    const user = await authUser(req);
    if (!user) return fail(401, 'Log in to ask for access.');
    const lesson = await db.getJSON('lessons', p.id);
    if (!lesson) return fail(404, 'Lesson not found.');
    await db.setJSON('requests', `${p.id}-${user.id}`, { lessonId: p.id, userId: user.id, at: now() });
    return json({ ok: true });
  });

  async function homeworkFor(user) {
    const all = (await allOf('homework')).sort((a, b) => b.created - a.created);
    const mine = all.filter((h) => h.to === 'all' || (Array.isArray(h.to) && h.to.includes(user.id)) || (user.groupId && (h.groups || []).includes(user.groupId)));
    const out = [];
    for (const h of mine) {
      const done = await db.getJSON('hwdone', `${h.id}-${user.id}`);
      out.push({ ...h, done: done ? done.at : null });
    }
    return out;
  }
  route('GET', '/api/homework', async (req) => {
    const user = await authUser(req);
    if (!user) return fail(401, 'Log in to see homework.');
    return json({ homework: await homeworkFor(user), serverTime: now() });
  });
  route('POST', '/api/homework/:id/done', async (req, p) => {
    const user = await authUser(req);
    if (!user) return fail(401, 'Log in first.');
    const b = await req.json().catch(() => ({}));
    if (b.done === false) await db.del('hwdone', `${p.id}-${user.id}`);
    else await db.setJSON('hwdone', `${p.id}-${user.id}`, { at: now() });
    return json({ ok: true });
  });

  // ----- teacher -----
  route('GET', '/api/admin/overview', async (req) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    const students = (await allOf('users')).map((u) => ({ id: u.id, email: u.email, displayName: u.displayName, fullName: u.fullName, role: u.role, created: u.created, avatar: u.avatar, level: u.level || 'A1', levelSet: !!u.levelSet, groupId: u.groupId || null, note: u.note || '', google: !!u.googleSub }));
    for (const s of students) {
      const pr = await db.getJSON('progress', s.id);
      const d = pr && pr.data;
      Object.assign(s, { xp: d?.xp || 0, streak: d?.streak?.count || 0, words: d?.words ? Object.keys(d.words).length : 0, active: pr?.updated || null });
    }
    const access = {};
    for (const l of await allOf('lessons')) access[l.id] = (await db.getJSON('access', l.id)) || { all: false, users: [], groups: [] };
    const requests = await allOf('requests');
    const homework = (await allOf('homework')).sort((a, b) => b.created - a.created);
    const hwdoneKeys = await db.keys('hwdone');
    for (const h of homework) h.doneCount = hwdoneKeys.filter((k) => k.startsWith(h.id + '-')).length;
    return json({ students, access, requests, homework, groups: await getGroups(), settings: await getSettings() });
  });

  // The teacher edits any student: name, email, group, level, private note.
  route('PUT', '/api/admin/student', async (req) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    const b = await req.json().catch(() => ({}));
    const u = await db.getJSON('users', clean(b.userId, 40));
    if (!u) return fail(404, 'Student not found.');
    if (b.level !== undefined) {
      const level = pickLevel(b.level);
      if (!level) return fail(400, 'Choose a level.');
      u.level = level; u.levelSet = true;
    }
    if (b.groupId !== undefined) {
      if (b.groupId === '' || b.groupId === null) { u.groupId = null; u.groupSet = false; }
      else {
        const g = (await getGroups()).find((x) => x.id === b.groupId);
        if (!g) return fail(400, 'That group does not exist.');
        u.groupId = g.id; u.groupSet = true;
      }
    }
    if (b.fullName !== undefined) { const n = clean(b.fullName, 60); if (n.length < 2) return fail(400, 'Enter the name.'); u.fullName = n; }
    if (b.displayName !== undefined) u.displayName = clean(b.displayName, 32) || u.displayName;
    if (b.note !== undefined) u.note = clean(b.note, 300);
    if (b.email !== undefined) {
      const email = clean(b.email, 120).toLowerCase();
      if (email !== u.email) {
        if (!EMAIL.test(email)) return fail(400, 'Enter a valid email address.');
        if (await db.getJSON('emails', email)) return fail(409, 'Another account already uses this email.');
        await db.del('emails', u.email);
        await db.setJSON('emails', email, { id: u.id });
        u.email = email;
      }
    }
    await db.setJSON('users', u.id, u);
    return json({ ok: true, student: { id: u.id, email: u.email, displayName: u.displayName, fullName: u.fullName, level: u.level || 'A1', groupId: u.groupId || null, note: u.note || '' } });
  });

  route('DELETE', '/api/admin/student/:id', async (req, p) => {
    const me = await requireTeacher(req);
    if (!me) return fail(403, 'Teacher access only.');
    const u = await db.getJSON('users', p.id);
    if (!u) return fail(404, 'Student not found.');
    if (u.role === 'teacher') return fail(400, 'A teacher account cannot be removed here.');
    await db.del('users', u.id);
    await db.del('emails', u.email);
    if (u.googleSub) await db.del('google', u.googleSub);
    await db.del('progress', u.id);
    await clearFailures(u.email);
    return json({ ok: true });
  });

  route('PUT', '/api/admin/groups', async (req) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    const b = await req.json().catch(() => ({}));
    if (!Array.isArray(b.groups) || !b.groups.length) return fail(400, 'Keep at least one group.');
    const before = await getGroups();
    const used = new Set();
    const groups = b.groups.slice(0, 30).map((g) => {
      const name = clean(g.name, 40);
      let id = before.find((x) => x.id === g.id) ? g.id : (name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'group') + '-' + uid().slice(0, 4);
      while (used.has(id)) id += 'x';
      used.add(id);
      return { id, name, level: pickLevel(g.level) || '' };
    });
    if (groups.some((g) => !g.name)) return fail(400, 'Every group needs a name.');
    await db.setJSON('config', 'groups', { groups });
    const gone = new Set(before.filter((g) => !used.has(g.id)).map((g) => g.id));
    if (gone.size) {
      for (const u of await allOf('users')) if (u.groupId && gone.has(u.groupId)) { u.groupId = null; u.groupSet = false; await db.setJSON('users', u.id, u); }
    }
    return json({ groups });
  });

  route('PUT', '/api/admin/settings', async (req) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    const b = await req.json().catch(() => ({}));
    const cur = await getSettings();
    const next = {
      signupOpen: b.signupOpen === undefined ? cur.signupOpen : !!b.signupOpen,
      askGroup: b.askGroup === undefined ? cur.askGroup : !!b.askGroup,
      studentsChangeGroup: b.studentsChangeGroup === undefined ? cur.studentsChangeGroup : !!b.studentsChangeGroup,
      newLessonAccess: b.newLessonAccess === 'open' ? 'open' : b.newLessonAccess === 'private' ? 'private' : cur.newLessonAccess,
      hwDefaultDays: Number.isFinite(+b.hwDefaultDays) ? Math.min(60, Math.max(0, Math.round(+b.hwDefaultDays))) : cur.hwDefaultDays,
      welcome: b.welcome === undefined ? cur.welcome : clean(b.welcome, 240),
    };
    await db.setJSON('config', 'settings', next);
    return json({ settings: next });
  });

  route('POST', '/api/admin/student/password', async (req) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    const b = await req.json().catch(() => ({}));
    const u = await db.getJSON('users', clean(b.userId, 40));
    if (!u) return fail(404, 'Student not found.');
    if (!goodPassword(b.password)) return fail(400, 'Use a password with at least 8 characters.');
    Object.assign(u, hashPassword(String(b.password)));
    await db.setJSON('users', u.id, u);
    await clearFailures(u.email);
    return json({ ok: true });
  });

  route('PUT', '/api/admin/lesson', async (req) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    const b = await req.json().catch(() => ({}));
    const id = clean(b.id, 40).replace(/[^a-z0-9-]/gi, '-').toLowerCase() || uid();
    const prev = (await db.getJSON('lessons', id)) || {};
    const lesson = {
      ...prev, id,
      title: clean(b.title, 90) || 'Untitled lesson',
      kind: b.kind === 'vocab' ? 'vocab' : 'grammar',
      level: clean(b.level, 8) || 'A2',
      summary: clean(b.summary, 300),
      summaryUz: clean(b.summaryUz, 300),
      emoji: clean(b.emoji, 8) || '📘',
      notes: Array.isArray(b.notes) ? b.notes.slice(0, 12).map((n) => ({ h: clean(n.h, 80), t: clean(n.t, 400), ex: clean(n.ex, 200), uz: clean(n.uz, 500) })) : (prev.notes || []),
      access: b.access === 'open' ? 'open' : 'private',
      notesOpen: b.notesOpen !== false,
      published: b.published !== false,
      order: Number.isFinite(+b.order) ? +b.order : (prev.order ?? 100),
      updated: now(),
      hasFile: !!prev.hasFile,
      previewPages: prev.previewPages || 0,
      pages: prev.pages || 0,
    };
    await db.setJSON('lessons', id, lesson);
    return json({ lesson });
  });

  route('DELETE', '/api/admin/lesson/:id', async (req, p) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    await db.del('lessons', p.id);
    await db.del('access', p.id);
    await db.del('files', p.id);
    await db.del('files', `${p.id}.pptx`);
    const own = new RegExp('^' + p.id.replace(/[^a-z0-9-]/gi, '') + '-\\d+$');
    for (const k of await db.keys('previews', `${p.id}-`)) if (own.test(k)) await db.del('previews', k);
    for (const k of await db.keys('chunks', `${p.id}.`)) await db.del('chunks', k);
    return json({ ok: true });
  });

  // chunked upload: POST /api/admin/lesson/:id/chunk?upload=U&i=0   (raw bytes)
  route('POST', '/api/admin/lesson/:id/chunk', async (req, p) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    const url = new URL(req.url);
    const upload = clean(url.searchParams.get('upload'), 30).replace(/[^a-z0-9]/gi, '');
    const i = parseInt(url.searchParams.get('i'), 10);
    if (!upload || !(i >= 0)) return fail(400, 'Bad chunk.');
    await db.setBin('chunks', `${p.id}.${upload}-${i}`, new Uint8Array(await req.arrayBuffer()));
    return json({ ok: true });
  });
  route('POST', '/api/admin/lesson/:id/finish', async (req, p) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    const b = await req.json().catch(() => ({}));
    const upload = clean(b.upload, 30).replace(/[^a-z0-9]/gi, '');
    const n = parseInt(b.chunks, 10);
    const lesson = await db.getJSON('lessons', p.id);
    if (!lesson) return fail(404, 'Save the lesson first.');
    const parts = [];
    for (let i = 0; i < n; i++) {
      const part = await db.getBin('chunks', `${p.id}.${upload}-${i}`);
      if (!part) return fail(400, `Chunk ${i} is missing. Upload again.`);
      parts.push(part);
    }
    const total = parts.reduce((s, x) => s + x.length, 0);
    const whole = new Uint8Array(total);
    let off = 0;
    for (const x of parts) { whole.set(x, off); off += x.length; }
    const head = String.fromCharCode(whole[0], whole[1], whole[2], whole[3]);
    const isPptx = b.kind === 'pptx';
    const looksPptx = isPptx && head === 'PK\x03\x04' && Buffer.from(whole.buffer, whole.byteOffset, whole.length).includes('ppt/');
    if (isPptx ? !looksPptx : head !== '%PDF') {
      for (let i = 0; i < n; i++) await db.del('chunks', `${p.id}.${upload}-${i}`);
      return fail(400, isPptx ? 'This file is not a PowerPoint (.pptx) file.' : 'This file is not a PDF. In PowerPoint use File > Export > PDF.');
    }
    await db.setBin('files', isPptx ? `${p.id}.pptx` : p.id, whole);
    for (let i = 0; i < n; i++) await db.del('chunks', `${p.id}.${upload}-${i}`);
    if (isPptx) Object.assign(lesson, { hasPptx: true, pptxName: clean(b.name, 80) || `${p.id}.pptx`, pptxBytes: total, updated: now() });
    else Object.assign(lesson, { hasFile: true, pages: parseInt(b.pages, 10) || lesson.pages, bytes: total, updated: now() });
    await db.setJSON('lessons', p.id, lesson);
    return json({ lesson });
  });
  route('POST', '/api/admin/lesson/:id/preview/:n', async (req, p) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    const lesson = await db.getJSON('lessons', p.id);
    if (!lesson) return fail(404, 'Save the lesson first.');
    const n = parseInt(p.n, 10);
    await db.setBin('previews', `${p.id}-${n}`, new Uint8Array(await req.arrayBuffer()));
    lesson.previewPages = Math.max(lesson.previewPages || 0, n + 1);
    lesson.updated = now();
    await db.setJSON('lessons', p.id, lesson);
    return json({ lesson });
  });
  route('DELETE', '/api/admin/lesson/:id/file/:kind', async (req, p) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    const lesson = await db.getJSON('lessons', p.id);
    if (!lesson) return fail(404, 'Lesson not found.');
    if (p.kind === 'pptx') { await db.del('files', `${p.id}.pptx`); Object.assign(lesson, { hasPptx: false, pptxName: '', pptxBytes: 0 }); }
    else { await db.del('files', p.id); Object.assign(lesson, { hasFile: false, previewPages: 0, pages: 0, bytes: 0 }); }
    lesson.updated = now();
    await db.setJSON('lessons', p.id, lesson);
    return json({ lesson });
  });
  route('POST', '/api/admin/lesson/:id/previews-reset', async (req, p) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    const lesson = await db.getJSON('lessons', p.id);
    if (lesson) { lesson.previewPages = 0; await db.setJSON('lessons', p.id, lesson); }
    return json({ ok: true });
  });

  route('POST', '/api/admin/access', async (req) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    const b = await req.json().catch(() => ({}));
    const lessonId = clean(b.lessonId, 40);
    if (!(await db.getJSON('lessons', lessonId))) return fail(404, 'Lesson not found.');
    const grant = (await db.getJSON('access', lessonId)) || { all: false, users: [] };
    grant.groups = grant.groups || [];
    if (b.userId === 'all') grant.all = !!b.grant;
    else if (String(b.userId).startsWith('group:')) {
      const gid = String(b.userId).slice(6);
      grant.groups = b.grant ? [...new Set([...grant.groups, gid])] : grant.groups.filter((x) => x !== gid);
    } else {
      const set = new Set(grant.users);
      b.grant ? set.add(b.userId) : set.delete(b.userId);
      grant.users = [...set];
      if (b.grant) await db.del('requests', `${lessonId}-${b.userId}`);
    }
    await db.setJSON('access', lessonId, grant);
    return json({ access: grant });
  });

  route('PUT', '/api/admin/vocab', async (req) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    const b = await req.json().catch(() => ({}));
    const id = clean(b.id, 40).replace(/[^a-z0-9-]/gi, '-').toLowerCase() || uid();
    const words = (Array.isArray(b.words) ? b.words : []).slice(0, 300).map((w) => ({
      w: clean(w.w, 40), pos: clean(w.pos, 12), def: clean(w.def, 220), ex: clean(w.ex, 220), uz: clean(w.uz, 120),
      syn: Array.isArray(w.syn) ? w.syn.slice(0, 5).map((s) => clean(s, 30)) : [],
    })).filter((w) => w.w && w.def);
    const set = { id, title: clean(b.title, 60) || 'New word set', emoji: clean(b.emoji, 8) || '✨', color: /^#[0-9a-f]{6}$/i.test(b.color) ? b.color : '#7b6cff', level: clean(b.level, 8) || 'B1', order: Number.isFinite(+b.order) ? +b.order : 100, words };
    await db.setJSON('vocab', id, set);
    return json({ set });
  });
  route('DELETE', '/api/admin/vocab/:id', async (req, p) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    await db.del('vocab', p.id);
    return json({ ok: true });
  });

  route('POST', '/api/admin/homework', async (req) => {
    const teacher = await requireTeacher(req);
    if (!teacher) return fail(403, 'Teacher access only.');
    const b = await req.json().catch(() => ({}));
    const hw = {
      id: uid(), title: clean(b.title, 100), body: clean(b.body, 1500), lessonId: clean(b.lessonId, 40) || null,
      due: Number.isFinite(+b.due) && +b.due > 0 ? +b.due : null,
      groups: Array.isArray(b.groups) ? b.groups.map((g) => clean(g, 60)).slice(0, 30) : [],
      to: b.to === 'all' || !Array.isArray(b.to) ? (Array.isArray(b.groups) && b.groups.length ? [] : 'all') : b.to.slice(0, 500),
      created: now(),
    };
    if (!hw.title) return fail(400, 'Give the homework a title.');
    await db.setJSON('homework', hw.id, hw);
    return json({ homework: hw }, 201);
  });
  route('DELETE', '/api/admin/homework/:id', async (req, p) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    await db.del('homework', p.id);
    return json({ ok: true });
  });

  route('PUT', '/api/admin/site', async (req) => {
    if (!(await requireTeacher(req))) return fail(403, 'Teacher access only.');
    const b = await req.json().catch(() => ({}));
    const site = { announcement: clean(b.announcement, 200), wordOfTheDay: clean(b.wordOfTheDay, 40) };
    await db.setJSON('config', 'site', site);
    return json({ site });
  });

  return async function handle(req) {
    const url = new URL(req.url);
    for (const r of routes) {
      if (r.method !== req.method) continue;
      const m = url.pathname.match(r.re);
      if (!m) continue;
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      try {
        return await r.handler(req, params);
      } catch (e) {
        console.error(e);
        return fail(500, 'Something went wrong on the server. Try again in a moment.');
      }
    }
    return fail(404, 'Not found.');
  };
}
