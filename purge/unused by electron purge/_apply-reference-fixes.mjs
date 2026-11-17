/**
 * Pre-apply unrelated-code reference fixes before the giant e build:
 * 1) Ensure BUILD.gn stubs exist for every dep/label deleted path, with the
 *    target names referenced by // labels.
 * 2) Stub missing .gni / source / data files still named by kept BUILD files.
 * 3) Do not overwrite non-stub real content (kept packages).
 *
 * Usage: node _apply-reference-fixes.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = process.env.HALLULIUM_SRC || 'C:\\hallulium\\src';
const dir = path.dirname(fileURLToPath(import.meta.url));
const fixMd = fs.readFileSync(path.join(dir, 'unrelated code purge reference fix.md'), 'utf8');
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

const deleteFiles = new Set();
{
  const start = delMd.indexOf('```\n');
  const end = delMd.lastIndexOf('\n```');
  for (const line of delMd.slice(start + 4, end).split('\n')) {
    const r = line.trim().replace(/\\/g, '/');
    if (r) deleteFiles.add(r);
  }
}

function norm(p) {
  return p.replace(/\\/g, '/');
}

function isStub(text) {
  return text.includes('Hallulium stub') || /^\s*# Hallulium stub/m.test(text);
}

function writeFile(rel, body) {
  const abs = path.join(SRC, rel);
  const parent = path.dirname(abs);
  // If any path prefix is an existing file, we cannot mkdir through it.
  let cur = SRC;
  const parts = path.relative(SRC, parent).split(path.sep).filter(Boolean);
  for (const part of parts) {
    cur = path.join(cur, part);
    if (fs.existsSync(cur) && fs.statSync(cur).isFile()) {
      console.error('skip (parent is file)', rel);
      return false;
    }
  }
  fs.mkdirSync(parent, { recursive: true });
  if (fs.existsSync(abs) && fs.statSync(abs).isDirectory()) {
    console.error('skip (path is dir)', rel);
    return false;
  }
  fs.writeFileSync(abs, body.endsWith('\n') ? body : body + '\n');
  return true;
}

function stubBodyForBuild(groups) {
  const uniq = [...new Set(groups.filter(Boolean))];
  if (!uniq.length) uniq.push('stub');
  return '# Hallulium stub\n' + uniq.map((g) => `group("${g}") {}`).join('\n') + '\n';
}

function stubBodyForPath(rel) {
  const base = path.posix.basename(rel);
  if (base.endsWith('.gni')) {
    return '# Hallulium stub\ndeclare_args() {}\n';
  }
  if (base === 'BUILD.gn' || base.endsWith('.gn')) {
    const g = path.posix.basename(path.posix.dirname(rel));
    return stubBodyForBuild([g, 'stub']);
  }
  if (/\.(h|hh|hpp|hxx)$/i.test(base)) {
    return '#pragma once\n// Hallulium stub\n';
  }
  if (/\.(cc|cpp|cxx|c|mm|m)$/i.test(base)) {
    return '// Hallulium stub\n';
  }
  if (base.endsWith('.py')) {
    return '# Hallulium stub\n';
  }
  if (base.endsWith('.json') || base.endsWith('.xml') || base.endsWith('.mojom')) {
    return '{}\n';
  }
  if (base.endsWith('.grd') || base.endsWith('.grdp')) {
    return '<?xml version="1.0" encoding="utf-8"?>\n<grit-part></grit-part>\n';
  }
  return '// Hallulium stub\n';
}

function parseLabel(ref) {
  let s = ref.trim();
  if (s.startsWith('"') || s.startsWith("'")) s = s.slice(1, -1);
  if (!s.startsWith('//')) return null;
  s = s.slice(2);
  let target = null;
  const colon = s.indexOf(':');
  if (colon >= 0) {
    target = s.slice(colon + 1).replace(/\(.*$/, '').trim();
    s = s.slice(0, colon);
  }
  s = s.replace(/\(.*$/, '').replace(/^\/*/, '');
  if (!s || s.includes('$')) return null;
  const base = path.posix.basename(s);
  // Labels that are actual files (.gni, .cml, .py, …) are not packages.
  if (base.includes('.') && base !== 'BUILD.gn') {
    return { buildRel: null, fileRel: norm(s), dir: norm(path.posix.dirname(s)), target: null };
  }
  const buildRel = s.endsWith('BUILD.gn') ? s : `${s}/BUILD.gn`;
  if (!target) target = path.posix.basename(s);
  target = target.split('(')[0];
  return { buildRel: norm(buildRel), fileRel: null, dir: norm(s), target };
}

