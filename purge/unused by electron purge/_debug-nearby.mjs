import fs from 'node:fs';

const buf = fs.readFileSync('C:/hallulium/src/chrome/browser/BUILD.gn');
const text = buf.toString('utf8');
const idx = text.indexOf('nearby_sharing/attachment_info.cc');
console.log('idx', idx);
if (idx >= 0) {
  const slice = text.slice(idx - 5, idx + 40);
  console.log([...slice].map((c) => c + ':' + c.charCodeAt(0)).join(' | '));
}
// count occurrences of relative nearby_sharing source pattern
const re = /nearby_sharing\/[a-z0-9_./]+\.(cc|h)/gi;
console.log('rel hits', [...text.matchAll(re)].length);
console.log('quote nearby', [...text.matchAll(/"[^"]*nearby_sharing[^"]*"/g)].slice(0, 5));
