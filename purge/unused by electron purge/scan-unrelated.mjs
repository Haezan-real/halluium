/**
 * Scan hallulium src/ (excluding out/) for files not inputs of the electron
 * Release target. Emits markdown for "unrelated code purge".
 *
 * Keep overrides (Hallu plan): macOS/Darwin/Cocoa trees; build toolchains.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = process.env.HALLULIUM_SRC || 'C:\\hallulium\\src';
const OUT = path.join(SRC, 'out', 'Release');
const NINJA = path.join(SRC, 'third_party', 'ninja', 'ninja.exe');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_MD = path.join(ROOT, 'purge', 'unused by electron purge', 'unrelated code purge.md');

const KEEP_PATH_RE =
  /(^|\/|\\)(mac|macos|darwin|cocoa|appkit|metal|ios(?!_internal)|rust-toolchain|llvm-build|depot_tools|siso|buildtools)(\/|\\|$)/i;

function norm(p) {
  return p.replace(/\\/g, '/').replace(/^\.\.\//, '').replace(/^\.\//, '');
}

function toSrcRel(absOrRel) {
  let p = norm(absOrRel);
  const srcNorm = norm(SRC) + '/';
  if (p.toLowerCase().startsWith(srcNorm.toLowerCase())) {
    p = p.slice(srcNorm.length);
  }
  // ninja often emits ../../foo from out/Release
  while (p.startsWith('../')) p = p.slice(3);
  if (p.startsWith('out/')) return null;
  return p;
}

function collectNinjaInputs() {
  const needed = new Set();
  if (!fs.existsSync(NINJA) || !fs.existsSync(OUT)) {
    console.error('missing ninja or out/Release');
    return needed;
  }
  // Prefer electron.exe; also electron target name
  for (const target of ['electron.exe', 'electron']) {
    console.error(`ninja -t inputs ${target} ...`);
    const r = spawnSync(NINJA, ['-t', 'inputs', target], {
      cwd: OUT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 512,
    });
    if (r.status !== 0) {
      console.error(`inputs ${target} failed:`, (r.stderr || r.stdout || '').slice(0, 500));
      continue;
    }
    for (const line of (r.stdout || '').split(/\r?\n/)) {
      const t = line.trim();
      if (!t) continue;
      const rel = toSrcRel(t);
      if (rel) needed.add(rel);
    }
    if (needed.size) break;
  }
  console.error(`ninja inputs: ${needed.size}`);
  return needed;
}

function walkFiles(dir, base, out) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const name = ent.name;
    if (name === 'out' || name === '.git') continue;
    const abs = path.join(dir, name);
    const rel = norm(path.join(base, name));
    if (ent.isDirectory()) {
      walkFiles(abs, rel, out);
    } else if (ent.isFile() || ent.isSymbolicLink()) {
      out.push(rel);
    }
  }
}

function main() {
  const needed = collectNinjaInputs();
  console.error('walking src/ ...');
  const all = [];
  walkFiles(SRC, '', all);
  console.error(`src files (excl out): ${all.length}`);

  const deleteList = [];
  const keepBecauseNeeded = [];
  const keepBecausePolicy = [];

  for (const rel of all) {
    if (needed.has(rel)) {
      keepBecauseNeeded.push(rel);
      continue;
    }
    // Also keep if any path prefix is a needed directory? No — file-level.
    if (KEEP_PATH_RE.test(rel)) {
      keepBecausePolicy.push(rel);
      continue;
    }
    deleteList.push(rel);
  }

  deleteList.sort((a, b) => a.localeCompare(b));
  keepBecausePolicy.sort((a, b) => a.localeCompare(b));

  const byTop = new Map();
  for (const rel of deleteList) {
    const top = rel.split('/')[0] || rel;
    byTop.set(top, (byTop.get(top) || 0) + 1);
  }
  const topRows = [...byTop.entries()].sort((a, b) => b[1] - a[1]);

  const lines = [];
  lines.push('# Unrelated code purge');
  lines.push('');
  lines.push('Generated scan of `C:\\hallulium\\src` (**excluding `out/`**) for files');
  lines.push('that are **not** ninja inputs of the Release `electron` / `electron.exe`');
  lines.push('target (hallulium host binary before rename).');
  lines.push('');
  lines.push('## Method');
  lines.push('');
  lines.push('1. `ninja -C out/Release -t inputs electron.exe` (fallback: `electron`)');
  lines.push('2. Walk every file under `src/` except `out/` and `.git`');
  lines.push('3. Delete candidates = walk − ninja inputs − policy keeps');
  lines.push('');
  lines.push('## Policy keeps (not listed for deletion)');
  lines.push('');
  lines.push('- **macOS / Darwin / Cocoa** (and related path segments) — Hallulium may ship on Mac');
  lines.push('- **Build toolchains:** `rust-toolchain`, `llvm-build`, `depot_tools`, `siso`, `buildtools`');
  lines.push('');
  lines.push('## Stats');
  lines.push('');
  lines.push(`| Metric | Count |`);
  lines.push(`|---|---:|`);
  lines.push(`| Files under src/ (excl out) | ${all.length} |`);
  lines.push(`| Ninja inputs (electron) | ${needed.size} |`);
  lines.push(`| Policy keeps (mac/toolchain paths) | ${keepBecausePolicy.length} |`);
  lines.push(`| **Delete candidates** | **${deleteList.length}** |`);
  lines.push('');
  lines.push('## Delete candidates by top-level directory');
  lines.push('');
  lines.push('| Directory | Files to delete |');
  lines.push('|---|---:|');
  for (const [dir, n] of topRows) {
    lines.push(`| \`${dir}/\` | ${n} |`);
  }
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  lines.push('- This is a **scan artifact**, not a proof that deleting everything here');
  lines.push('  still `e build`s. Use fix-then-delete in batches; some files are only');
  lines.push('  needed for `gn gen` / sibling targets in the same `BUILD.gn`.');
  lines.push('- Already-purged paths (see `REMOVED.md`) may be absent and will not appear.');
  lines.push('- Phase 11 (catapult / hunspell_dictionaries) may be partially stubbed on disk.');
  lines.push(`- Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Full delete list');
  lines.push('');
  lines.push('Paths are relative to `src/`.');
  lines.push('');
  lines.push('```');
  for (const rel of deleteList) {
    lines.push(rel);
  }
  lines.push('```');
  lines.push('');

  fs.writeFileSync(OUT_MD, lines.join('\n'), 'utf8');
  console.error(`wrote ${OUT_MD}`);
  console.error(`delete candidates: ${deleteList.length}`);
}

main();
