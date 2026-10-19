// TEACHER DESK: everything a teacher changes lives here, so updating the site never needs a redeploy
// (and the link never changes). Lessons, slides, vocabulary, access, homework, announcements.
import { h, icon, toast, modal, confirmBox, fmtDate, fmtDateTime, avatarEl } from '../ui.js';
import { isTeacher, getUser, content } from '../store.js';
import { api, net, loadContent, loadPdfJs } from '../api.js';
import { SEED_LESSONS, SEED_VOCAB } from '../data/seed.js';
import { LEVELS } from '../data/levels.js';

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || `lesson-${Date.now().toString(36)}`;

export async function render(root) {
  if (!getUser() || !isTeacher()) {
    root.append(h('div', { class: 'empty glass card' }, h('div', { class: 'em' }, '🔐'), h('h1', { class: 'h1' }, 'Teacher desk'),
      h('p', { class: 'lede' }, !net.backend ? 'The server is not connected. Run the site with the Netlify functions to use the desk.' : getUser() ? 'This area is only for the teacher account.' : 'Log in with your teacher account.'),
      getUser() ? null : h('a', { class: 'btn primary', href: '#/login?next=/teacher' }, 'Log in')));
    return;
  }
  let tab = 'lessons';
  let ov = { students: [], access: {}, requests: [], homework: [], groups: [], settings: {} };
  const body = h('div', { class: 'stack' });
  const tabs = h('div', { class: 'seg', role: 'tablist', style: { marginBottom: '18px' } });
  const reloadOv = async () => { try { ov = await api.get('/api/admin/overview'); net.groups = ov.groups || net.groups; } catch (e) { toast(e.message, 'bad'); } };
  const refresh = async () => { await reloadOv(); await loadContent(); show(); };
  const show = () => {
    tabs.replaceChildren(...[['lessons', 'Lessons'], ['vocab', 'Vocabulary'], ['students', `Students${ov.requests.length ? ` (${ov.requests.length} asking)` : ''}`], ['groups', 'Groups'], ['homework', 'Homework'], ['site', 'Announcements'], ['settings', '⚙ Settings']].map(([v, l]) => h('button', { role: 'tab', 'aria-pressed': String(tab === v), onclick: async () => { tab = v; show(); await reloadOv(); show(); } }, l)));
    body.replaceChildren(({ lessons, vocab, students, groups, homework, site, settings }[tab])());
  };

  // =============== lessons ===============
  function lessons() {
    const list = content.starter ? [] : content.lessons;
    return h('div', { class: 'stack' },
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => lessonEditor() }, '+ New lesson'),
        h('button', { class: 'btn', onclick: importStarter }, content.starter ? 'Import starter lessons and words' : 'Add / refresh starter lessons and words')),
      content.starter ? h('div', { class: 'glass card' }, h('b', 'Your site is showing starter content. '), 'Import it to edit and extend it, or create your own lessons from scratch. Once you publish anything, the starter content is replaced by yours.') : null,
      h('div', { class: 'grid' }, list.map((l) => h('article', { class: 'glass card stack', style: { gap: '10px' } },
        h('div', { class: 'row between' }, h('span', { style: { fontSize: '2rem' } }, l.emoji), h('div', { class: 'row' }, l.published === false ? h('span', { class: 'chip' }, 'Draft') : null, h('span', { class: 'chip' }, l.access === 'open' ? 'Open to all' : '🔒 Locked'))),
        h('h3', { class: 'h2' }, l.title),
        h('p', { class: 'small muted' }, `${l.kind === 'vocab' ? 'Vocabulary' : 'Grammar'} · ${l.level} · ${l.hasFile ? `PDF ${l.pages || '?'} slides, ${l.previewPages} preview` : 'no PDF yet'}${l.hasPptx ? ' · PowerPoint attached' : ''}`),
        h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => lessonEditor(l) }, 'Edit'), h('a', { class: 'btn sm ghost', href: `#/lesson/${l.id}` }, 'View'),
          h('button', { class: 'btn sm danger', onclick: async () => { if (await confirmBox(`Delete “${l.title}”?`, 'Delete')) { await api.del(`/api/admin/lesson/${l.id}`); toast('Lesson deleted'); refresh(); } } }, 'Delete'))))));
  }

  async function importStarter() {
    if (!content.starter && !(await confirmBox('Add the built-in lessons and word sets? Items with the same name are replaced by the built-in version (your own new ones stay).', 'Add them'))) return;
    toast('Importing… this takes a moment');
    try {
      const jobs = [...SEED_LESSONS.map((l) => () => api.put('/api/admin/lesson', { ...l, published: true })), ...SEED_VOCAB.map((v) => () => api.put('/api/admin/vocab', v))];
      for (let i = 0; i < jobs.length; i += 6) await Promise.all(jobs.slice(i, i + 6).map((run) => run()));
      toast('Starter content imported. Edit anything you like.', 'good'); refresh();
    } catch (e) { toast(e.message, 'bad'); }
  }

  function lessonEditor(existing) {
    const l = existing ? JSON.parse(JSON.stringify(existing)) : { id: '', title: '', emoji: '📘', kind: 'grammar', level: 'A2', summary: '', notes: [], access: ov.settings?.newLessonAccess || 'private', notesOpen: true, published: true, order: (content.lessons.length + 1) * 10 };
    modal((sheet, close) => {
      const f = (label, el, hint) => h('div', { class: 'field' }, h('label', label), el, hint ? h('span', { class: 'hint' }, hint) : null);
      const inp = (key, props = {}) => h('input', { value: l[key] ?? '', oninput: (e) => { l[key] = e.target.value; }, ...props });
      const notesBox = h('div', { class: 'stack' });
      const paintNotes = () => notesBox.replaceChildren(...l.notes.map((n, i) => h('div', { class: 'glass card stack', style: { padding: '14px', gap: '8px' } },
        h('input', { value: n.h, placeholder: 'Heading, e.g. Form', oninput: (e) => (n.h = e.target.value) }),
        h('textarea', { placeholder: 'Explanation', style: { minHeight: '60px' }, oninput: (e) => (n.t = e.target.value) }, n.t),
        h('input', { value: n.ex, placeholder: 'Example sentence', oninput: (e) => (n.ex = e.target.value) }),
        h('textarea', { placeholder: 'Uzbek explanation (optional, shown to students)', style: { minHeight: '50px' }, oninput: (e) => (n.uz = e.target.value) }, n.uz || ''),
        h('button', { class: 'btn sm ghost danger', style: { justifySelf: 'start' }, onclick: () => { l.notes.splice(i, 1); paintNotes(); } }, 'Remove note'))), h('button', { class: 'btn sm', style: { justifySelf: 'start' }, onclick: () => { l.notes.push({ h: '', t: '', ex: '', uz: '' }); paintNotes(); } }, '+ Add note'));
      paintNotes();
      if (l.notesOpen === undefined) l.notesOpen = true;
      const seg = (key, opts) => { const b = h('div', { class: 'seg' }); const p = () => b.replaceChildren(...opts.map(([v, t]) => h('button', { type: 'button', 'aria-pressed': String(l[key] === v), onclick: () => { l[key] = v; p(); } }, t))); p(); return b; };
      const err = h('p', { class: 'error', role: 'alert' });
      const prog = h('div', { class: 'timer', style: { display: 'none' } }, h('i', { style: { transform: 'scaleX(0)', animation: 'none' } }));
      const status = h('p', { class: 'hint' }, existing?.hasFile ? `Current PDF: ${existing.pages || '?'} slides.` : 'No PDF uploaded yet.');
      const pStatus = h('p', { class: 'hint' }, existing?.hasPptx ? `Current PowerPoint: ${existing.pptxName || 'attached'}.` : 'No PowerPoint attached.');
      const pProg = h('div', { class: 'timer', style: { display: 'none' } }, h('i', { style: { transform: 'scaleX(0)', animation: 'none' } }));
      let previews = 3;

      const saveLesson = async () => {
        if (!l.title.trim()) throw new Error('Give the lesson a title.');
        if (!l.id) l.id = slug(l.title);
        const { lesson } = await api.put('/api/admin/lesson', l);
        Object.assign(l, lesson); return lesson;
      };
      const fileInput = h('input', { type: 'file', accept: 'application/pdf', onchange: async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        err.textContent = '';
        try {
          await saveLesson();
          prog.style.display = ''; const setP = (x, t) => { prog.firstChild.style.transform = `scaleX(${x})`; status.textContent = t; };
          await uploadDeck(l.id, file, previews, setP);
          setP(1, 'Slides uploaded.'); toast('Slides uploaded', 'good'); refresh();
        } catch (ex) { err.textContent = ex.message; status.textContent = ''; }
      } });

      const pptxInput = h('input', { type: 'file', accept: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation', onchange: async (e) => {
        const file = e.target.files?.[0]; if (!file) return;
        err.textContent = '';
        try {
          if (!/\.pptx$/i.test(file.name)) throw new Error('Choose a .pptx file. (Old .ppt files: open them in PowerPoint and use Save As .pptx.)');
          if (file.size > 19 * 1024 * 1024) throw new Error('This file is larger than 18 MB. In PowerPoint use File → Compress Pictures first.');
          await saveLesson();
          pProg.style.display = '';
          await uploadChunks(l.id, new Uint8Array(await file.arrayBuffer()), { kind: 'pptx', name: file.name }, (x, t) => { pProg.firstChild.style.transform = `scaleX(${x})`; pStatus.textContent = t; });
          pStatus.textContent = `PowerPoint attached: ${file.name}`; toast('PowerPoint attached', 'good'); refresh();
        } catch (ex) { err.textContent = ex.message; pStatus.textContent = ''; }
      } });
      const removeFile = async (kind) => {
        if (!l.id || !(await confirmBox(kind === 'pptx' ? 'Remove the PowerPoint file?' : 'Remove the PDF and its previews?', 'Remove'))) return;
        try { const r = await api.del(`/api/admin/lesson/${l.id}/file/${kind}`); Object.assign(l, r.lesson); toast('Removed'); refresh(); (kind === 'pptx' ? pStatus : status).textContent = 'Removed.'; } catch (ex) { err.textContent = ex.message; }
      };

      sheet.append(
        h('h2', { class: 'h2', style: { marginBottom: '14px' } }, existing ? 'Edit lesson' : 'New lesson'),
        h('div', { class: 'stack' },
          h('div', { class: 'row' }, f('Emoji', inp('emoji', { style: { width: '90px' }, maxlength: 4 })), h('div', { class: 'grow' }, f('Title', inp('title', { placeholder: 'e.g. Present Perfect', autofocus: true })))),
          f('Short summary', inp('summary', { placeholder: 'One line students see on the card', maxlength: 300 })),
          f('Summary in Uzbek (optional)', inp('summaryUz', { placeholder: 'Qisqacha izoh', maxlength: 300 })),
          h('div', { class: 'row' }, f('Type', seg('kind', [['grammar', 'Grammar'], ['vocab', 'Vocabulary']])), f('Level', inp('level', { style: { width: '90px' }, placeholder: 'B1' })), f('Order', inp('order', { type: 'number', style: { width: '100px' } }))),
          f('Who can open the slides?', seg('access', [['private', '🔒 Only students I grant'], ['open', 'Everyone']]), 'Locked lessons show a preview to everyone else. Grant access in the Students tab.'),
          f('Quick notes of a locked lesson', seg('notesOpen', [[true, '👀 Free preview for everyone'], [false, '🔒 Hidden until access']]), 'Quick notes appear on the lesson page. Hide them if they give away what the slides teach.'),
          h('label', { class: 'row' }, h('input', { type: 'checkbox', checked: l.published !== false, onchange: (e) => (l.published = e.target.checked) }), 'Published (uncheck to keep it as a draft only you can see)'),
          h('hr', { style: { border: 0, borderTop: '1px solid var(--line)', width: '100%' } }),
          h('h3', { class: 'h3' }, 'Presentation: PDF and PowerPoint'),
          h('p', { class: 'hint' }, 'Upload both for the best result. The PDF is shown on the site, with a free preview before access is given. The PowerPoint (.pptx) is a download that unlocks together with the PDF.'),
          f('1. PDF (shown on the site)', h('div', { class: 'row' }, fileInput, existing?.hasFile ? h('button', { type: 'button', class: 'btn sm ghost danger', onclick: () => removeFile('pdf') }, 'Remove PDF') : null), 'In PowerPoint or Google Slides use File → Export / Download → PDF. Keep it under about 18 MB.'),
          f('Free preview slides', (() => { const b = h('div', { class: 'seg' }); const p = () => b.replaceChildren(...[0, 1, 2, 3, 5].map((n) => h('button', { type: 'button', 'aria-pressed': String(previews === n), onclick: () => { previews = n; p(); } }, n))); p(); return b; })(), 'The first slides everybody can see. The rest stays locked.'),
          prog, status,
          f('2. PowerPoint (.pptx, for download)', h('div', { class: 'row' }, pptxInput, existing?.hasPptx ? h('button', { type: 'button', class: 'btn sm ghost danger', onclick: () => removeFile('pptx') }, 'Remove PowerPoint') : null), 'Students with access can download the original file to keep. Under about 18 MB.'),
          pProg, pStatus,
          h('hr', { style: { border: 0, borderTop: '1px solid var(--line)', width: '100%' } }),
          h('h3', { class: 'h3' }, 'Quick notes (shown on the lesson page)'), notesBox, err,
          h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: async () => { err.textContent = ''; try { await saveLesson(); toast('Lesson saved', 'good'); close(); refresh(); } catch (ex) { err.textContent = ex.message; } } }, 'Save lesson'), h('button', { class: 'btn ghost', onclick: close }, 'Cancel'))));
    });
  }

  async function uploadDeck(id, file, previewCount, progress) {
    progress(.02, 'Reading the PDF…');
    const pdfjs = await loadPdfJs();
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (bytes.length > 19 * 1024 * 1024) throw new Error('This PDF is larger than 18 MB. Compress it first (for example with “Reduce file size” in your PDF app).');
    const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    await api.post(`/api/admin/lesson/${id}/previews-reset`);
    const n = Math.min(previewCount, pdf.numPages);
    for (let i = 0; i < n; i++) {
      progress(.05 + (i / Math.max(1, n)) * .2, `Making preview ${i + 1} of ${n}…`);
      const page = await pdf.getPage(i + 1);
      const vp0 = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: 1280 / vp0.width });
      const c = document.createElement('canvas'); c.width = vp.width; c.height = vp.height;
      await page.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', .8));
      await api.bytes(`/api/admin/lesson/${id}/preview/${i}`, blob);
    }
    await uploadChunks(id, bytes, { kind: 'pdf', pages: pdf.numPages }, (x, t) => progress(.3 + x * .7, t));
  }

  // 3 MB pieces keep every request small enough for Netlify functions
  async function uploadChunks(id, bytes, meta, progress) {
    const CH = 3 * 1024 * 1024, total = Math.ceil(bytes.length / CH), uid = Math.random().toString(36).slice(2, 12);
    for (let i = 0; i < total; i++) {
      progress(i / total, `Uploading ${Math.round((i / total) * 100)}%…`);
      await api.bytes(`/api/admin/lesson/${id}/chunk?upload=${uid}&i=${i}`, bytes.subarray(i * CH, (i + 1) * CH));
    }
    await api.post(`/api/admin/lesson/${id}/finish`, { upload: uid, chunks: total, ...meta });
    progress(1, 'Done.');
  }

  // =============== vocabulary ===============
  function vocab() {
    const list = content.starter ? [] : content.vocab;
    return h('div', { class: 'stack' },
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: () => vocabEditor() }, '+ New word set'), h('button', { class: 'btn', onclick: importStarter }, content.starter ? 'Import starter lessons and words' : 'Add / refresh starter words')),
      h('div', { class: 'grid' }, list.map((s) => h('article', { class: 'glass card stack', style: { gap: '10px' } },
        h('span', { style: { fontSize: '2rem' } }, s.emoji), h('h3', { class: 'h2' }, s.title), h('p', { class: 'small muted' }, `${s.words.length} words · ${s.level}${s.words.some((w) => !w.uz) ? ' · some without Uzbek' : ''}`),
        h('div', { class: 'row' }, h('button', { class: 'btn sm', onclick: () => vocabEditor(s) }, 'Edit'),
          h('button', { class: 'btn sm danger', onclick: async () => { if (await confirmBox(`Delete the set “${s.title}”?`, 'Delete')) { await api.del(`/api/admin/vocab/${s.id}`); refresh(); } } }, 'Delete'))))));
  }
  function vocabEditor(existing) {
    const s = existing ? { ...existing } : { id: '', title: '', emoji: '✨', color: '#7b6cff', level: 'B1', order: (content.vocab.length + 1) };
    const toText = (ws) => ws.map((w) => [w.w, w.pos, w.def, w.ex, (w.syn || []).join(', '), w.uz || ''].join(' | ')).join('\n');
    modal((sheet, close) => {
      const ta = h('textarea', { style: { minHeight: '260px', fontFamily: 'ui-monospace, monospace', fontSize: '.9rem' }, placeholder: 'serendipity | n | finding something good by chance | We found the café by serendipity. | luck, chance | tasodifan topilgan baxt' }, existing ? toText(existing.words) : '');
      const err = h('p', { class: 'error', role: 'alert' });
      sheet.append(h('h2', { class: 'h2', style: { marginBottom: '14px' } }, existing ? 'Edit word set' : 'New word set'),
        h('div', { class: 'stack' },
          h('div', { class: 'row' }, h('div', { class: 'field' }, h('label', 'Emoji'), h('input', { value: s.emoji, style: { width: '90px' }, oninput: (e) => (s.emoji = e.target.value) })), h('div', { class: 'field grow' }, h('label', 'Title'), h('input', { value: s.title, autofocus: true, oninput: (e) => (s.title = e.target.value) })),
            h('div', { class: 'field' }, h('label', 'Colour'), h('input', { type: 'color', value: s.color, oninput: (e) => (s.color = e.target.value) })), h('div', { class: 'field' }, h('label', 'Level'), h('input', { value: s.level, style: { width: '90px' }, oninput: (e) => (s.level = e.target.value) }))),
          h('div', { class: 'field' }, h('label', 'Words, one per line'), ta, h('span', { class: 'hint' }, 'Format: word | part of speech | meaning | example sentence | similar words (optional, separated by commas) | Uzbek translation. Students see the Uzbek translation first. Similar words that exist elsewhere become connected stars in the galaxy.')),
          err,
          h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: async () => {
            err.textContent = '';
            const words = ta.value.split('\n').map((line) => line.split('|').map((x) => x.trim())).filter((p) => p[0] && p[2]).map((p) => ({ w: p[0], pos: p[1] || '', def: p[2], ex: p[3] || '', syn: (p[4] || '').split(',').map((x) => x.trim()).filter(Boolean), uz: p[5] || '' }));
            if (!s.title.trim()) { err.textContent = 'Give the set a title.'; return; }
            if (words.length < 4) { err.textContent = 'Add at least 4 words so games can use the set.'; return; }
            try { if (!s.id) s.id = slug(s.title); await api.put('/api/admin/vocab', { ...s, words }); toast('Word set saved', 'good'); close(); refresh(); } catch (e) { err.textContent = e.message; }
          } }, 'Save word set'), h('button', { class: 'btn ghost', onclick: close }, 'Cancel'))));
    });
  }

  // =============== students & access ===============
  let accessLesson = null;
  const groupName = (id) => (ov.groups || []).find((g) => g.id === id)?.name || '';
  let studFilter = 'all', studSearch = '';
  function students() {
    const studs = ov.students.filter((u) => u.role !== 'teacher');
    const priv = content.lessons.filter((l) => !content.starter && l.access === 'private');
    if (!accessLesson || !priv.find((l) => l.id === accessLesson)) accessLesson = priv[0]?.id;
    const grant = ov.access[accessLesson] || { all: false, users: [], groups: [] };
    const toggle = async (userId, on) => { try { await api.post('/api/admin/access', { lessonId: accessLesson, userId, grant: on }); await refresh(); } catch (e) { toast(e.message, 'bad'); } };
    const sw = (checked, fn, label) => h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked, 'aria-label': label, onchange: (e) => fn(e.target.checked) }), h('span'));
    const progressCell = (u) => h('div', { class: 'small' }, `${u.xp || 0} XP`, h('div', { class: 'muted' }, `🔥 ${u.streak || 0} · ⭐ ${u.words || 0}`, u.active ? ` · ${fmtDate(u.active)}` : ''));
    const save = async (u, patch, okMsg) => { try { await api.put('/api/admin/student', { userId: u.id, ...patch }); Object.assign(u, patch); toast(okMsg, 'good'); } catch (ex) { toast(ex.message, 'bad'); } };

    const editStudent = (u) => modal((sheet, close) => {
      const d = { fullName: u.fullName || '', displayName: u.displayName || '', email: u.email || '', note: u.note || '' };
      const err = h('p', { class: 'error', role: 'alert' });
      const f = (label, key, o = {}) => h('div', { class: 'field' }, h('label', label), h('input', { value: d[key], ...o, oninput: (e) => (d[key] = e.target.value) }));
      sheet.append(h('h2', { class: 'h2' }, `Edit ${u.displayName}`),
        h('div', { class: 'stack', style: { marginTop: '12px' } },
          f('Full name', 'fullName', { maxlength: 60 }), f('Name shown in class', 'displayName', { maxlength: 32 }), f('Email', 'email', { type: 'email' }),
          h('div', { class: 'field' }, h('label', 'Private note (only you see this)'), h('textarea', { maxlength: 300, placeholder: 'e.g. Needs extra speaking practice', oninput: (e) => (d.note = e.target.value) }, d.note)),
          err,
          h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: async () => {
            err.textContent = '';
            try { await api.put('/api/admin/student', { userId: u.id, ...d }); Object.assign(u, d); toast('Student updated', 'good'); close(); show(); } catch (ex) { err.textContent = ex.message; }
          } }, 'Save'), h('button', { class: 'btn', onclick: close }, 'Cancel'))));
    });
    const pwBtn = (u) => h('button', { class: 'btn sm', title: 'Set a temporary password', onclick: async () => {
      const pw = prompt(`New temporary password for ${u.displayName} (at least 8 characters). Tell it to the student; they can change it in their profile.`);
      if (!pw) return;
      try { await api.post('/api/admin/student/password', { userId: u.id, password: pw }); toast(`Password changed for ${u.displayName}`, 'good'); } catch (ex) { toast(ex.message, 'bad'); }
    } }, '🔑');
    const removeBtn = (u) => h('button', { class: 'btn sm danger', title: 'Remove this student', onclick: async () => {
      if (!(await confirmBox(`Remove ${u.displayName} (${u.email})? Their account and saved progress are deleted. This cannot be undone.`, 'Remove'))) return;
      try { await api.del(`/api/admin/student/${u.id}`); toast('Student removed'); refresh(); } catch (ex) { toast(ex.message, 'bad'); }
    } }, '🗑');

    const shown = studs.filter((u) => (studFilter === 'all' || (studFilter === 'none' ? !u.groupId : u.groupId === studFilter))
      && (!studSearch || `${u.displayName} ${u.fullName} ${u.email}`.toLowerCase().includes(studSearch.toLowerCase())));
    const list = h('div', { style: { overflowX: 'auto' } }, shown.length ? h('table', { class: 'table' },
      h('thead', h('tr', ['Student', 'Group', 'Level', 'Progress', 'Joined', ''].map((x) => h('th', x)))),
      h('tbody', shown.map((u) => h('tr',
        h('td', h('div', { class: 'row', style: { flexWrap: 'nowrap' } }, avatarEl(u), h('div', h('b', u.fullName || u.displayName), h('div', { class: 'small muted' }, u.email), u.note ? h('div', { class: 'small', title: u.note }, `📝 ${u.note.slice(0, 40)}${u.note.length > 40 ? '…' : ''}`) : null))),
        h('td', h('select', { 'aria-label': `Group for ${u.displayName}`, style: { width: 'auto' }, onchange: (e) => save(u, { groupId: e.target.value }, `${u.displayName} moved`) },
          h('option', { value: '', selected: !u.groupId }, '— none —'), (ov.groups || []).map((g) => h('option', { value: g.id, selected: g.id === u.groupId }, g.name)))),
        h('td', h('select', { 'aria-label': `Level for ${u.displayName}`, style: { width: 'auto' }, onchange: (e) => save(u, { level: e.target.value }, `${u.displayName} is now ${e.target.value}`) },
          LEVELS.map((lv) => h('option', { value: lv.id, selected: lv.id === (u.level || 'A1') }, `${lv.id} · ${lv.name}`)))),
        h('td', progressCell(u)), h('td', fmtDate(u.created)),
        h('td', h('div', { class: 'row', style: { flexWrap: 'nowrap', gap: '6px' } }, h('button', { class: 'btn sm', title: 'Edit name, email, note', onclick: () => editStudent(u) }, '✏️'), pwBtn(u), removeBtn(u)))))))
      : h('p', { class: 'muted' }, studs.length ? 'No student matches this filter.' : 'No students have signed up yet. Share your site link with the class.'));

    return h('div', { class: 'stack' },
      ov.requests.length ? h('section', { class: 'glass card stack', style: { borderColor: 'var(--gold)' } }, h('h2', { class: 'h2' }, 'Waiting for access'),
        ov.requests.map((r) => { const u = ov.students.find((x) => x.id === r.userId); const les = content.lessons.find((x) => x.id === r.lessonId); return h('div', { class: 'row between' }, h('span', h('b', u?.displayName || 'A student'), ` asked for “${les?.title || r.lessonId}” · ${fmtDateTime(r.at)}`), h('button', { class: 'btn sm primary', onclick: async () => { await api.post('/api/admin/access', { lessonId: r.lessonId, userId: r.userId, grant: true }); refresh(); } }, 'Allow')); })) : null,
      h('section', { class: 'glass card stack' },
        h('div', { class: 'row between' }, h('h2', { class: 'h2' }, `Students (${shown.length}${shown.length !== studs.length ? ` of ${studs.length}` : ''})`),
          h('button', { class: 'btn sm', onclick: () => exportCsv(studs) }, '⬇ Export CSV')),
        h('p', { class: 'muted' }, 'Change a group or level right in the table. ✏️ edits the name, email and a private note, 🔑 sets a temporary password, 🗑 removes the student.'),
        h('div', { class: 'row' },
          h('select', { 'aria-label': 'Filter by group', style: { width: 'auto' }, onchange: (e) => { studFilter = e.target.value; show(); } },
            h('option', { value: 'all', selected: studFilter === 'all' }, 'All groups'), (ov.groups || []).map((g) => h('option', { value: g.id, selected: studFilter === g.id }, `${g.name} (${studs.filter((u) => u.groupId === g.id).length})`)),
            h('option', { value: 'none', selected: studFilter === 'none' }, `No group (${studs.filter((u) => !u.groupId).length})`)),
          h('input', { class: 'grow', type: 'search', placeholder: 'Search by name or email', value: studSearch, 'aria-label': 'Search students', oninput: (e) => { studSearch = e.target.value; clearTimeout(studTimer); studTimer = setTimeout(() => { show(); document.querySelector('[aria-label="Search students"]')?.focus(); }, 350); } })),
        list),
      h('section', { class: 'glass card stack' }, h('h2', { class: 'h2' }, 'Who can open which slides'),
        priv.length ? h('div', { class: 'stack' },
          h('div', { class: 'field' }, h('label', { for: 'acl' }, 'Lesson'), h('select', { id: 'acl', onchange: (e) => { accessLesson = e.target.value; show(); } }, priv.map((l) => h('option', { value: l.id, selected: l.id === accessLesson }, `${l.emoji} ${l.title}`)))),
          h('div', { class: 'setting' }, h('div', h('b', 'Everyone (all students)'), h('span', { class: 'hint' }, 'Turn on to unlock for the whole class, including future students.')), sw(grant.all, (v) => toggle('all', v), 'Unlock for everyone')),
          ...(ov.groups || []).map((g) => h('div', { class: 'setting' }, h('div', h('b', `Group: ${g.name}`), h('span', { class: 'hint' }, 'Everyone in this group, including students who join it later.')), sw(grant.all || (grant.groups || []).includes(g.id), (v) => toggle('group:' + g.id, v), `Unlock for ${g.name}`))),
          studs.length ? h('table', { class: 'table' }, h('thead', h('tr', h('th', 'Student'), h('th', 'Group'), h('th', 'Access'))), h('tbody', studs.map((u) => h('tr', h('td', h('b', u.displayName), h('div', { class: 'small muted' }, u.email)), h('td', groupName(u.groupId) || '—'), h('td', sw(grant.all || grant.users.includes(u.id) || (grant.groups || []).includes(u.groupId), (v) => toggle(u.id, v), `Access for ${u.displayName}`))))))
          : null)
          : h('p', { class: 'muted' }, 'You have no locked lessons yet. Create a lesson and keep “Only students I grant” selected.')));
  }
  let studTimer = null;
  const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  function download(name, text, type) {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name }); document.body.append(a); a.click(); a.remove();
  }
  function exportCsv(studs) {
    const rows = [['Name', 'Display name', 'Email', 'Group', 'Level', 'XP', 'Streak', 'Words', 'Joined', 'Note'], ...studs.map((u) => [u.fullName, u.displayName, u.email, groupName(u.groupId), u.level, u.xp || 0, u.streak || 0, u.words || 0, new Date(u.created).toISOString().slice(0, 10), u.note || ''])];
    download('clivedu-students.csv', '﻿' + rows.map((r) => r.map(csvCell).join(',')).join('\n'), 'text/csv');
  }

  // =============== groups ===============
  let gdraft = null;
  function groups() {
    if (!gdraft) gdraft = (ov.groups || []).map((g) => ({ ...g }));
    const studs = ov.students.filter((u) => u.role !== 'teacher');
    const err = h('p', { class: 'error', role: 'alert' });
    return h('div', { class: 'stack' }, h('section', { class: 'glass card stack' },
      h('h2', { class: 'h2' }, 'Groups'),
      h('p', { class: 'muted' }, 'Students pick one of these groups when they sign up. Rename them, add more, or remove ones you do not need. The level of a group is what a new student starts with. Removing a group leaves its students without a group.'),
      h('div', { class: 'stack' }, gdraft.map((g, i) => h('div', { class: 'row', style: { flexWrap: 'wrap' } },
        h('input', { class: 'grow', value: g.name, maxlength: 40, 'aria-label': `Name of group ${i + 1}`, oninput: (e) => (g.name = e.target.value) }),
        h('select', { 'aria-label': `Level of ${g.name}`, style: { width: 'auto' }, onchange: (e) => (g.level = e.target.value) }, h('option', { value: '', selected: !g.level }, 'No level'), LEVELS.map((lv) => h('option', { value: lv.id, selected: lv.id === g.level }, `${lv.id} · ${lv.name}`))),
        h('span', { class: 'chip' }, `${studs.filter((u) => u.groupId === g.id).length} students`),
        h('button', { class: 'btn sm', 'aria-label': 'Move up', disabled: i === 0, onclick: () => { [gdraft[i - 1], gdraft[i]] = [gdraft[i], gdraft[i - 1]]; show(); } }, '↑'),
        h('button', { class: 'btn sm danger', 'aria-label': `Remove ${g.name}`, onclick: async () => {
          const n = studs.filter((u) => u.groupId === g.id).length;
          if (n && !(await confirmBox(`${n} student${n === 1 ? ' is' : 's are'} in “${g.name}”. They will have no group until you move them. Continue?`, 'Remove'))) return;
          gdraft.splice(i, 1); show();
        } }, '🗑')))),
      err,
      h('div', { class: 'row' },
        h('button', { class: 'btn', onclick: () => { gdraft.push({ id: '', name: '', level: '' }); show(); } }, '＋ Add a group'),
        h('button', { class: 'btn primary', onclick: async () => {
          err.textContent = '';
          if (!gdraft.length) { err.textContent = 'Keep at least one group.'; return; }
          if (gdraft.some((g) => !g.name.trim())) { err.textContent = 'Every group needs a name.'; return; }
          try { await api.put('/api/admin/groups', { groups: gdraft }); gdraft = null; toast('Groups saved', 'good'); await refresh(); } catch (ex) { err.textContent = ex.message; }
        } }, 'Save groups'),
        h('button', { class: 'btn', onclick: () => { gdraft = null; show(); } }, 'Undo changes'))));
  }

  // =============== teacher settings ===============
  function settings() {
    const st = { ...(ov.settings || {}) };
    const sw = (key, label, hint) => h('div', { class: 'setting' }, h('div', h('b', label), h('span', { class: 'hint' }, hint)), h('label', { class: 'switch' }, h('input', { type: 'checkbox', checked: !!st[key], 'aria-label': label, onchange: (e) => (st[key] = e.target.checked) }), h('span')));
    const err = h('p', { class: 'error', role: 'alert' });
    const accessSeg = h('div', { class: 'seg' });
    const paintAcc = () => accessSeg.replaceChildren(...[['private', '🔒 Only students I grant'], ['open', 'Everyone']].map(([v, l]) => h('button', { type: 'button', 'aria-pressed': String(st.newLessonAccess === v), onclick: () => { st.newLessonAccess = v; paintAcc(); } }, l)));
    paintAcc();
    const cur = h('input', { type: 'password', autocomplete: 'current-password' }), nw = h('input', { type: 'password', autocomplete: 'new-password' });
    const pwErr = h('p', { class: 'error', role: 'alert' });
    return h('div', { class: 'stack' },
      h('section', { class: 'glass card stack' }, h('h2', { class: 'h2' }, 'Sign-up and groups'),
        sw('signupOpen', 'Anyone can create an account', 'Turn off once your class has joined, so strangers cannot sign up.'),
        sw('askGroup', 'Ask new students which group they are in', 'Shown when they sign up (or the first time they log in).'),
        sw('studentsChangeGroup', 'Students can change their own group', 'When off, only you can move a student to another group.')),
      h('section', { class: 'glass card stack' }, h('h2', { class: 'h2' }, 'Defaults for new work'),
        h('div', { class: 'field' }, h('label', 'A new lesson starts as'), accessSeg),
        h('div', { class: 'field' }, h('label', { for: 'hwdays' }, 'New homework is due after (days, 0 = no date)'), h('input', { id: 'hwdays', type: 'number', min: 0, max: 60, value: st.hwDefaultDays ?? 3, style: { width: '110px' }, oninput: (e) => (st.hwDefaultDays = +e.target.value) })),
        h('div', { class: 'field' }, h('label', { for: 'wel' }, 'Welcome message on the login page (optional)'), h('input', { id: 'wel', maxlength: 240, value: st.welcome || '', placeholder: 'e.g. Welcome to Group A! Use your real name.', oninput: (e) => (st.welcome = e.target.value) })),
        err, h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: async () => {
          err.textContent = '';
          try { const r = await api.put('/api/admin/settings', st); ov.settings = r.settings; toast('Settings saved', 'good'); await loadContent(); } catch (ex) { err.textContent = ex.message; }
        } }, 'Save settings'))),
      h('section', { class: 'glass card stack' }, h('h2', { class: 'h2' }, 'Your account'),
        h('p', { class: 'muted' }, `Signed in as ${getUser().email}.`),
        h('div', { class: 'field' }, h('label', 'Current password'), cur), h('div', { class: 'field' }, h('label', 'New password (at least 8 characters)'), nw), pwErr,
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: async () => {
          pwErr.textContent = '';
          try { await api.post('/api/me/password', { current: cur.value, next: nw.value }); cur.value = ''; nw.value = ''; toast('Password changed', 'good'); } catch (ex) { pwErr.textContent = ex.message; }
        } }, 'Change my password'))),
      h('section', { class: 'glass card stack' }, h('h2', { class: 'h2' }, 'Your data'),
        h('p', { class: 'muted' }, 'Keep a copy of the class list or of your lessons and vocabulary. Slide files are not included in the backup, only the text.'),
        h('div', { class: 'row' },
          h('button', { class: 'btn', onclick: () => exportCsv(ov.students.filter((u) => u.role !== 'teacher')) }, '⬇ Students (CSV)'),
          h('button', { class: 'btn', onclick: () => download('clivedu-backup.json', JSON.stringify({ exported: new Date().toISOString(), groups: ov.groups, settings: ov.settings, lessons: content.lessons.map(({ unlocked, ...l }) => l), vocab: content.vocab }, null, 2), 'application/json') }, '⬇ Lessons and vocabulary (JSON)'))));
  }

  // =============== homework ===============
  function homework() {
    const studs = ov.students.filter((u) => u.role !== 'teacher');
    const defDays = Number(ov.settings?.hwDefaultDays ?? 3);
    const dueDefault = defDays > 0 ? new Date(Date.now() + defDays * 864e5 - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10) : '';
    const form = { title: '', body: '', lessonId: '', due: dueDefault, to: 'all', picked: new Set(), groupsPicked: new Set() };
    const err = h('p', { class: 'error', role: 'alert' });
    const pickBox = h('div', { class: 'chips' });
    const paintPick = () => pickBox.replaceChildren(...(form.to === 'all' ? [] : form.to === 'groups' ? (ov.groups || []).map((g) => h('button', { type: 'button', class: `chip${form.groupsPicked.has(g.id) ? ' on' : ''}`, onclick: () => { form.groupsPicked.has(g.id) ? form.groupsPicked.delete(g.id) : form.groupsPicked.add(g.id); paintPick(); } }, `${g.name} (${studs.filter((u) => u.groupId === g.id).length})`)) : studs.map((u) => h('button', { type: 'button', class: `chip${form.picked.has(u.id) ? ' on' : ''}`, onclick: () => { form.picked.has(u.id) ? form.picked.delete(u.id) : form.picked.add(u.id); paintPick(); } }, u.displayName))));
    const toSeg = h('div', { class: 'seg' });
    const paintTo = () => toSeg.replaceChildren(...[['all', 'Whole class'], ['groups', 'Groups'], ['some', 'Chosen students']].map(([v, l]) => h('button', { type: 'button', 'aria-pressed': String(form.to === v), onclick: () => { form.to = v; paintTo(); paintPick(); } }, l)));
    paintTo();
    return h('div', { class: 'stack' },
      h('section', { class: 'glass card stack' }, h('h2', { class: 'h2' }, 'Give homework'),
        h('div', { class: 'field' }, h('label', { for: 'hwt' }, 'Title'), h('input', { id: 'hwt', placeholder: 'e.g. Write 5 sentences with the present perfect', oninput: (e) => (form.title = e.target.value) })),
        h('div', { class: 'field' }, h('label', { for: 'hwb' }, 'Instructions'), h('textarea', { id: 'hwb', placeholder: 'What should students do and how will you check it?', oninput: (e) => (form.body = e.target.value) })),
        h('div', { class: 'row' },
          h('div', { class: 'field grow' }, h('label', { for: 'hwl' }, 'Related lesson (optional)'), h('select', { id: 'hwl', onchange: (e) => (form.lessonId = e.target.value) }, h('option', { value: '' }, 'None'), content.lessons.map((l) => h('option', { value: l.id }, l.title)))),
          h('div', { class: 'field' }, h('label', { for: 'hwd' }, 'Due date'), h('input', { id: 'hwd', type: 'date', value: dueDefault, onchange: (e) => (form.due = e.target.value) }))),
        h('div', { class: 'field' }, h('label', 'Give it to'), toSeg, pickBox),
        err,
        h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: async () => {
          err.textContent = '';
          if (form.to === 'some' && !form.picked.size) { err.textContent = 'Choose at least one student.'; return; }
          if (form.to === 'groups' && !form.groupsPicked.size) { err.textContent = 'Choose at least one group.'; return; }
          try { await api.post('/api/admin/homework', { title: form.title, body: form.body, lessonId: form.lessonId, due: form.due ? new Date(form.due + 'T23:59:00').getTime() : null, to: form.to === 'some' ? [...form.picked] : form.to === 'groups' ? [] : 'all', groups: form.to === 'groups' ? [...form.groupsPicked] : [] }); toast('Homework sent. Students are notified.', 'good'); refresh(); } catch (e) { err.textContent = e.message; }
        } }, 'Send homework'))),
      h('section', { class: 'stack' }, h('h2', { class: 'h2' }, 'Given so far'),
        ov.homework.length ? ov.homework.map((x) => h('article', { class: 'hw glass' }, h('div', { class: 'row between' }, h('b', x.title), h('button', { class: 'btn sm danger', onclick: async () => { if (await confirmBox(`Delete “${x.title}”?`, 'Delete')) { await api.del(`/api/admin/homework/${x.id}`); refresh(); } } }, 'Delete')),
          h('div', { class: 'small muted' }, `${fmtDate(x.created)} · ${x.to === 'all' ? 'whole class' : [...(x.groups || []).map(groupName), x.to.length ? `${x.to.length} student${x.to.length === 1 ? '' : 's'}` : ''].filter(Boolean).join(' + ')} · ${x.doneCount} marked done${x.due ? ` · due ${fmtDate(x.due)}` : ''}`)))
          : h('p', { class: 'muted' }, 'Nothing yet.')));
  }

  // =============== announcements ===============
  function site() {
    const s = { announcement: content.site?.announcement || '', wordOfTheDay: content.site?.wordOfTheDay || '' };
    return h('section', { class: 'glass card stack' }, h('h2', { class: 'h2' }, 'Home page'),
      h('div', { class: 'field' }, h('label', { for: 'ann' }, 'Announcement banner'), h('input', { id: 'ann', value: s.announcement, maxlength: 200, placeholder: 'e.g. No class on Friday. Enjoy the holiday!', oninput: (e) => (s.announcement = e.target.value) }), h('span', { class: 'hint' }, 'Shown at the top of the home page. Leave empty to hide.')),
      h('div', { class: 'field' }, h('label', { for: 'wod' }, 'Star of the day (optional)'), h('input', { id: 'wod', value: s.wordOfTheDay, placeholder: 'A word from your sets, e.g. resilient', oninput: (e) => (s.wordOfTheDay = e.target.value) }), h('span', { class: 'hint' }, 'Leave empty to rotate words automatically every day.')),
      h('div', { class: 'row' }, h('button', { class: 'btn primary', onclick: async () => { try { await api.put('/api/admin/site', s); toast('Saved', 'good'); refresh(); } catch (e) { toast(e.message, 'bad'); } } }, 'Save')));
  }

  root.append(h('header', { class: 'page-head' }, h('h1', { class: 'h1' }, 'Teacher desk'), h('p', { class: 'lede' }, 'Change anything here and it is live straight away. The site link never changes.')), tabs, body);
  await refresh();
}
