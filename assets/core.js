/* Cram-Kit prototype core: shared by the Clouds and Neon designs.
   Content (steps), course profile, prompt filling, guided wizard, Anki planner, lofi synth. */
(function () {
const D = window.CK_DATA;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- storage (always optional) ----------
const store = {
  get(k, d) { try { const v = localStorage.getItem('ck.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ck.' + k, JSON.stringify(v)); } catch (e) {} }
};

// ---------- environment ----------
const ua = navigator.userAgent;
const env = {
  mac: /Mac/i.test(navigator.platform || ua),
  mobile: /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && /Mac/.test(ua) && !/Chrome/.test(ua)),
  safari: /Safari/.test(ua) && !/Chrome|Chromium|Edg|Firefox/.test(ua),
  firefox: /Firefox/.test(ua)
};
env.ok = !env.mobile && !env.safari;
env.mod = env.mac ? 'Cmd' : 'Ctrl';

// ---------- icons (one stroke family, 24px grid) ----------
const P = {
  check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>',
  download: '<path d="M12 4v11m-5-5 5 5 5-5M5 20h14"/>',
  play: '<path d="M8 5.5v13l11-6.5z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  next: '<path d="M6 6l8 6-8 6zM18 6v12"/>',
  prev: '<path d="M18 6l-8 6 8 6zM6 6v12"/>',
  music: '<path d="M9 18V6l11-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  home: '<path d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z"/>',
  guide: '<path d="M4 5h6a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-6a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h6z"/>',
  tools: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
  full: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17.2v.1"/>',
  right: '<path d="M5 12h14m-6-6 6 6-6 6"/>',
  left: '<path d="M19 12H5m6-6-6 6 6 6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  slides: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  open: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
  vol: '<path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>',
  bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6z"/>'
};
const icon = (n, cls = '') => `<svg class="ck-i ${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${P[n] || ''}</svg>`;

// ---------- clipboard / download ----------
async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) { const t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (_) {} t.remove(); return true; }
}
function download(name, text) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/markdown' }));
  a.download = name; document.body.appendChild(a); a.click(); a.remove();
}

