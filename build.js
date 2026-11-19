// Rebuilds index.html from src/. Run: node build.js
const fs = require('fs');
const bm = f => 'javascript:' + encodeURIComponent(
  fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//, '').replace(/^\s*\/\/.*$/mg, ''));
const T = {};
for (const f of fs.readdirSync('src/templates')) T[f] = fs.readFileSync('src/templates/' + f, 'utf8');
const json = JSON.stringify(T).replace(/<\//g, '<\\/');
const html = fs.readFileSync('src/template.html', 'utf8')
  .replace('__BOOKMARKLET__', () => bm('src/panopto-transcripts.js'))
  .replace('__CANVAS__', () => bm('src/canvas-slides.js'))
  .replace('__TEMPLATES__', () => json);
for (const [, code] of html.matchAll(/href="javascript:([^"]+)"/g)) new Function(decodeURIComponent(code)); // syntax check
fs.writeFileSync('index.html', html);
console.log('Built index.html (' + html.length + ' bytes)');
