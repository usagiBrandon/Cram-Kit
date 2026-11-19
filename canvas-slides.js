/*
 * Canvas Slides Downloader
 * ------------------------------------------------------------
 * Click this bookmark on ANY page inside a Canvas course (Home, Modules, Files, a Page...).
 * It finds every file in the course wherever the instructor put it:
 *   - the Files area (if students can see it)
 *   - files attached to Modules
 *   - files linked inside course Pages (incl. the front page)
 * then shows a checklist. Tick what you want and press Download.
 * Uses Canvas's own API with your existing login; nothing leaves your browser.
 */
(async () => {
  const m = location.pathname.match(/\/courses\/(\d+)/);
  if (!m) { alert('Open a page inside a Canvas course first (e.g. its Home or Modules page), then click the bookmark.'); return; }
  const course = m[1];
  const API = `${location.origin}/api/v1/courses/${course}`;
  document.getElementById('__cs_host')?.remove();

  // ---------- UI shell (shadow DOM so Canvas styles don't interfere) ----------
  const host = document.createElement('div');
  host.id = '__cs_host';
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483647';
  const root = host.attachShadow({ mode: 'open' });
  root.innerHTML = `<style>
    .bg{position:fixed;inset:0;background:rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;font:14px/1.45 system-ui,-apple-system,sans-serif}
    .card{background:#fff;color:#1b1b1a;width:min(760px,94vw);max-height:88vh;border-radius:14px;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.3)}
    header{padding:16px 20px;border-bottom:1px solid #e5e2da;display:flex;align-items:center;gap:12px}
    h1{font-size:17px;margin:0;flex:1}
    .x{background:none;border:0;font-size:22px;cursor:pointer;color:#666}
    .tools{padding:10px 20px;display:flex;gap:8px;flex-wrap:wrap;border-bottom:1px solid #e5e2da;align-items:center}
    input[type=search]{flex:1;min-width:160px;padding:7px 10px;border:1px solid #ccc;border-radius:8px;font:inherit}
    .btn{padding:7px 12px;border:1px solid #ccc;background:#fff;border-radius:8px;cursor:pointer;font:inherit}
    .main{background:#2f5d50;color:#fff;border-color:#2f5d50;font-weight:600}
    .main:disabled{opacity:.5;cursor:default}
    .list{overflow:auto;padding:6px 12px 12px;flex:1}
    .grp{font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#6b6862;margin:14px 8px 4px}
    label{display:flex;gap:10px;align-items:baseline;padding:5px 8px;border-radius:6px;cursor:pointer}
    label:hover{background:#f4f2ec}
    .nm{flex:1;word-break:break-word}
    .meta{color:#8a867d;font-size:12px;white-space:nowrap}
    .status{padding:12px 20px;border-top:1px solid #e5e2da;color:#555;min-height:20px}
    .tag{font-size:11px;border:1px solid #ccc;border-radius:5px;padding:0 5px;margin-left:6px;color:#666}
    .dl1{text-decoration:none;font-size:15px;padding:0 4px}
    .help{display:none;margin:0 20px 12px;padding:10px 12px;background:#fff6e0;border:1px solid #f0d58a;border-radius:8px;color:#5a4300}
    .help.show{display:block}
    .help button{margin-top:8px}
    a{color:#2f5d50}
  </style>
  <div class="bg"><div class="card">
    <header><h1>Course files</h1><button class="x" title="Close">×</button></header>
    <div class="tools">
      <input type="search" placeholder="Filter, e.g. lecture, pdf, week 3">
      <button class="btn" data-a="best" title="PPTX when there is one, plus annotated PDFs; PDF for decks without a PPTX">Best version</button>
      <button class="btn" data-a="pptx">Only PPTX</button>
      <button class="btn" data-a="pdf" title="Slide PDFs + annotated PDFs (no handouts)">Only PDF</button>
      <button class="btn" data-a="all">Tick shown</button>
      <button class="btn" data-a="none">Untick all</button>
      <button class="btn main" data-a="dl" disabled>Download</button>
    </div>
    <div class="list">Looking through the course…</div>
    <div class="status"></div>
    <div class="help"><b>Only got one or two files?</b> Chrome blocks the rest as "multiple downloads". Click the blocked-download icon at the right end of the address bar, choose <b>Always allow</b>, then press Retry. (Or use the ⬇ next to any file to grab it individually.)<br><button class="btn main" data-a="retry">Retry (all except the first file)</button></div>
  </div></div>`;
  document.body.appendChild(host);
  const $ = s => root.querySelector(s);
  const status = t => ($('.status').textContent = t);
  $('.x').onclick = () => host.remove();
  $('.bg').onclick = e => { if (e.target === $('.bg')) host.remove(); };

  // ---------- Canvas API helpers ----------
  async function get(url) {
    const r = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
    if (!r.ok) throw Object.assign(new Error(r.status), { status: r.status });
    const txt = (await r.text()).replace(/^while\(1\);/, '');
    const next = (r.headers.get('Link') || '').split(',').find(p => /rel="next"/.test(p));
    return { data: JSON.parse(txt), next: next && next.match(/<([^>]+)>/)[1] };
  }
  async function getAll(url) {
    let out = [], u = url;
    for (let i = 0; u && i < 50; i++) { const r = await get(u); out = out.concat(r.data); u = r.next; }
    return out;
  }

  const files = new Map();   // id -> {id,name,url,size,type,updated,where:Set}
  const links = [];          // external links {title,url,where}
  const add = (f, where) => {
    if (!f || !f.id) return;
    const ex = files.get(String(f.id));
    if (ex) { ex.where.add(where); return; }
    files.set(String(f.id), {
      id: String(f.id), name: f.display_name || f.filename || ('file ' + f.id), url: f.url,
      size: f.size, type: (f.filename || f.display_name || '').split('.').pop().toLowerCase(),
      updated: f.updated_at || f.created_at, locked: f.locked_for_user, where: new Set([where])
    });
  };
  const fileById = async (id, where) => {
    if (files.has(String(id))) { files.get(String(id)).where.add(where); return; }
    try { add((await get(`${API}/files/${id}`)).data, where); } catch (e) { /* not visible to you */ }
  };
  const found = [];

  // 1. Files area
  status('Checking the Files area…');
  try { (await getAll(`${API}/files?per_page=100&sort=name`)).forEach(f => add(f, 'Files')); found.push('Files'); }
  catch (e) { /* Files tab hidden for students — fall through */ }

  // 2. Modules
  status('Checking Modules…');
  try {
    const mods = await getAll(`${API}/modules?include[]=items&per_page=100`);
    let items = [];
    for (const mo of mods) {
      let its = mo.items;
      if (!its && mo.items_url) { try { its = await getAll(mo.items_url + '?per_page=100'); } catch (e) { its = []; } }
      for (const it of its || []) items.push([mo.name, it]);
    }
    const tasks = [];
    for (const [mname, it] of items) {
      const where = 'Module: ' + mname;
      if (it.type === 'File') tasks.push(() => fileById(it.content_id, where));
      else if (it.type === 'ExternalUrl' && it.external_url) links.push({ title: it.title, url: it.external_url, where });
      else if (it.type === 'Page' && it.page_url) tasks.push(async () => {   // files linked inside module pages
        try {
          const body = (await get(`${API}/pages/${encodeURIComponent(it.page_url)}`)).data.body || '';
          for (const id of new Set([...body.matchAll(/\/files\/(\d+)/g)].map(x => x[1]))) await fileById(id, where);
        } catch (e) {}
      });
    }
    let done = 0;
    const worker = async () => { while (tasks.length) { await tasks.shift()(); status(`Checking Modules… (${++done} items)`); } };
    await Promise.all([1, 2, 3, 4, 5, 6].map(worker));
    found.push('Modules');
  } catch (e) {}

  // 3. Pages (links to files inside page content)
  status('Checking course Pages…');
  try {
    const pages = await getAll(`${API}/pages?per_page=100`);
    let n = 0;
    for (const p of pages.slice(0, 150)) {
      status(`Checking course Pages… (${++n}/${Math.min(pages.length, 150)})`);
      try {
        const body = (await get(`${API}/pages/${encodeURIComponent(p.url)}`)).data.body || '';
        const ids = new Set([...body.matchAll(/\/files\/(\d+)/g)].map(x => x[1]));
        for (const id of ids) await fileById(id, 'Page: ' + p.title);
      } catch (e) {}
    }
    found.push('Pages');
  } catch (e) {
    // Pages list hidden: at least try the front page
    try {
      const body = (await get(`${API}/front_page`)).data.body || '';
      for (const id of new Set([...body.matchAll(/\/files\/(\d+)/g)].map(x => x[1]))) await fileById(id, 'Home page');
    } catch (e2) {}
  }

  // ---------- Render checklist ----------
  const DECK_EXT = /^(pptx?|key|odp)$/;
  const SLIDE_NAME = /lec|slide|week|class|chapter|ch\.?\s?\d|unit|topic|annotat/i;
  const stem = n => n.replace(/\.[^.]+$/, '').toLowerCase().replace(/\+/g, ' ');
  const base = n => stem(n).replace(/([_\s-]+(pdf|handouts?|ho|annotated( slides)?|print|notes))+$/,'').trim();
  const all = [...files.values()].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  const deckBases = new Set(all.filter(f => DECK_EXT.test(f.type)).map(f => base(f.name)));
  for (const f of all) {
    const st = stem(f.name);
    f.kind = DECK_EXT.test(f.type) ? 'deck'
      : f.type !== 'pdf' ? 'other'
      : /annotat/.test(st) ? 'annotated'
      : /handout|[_\s-]ho$/.test(st) ? 'handout'
      : (deckBases.has(base(f.name)) || SLIDE_NAME.test(f.name)) ? 'slidepdf' : 'other';
  }
  const PRESETS = {
    best: f => f.kind === 'deck' || f.kind === 'annotated' || (f.kind === 'slidepdf' && !deckBases.has(base(f.name))),
    pptx: f => f.kind === 'deck',
    pdf: f => f.kind === 'slidepdf' || f.kind === 'annotated',
  };
  const isSlide = PRESETS.best;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const kb = n => n == null ? '' : n > 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.ceil(n / 1e3) + ' KB';
  const groupOf = f => [...f.where][0].startsWith('Module: ') ? [...f.where][0] : [...f.where].find(w => w.startsWith('Module: ')) || [...f.where][0];

  if (!all.length && !links.length) {
    $('.list').innerHTML = '<p style="padding:8px">No files found that you can access in this course. The slides may be hosted outside Canvas (e.g. a prof\'s website or Google Drive).</p>';
    status(''); return;
  }
  const dlUrl = f => { const u = new URL(f.url, location.origin); u.searchParams.set('download_frd', '1'); return u.href; };
  const groups = {};
  for (const f of all) (groups[groupOf(f)] ||= []).push(f);
  const order = Object.keys(groups).sort((a, b) => (a === 'Files') - (b === 'Files') || a.localeCompare(b, undefined, { numeric: true }));
  let html = '';
  for (const g of order) {
    html += `<div class="grp" data-g>${esc(g)}</div>`;
    for (const f of groups[g]) html += `<label data-name="${esc((f.name + ' ' + g).toLowerCase())}"><input type="checkbox" data-id="${f.id}" ${isSlide(f) ? 'checked' : ''} ${f.url ? '' : 'disabled'}>
      <span class="nm">${esc(f.name)}${f.kind === 'handout' ? '<span class="tag">handout</span>' : f.kind === 'annotated' ? '<span class="tag">annotated</span>' : ''}${f.url ? '' : ' <i>(locked)</i>'}</span><span class="meta">${f.type.toUpperCase()} · ${kb(f.size)}</span>${f.url ? `<a class="dl1" title="Download just this file" href="${esc(dlUrl(f))}">⬇</a>` : ''}</label>`;
  }
  if (links.length) {
    html += `<details><summary class="grp" style="cursor:pointer">External links: ${links.length} (open these yourself)</summary>`;
    for (const l of links) html += `<label style="cursor:default"><span class="nm"><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.title)}</a></span><span class="meta">${esc(l.where)}</span></label>`;
    html += `</details>`;
  }
  $('.list').innerHTML = html;

  const boxes = () => [...root.querySelectorAll('input[data-id]')];
  const visible = b => b.closest('label').style.display !== 'none';
  const refresh = () => {
    const n = boxes().filter(b => b.checked).length;
    $('[data-a=dl]').disabled = !n;
    $('[data-a=dl]').textContent = n ? `Download ${n}` : 'Download';
    status(`Found ${all.length} files (searched ${found.join(', ') || 'what was accessible'}).`);
  };
  root.addEventListener('change', refresh);
  $('input[type=search]').oninput = e => {
    const q = e.target.value.toLowerCase().trim().split(/\s+/);
    root.querySelectorAll('label[data-name]').forEach(l => (l.style.display = q.every(w => l.dataset.name.includes(w)) ? '' : 'none'));
  };
  for (const k of Object.keys(PRESETS)) $(`[data-a=${k}]`).onclick = () => { boxes().forEach(b => (b.checked = !b.disabled && PRESETS[k](files.get(b.dataset.id)))); refresh(); };
  $('[data-a=all]').onclick = () => { boxes().forEach(b => { if (visible(b) && !b.disabled) b.checked = true; }); refresh(); };
  $('[data-a=none]').onclick = () => { boxes().forEach(b => (b.checked = false)); refresh(); };

  // ---------- Download ----------
  // Canvas serves download_frd=1 links as attachments, so clicking one downloads without leaving the page.
  // Chrome only lets the first one through until you allow "multiple downloads" for this site.
  let lastBatch = [];
  const fire = f => {
    const a = document.createElement('a');
    a.href = dlUrl(f); a.download = f.name; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a); a.click(); a.remove();
  };
  async function run(pick) {
    $('[data-a=dl]').disabled = true;
    for (const [i, f] of pick.entries()) {
      status(`Starting ${i + 1}/${pick.length}: ${f.name}`);
      fire(f);
      await new Promise(r => setTimeout(r, 1500));
    }
    status(`Started ${pick.length} download${pick.length > 1 ? 's' : ''}. Large PPTX files can take a minute to finish.`);
    if (pick.length > 1) $('.help').classList.add('show');
    $('[data-a=dl]').disabled = false;
  }
  $('[data-a=dl]').onclick = () => { lastBatch = boxes().filter(b => b.checked).map(b => files.get(b.dataset.id)); run(lastBatch); };
  $('[data-a=retry]').onclick = () => { $('.help').classList.remove('show'); run(lastBatch.slice(1)); };
  refresh();
})();