// ---------- course profile → fills every prompt ----------
const course = () => store.get('course', {});
function fill(text) {
  const c = course(); let t = text;
  const code = c.code && c.code.trim(), prof = c.prof && c.prof.trim();
  const examTxt = [c.exam, c.date && new Date(c.date + 'T00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })].filter(Boolean).join(', ');
  if (code) t = t.split('[COURSE CODE: course name]').join(code).split('[COURSE CODE]').join(code);
  if (prof) t = t.split('[Prof name]').join(prof);
  if (code) t = t.replace(/\*\*Course:\*\* \[[^\]\n]*\]/, `**Course:** ${code}${prof ? ', ' + prof : ''}`);
  if (examTxt) {
    t = t.replace(/\*\*Upcoming exam:\*\* \[[^\]\n]*\]/, `**Upcoming exam:** ${examTxt}`);
    t = t.replace(/\*\*Exam info I know:\*\* \[[^\]\n]*\]/, `**Exam info I know:** ${examTxt}${c.format ? '; ' + c.format : ''}`);
  }
  if (c.format) t = t.replace(/\*\*Format I've been told:\*\* \[[^\]\n]*\]/, `**Format I've been told:** ${c.format}`).split('[format]').join(c.format);
  return t;
}
const prompt = name => fill(D.tpl[name]);
const body = name => { const t = prompt(name); const i = t.indexOf('\n---\n'); return i < 0 ? t : t.slice(i + 5).trim(); };
const daysToExam = () => { const c = course(); if (!c.date) return null; const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((new Date(c.date + 'T00:00') - t) / 864e5); };

// ---------- animated mocks ("how to do it") ----------
const cursor = '<svg class="ck-m-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 8-6 1.6L10 19z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>';
const browser = (addr, bar, page, extra = '', cls = '') => `<div class="ck-mock ck-m-browser ${cls}" aria-hidden="true">
  <div class="ck-m-top"><i></i><i></i><i></i><span class="ck-m-addr">${addr}</span></div>
  <div class="ck-m-bar">${bar}</div><div class="ck-m-page">${page}</div>${extra}${cursor}</div>`;
const chip = (t, cls = '') => `<span class="ck-m-chip ${cls}">${t}</span>`;
const MOCKS = {
  course: () => `<div class="ck-mock ck-m-card" aria-hidden="true"><div class="ck-m-form"><b>Your course</b><span class="ck-m-field f1">PSYC 101</span><span class="ck-m-field f2">Dr. Lee</span><span class="ck-m-field f3">Midterm 2 · Nov 26</span></div><div class="ck-m-arrow">${icon('right')}</div><div class="ck-m-doc"><i></i><i class="hl"></i><i></i><i class="hl"></i><i></i></div></div>`,
  syllabus: () => `<div class="ck-mock ck-m-card" aria-hidden="true"><div class="ck-m-doc big"><b>Syllabus</b><i></i><i></i><i class="hl"></i><i></i><i></i></div><div class="ck-m-stamp">AI tools?</div></div>`,
  device: () => `<div class="ck-mock ck-m-card" aria-hidden="true"><div class="ck-m-laptop"><div class="ck-m-screen">${chip('Chrome')} ${chip('Edge')}</div><div class="ck-m-base"></div></div></div>`,
  keys: () => browser('any page', '', '<div class="ck-m-lines"><i></i><i></i><i></i></div>',
    `<div class="ck-m-keys"><kbd class="k1">${env.mod}</kbd><span>+</span><kbd class="k2">Shift</kbd><span>+</span><kbd class="k3">B</kbd></div>`, 'm-keys'),
  dragT: () => browser('cram-kit', chip('Canvas') + chip('Gmail') + chip('⬇ Get transcripts', 'new'), `<span class="ck-m-btn">⬇ Get transcripts</span>`, '<span class="ck-m-ghost">⬇ Get transcripts</span>', 'm-drag'),
  dragS: () => browser('cram-kit', chip('Canvas') + chip('⬇ Get transcripts') + chip('⬇ Get slides', 'new'), `<span class="ck-m-btn">⬇ Get slides</span>`, '<span class="ck-m-ghost">⬇ Get slides</span>', 'm-drag'),
  panopto: () => browser('panopto … /folder', chip('⬇ Get transcripts', 'hot'), '<div class="ck-m-rows"><i>Lecture 1</i><i>Lecture 2</i><i>Lecture 3</i><i>Lecture 4</i></div>',
    `<div class="ck-m-toast">${icon('download')} transcripts.zip</div>`, 'm-click'),
  canvas: () => browser('canvas … /courses', chip('⬇ Get transcripts') + chip('⬇ Get slides', 'hot'), '<div class="ck-m-pop"><b>12 files</b><i>✓ Lecture 1.pptx</i><i>✓ Lecture 2.pptx</i><span class="ck-m-go">Download</span></div>',
    `<span class="ck-m-block">${icon('download')}</span><div class="ck-m-menu"><i>Always allow</i><i>Keep blocking</i></div>`, 'm-canvas'),
  chat: () => `<div class="ck-mock ck-m-chat" aria-hidden="true"><div class="ck-m-msgs"><i></i><i class="me"></i></div><span class="ck-m-file f1">L1.pptx</span><span class="ck-m-file f2">L1.md</span><div class="ck-m-box"><span class="ck-m-clip">${icon('open')}</span><span class="ck-m-typed">Paste the prompt…</span><span class="ck-m-send">${icon('right')}</span></div>${cursor}</div>`,
  project: () => `<div class="ck-mock ck-m-proj" aria-hidden="true"><div class="ck-m-side"><i>Chats</i><i class="on">Projects</i></div><div class="ck-m-main"><span class="ck-m-new">+ New project</span><div class="ck-m-instr"><b>Instructions</b><i></i><i></i><i></i></div></div>${cursor}</div>`,
  upload: () => `<div class="ck-mock ck-m-proj" aria-hidden="true"><div class="ck-m-main"><div class="ck-m-files"><b>Files</b><span class="u1">${icon('check')} Lecture notes.md</span><span class="u2">${icon('check')} Slides.pdf</span><span class="u3">${icon('check')} Objectives.pdf</span></div></div></div>`,
  ask: () => `<div class="ck-mock ck-m-chat" aria-hidden="true"><div class="ck-m-msgs"><i class="me q">What happened in Lecture 7?</i><i class="a"></i><i class="a2"></i><span class="ck-m-tag">🎯 on the exam · L7 23:10</span></div></div>`,
  exam: () => `<div class="ck-mock ck-m-card" aria-hidden="true"><div class="ck-m-papers"><i></i><i></i><i></i></div><div class="ck-m-bars"><i style="--h:90%"></i><i style="--h:70%"></i><i style="--h:55%"></i><i style="--h:35%"></i><i style="--h:20%"></i></div></div>`,
  practice: () => `<div class="ck-mock ck-m-card" aria-hidden="true"><div class="ck-m-doc big"><b>Practice Midterm</b><i></i><i class="hl"></i><i></i><i></i></div><div class="ck-m-score">82%</div></div>`,
  anki: () => `<div class="ck-mock ck-m-card" aria-hidden="true"><div class="ck-m-flip"><div class="ck-m-face front">The {{c1::…}} makes ATP</div><div class="ck-m-face back">mitochondria</div></div></div>`
};

// ---------- the steps ----------
// done: 'check' (tick box) · 'course' (needs a course code) · 'device' (auto)
const STEPS = [
  { id: 'course', sec: 'Start', title: 'Tell us about your course', mock: 'course', done: 'course',
    lead: 'We put this into every prompt for you, so you never fill in [brackets].', form: 'course' },
  { id: 'syllabus', sec: 'Start', title: 'Check your syllabus', mock: 'syllabus', check: 'I checked my syllabus',
    lead: 'Some profs don\'t allow lecture recordings or transcripts in AI tools.',
    steps: ['Search your syllabus for "AI", "ChatGPT" or "recordings".', 'If they\'re not allowed, skip the transcript steps and use slides only. Everything still works.'] },
  { id: 'device', sec: 'Start', title: 'Use a laptop with Chrome or Edge', mock: 'device', done: 'device',
    lead: 'The download buttons only work in a desktop browser.' },
  { id: 'bar', sec: 'Gather', title: 'Show your bookmarks bar', mock: 'keys', check: 'I can see the bookmarks bar under the address bar',
    lead: `Press <kbd>${env.mod}</kbd> + <kbd>Shift</kbd> + <kbd>B</kbd>. A thin bar appears under the address bar.`,
    help: 'Nothing changed? It may already be showing (look under the address bar). Or press the keys again: it toggles on and off.' },
  { id: 'dragT', sec: 'Gather', title: 'Drag “Get transcripts” to the bar', mock: 'dragT', bm: 'transcripts', check: '⬇ Get transcripts is in my bookmarks bar',
    lead: 'Press and hold the button below, move it up onto the bookmarks bar, and let go. Don\'t just click it.',
    help: 'Can\'t drag? Right-click the bookmarks bar → <b>Add page…</b> → name it <i>Get transcripts</i> → paste the code from the copy button below into the URL box.', helpCopy: 'transcripts' },
  { id: 'dragS', sec: 'Gather', title: 'Drag “Get slides” to the bar', mock: 'dragS', bm: 'slides', check: '⬇ Get slides is in my bookmarks bar',
    lead: 'Same thing for the slides button.',
    help: 'Right-click the bookmarks bar → <b>Add page…</b> → name it <i>Get slides</i> → paste the code from the copy button below.', helpCopy: 'slides' },
  { id: 'panopto', sec: 'Gather', title: 'Download the transcripts', mock: 'panopto', open: 'Panopto', check: 'A transcripts zip downloaded',
    lead: 'In a new tab, open your course\'s Panopto folder and wait for the list of lectures to load.',
    steps: ['Click <b>⬇ Get transcripts</b> in your bookmarks bar.', 'A zip file downloads. Double-click it to open the folder.'],
    help: '“No recordings found”: the list hasn\'t loaded yet, or you\'re not on a folder page. More than 25 lectures? Set <i>Results per page</i> to the max first.' },
  { id: 'canvas', sec: 'Gather', title: 'Download the slides', mock: 'canvas', open: 'Canvas', check: 'My slides downloaded',
    lead: 'Open any page of your course on Canvas, then click <b>⬇ Get slides</b>.',
    steps: ['Pick <b>Best version</b> and press <b>Download</b>.', 'Only one file came down? Click the blocked-download icon at the right of the address bar → <b>Always allow</b> → press <b>Retry</b>.'],
    help: 'No files listed? Your prof may host slides somewhere else. Check “External links” in the pop-up.' },
  { id: 'notes', sec: 'Claude', title: 'Turn lectures into a notes file', mock: 'chat', check: 'I have my lecture notes file',
    lead: 'Claude reads 2–4 lectures at a time and writes one page per lecture: what happened, what was said beyond the slides, and what\'s on the exam.',
    steps: ['Go to <a href="https://claude.ai/new" target="_blank" rel="noopener">claude.ai</a> → new chat (not inside a project).', 'Attach the transcripts and slides for 2–4 lectures.', 'Paste the prompt and send. Type <code>continue</code> if it stops.', 'Paste the result into the notes file. Repeat for the next lectures.'],
    copy: ['1-context-builder-prompt.md', 'Copy the notes prompt'], dl: ['0-context-doc-skeleton.md', 'Download the notes file'] },
  { id: 'project', sec: 'Claude', title: 'Create your Claude project', mock: 'project', check: 'My project has the tutor instructions',
    lead: 'A project is a folder in Claude that remembers your course.',
    steps: ['In Claude: <b>Projects</b> → <b>New project</b>. Name it after the course.', 'Copy the tutor instructions and paste them into the project\'s <b>Instructions</b>.'],
    copy: ['2-project-instructions.md', 'Copy tutor instructions'] },
  { id: 'upload', sec: 'Claude', title: 'Add your files to the project', mock: 'upload', check: 'Files are uploaded',
    lead: 'Use the project\'s <b>Files</b> section.',
    steps: ['✓ Your lecture notes file (the important one)', '✓ Slides as PDF', '✓ Learning objectives, if you have them', '✗ Not the raw transcripts. The notes file replaces them.'],
    help: 'On the free plan, if the capacity bar goes over 100%, remove slides first and keep the notes file.' },
  { id: 'ask', sec: 'Claude', title: 'Ask it something', mock: 'ask', check: 'I tried it',
    lead: 'Start a new chat inside the project and try one of these:',
    try: ['What happened in Lecture 7?', 'I missed class on Oct 20, catch me up', 'Quiz me on Lectures 10–12, exam style', 'What\'s on the exam? Make a checklist'] },
  { id: 'papers', sec: 'Exam prep', title: 'Find the key exam topics', mock: 'exam', check: 'I saved my exam blueprint to the project',
    lead: 'Collect past exams, quizzes and practice midterms. Claude ranks what gets tested, and down-weights practice that doesn\'t look like the real exam.',
    steps: ['New chat in your project. Attach every past paper you have.', 'Paste the prompt and send.', 'Save the result as <b>Exam blueprint</b> in the project\'s Files.'],
    copy: ['5-exam-analysis-prompt.md', 'Copy the analysis prompt'] },
  { id: 'practice', sec: 'Exam prep', title: 'Take a practice exam', mock: 'practice', check: 'I did a practice exam',
    lead: 'Same format as the real one, new questions, answer key kept separate.',
    steps: ['Paste the prompt in a new project chat.', 'Do it timed, without notes.', 'Send your answers. Claude marks them and turns mistakes into flashcards.'],
    copy: ['6-practice-exam-prompt.md', 'Copy the practice exam prompt'] },
  { id: 'anki', sec: 'Anki', title: 'Make flashcards', mock: 'anki', check: 'My deck is in Anki',
    lead: 'Get Anki free at <a href="https://apps.ankiweb.net" target="_blank" rel="noopener">apps.ankiweb.net</a>, then let Claude write the cards.',
    steps: ['Paste the prompt in a new project chat, one unit at a time.', 'Double-click the <code>.apkg</code> file Claude gives you. Done.', 'Want a study plan and cards tuned to you? Open the Anki planner in Tools.'],
    copy: ['4-anki-deck-prompt.md', 'Copy the Anki prompt'], tool: 'anki' }
];

// ---------- wizard (slideshow + single-page list) ----------
function stepDone(s, done) {
  if (s.done === 'course') return !!(course().code || '').trim();
  if (s.done === 'device') return env.ok || !!done[s.id];
  return !!done[s.id];
}
function courseForm() {
  const c = course();
  return `<form class="ck-form" data-course onsubmit="return false">
    <label>Course <input name="code" value="${esc(c.code)}" placeholder="e.g. PSYC 101" autocomplete="off"></label>
    <label>Prof <input name="prof" value="${esc(c.prof)}" placeholder="e.g. Dr. Lee" autocomplete="off"></label>
    <label>Next exam <input name="exam" value="${esc(c.exam)}" placeholder="e.g. Midterm 2" autocomplete="off"></label>
    <label>Exam date <input name="date" type="date" value="${esc(c.date)}"></label>
    <label class="wide">Exam format <select name="format">${['', 'Multiple choice', 'Multiple choice + short answer', 'Short answer / written', 'Problems / calculations', 'Essays', 'Mixed'].map(f => `<option ${c.format === f ? 'selected' : ''} value="${f}">${f || 'Not sure yet'}</option>`).join('')}</select></label>
  </form>`;
}
function bindCourse(root, onChange) {
  $$('form[data-course]', root).forEach(f => f.addEventListener('input', () => {
    const c = Object.fromEntries(new FormData(f)); store.set('course', c); onChange && onChange();
  }));
}
function deviceBody() {
  if (env.ok) return `<p class="ck-ok">${icon('check')} You're on a laptop browser that works.</p>`;
  const why = env.mobile ? 'You\'re on a phone or tablet.' : 'You\'re on Safari, which blocks the download buttons.';
  return `<p class="ck-warn">${why} Open this page on a laptop in Chrome or Edge.</p>
    <button type="button" class="ck-btn" data-copylink>${icon('copy')} Copy this page's link</button>`;
}
function stepHTML(s, i, n, done) {
  const isDone = stepDone(s, done);
  let h = `<div class="ck-step" data-step="${s.id}"><div class="ck-step-text">
    <h2 class="ck-title">${s.title}</h2>${s.lead ? `<p class="ck-lead">${s.lead}</p>` : ''}`;
  if (s.form === 'course') h += courseForm();
  if (s.done === 'device') h += deviceBody();
  if (s.bm) h += `<div class="ck-row"><a class="ck-bm" draggable="true" href="${D.bm[s.bm]}" data-bm>⬇ Get ${s.bm}</a><span class="ck-hint">${icon('left')} drag me up</span></div>`;
  if (s.open) h += `<form class="ck-open" data-open><input type="url" placeholder="Paste your ${s.open} link (optional)" aria-label="${s.open} link"><button class="ck-btn ghost">${icon('open')} Open</button></form>`;
  if (s.steps) h += `<ol class="ck-list">${s.steps.map(x => `<li>${x}</li>`).join('')}</ol>`;
  if (s.try) h += `<div class="ck-try">${s.try.map(q => `<button type="button" class="ck-chip" data-copytext="${esc(q)}">${esc(q)} ${icon('copy')}</button>`).join('')}</div>`;
  if (s.copy || s.dl) h += `<div class="ck-row">${s.copy ? `<button type="button" class="ck-btn primary" data-copy="${s.copy[0]}">${icon('copy')} ${s.copy[1]}</button>` : ''}${s.dl ? `<button type="button" class="ck-btn ghost" data-dl="${s.dl[0]}">${icon('download')} ${s.dl[1]}</button>` : ''}${s.copy ? `<button type="button" class="ck-btn ghost" data-peek="${s.copy[0]}">Preview</button>` : ''}</div><pre class="ck-pre" hidden></pre>`;
  if (s.copy && (course().code || '').trim()) h += `<p class="ck-note">${icon('check')} Already filled in with ${esc(course().code)}.</p>`;
  if (s.tool) h += `<button type="button" class="ck-btn ghost" data-tool="${s.tool}">${icon('tools')} Open the Anki planner</button>`;
  if (s.check || (s.done === 'device' && !env.ok)) h += `<label class="ck-done"><input type="checkbox" data-done="${s.id}" ${done[s.id] ? 'checked' : ''}><span class="ck-box">${icon('check')}</span><span>${s.check || 'I\'ll use a laptop with Chrome or Edge'}</span></label>`;
  if (s.help) h += `<details class="ck-help"><summary>${icon('help')} Stuck?</summary><p>${s.help}</p>${s.helpCopy ? `<button type="button" class="ck-btn ghost small" data-copybm="${s.helpCopy}">${icon('copy')} Copy the button's code</button>` : ''}</details>`;
  h += `</div><div class="ck-step-visual">${MOCKS[s.mock] ? MOCKS[s.mock]() : ''}</div></div>`;
  return h;
}
function bindActions(root, opts = {}) {
  root.addEventListener('click', async e => {
    const b = e.target.closest('button,a'); if (!b) return;
    const flash = (txt) => { const o = b.innerHTML; b.innerHTML = icon('check') + ' ' + txt; b.classList.add('ok'); setTimeout(() => { b.innerHTML = o; b.classList.remove('ok'); }, 1500); };
    if (b.dataset.copy) { await copy(prompt(b.dataset.copy)); flash('Copied'); }
    else if (b.dataset.copytext) { await copy(b.dataset.copytext); flash('Copied'); }
    else if (b.dataset.copybm) { await copy(D.bm[b.dataset.copybm]); flash('Copied'); }
    else if (b.dataset.dl) download(b.dataset.dl.replace(/^\d-/, ''), prompt(b.dataset.dl));
    else if (b.dataset.peek) { const pre = b.closest('.ck-step-text,.ck-card').querySelector('.ck-pre'); pre.hidden = !pre.hidden; pre.textContent = prompt(b.dataset.peek); b.textContent = pre.hidden ? 'Preview' : 'Hide'; }
    else if (b.dataset.tool) { opts.onTool && opts.onTool(b.dataset.tool); }
    else if (b.hasAttribute('data-copylink')) { await copy(location.href); flash('Link copied'); }
    else if (b.hasAttribute('data-bm')) { e.preventDefault(); b.classList.add('nudge'); setTimeout(() => b.classList.remove('nudge'), 900); opts.onBmClick && opts.onBmClick(b); }
  });
  root.addEventListener('submit', e => {
    const f = e.target.closest('[data-open]'); if (!f) return; e.preventDefault();
    const v = f.querySelector('input').value.trim(); if (/^https?:\/\//.test(v)) window.open(v, '_blank', 'noopener');
  });
}

function wizard(root, opts = {}) {
  const MK = opts.modeKey || 'mode';
  let done = store.get('done', {}), i = Math.min(store.get('step', 0), STEPS.length - 1), mode = store.get(MK, opts.defaultMode || 'slides');
  const sections = [...new Set(STEPS.map(s => s.sec))];
  function save() { store.set('done', done); store.set('step', i); store.set(MK, mode); }
  function render() {
    const n = STEPS.length, s = STEPS[i], ok = stepDone(s, done);
    root.dataset.mode = mode;
    const count = STEPS.filter(x => stepDone(x, done)).length;
    const nav = `<nav class="ck-steps" aria-label="All steps">${sections.map(sec => `<div class="ck-sec"><b>${sec}</b>${STEPS.map((x, j) => x.sec !== sec ? '' : `<button type="button" class="ck-sl ${j === i && mode === 'slides' ? 'on' : ''} ${stepDone(x, done) ? 'did' : ''}" data-go="${j}"><span class="ck-dot">${stepDone(x, done) ? icon('check') : j + 1}</span>${x.title}</button>`).join('')}</div>`).join('')}</nav>`;
    const head = `<div class="ck-head"><div class="ck-prog" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${count}" aria-label="Steps done"><i style="width:${count / n * 100}%"></i></div>
      <div class="ck-modes" role="group" aria-label="View"><button type="button" data-mode="slides" aria-pressed="${mode === 'slides'}">${icon('slides')} One step at a time</button><button type="button" data-mode="list" aria-pressed="${mode === 'list'}">${icon('list')} All steps on one page</button></div></div>`;
    if (mode === 'list') {
      root.innerHTML = head + `<div class="ck-all">${sections.map(sec => `<section class="ck-allsec"><h3 class="ck-sechead">${sec}</h3>${STEPS.map((x, j) => x.sec !== sec ? '' : `<div class="ck-card ${stepDone(x, done) ? 'did' : ''}"><span class="ck-num">${j + 1}</span>${stepHTML(x, j, n, done)}</div>`).join('')}</section>`).join('')}</div>`;
    } else {
      root.innerHTML = head + `<div class="ck-wiz">${nav}<div class="ck-stage">
        <div class="ck-count">Step ${i + 1} of ${n} · ${s.sec}</div>
        <div class="ck-slide" key="${s.id}">${stepHTML(s, i, n, done)}</div>
        <div class="ck-nav"><button type="button" class="ck-btn ghost" data-prev ${i ? '' : 'disabled'}>${icon('left')} Back</button>
          <span class="ck-gate">${ok ? '' : (s.done === 'course' ? 'Add your course to continue' : 'Tick the box when you\'ve done it')}</span>
          <button type="button" class="ck-btn primary" data-next ${ok ? '' : 'disabled'}>${i === n - 1 ? 'Finish' : 'Next'} ${icon('right')}</button></div></div></div>`;
    }
    bindCourse(root, () => { const nb = $('[data-next]', root); const ok2 = stepDone(STEPS[i], done); if (nb) { nb.disabled = !ok2; $('.ck-gate', root).textContent = ok2 ? '' : 'Add your course to continue'; } opts.onCourse && opts.onCourse(); });
    opts.onRender && opts.onRender(i, mode);
  }
  root.addEventListener('change', e => {
    const c = e.target.closest('[data-done]'); if (!c) return;
    done[c.dataset.done] = c.checked; save();
    if (mode === 'slides') { const nb = $('[data-next]', root); const ok = stepDone(STEPS[i], done); nb.disabled = !ok; $('.ck-gate', root).textContent = ok ? '' : 'Tick the box when you\'ve done it'; if (ok) nb.focus(); }
    else c.closest('.ck-card').classList.toggle('did', c.checked);
    opts.onProgress && opts.onProgress(progress());
  });
  root.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.go != null) { i = +b.dataset.go; mode = 'slides'; save(); render(); }
    else if (b.dataset.mode) { mode = b.dataset.mode; save(); render(); }
    else if (b.hasAttribute('data-next')) { if (i < STEPS.length - 1) { i++; save(); render(); $('.ck-title', root)?.focus?.(); } else opts.onFinish && opts.onFinish(); }
    else if (b.hasAttribute('data-prev')) { i = Math.max(0, i - 1); save(); render(); }
  });
  bindActions(root, opts);
  render();
  return { render, go(j) { i = j; mode = 'slides'; save(); render(); }, progress };
}
function progress() { const done = store.get('done', {}); const n = STEPS.filter(s => stepDone(s, done)).length; const next = STEPS.findIndex(s => !stepDone(s, done)); return { done: n, total: STEPS.length, next, nextTitle: next >= 0 ? STEPS[next].title : null }; }

