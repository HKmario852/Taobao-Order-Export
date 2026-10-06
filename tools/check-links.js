// Checks that every relative link and image in the README files points to a file that exists.
//   node tools/check-links.js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = ['README.md', 'PRIVACY.md', 'docs/DEVELOPMENT.md'];
for (const f of fs.readdirSync(path.join(root, 'docs/i18n'))) if (f.endsWith('.md')) files.push(`docs/i18n/${f}`);

let bad = 0;
let checked = 0;
for (const file of files) {
  const text = fs.readFileSync(path.join(root, file), 'utf8').replace(/```[\s\S]*?```/g, '');
  const targets = [
    ...[...text.matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)].map((m) => m[1]),
    ...[...text.matchAll(/<(?:img|a)\s[^>]*(?:src|href)="([^"]+)"/g)].map((m) => m[1]),
  ];
  for (const t of targets) {
    if (/^(https?:|mailto:|#)/.test(t)) continue;
    const target = decodeURIComponent(t.split('#')[0]);
    const resolved = path.resolve(path.dirname(path.join(root, file)), target);
    checked++;
    if (!fs.existsSync(resolved)) {
      console.log(`${file}: missing ${t}`);
      bad++;
    }
  }
}
console.log(`${checked} relative links checked in ${files.length} files, ${bad} missing`);
process.exit(bad ? 1 : 0);
