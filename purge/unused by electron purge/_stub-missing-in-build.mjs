/**
 * For kept BUILD.gn files under prefixes, create stubs for every missing
 * relative source/data path the file still quotes.
 */
import fs from 'node:fs';
import path from 'node:path';

const SRC = process.env.HALLULIUM_SRC || 'C:\\hallulium\\src';
const prefixes = process.argv.slice(2);
if (!prefixes.length) {
  console.error('usage: node _stub-missing-in-build.mjs chrome/browser chrome/app ...');
  process.exit(1);
}

function stub(rel) {
  const base = path.posix.basename(rel);
  if (/\.(h|hh|hpp)$/i.test(base)) return '#pragma once\n// Hallulium stub\n';
  if (/\.(cc|cpp|c|mm|m)$/i.test(base)) return '// Hallulium stub\n';
  if (base.endsWith('.gni')) return '# Hallulium stub\ndeclare_args() {}\n';
  if (base.endsWith('.mojom')) return '// Hallulium stub\nmodule stub;\n';
  if (base.endsWith('.grd') || base.endsWith('.grdp')) {
    return '<?xml version="1.0" encoding="utf-8"?>\n<grit-part></grit-part>\n';
  }
  return '// Hallulium stub\n';
}

function walk(dirAbs, base, out) {
  let ents;
  try {
    ents = fs.readdirSync(dirAbs, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of ents) {
    const abs = path.join(dirAbs, ent.name);
    const rel = path.posix.join(base, ent.name).replace(/\\/g, '/');
    if (ent.isDirectory()) walk(abs, rel, out);
    else if (ent.name === 'BUILD.gn' || ent.name.endsWith('.gni')) out.push(rel);
  }
}

let written = 0;
let checked = 0;
for (const prefix of prefixes) {
  const files = [];
  const root = path.join(SRC, prefix);
  if (!fs.existsSync(root)) continue;
  walk(root, prefix.replace(/\\/g, '/'), files);
  for (const rel of files) {
    const text = fs.readFileSync(path.join(SRC, rel), 'utf8');
    if (text.includes('Hallulium stub')) continue;
    const buildDir = path.posix.dirname(rel);
    for (const m of text.matchAll(/"([^"]+)"/g)) {
      const lit = m[1];
      if (!lit || lit.startsWith('//') || lit.includes('$') || /[*?\r\n]/.test(lit)) continue;
      if (lit.length > 240 || lit.includes(' ') || lit.startsWith(',') || lit.includes('#')) continue;
      if (!/^[A-Za-z0-9_./+-]+$/.test(lit)) continue;
      if (
        !/\.(cc|cpp|cxx|h|hh|hpp|mm|m|c|mojom|gni|grd|grdp|json|xml|txt|icon)$/i.test(lit)
      ) {
        continue;
      }
      checked++;
      const cand = path.posix.join(buildDir, lit).replace(/\\/g, '/');
      const abs = path.join(SRC, cand);
      if (fs.existsSync(abs)) continue;
      try {
        fs.mkdirSync(path.dirname(abs), { recursive: true });
        fs.writeFileSync(abs, stub(cand));
        written++;
      } catch (e) {
        console.error('skip', cand, e.message);
      }
    }
  }
}
console.log(JSON.stringify({ prefixes, checked, written }, null, 2));