// ---------- Anki planner + personalized prompt + SUPER CRAM ----------
const PER_LEC = { key: 15, exam: 30, all: 50 };
const SUBJECT = {
  bio: ['Biology / life sciences', ['Cloze cards, one fact per deletion, with a one-line "why" in Back Extra (the style of the big MCAT decks like AnKing and MileDown).', 'Processes and pathways as ordered steps: one card per step plus one big-picture diagram card.', 'Image occlusion for structures, anatomy, cycles and pathways.', 'Tell-apart cards for look-alikes (e.g. mitosis vs meiosis).']],
  chem: ['Chemistry / biochemistry', ['Reaction cards: reactants + conditions → product, and the reverse.', 'Mechanisms one step at a time, with arrow-pushing diagrams.', 'Trends with the reason, not just the direction.', 'Structures as image cards; equations with units and when they apply.']],
  phys: ['Physics / engineering', ['Formula cards: the equation, each symbol with units, and when it applies.', '"Which equation fits this situation?" cards.', 'Short worked problems, one step per card.', 'Free-body, circuit and setup diagrams drawn as SVG.']],
  math: ['Math / statistics', ['Definitions and theorems with their exact conditions.', '"Which method or test do I use when…" decision cards.', 'Tiny worked examples and common-mistake cards.']],
  psych: ['Psychology / social sciences', ['Term → definition AND definition → term, like the Mr. Pankow / AnKing psych-soc cards.', 'Scenario cards: a 1–2 sentence example → name the concept.', 'Researcher → study → finding cards; theory stages in order.', 'Tell-apart cards for easily confused terms.']],
  hist: ['History / humanities', ['Who / what / when / why it matters, with cause → effect chains.', 'No date-only cards unless dates are tested.', 'Theme cards that link events, for essay answers.']],
  lang: ['Languages', ['Vocab both directions, each with an example sentence.', 'Grammar patterns as cloze sentences.', 'Irregular forms on their own cards.']],
  cs: ['Computer science', ['Concept cards, including time/space complexity.', '"What does this code output?" cards.', 'Trade-off cards: when to use X vs Y.']],
  bus: ['Business / economics', ['Definitions and formulas with what they tell you.', 'Graph cards: what shifts and which way.', 'Cause → effect chains.']],
  med: ['Medicine / nursing / health', ['AnKing-style cloze with a rich Back Extra.', 'Mechanism → presentation → treatment chains.', 'Image occlusion for anatomy and pathways.']],
  other: ['Other', ['A mix of cloze and Q&A, one fact per card, plus application cards.']]
};
const FORMAT = { mc: 'Multiple choice: tell-apart cards and the traps distractors use.', sa: 'Short answer: cards that make me produce the full definition plus an example.', calc: 'Calculations: formula cards and mini worked problems.', diag: 'Diagrams: image occlusion for every likely figure.', essay: 'Essays: thesis, 3 points with evidence, and a counterargument per theme.' };
const WEAK = { terms: 'Memorizing terms: add a memory hook to every term card.', process: 'Processes: ordered-steps cards and "what comes before/after X" cards.', apply: 'Applying ideas: at least 2 scenario cards per key concept.', visual: 'Diagrams: image occlusion and draw-from-memory cards.', formulas: 'Formulas: a "when do I use this?" card and a units card for each.' };
const STYLE = { mix: 'Mix: cloze for facts, Q&A for why/how and application.', cloze: 'Mostly fill-in-the-blank (cloze).', basic: 'Mostly question → answer (Basic).' };
const DIAG = { both: 'Use both diagram types.', draw: 'Only diagrams you draw as SVG.', slides: 'Only slide snapshots (image occlusion).', none: 'No diagrams.' };

