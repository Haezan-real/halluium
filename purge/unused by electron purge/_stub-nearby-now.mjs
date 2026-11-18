import fs from 'node:fs';
import path from 'node:path';

const SRC = 'C:/hallulium/src';
const text = fs.readFileSync(SRC + '/chrome/browser/BUILD.gn', 'utf8');
const buildDir = 'chrome/browser';
let written = 0;
for (const m of text.matchAll(/"([^"]+)"/g)) {
  const lit = m[1];
  if (!lit || lit.startsWith('//') || lit.includes('$')) continue;
  if (!/\.(cc|h|mm|mojom)$/.test(lit)) continue;
  if (!/^[A-Za-z0-9_./+-]+$/.test(lit)) continue;
  const cand = path.posix.join(buildDir, lit);
  const abs = path.join(SRC, cand);
  if (fs.existsSync(abs)) continue;
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(
    abs,
    /\.h$/.test(lit) ? '#pragma once\n// Hallulium stub\n' : '// Hallulium stub\n'
  );
  written++;
}
console.log('written', written);
console.log(
  'nearby',
  fs.existsSync(SRC + '/chrome/browser/nearby_sharing/attachment_info.cc')
);
