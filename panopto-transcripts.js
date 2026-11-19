/*
 * Panopto Transcript Downloader
 * ------------------------------------------------------------
 * HOW TO USE
 *   1. Open a Panopto folder page (e.g. ubc.ca.panopto.com/.../List.aspx#folderID=...)
 *      while signed in. Set "Results per page" to the max so every lecture is listed.
 *   2. Open the browser console (Mac: Cmd+Option+J in Chrome, Cmd+Option+C in Safari),
 *      paste this whole file, press Enter.
 *      (Or use the bookmarklet version: click it while on the folder page.)
 *   3. A zip downloads: one Markdown file per lecture + one combined file.
 *
 * HOW IT WORKS
 *   - Every recording link on the page contains its session id (Viewer.aspx?id=...).
 *   - Panopto serves captions for any session you can watch at
 *       /Panopto/Pages/Transcription/GenerateSRT.ashx?id=<id>&language=0
 *     as a standard .srt subtitle file. Because the script runs on the Panopto page,
 *     your existing login is used; no passwords or API keys involved.
 *   - The .srt is parsed and caption lines are merged into ~2-minute paragraphs,
 *     each tagged with its start time.
 *   - Files are packed into a zip in the browser (no libraries needed) and downloaded.
 */
(async () => {
  const PARAGRAPH_SECONDS = 120;   // change to group captions into longer/shorter paragraphs
  const DRY_RUN = window.__PANOPTO_DRY_RUN === true; // for testing: build but don't download

  // ---------- 1. Find every session on the folder page ----------
  const seen = new Set();
  const sessions = [...document.querySelectorAll('a[href*="Viewer.aspx?id="]')]
    .map(a => ({ title: a.textContent.trim(), id: new URL(a.href).searchParams.get('id') }))
    .filter(s => s.title && s.id && !seen.has(s.id) && seen.add(s.id));
  // On a single lecture's viewer page, grab just that one
  const here = new URLSearchParams(location.search).get('id');
  if (!sessions.length && here && /Viewer\.aspx/i.test(location.pathname))
    sessions.push({ title: document.title.replace(/ : Panopto$/, '').trim() || 'Lecture', id: here });
  if (!sessions.length) {
    alert(/panopto/i.test(location.hostname)
      ? 'No recordings found on this page. Open a Panopto folder (or a single lecture) and wait for the list to load, then try again.'
      : 'This only works on a Panopto page. Open your Panopto folder first, then click the bookmark.');
    return;
  }

  // ---------- 2. Helpers ----------
  const fmt = s => {
    const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0');
  };

  function srtToMarkdown(srt) {
    const segs = [];
    for (const block of srt.replace(/\r/g, '').split(/\n\n+/)) {
      const lines = block.split('\n');
      const i = lines.findIndex(l => l.includes('-->'));
      if (i < 0) continue;
      const m = lines[i].match(/(\d+):(\d+):(\d+)/);
      const start = +m[1] * 3600 + +m[2] * 60 + +m[3];
      const text = lines.slice(i + 1).join(' ')
        .replace(/\[Auto-generated transcript[^\]]*\]/i, '').trim();
      if (text) segs.push({ start, text });
    }
    const paras = [];
    let cur = null;
    for (const s of segs) {
      if (!cur || s.start - cur.start >= PARAGRAPH_SECONDS) paras.push(cur = { start: s.start, text: [] });
      cur.text.push(s.text);
    }
    return paras.map(p => `**[${fmt(p.start)}]** ${p.text.join(' ')}`).join('\n\n');
  }

  // Pull a date out of titles like "... on 9/10/2026 (Thu)" for sortable filenames
  function dateOf(title) {
    const m = title.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null;
  }
  const safe = s => s.replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim().slice(0, 120);

  // ---------- 3. Download + convert every transcript ----------
  const files = [];
  const combined = [`# ${document.title.replace(/ : Panopto$/, '')} — Transcripts\n`];
  const failed = [];
  sessions.sort((a, b) => (dateOf(a.title) || a.title).localeCompare(dateOf(b.title) || b.title));
  for (const [n, s] of sessions.entries()) {
    console.log(`[${n + 1}/${sessions.length}] ${s.title}`);
    try {
      const r = await fetch(`/Panopto/Pages/Transcription/GenerateSRT.ashx?id=${s.id}&language=0`);
      const srt = r.ok ? await r.text() : '';
      const body = srtToMarkdown(srt);
      if (!body) { failed.push(s.title); continue; }
      const url = `${location.origin}/Panopto/Pages/Viewer.aspx?id=${s.id}`;
      const md = `# ${s.title}\n\nRecording: ${url}\n\n${body}\n`;
      const d = dateOf(s.title);
      files.push({ name: safe(d ? `${d} ${s.title}` : s.title) + '.md', text: md });
      combined.push(md.replace(/^# /, '## '));
    } catch (e) { failed.push(s.title); }
  }
  files.push({ name: '_ALL_TRANSCRIPTS.md', text: combined.join('\n\n---\n\n') });

  // ---------- 4. Build a zip (store-only, no compression, no libraries) ----------
  const enc = new TextEncoder();
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0;
  });
  const crc32 = b => { let c = 0xFFFFFFFF; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const parts = [], central = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), data = enc.encode(f.text), crc = crc32(data);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true); local.setUint16(4, 20, true); local.setUint16(6, 0x0800, true);
    local.setUint32(14, crc, true); local.setUint32(18, data.length, true); local.setUint32(22, data.length, true);
    local.setUint16(26, name.length, true);
    parts.push(local, name, data);
    const cen = new DataView(new ArrayBuffer(46));
    cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true);
    cen.setUint32(16, crc, true); cen.setUint32(20, data.length, true); cen.setUint32(24, data.length, true);
    cen.setUint16(28, name.length, true); cen.setUint32(42, offset, true);
    central.push(cen, name);
    offset += 30 + name.length + data.length;
  }
  const cenSize = central.reduce((t, p) => t + p.byteLength, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true); end.setUint16(10, files.length, true);
  end.setUint32(12, cenSize, true); end.setUint32(16, offset, true);
  const zip = new Blob([...parts, ...central, end], { type: 'application/zip' });

  const summary = `${files.length - 1} transcripts, ${failed.length} without captions` +
    (failed.length ? ':\n- ' + failed.join('\n- ') : '');
  console.log(summary);
  if (DRY_RUN) { window.__PANOPTO_RESULT = { files, zip, zipBytes: zip.size, failed }; return; }

  // ---------- 5. Download ----------
  const a = document.createElement('a');
  a.href = URL.createObjectURL(zip);
  a.download = safe(document.title.replace(/ : Panopto$/, '')) + ' transcripts.zip';
  document.body.appendChild(a); a.click(); a.remove();
  alert('Done: ' + summary);
})();