function ankiTool(root) {
  const c = course();
  const chips = (name, type, opts, def) => `<div class="ck-chips" role="group">${Object.entries(opts).map(([v, l]) => `<label><input type="${type}" name="${name}" value="${v}" ${(Array.isArray(def) ? def.includes(v) : def === v) ? 'checked' : ''}> ${l}</label>`).join('')}</div>`;
  root.innerHTML = `<div class="ck-anki">
    <div class="ck-cram-row"><button type="button" class="ck-cram" data-cram aria-pressed="false">${icon('bolt')} SUPER CRAM</button><span class="ck-hint">Exam tomorrow and you know nothing? Press this.</span></div>
    <form class="ck-form ck-aform" onsubmit="return false">
      <label>Lectures for this deck <input name="range" placeholder="e.g. Lectures 1–4"></label>
      <label>Lectures on the exam <input name="lec" type="number" min="1" max="80" value="12"></label>
      <label>Study days per week <select name="days">${[3, 4, 5, 6, 7].map(d => `<option ${d === 6 ? 'selected' : ''}>${d}</option>`).join('')}</select></label>
      <label>Minutes per day <input name="min" type="number" min="5" max="600" step="5" value="30"></label>
      <label class="wide">Subject <select name="subject">${Object.entries(SUBJECT).map(([k, v]) => `<option value="${k}" ${k === 'psych' ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></label>
      <div class="wide"><span class="ck-ql">Exam questions are mostly…</span>${chips('fmt', 'checkbox', { mc: 'Multiple choice', sa: 'Short answer', calc: 'Calculations', diag: 'Diagrams', essay: 'Essays' }, ['mc'])}</div>
      <div class="wide"><span class="ck-ql">Card style</span>${chips('style', 'radio', { mix: 'Mix', cloze: 'Fill-in-the-blank', basic: 'Question → answer' }, 'mix')}</div>
      <div class="wide"><span class="ck-ql">Detail</span>${chips('detail', 'radio', { key: 'Key ideas only', exam: 'Exam-ready', all: 'Everything' }, 'exam')}</div>
      <div class="wide"><span class="ck-ql">What's hard for you?</span>${chips('weak', 'checkbox', { terms: 'Terms', process: 'Processes', apply: 'Applying', visual: 'Diagrams', formulas: 'Formulas' }, [])}</div>
      <div class="wide"><span class="ck-ql">Diagrams on cards</span>${chips('diag', 'radio', { both: 'Both', draw: 'Drawn by Claude', slides: 'Slide snapshots', none: 'None' }, 'both')}</div>
    </form>
    <div class="ck-plan" data-plan></div>
    <div class="ck-row"><button type="button" class="ck-btn primary" data-copyp>${icon('copy')} Copy my flashcard prompt</button><button type="button" class="ck-btn ghost" data-peekp>Preview</button></div>
    <pre class="ck-pre" hidden data-pre></pre></div>`;
  const f = $('.ck-aform', root); let cram = false;
  const val = n => f.elements[n] && f.elements[n].value;
  const radio = n => (f.querySelector(`input[name=${n}]:checked`) || {}).value;
  const checks = n => $$(`input[name=${n}]:checked`, f).map(i => i.value);
  function plan() {
    const lec = Math.max(1, +val('lec') || 1), perLec = PER_LEC[radio('detail')], cards = lec * perLec, per = +val('days'), mins = Math.max(5, +val('min') || 30);
    if (cram) return { cram: true, cards: Math.min(150, Math.max(60, lec * 8)) };
    const D = daysToExam();
    if (D == null) return { err: 'Add your exam date in Your course (top of the guide or settings).' };
    if (D < 1) return { err: 'Your exam date has passed. Update it in Your course.' };
    if (D <= 2) return { err: `Exam in ${D} day${D > 1 ? 's' : ''}? Press SUPER CRAM.` };
    const studyDays = Math.max(1, Math.round(D * per / 7)), reserve = D >= 7 ? Math.max(1, Math.round(studyDays * .2)) : 0, newDays = Math.max(1, studyDays - reserve);
    const need = Math.ceil(cards / newDays), fit = Math.max(1, Math.floor(mins / 1.5));
    return { D, cards, lec, perLec, studyDays, reserve, need, fit, mins, newPerDay: Math.min(need, fit), short: need > fit, steps: D <= 7 ? '1m 10m 1h' : '1m 10m', retention: D > 30 ? '0.90' : D > 7 ? '0.92' : '0.95', maxIvl: Math.max(2, Math.round(D / 3)), reserveDays: Math.ceil(reserve * 7 / per) };
  }
  const table = rows => `<table class="ck-table"><tbody>${rows.map(r => `<tr><td>${r[0]}</td><td><b>${r[1]}</b>${r[2] ? `<small>${r[2]}</small>` : ''}</td></tr>`).join('')}</tbody></table>`;
  function render(p) {
    const o = $('[data-plan]', root), code = esc(course().code || 'your course');
    if (p.err) { o.innerHTML = `<p class="ck-warn">${p.err}</p>`; return; }
    if (p.cram) {
      o.innerHTML = `<div class="ck-out cram"><h4>SUPER CRAM: exam tomorrow</h4><ol class="ck-list">
        <li><b>Now:</b> copy the prompt below into a new project chat. You get ~${p.cards} cards on only the most-tested ideas.</li>
        <li><b>Pass 1 (2–3 h):</b> every card once. 5-minute break every 45 minutes.</li>
        <li><b>Pass 2:</b> rebuild the filtered deck with <code>rated:1:1</code> to redo only what you missed.</li>
        <li><b>Test yourself:</b> ask for <code>15 exam-style questions on the top topics</code>.</li>
        <li><b>Sleep at least 6 hours.</b> That's when it sticks.</li>
        <li><b>Morning:</b> rebuild with <code>rated:2:1</code> and do your misses once more.</li></ol>
        <h4>Filtered deck (Tools → Create Filtered Deck)</h4>${table([['Search', `deck:"${code}" tag:highyield`], ['Limit', '9999'], ['Cards selected by', 'Order added'], ['Reschedule cards based on my answers', 'Off', 'Keeps your normal schedule clean.'], ['Again / Hard / Good delay', '60 / 600 / 0 s']])}</div>`;
      return;
    }
    o.innerHTML = `<div class="ck-out"><h4>Your plan</h4><ul class="ck-list">
      <li><b>${p.D} days</b> to go, about <b>${p.studyDays} study days</b>, about <b>${p.cards} cards</b>.</li>
      <li>Learn <b>${p.newPerDay} new cards</b> a day plus reviews (about ${Math.round(p.newPerDay * 1.5)} min).</li>
      ${p.reserve ? `<li><b>Last ${p.reserveDays} days:</b> reviews and practice exams only.</li>` : ''}</ul>
      ${p.short ? `<p class="ck-warn">${p.mins} min/day isn't enough for all ${p.cards} cards (you'd need about ${Math.ceil(p.need * 1.5)}). Study longer, pick Key ideas only, or learn <code>tag:highyield</code> first.</p>` : ''}
      <h4>Anki settings (⚙ next to the deck → Options)</h4>${table([['New cards/day', p.newPerDay], ['Maximum reviews/day', '9999'], ['Learning steps', p.steps], ['Relearning steps', '10m'], ['FSRS', 'On', 'Under Advanced.'], ['Desired retention', p.retention], ['Maximum interval', p.maxIvl + ' days', 'So every card comes back before the exam.'], ['Bury siblings', 'On']])}</div>`;
  }
  function myPrompt(p) {
    let b = D.tpl['4-anki-deck-prompt.md']; b = fill(b.slice(b.indexOf('\n---\n') + 5).trim());
    const range = (val('range') || '').trim();
    if (cram) b = b.replace('[Lectures N–M / unit]', 'everything on tomorrow\'s exam').split('::[unit]').join('::Cram');
    else if (range) b = b.replace('[Lectures N–M / unit]', range).split('::[unit]').join('::' + range);
    const s = SUBJECT[val('subject')], L = ['## Tailored to me', '', `**Subject: ${s[0]}.**`, ...s[1].map(x => '- ' + x), ''];
    const fm = checks('fmt'); if (fm.length) L.push('**The exam is mostly:**', ...fm.map(x => '- ' + FORMAT[x]), '');
    L.push('**Card style:** ' + STYLE[radio('style')], '');
    if (!cram) L.push(`**Detail:** about ${PER_LEC[radio('detail')]} cards per lecture.`, '');
    const wk = checks('weak'); if (wk.length) L.push('**What I find hard:**', ...wk.map(x => '- ' + WEAK[x]), '');
    L.push('**Diagrams:** ' + DIAG[radio('diag')], '');
    if (p && p.newPerDay) L.push(`**My schedule:** exam in ${p.D} days, ~${p.newPerDay} new cards a day. Put \`highyield\` cards first.`, '');
    if (cram) L.push('## SUPER CRAM: my exam is tomorrow', '', `- Make only the **${p.cards} highest-yield cards**, most likely tested first.`, '- Start with ~10 big-picture cards.', '- Tag every card `highyield`. No nice-to-know detail.', '- Then a one-page "if you remember nothing else" summary.', '');
    return b.replace('## Output', L.join('\n') + '\n## Output');
  }
  let last = {};
  const update = () => { last = plan(); render(last); const pre = $('[data-pre]', root); if (!pre.hidden) pre.textContent = myPrompt(last); };
  f.addEventListener('input', update); f.addEventListener('change', update);
  root.addEventListener('click', async e => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-cram')) { cram = !cram; b.setAttribute('aria-pressed', cram); b.classList.toggle('on', cram); update(); }
    else if (b.hasAttribute('data-copyp')) { await copy(myPrompt(last)); const o = b.innerHTML; b.innerHTML = icon('check') + ' Copied'; setTimeout(() => b.innerHTML = o, 1500); }
    else if (b.hasAttribute('data-peekp')) { const pre = $('[data-pre]', root); pre.hidden = !pre.hidden; pre.textContent = myPrompt(last); b.textContent = pre.hidden ? 'Preview' : 'Hide'; }
  });
  update();
  return { update };
}

