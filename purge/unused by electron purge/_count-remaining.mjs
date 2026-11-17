import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = process.env.HALLULIUM_SRC || 'C:\\hallulium\\src';
const delMd = fs.readFileSync(path.join(dir, 'unrelated code purge.md'), 'utf8');
const keepMd = fs.readFileSync(
  path.join(dir, 'unrelated code purge keep overrides.md'),
  'utf8'
);
const keep = new Set();
for (const line of keepMd.split(/\r?\n/)) {
  const m = line.match(/^([a-zA-Z0-9_./+-]+)\s+\u2190/);
  if (m) keep.add(m[1].replace(/\\/g, '/'));
}
const policy =
  /(^|\/)(mac|macos|darwin|cocoa|appkit|metal|ios(?!_internal)|rust-toolchain|llvm-build|depot_tools|siso|buildtools)(\/|$)/i;

const start = delMd.indexOf('```\n');
const end = delMd.lastIndexOf('\n```');
const body = delMd.slice(start + 4, end);
let still = 0;
const by2 = new Map();
for (const relRaw of body.split('\n')) {
  const rel = relRaw.trim().replace(/\\/g, '/');
  if (!rel) continue;
  if (keep.has(rel)) continue;
  if (policy.test(rel)) continue;
  if (!fs.existsSync(path.join(src, rel))) continue;
  still++;
  const two = rel.split('/').slice(0, 2).join('/');
  by2.set(two, (by2.get(two) || 0) + 1);
}
console.log(
  JSON.stringify(
    {
      stillExistingCandidatesMinusKeepAndPolicy: still,
    },
    null,
    2
  )
);
console.log(
  [...by2.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([k, v]) => `${v}\t${k}`)
    .join('\n')
);