// --- Pass 1: BUILD.gn stubs from dep/label/source-or-data rows ---
const buildTargets = new Map(); // buildRel -> Set(target names)
const missingNonBuild = new Set();

const rowRe =
  /^\| \d+ \| `(dep|label|source-or-data)` \| `([^`]+)` \| `([^`]+)` \|/gm;
for (const m of fixMd.matchAll(rowRe)) {
  const type = m[1];
  const ref = m[2];
  const deleted = norm(m[3]);

  if (type === 'source-or-data' || deleted.match(/\.(cc|h|py|xml|dict|mojom|grd)/i)) {
    if (!deleted.endsWith('BUILD.gn') && !deleted.endsWith('.gni')) {
      missingNonBuild.add(deleted);
    }
  }

  if (deleted.endsWith('BUILD.gn') || deleted.endsWith('.gn')) {
    if (!buildTargets.has(deleted)) buildTargets.set(deleted, new Set());
    const parsed = parseLabel(ref);
    if (parsed?.target) buildTargets.get(deleted).add(parsed.target);
    buildTargets.get(deleted).add(path.posix.basename(path.posix.dirname(deleted)));
    buildTargets.get(deleted).add('stub');
  } else if (deleted.endsWith('.gni')) {
    missingNonBuild.add(deleted);
  } else {
    const parsed = parseLabel(ref);
    if (parsed?.fileRel) {
      missingNonBuild.add(parsed.fileRel);
    } else if (parsed?.buildRel) {
      if (!buildTargets.has(parsed.buildRel)) buildTargets.set(parsed.buildRel, new Set());
      buildTargets.get(parsed.buildRel).add(parsed.target);
      buildTargets.get(parsed.buildRel).add('stub');
    }
    if (!deleted.endsWith('BUILD.gn')) missingNonBuild.add(deleted);
  }
}

let buildStubsWritten = 0;
let buildStubsUpdated = 0;
for (const [buildRel, groups] of buildTargets) {
  if (!buildRel || keep.has(buildRel)) continue;
  if (buildRel.includes('third_party/libc++')) continue;
  // Skip if label path is actually an extensionless header file on disk.
  const pkgDir = path.join(SRC, path.posix.dirname(buildRel));
  if (fs.existsSync(pkgDir) && fs.statSync(pkgDir).isFile()) continue;
  const abs = path.join(SRC, buildRel);
  const body = stubBodyForBuild([...groups]);
  if (!buildRel.endsWith('BUILD.gn') && !buildRel.endsWith('.gn')) continue;
  if (!fs.existsSync(abs)) {
    if (writeFile(buildRel, body)) buildStubsWritten++;
    continue;
  }
  if (fs.statSync(abs).isDirectory()) continue;
  const cur = fs.readFileSync(abs, 'utf8');
  if (!isStub(cur)) continue; // real package — leave alone
  // Merge group names into stub
  const have = new Set([...cur.matchAll(/group\("([^"]+)"\)/g)].map((x) => x[1]));
  let changed = false;
  for (const g of groups) {
    if (!have.has(g)) {
      have.add(g);
      changed = true;
    }
  }
  if (changed || !cur.includes('Hallulium stub')) {
    if (writeFile(buildRel, stubBodyForBuild([...have]))) buildStubsUpdated++;
  }
}

// --- Pass 2: stub missing delete-candidate paths that kept BUILD files still name ---
function walkBuildFiles(dirAbs, base, out) {
  let entries;
  try {
    entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const name = ent.name;
    if (name === 'out' || name === '.git' || name === 'llvm-build' || name === 'rust-toolchain') {
      continue;
    }
    const abs = path.join(dirAbs, name);
    const rel = norm(path.join(base, name));
    if (ent.isDirectory()) {
      walkBuildFiles(abs, rel, out);
    } else if (ent.isFile() && (name === 'BUILD.gn' || name.endsWith('.gni'))) {
      out.push(rel);
    }
  }
}

const buildFiles = [];
walkBuildFiles(SRC, '', buildFiles);

const missingFromBuild = new Set();
const pathLitRe = /"([^"]+)"/g;

for (const rel of buildFiles) {
  const abs = path.join(SRC, rel);
  let text;
  try {
    text = fs.readFileSync(abs, 'utf8');
  } catch {
    continue;
  }
  if (isStub(text)) continue;

  const buildDir = path.posix.dirname(rel);
  for (const m of text.matchAll(pathLitRe)) {
    const lit = m[1];
    if (!lit || lit.includes('$') || lit.includes('{{')) continue;

    let candidates = [];
    if (lit.startsWith('//')) {
      const p = parseLabel(lit);
      if (p?.buildRel) candidates.push(p.buildRel);
      if (p?.fileRel) candidates.push(p.fileRel);
      if (lit.includes('.gni')) {
        candidates.push(lit.slice(2).split(':')[0]);
      }
      if (lit.endsWith('.gni') || lit.endsWith('.gn')) {
        candidates.push(lit.slice(2).split(':')[0]);
      }
    } else if (
      /\.(cc|cpp|cxx|h|hh|hpp|mm|m|c|mojom|py|json|xml|grd|grdp|icon|png|svg|txt|dict|idl|tmpl)$/i.test(
        lit
      ) ||
      lit.endsWith('.gni')
    ) {
      if (buildDir && buildDir !== '.') candidates.push(norm(path.posix.join(buildDir, lit)));
      candidates.push(norm(lit));
    }

    for (const cand of candidates) {
      if (cand == null) continue;
      const c = norm(cand);
      if (!c || c.includes('..')) continue;
      if (/[*?[\]{}]/.test(c)) continue;
      if (c.includes('third_party/libc++')) continue;
      if (keep.has(c)) continue;
      const cabs = path.join(SRC, c);
      if (fs.existsSync(cabs)) continue;
      // Only create stubs for delete-candidates or obvious import/build paths
      if (
        deleteFiles.has(c) ||
        c.endsWith('BUILD.gn') ||
        c.endsWith('.gni') ||
        c.includes('/ash/') ||
        c.includes('/chromeos/') ||
        c.includes('nearby_sharing') ||
        c.includes('optimization_guide') ||
        c.includes('webnn') ||
        c.includes('openscreen') ||
        c.includes('tflite') ||
        c.includes('litert') ||
        c.includes('xnnpack')
      ) {
        missingFromBuild.add(c);
      }
    }
  }
}

// Also add missingNonBuild from fix list
for (const p of missingNonBuild) missingFromBuild.add(p);

let fileStubs = 0;
let skippedKeep = 0;
for (const rel of [...missingFromBuild].sort()) {
  if (!rel || /[*?[\]{}]/.test(rel)) continue;
  if (keep.has(rel)) {
    skippedKeep++;
    continue;
  }
  const abs = path.join(SRC, rel);
  if (fs.existsSync(abs)) continue;
  let ok = false;
  if (rel.endsWith('BUILD.gn') || (rel.endsWith('.gn') && !rel.endsWith('.gni'))) {
    const groups = buildTargets.get(rel) || new Set([path.posix.basename(path.posix.dirname(rel)), 'stub']);
    ok = writeFile(rel, stubBodyForBuild([...groups]));
  } else {
    ok = writeFile(rel, stubBodyForPath(rel));
  }
  if (ok) fileStubs++;
}

// --- Pass 3: known critical feature gni stubs ---
const criticalGni = [
  ['components/optimization_guide/features.gni', 'declare_args() {\n  enable_ml_internal = false\n}\n'],
  ['components/compose/features.gni', 'declare_args() {}\n'],
  ['services/on_device_model/on_device_model.gni', 'declare_args() {\n  enable_on_device_model = false\n}\n'],
];
let critical = 0;
for (const [rel, body] of criticalGni) {
  const abs = path.join(SRC, rel);
  if (fs.existsSync(abs)) continue;
  writeFile(rel, '# Hallulium stub\n' + body);
  critical++;
}

console.log(
  JSON.stringify(
    {
      buildStubsWritten,
      buildStubsUpdated,
      fileStubsWritten: fileStubs,
      criticalGniWritten: critical,
      skippedKeep,
      missingFromBuildConsidered: missingFromBuild.size,
      buildTargetsTracked: buildTargets.size,
    },
    null,
    2
  )
);