// ---------- prompt library (for Tools views) ----------
const LIBRARY = [
  ['Gather', [['Transcripts button', 'bm:transcripts'], ['Slides button', 'bm:slides']]],
  ['Claude project', [['Notes prompt', '1-context-builder-prompt.md'], ['Notes file', '0-context-doc-skeleton.md'], ['Tutor instructions', '2-project-instructions.md'], ['Study guide prompt', '3-study-guide-prompt.md']]],
  ['Exam prep', [['Past paper analysis', '5-exam-analysis-prompt.md'], ['Practice exam', '6-practice-exam-prompt.md']]],
  ['Anki', [['Anki deck prompt', '4-anki-deck-prompt.md']]]
];
function library(root) {
  root.innerHTML = LIBRARY.map(([sec, items]) => `<section class="ck-libsec"><h3 class="ck-sechead">${sec}</h3>${items.map(([name, id]) => id.startsWith('bm:') ?
    `<div class="ck-libitem"><span>${name}</span><a class="ck-bm small" href="${D.bm[id.slice(3)]}" data-bm draggable="true">⬇ Get ${id.slice(3)}</a></div>` :
    `<div class="ck-libitem"><span>${name}</span><span class="ck-row tight"><button type="button" class="ck-btn small primary" data-copy="${id}">${icon('copy')} Copy</button><button type="button" class="ck-btn small ghost" data-dl="${id}">${icon('download')}</button></span></div>`).join('')}</section>`).join('');
  bindActions(root);
}

