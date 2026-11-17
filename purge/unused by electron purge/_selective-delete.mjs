/**
 * Delete unrelated-code candidates under given prefixes, minus keep-overrides.
 * Preserves BUILD.gn / *.gni / DEPS / *.grd* so remaining targets can still gen.
 *
 * Usage: node _selective-delete.mjs chrome/browser chrome/app
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = process.env.HALLULIUM_SRC || 'C:\\hallulium\\src';
const dir = path.dirname(fileURLToPath(import.meta.url));
const delMd = fs.readFileSync(path.join(dir, 'unrelated code purge.md'), 'utf8');
const keepMd = fs.readFileSync(
  path.join(dir, 'unrelated code purge keep overrides.md'),
  'utf8'
);

const prefixes = process.argv.slice(2).map((p) => p.replace(/\\/g, '/').replace(/\/$/, ''));
if (!prefixes.length) {
  console.error('usage: node _selective-delete.mjs <prefix>...');
  process.exit(1);
}

const keep = new Set();
for (const line of keepMd.split(/\r?\n/)) {
  const m = line.match(/^([a-zA-Z0-9_./+-]+)\s+\u2190/);
  if (m) keep.add(m[1].replace(/\\/g, '/'));
}

const start = delMd.indexOf('```\n');
const end = delMd.lastIndexOf('\n```');
const body = delMd.slice(start + 4, end);

const preserveName = (rel) => {
  const base = path.posix.basename(rel);
  if (base === 'BUILD.gn' || base === 'DEPS' || base === 'OWNERS') return true;
  if (base.endsWith('.gni') || base.endsWith('.grd') || base.endsWith('.grdp')) return true;
  if (base.endsWith('.gn')) return true;
  return false;
};

let deleted = 0;
let skippedKeep = 0;
let skippedMeta = 0;
let missing = 0;
let bytes = 0;

for (const relRaw of body.split('\n')) {
  const rel = relRaw.trim().replace(/\\/g, '/');
  if (!rel) continue;
  if (!prefixes.some((p) => rel === p || rel.startsWith(p + '/'))) continue;
  if (keep.has(rel)) {
    skippedKeep++;
    continue;
  }
  if (preserveName(rel)) {
    skippedMeta++;
    continue;
  }
  const abs = path.join(SRC, rel);
  if (!fs.existsSync(abs)) {
    missing++;
    continue;
  }
  try {
    const st = fs.statSync(abs);
    if (st.isFile()) {
      bytes += st.size;
      fs.unlinkSync(abs);
      deleted++;
    }
  } catch (e) {
    console.error('fail', rel, e.message);
  }
}

console.error(
  JSON.stringify(
    {
      prefixes,
      deleted,
      bytesMB: Math.round(bytes / 1024 / 1024),
      skippedKeep,
      skippedMeta,
      missing,
      keepTotal: keep.size,
    },
    null,
    2
  )
);
