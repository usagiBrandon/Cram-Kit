// Builds assets/data.js (bookmarklets + prompts) from src/. Run: node build.js
const fs = require('fs');
const bm = f => 'javascript:' + encodeURIComponent(
  fs.readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//, '').replace(/^\s*\/\/.*$/mg, ''));
for (const f of ['src/panopto-transcripts.js', 'src/canvas-slides.js']) new Function(fs.readFileSync(f, 'utf8')); // syntax check
const tpl = {};
for (const f of fs.readdirSync('src/templates')) tpl[f] = fs.readFileSync('src/templates/' + f, 'utf8');
const data = { bm: { transcripts: bm('src/panopto-transcripts.js'), slides: bm('src/canvas-slides.js') }, tpl };
fs.writeFileSync('assets/data.js', 'window.CK_DATA=' + JSON.stringify(data) + ';\n');
console.log('Built assets/data.js (' + Object.keys(tpl).length + ' prompts)');