// ---------- lofi: built-in generated music + your own files ----------
const Lofi = (() => {
  let ctx, master, lp, timer, playing = false, step = 0, nextT = 0, idx = store.get('station', 0), vol = store.get('vol', 0.6), noise, crackleSrc, rainSrc, audio, listeners = [];
  const BUILT = [
    { name: 'rainy café', bpm: 72, prog: [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]], rain: true },
    { name: 'night drive', bpm: 84, prog: [[45, 52, 55, 60], [41, 48, 52, 57], [48, 55, 59, 64], [43, 50, 55, 59]] },
    { name: 'slow morning', bpm: 64, prog: [[48, 55, 59, 64], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 62]] }
  ];
  let stations = BUILT.map(s => ({ ...s, kind: 'synth', label: s.name + ' (built-in)' }));
  const MUS=(window.CK_MUSIC||'music/');
  fetch(MUS+'playlist.json').then(r => r.ok ? r.json() : []).then(list => {
    if (Array.isArray(list) && list.length) { stations = list.map(x => ({ kind: 'file', file: MUS + (x.file || x), label: x.title || String(x.file || x).replace(/\.[^.]+$/, '') })).concat(stations); idx = 0; emit(); }
  }).catch(() => {});
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain(); master.gain.value = vol * 0.5;
    lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200;
    const comp = ctx.createDynamicsCompressor(); master.connect(lp); lp.connect(comp); comp.connect(ctx.destination);
    noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  function loopNoise(gain, type, freq, sparse) {
    const buf = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = sparse ? (Math.random() < 0.0006 ? (Math.random() * 2 - 1) : (Math.random() * 2 - 1) * 0.02) : Math.random() * 2 - 1;
    const s = ctx.createBufferSource(); s.buffer = buf; s.loop = true; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; const g = ctx.createGain(); g.gain.value = gain;
    s.connect(f); f.connect(g); g.connect(master); s.start(); return s;
  }
  function tone(m, t, dur, type, g0, cut = 1200) {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = hz(m); o.detune.value = (Math.random() - .5) * 12; f.type = 'lowpass'; f.frequency.value = cut;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(g0, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(f); f.connect(g); g.connect(master); o.start(t); o.stop(t + dur + .05);
  }
  function hit(t, kind) {
    if (kind === 'kick') { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(42, t + .14); g.gain.setValueAtTime(.9, t); g.gain.exponentialRampToValueAtTime(.001, t + .4); o.connect(g); g.connect(master); o.start(t); o.stop(t + .45); return; }
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise;
    if (kind === 'snare') { f.type = 'bandpass'; f.frequency.value = 1700; g.gain.setValueAtTime(.35, t); g.gain.exponentialRampToValueAtTime(.001, t + .22); }
    else { f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(.07 + Math.random() * .04, t); g.gain.exponentialRampToValueAtTime(.001, t + .05); }
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + .3);
  }
  function schedule(st, s, t) {
    const sd = 60 / s.bpm / 4, bar = Math.floor(st / 16) % s.prog.length, k = st % 16, ch = s.prog[bar];
    const swing = (k % 4 === 2) ? sd * .28 : 0;
    if (k === 0) { ch.forEach((m, j) => tone(m, t + j * .012, sd * 15, j % 2 ? 'sine' : 'triangle', .07, 1100)); }
    if (k === 0 || k === 10) tone(ch[0] - 12, t, sd * 5, 'sine', .22, 400);
    if (k === 0 || k === 7 || k === 10) hit(t, 'kick');
    if (k === 4 || k === 12) hit(t + swing, 'snare');
    if (k % 2 === 0) hit(t + swing, 'hat');
    if (Math.random() < .14 && k % 2 === 0) tone(ch[1 + Math.floor(Math.random() * 3)] + 12, t + swing, sd * 3, 'sine', .05, 2400);
  }
  function startSynth(s) {
    if (!ctx) init(); if (ctx.state === 'suspended') ctx.resume();
    step = 0; nextT = ctx.currentTime + .08;
    crackleSrc = loopNoise(.5, 'bandpass', 3000, true);
    if (s.rain) rainSrc = loopNoise(.05, 'lowpass', 1600, false);
    timer = setInterval(() => { while (nextT < ctx.currentTime + .12) { schedule(step, s, nextT); nextT += 60 / s.bpm / 4; step++; } }, 25);
  }
  function stopAll() { clearInterval(timer); [crackleSrc, rainSrc].forEach(x => { try { x && x.stop(); } catch (e) {} }); crackleSrc = rainSrc = null; if (audio) { audio.pause(); audio = null; } }
  function play() {
    stopAll(); const s = stations[idx]; playing = true;
    if (s.kind === 'file') { audio = new Audio(s.file); audio.volume = vol; audio.onended = () => next(); audio.play().catch(() => { playing = false; emit(); }); }
    else startSynth(s);
    emit();
  }
  function stop() { stopAll(); playing = false; emit(); }
  function next() { idx = (idx + 1) % stations.length; store.set('station', idx); if (playing) play(); else emit(); }
  function prev() { idx = (idx - 1 + stations.length) % stations.length; store.set('station', idx); if (playing) play(); else emit(); }
  function setVolume(v) { vol = Math.max(0, Math.min(1, v)); store.set('vol', vol); if (master) master.gain.value = vol * .5; if (audio) audio.volume = vol; emit(); }
  function emit() { idx = Math.min(idx, stations.length - 1); listeners.forEach(f => f(state())); }
  const state = () => ({ playing, label: stations[idx] ? stations[idx].label : '', idx, count: stations.length, vol, files: stations.filter(s => s.kind === 'file').length });
  return { play, stop, toggle: () => playing ? stop() : play(), next, prev, setVolume, state, on: f => { listeners.push(f); f(state()); } };
})();

window.CK = { D, $, $$, esc, store, env, icon, copy, download, course, fill, prompt, body, daysToExam, STEPS, wizard, progress, ankiTool, library, Lofi, bindCourse, courseForm, bindActions };
})();
