/**
 * Emit two markdowns for the unrelated-code purge:
 * - "unrelated code purge keep overrides.md" — subtract from delete set
 * - "unrelated code purge reference fix.md" — GN dep/source/label edits
 *
 * Philosophy (cut-and-fix):
 * - If a ninja-needed source #includes a "delete candidate", that header is
 *   almost certainly a ninja-inputs false negative → KEEP it, or delete the
 *   includer code. Listed as keep-overrides, not mass include surgery.
 * - Real edit work is kept BUILD.gn / .gni / DEPS that import, dep, or list
 *   paths in the delete set.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = process.env.HALLULIUM_SRC || 'C:\\hallulium\\src';
const OUT = path.join(SRC, 'out', 'Release');
const NINJA = path.join(SRC, 'third_party', 'ninja', 'ninja.exe');
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT_KEEP = path.join(ROOT, 'purge', 'unused by electron purge', 'unrelated code purge keep overrides.md');
const OUT_FIX = path.join(ROOT, 'purge', 'unused by electron purge', 'unrelated code purge reference fix.md');
const OUT_OLD = path.join(ROOT, 'purge', 'unused by electron purge', 'unrelated code purge fixes.md');

const KEEP_PATH_RE =
  /(^|\/|\\)(mac|macos|darwin|cocoa|appkit|metal|ios(?!_internal)|rust-toolchain|llvm-build|depot_tools|siso|buildtools)(\/|\\|$)/i;

const BUILD_NAME_RE = /(^|\/)(BUILD\.gn|[^/]+\.gni|DEPS)$/i;
const SOURCE_EXT_RE = /\.(cc|cpp|cxx|h|hh|hpp|mm|m|c)$/i;

function norm(p) {
  return p.replace(/\\/g, '/').replace(/^\.\.\//, '').replace(/^\.\//, '');
}

function toSrcRel(absOrRel) {
  let p = norm(absOrRel);
  const srcNorm = norm(SRC) + '/';
  if (p.toLowerCase().startsWith(srcNorm.toLowerCase())) p = p.slice(srcNorm.length);
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
    if (ent.isDirectory()) walkFiles(abs, rel, out);
    else if (ent.isFile() || ent.isSymbolicLink()) out.push(rel);
  }
}

function parentsOf(rel) {
  const parts = rel.split('/');
  const out = [];
  for (let i = 1; i < parts.length; i++) out.push(parts.slice(0, i).join('/'));
  return out;
}

function labelToPath(label) {
  let s = label.trim();
  if (s.startsWith('"') || s.startsWith("'")) s = s.slice(1, -1);
  if (!s.startsWith('//')) return null;
  s = s.slice(2);
  const colon = s.indexOf(':');
  if (colon >= 0) s = s.slice(0, colon);
  const paren = s.indexOf('(');
  if (paren >= 0) s = s.slice(0, paren);
  s = s.replace(/^\/*/, '');
  if (!s || s.includes('$')) return null;
  return s;
}

function fixAdvice(type) {
  switch (type) {
    case 'import':
      return 'Remove/gate the `import()`, or leave a stub `.gni` at the deleted path.';
    case 'dep':
      return 'Drop the dep, or stub an empty `BUILD.gn` target with the same label.';
    case 'source-or-data':
      return 'Remove the entry, or leave an empty stub file at that path.';
    case 'relative-source':
      return 'Remove from `sources`/`data`/`inputs` (unused sibling target), or stub the file.';
    case 'label':
      return 'Remove, stub, or narrow the condition so the electron graph ignores it.';
    default:
      return 'Fix or stub so the electron Release graph no longer needs the path.';
  }
}

function classifyField(window, line) {
  if (
    /\b(public_deps|deps|data_deps|public_configs|configs)\s*=/.test(window) ||
    /^\s*(public_deps|deps|data_deps)\s*=/.test(line)
  ) {
    return 'dep';
  }
  if (
    /\b(sources|public|inputs|data|outputs)\s*=/.test(window) ||
    /^\s*(sources|public|inputs|data)\s*=/.test(line)
  ) {
    return 'source-or-data';
  }
  return 'label';
}

function dirOfPath(p) {
  const d = path.posix.dirname(p);
  return d === '.' ? '' : d;
}

/** True if this package dir still has ninja-needed files (BUILD.gn must stay). */
function packageNeeded(labelPath, neededDirs) {
  return neededDirs.has(labelPath) || neededDirs.has(dirOfPath(labelPath));
}

function scanBuildText(rel, text, deleteFiles, neededDirs, hits) {
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const ln = i + 1;
    const window = lines.slice(Math.max(0, i - 8), i + 1).join('\n');

    for (const m of line.matchAll(/import\s*\(\s*"(\/\/[^"]+)"\s*\)/g)) {
      const p = labelToPath(m[1]);
      if (!p) continue;
      if (!deleteFiles.has(p)) continue;
      // Imported delete-candidate → keep-override (recorded by caller via
      // type import-keep), not a line-edit unless you also drop the import.
      hits.push({
        file: rel,
        line: ln,
        type: 'import-keep',
        ref: m[1],
        deleted: p,
      });
    }

    for (const m of line.matchAll(/"(\/\/[^"$]+)"/g)) {
      const raw = m[1];
      if (/import\s*\(/.test(line) && line.includes(raw)) continue;
      const p = labelToPath(raw);
      if (!p || p.length < 2) continue;
      // Flag deps/labels only when the target package has zero needed files
      // (whole tree is on the purge list). Packages with needed files keep
      // their BUILD.gn even if ninja omitted it from inputs.
      if (packageNeeded(p, neededDirs)) continue;
      if (!deleteFiles.has(`${p}/BUILD.gn`) && !deleteFiles.has(p)) continue;
      const type = classifyField(window, line);
      hits.push({
        file: rel,
        line: ln,
        type,
        ref: raw,
        deleted: deleteFiles.has(p) ? p : `${p}/BUILD.gn`,
      });
    }

    for (const m of line.matchAll(
      /"([^"$]+\.(?:cc|cpp|h|hpp|mm|m|c|java|py|json|grd|grdp|mojom|js|ts|txt|pak|icon|png|html|css|xml|gn|gni))"/gi,
    )) {
      const raw = m[1];
      if (raw.startsWith('//') || raw.includes('$') || raw.includes('{{')) continue;
      const dir = path.posix.dirname(rel);
      const resolved = norm(path.posix.join(dir === '.' ? '' : dir, raw));
      if (!deleteFiles.has(resolved)) continue;
      hits.push({
        file: rel,
        line: ln,
        type: 'relative-source',
        ref: raw,
        deleted: resolved,
      });
    }
  }
}

function resolveInclude(fromFile, inc, deleteFiles) {
  const cands = [norm(inc)];
  const dir = path.posix.dirname(fromFile);
  cands.push(norm(path.posix.join(dir === '.' ? '' : dir, inc)));
  for (const c of cands) {
    if (deleteFiles.has(c)) return c;
  }
  return null;
}

function main() {
  const needed = collectNinjaInputs();
  console.error('walking src/ ...');
  const all = [];
  walkFiles(SRC, '', all);
  console.error(`src files (excl out): ${all.length}`);

  const deleteFiles = new Set();
  const keepFiles = [];
  for (const rel of all) {
    if (needed.has(rel) || KEEP_PATH_RE.test(rel)) {
      keepFiles.push(rel);
      continue;
    }
    deleteFiles.add(rel);
  }
  console.error(`delete: ${deleteFiles.size}; keep: ${keepFiles.length}`);

  // --- Include edges: needed source → delete-candidate header = keep override ---
  const keepOverrides = new Map(); // deletedHeader -> Set(includers)
  let sourcesScanned = 0;
  for (const rel of keepFiles) {
    if (!needed.has(rel) || !SOURCE_EXT_RE.test(rel)) continue;
    const abs = path.join(SRC, rel);
    let text;
    try {
      if (fs.statSync(abs).size > 2_000_000) continue;
      text = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    sourcesScanned++;
    for (const line of text.split(/\r?\n/)) {
      const m = line.match(/^\s*#\s*include\s*[<"]([^">]+)[">]/);
      if (!m) continue;
      const hit = resolveInclude(rel, m[1], deleteFiles);
      if (!hit) continue;
      if (!keepOverrides.has(hit)) keepOverrides.set(hit, new Set());
      keepOverrides.get(hit).add(rel);
    }
  }
  console.error(`include keep-overrides: ${keepOverrides.size} headers (from ${sourcesScanned} sources)`);

  // --- GN hits: build files in dirs that contain ninja-needed files ---
  // ninja -t inputs lists almost no BUILD.gn; gn still loads the BUILD.gn
  // next to compiled sources. Treat those as kept for fix scanning.
  const neededDirs = new Set();
  for (const rel of needed) {
    for (const p of parentsOf(rel)) neededDirs.add(p);
    neededDirs.add(''); // root
  }
  const buildScanList = [];
  for (const rel of all) {
    if (!BUILD_NAME_RE.test(rel)) continue;
    if (needed.has(rel) || KEEP_PATH_RE.test(rel)) {
      buildScanList.push(rel);
      continue;
    }
    const dir = path.posix.dirname(rel);
    const dirKey = dir === '.' ? '' : dir;
    if (neededDirs.has(dirKey)) buildScanList.push(rel);
  }
  console.error(`build files in needed dirs: ${buildScanList.length}`);

  const gnHits = [];
  let buildScanned = 0;
  for (const rel of buildScanList) {
    const abs = path.join(SRC, rel);
    let text;
    try {
      if (fs.statSync(abs).size > 5_000_000) continue;
      text = fs.readFileSync(abs, 'utf8');
    } catch {
      continue;
    }
    buildScanned++;
    scanBuildText(rel, text, deleteFiles, neededDirs, gnHits);
  }
  console.error(`build files scanned: ${buildScanned}; gn hits: ${gnHits.length}`);

  // Fold import-keep into keepOverrides
  let importKeepEdges = 0;
  for (const h of gnHits) {
    if (h.type !== 'import-keep') continue;
    importKeepEdges++;
    if (!keepOverrides.has(h.deleted)) keepOverrides.set(h.deleted, new Set());
    keepOverrides.get(h.deleted).add(h.file);
  }
  console.error(`import-keep edges folded into overrides: ${importKeepEdges}`);

  const seen = new Set();
  const uniqueGn = [];
  for (const h of gnHits) {
    if (h.type === 'import-keep') continue;
    const k = `${h.file}|${h.line}|${h.type}|${h.ref}`;
    if (seen.has(k)) continue;
    seen.add(k);
    uniqueGn.push(h);
  }
  uniqueGn.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);

  const byFile = new Map();
  for (const h of uniqueGn) {
    if (!byFile.has(h.file)) byFile.set(h.file, []);
    byFile.get(h.file).push(h);
  }

  const byType = new Map();
  for (const h of uniqueGn) byType.set(h.type, (byType.get(h.type) || 0) + 1);

  // Summarize relative-source per BUILD.gn (often hundreds of unused siblings)
  const relSourceByBuild = new Map();
  for (const h of uniqueGn) {
    if (h.type !== 'relative-source') continue;
    if (!relSourceByBuild.has(h.file)) relSourceByBuild.set(h.file, []);
    relSourceByBuild.get(h.file).push(h);
  }

  // Keep-override dirs summary
  const overrideByPrefix = new Map();
  for (const [hdr, includers] of keepOverrides) {
    const parts = hdr.split('/');
    const top = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
    if (!overrideByPrefix.has(top)) overrideByPrefix.set(top, { headers: 0, edges: 0 });
    const o = overrideByPrefix.get(top);
    o.headers++;
    o.edges += includers.size;
  }
  const overridePrefixRows = [...overrideByPrefix.entries()].sort(
    (a, b) => b[1].headers - a[1].headers,
  );

  // GN deleted targets summary
  const gnDeleted = new Map();
  for (const h of uniqueGn) {
    if (!gnDeleted.has(h.deleted)) {
      gnDeleted.set(h.deleted, { count: 0, types: new Set(), files: new Set() });
    }
    const g = gnDeleted.get(h.deleted);
    g.count++;
    g.types.add(h.type);
    g.files.add(h.file);
  }
  const gnDeletedRows = [...gnDeleted.entries()].sort((a, b) => b[1].count - a[1].count);

  const generated = new Date().toISOString();
  const edgeTotal = [...keepOverrides.values()].reduce((a, s) => a + s.size, 0);

  // recompute prefixes after import-keep fold
  overrideByPrefix.clear();
  for (const [hdr, includers] of keepOverrides) {
    const parts = hdr.split('/');
    const top = parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
    if (!overrideByPrefix.has(top)) overrideByPrefix.set(top, { headers: 0, edges: 0 });
    const o = overrideByPrefix.get(top);
    o.headers++;
    o.edges += includers.size;
  }

  // ----- keep overrides file -----
  const keepLines = [];
  keepLines.push('# Unrelated code purge keep overrides');
  keepLines.push('');
  keepLines.push('Delete-candidate paths that must **stay on disk** so Hallulium');
  keepLines.push('still `e build`s after the purge in');
  keepLines.push('[`unrelated code purge.md`](unrelated%20code%20purge.md).');
  keepLines.push('');
  keepLines.push('These are files the delete scan marked unused, but a ninja-needed');
  keepLines.push('source still `#include`s them or a needed-dir build file still');
  keepLines.push('`import()`s them (`ninja -t inputs` misses many headers / `.gni`).');
  keepLines.push('');
  keepLines.push('Default action: **subtract from the purge**. Only delete one if');
  keepLines.push('you also remove every referencer (cut-and-fix).');
  keepLines.push('');
  keepLines.push('Companion: [`unrelated code purge reference fix.md`](unrelated%20code%20purge%20reference%20fix.md)');
  keepLines.push('(GN dep/source/label edits for trees you do remove).');
  keepLines.push('');
  keepLines.push(`Generated: ${generated}`);
  keepLines.push('');
  keepLines.push('## Stats');
  keepLines.push('');
  keepLines.push('| Metric | Count |');
  keepLines.push('|---|---:|');
  keepLines.push(`| Delete candidates | ${deleteFiles.size} |`);
  keepLines.push(`| Keep files (ninja + policy) | ${keepFiles.length} |`);
  keepLines.push(`| Ninja-needed sources scanned for includes | ${sourcesScanned} |`);
  keepLines.push(`| Import-keep edges | ${importKeepEdges} |`);
  keepLines.push(`| **Keep-override files** | **${keepOverrides.size}** |`);
  keepLines.push(`| Reference edges | ${edgeTotal} |`);
  keepLines.push('');
  keepLines.push('An **edge** is one `#include` or `import()` from a kept file to');
  keepLines.push('a keep-override path.');
  keepLines.push('');
  keepLines.push('## By directory prefix');
  keepLines.push('');
  keepLines.push('| Prefix | Files to keep | Edges |');
  keepLines.push('|---|---:|---:|');
  for (const [p, o] of [...overrideByPrefix.entries()].sort((a, b) => b[1].headers - a[1].headers)) {
    keepLines.push(`| \`${p}/\` | ${o.headers} | ${o.edges} |`);
  }
  keepLines.push('');
  keepLines.push('## Full keep-override list');
  keepLines.push('');
  keepLines.push('Format: `path` ← `referencer` [, more…]');
  keepLines.push('');
  keepLines.push('```');
  for (const [hdr, includers] of [...keepOverrides.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const list = [...includers].sort();
    const shown = list.slice(0, 5).join(', ');
    const more = list.length > 5 ? ` (+${list.length - 5} more)` : '';
    keepLines.push(`${hdr}  ←  ${shown}${more}`);
  }
  keepLines.push('```');
  keepLines.push('');

  // ----- reference fix file -----
  const fixLines = [];
  fixLines.push('# Unrelated code purge reference fix');
  fixLines.push('');
  fixLines.push('GN / build-file edits so Hallulium still `e build`s after deleting');
  fixLines.push('candidates in [`unrelated code purge.md`](unrelated%20code%20purge.md)');
  fixLines.push('(minus [`keep overrides`](unrelated%20code%20purge%20keep%20overrides.md)).');
  fixLines.push('');
  fixLines.push('References from `BUILD.gn` / `*.gni` / `DEPS` in directories that');
  fixLines.push('contain ninja-needed files, pointing at packages with **zero**');
  fixLines.push('needed files or at delete-candidate relative sources.');
  fixLines.push('');
  fixLines.push('| Situation | What to do |');
  fixLines.push('|---|---|');
  fixLines.push('| Target `deps` a package with zero needed files | Drop the dep, or stub an empty `BUILD.gn` group |');
  fixLines.push('| `BUILD.gn` lists delete-candidate relative `sources` | Clear unused sibling targets, or leave empty stub files |');
  fixLines.push('| `//` label / `data` names a purged path | Remove, stub, or narrow the condition |');
  fixLines.push('');
  fixLines.push('Deleting unused src does **not** shrink `hallulium.exe` / DLLs.');
  fixLines.push('These edits only keep `gn gen` / compile green.');
  fixLines.push('');
  fixLines.push(`Generated: ${generated}`);
  fixLines.push('');
  fixLines.push('## Stats');
  fixLines.push('');
  fixLines.push('| Metric | Count |');
  fixLines.push('|---|---:|');
  fixLines.push(`| Delete candidates | ${deleteFiles.size} |`);
  fixLines.push(`| Build files scanned (needed dirs) | ${buildScanned} |`);
  fixLines.push(`| **GN edit hits** | **${uniqueGn.length}** |`);
  fixLines.push(`| Build files with GN edit hits | ${byFile.size} |`);
  fixLines.push('');
  fixLines.push('### Hits by type');
  fixLines.push('');
  fixLines.push('| Type | Count | Typical fix |');
  fixLines.push('|---|---:|---|');
  for (const [t, n] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
    fixLines.push(`| \`${t}\` | ${n} | ${fixAdvice(t)} |`);
  }
  fixLines.push('');
  fixLines.push('## Deleted paths most often named');
  fixLines.push('');
  fixLines.push('| Deleted path | Hits | Types | Kept files |');
  fixLines.push('|---|---:|---|---|');
  for (const [d, info] of gnDeletedRows.slice(0, 200)) {
    const types = [...info.types].sort().join(', ');
    const examples = [...info.files].sort().slice(0, 2).map((f) => `\`${f}\``).join(', ');
    const more = info.files.size > 2 ? ` (+${info.files.size - 2})` : '';
    fixLines.push(`| \`${d}\` | ${info.count} | ${types} | ${examples}${more} |`);
  }
  if (gnDeletedRows.length > 200) {
    fixLines.push('');
    fixLines.push(`*(${gnDeletedRows.length - 200} more deleted paths omitted from this table; see per-file list.)*`);
  }
  fixLines.push('');
  fixLines.push('## Relative `sources` / `data` summaries');
  fixLines.push('');
  fixLines.push('Build files that list many delete-candidate relative paths');
  fixLines.push('(usually unused sibling targets). Fix by clearing those targets');
  fixLines.push('or stubbing files — not by keeping all sources.');
  fixLines.push('');
  fixLines.push('| BUILD file | Relative-source hits |');
  fixLines.push('|---|---:|');
  for (const [f, hs] of [...relSourceByBuild.entries()].sort((a, b) => b[1].length - a[1].length)) {
    fixLines.push(`| \`${f}\` | ${hs.length} |`);
  }
  fixLines.push('');
  fixLines.push('## Per-file fix list (deps / labels / source-or-data only)');
  fixLines.push('');
  fixLines.push('`relative-source` hits are summarized above. Below: drop');
  fixLines.push('dep/label or stub the deleted package.');
  fixLines.push('');

  const editByFile = new Map();
  for (const h of uniqueGn) {
    if (h.type === 'relative-source') continue;
    if (!editByFile.has(h.file)) editByFile.set(h.file, []);
    editByFile.get(h.file).push(h);
  }
  for (const [file, fileHits] of [...editByFile.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const note = deleteFiles.has(file)
      ? ' *(omitted from ninja inputs — keep this build file and edit)*'
      : '';
    fixLines.push(`### \`${file}\`${note}`);
    fixLines.push('');
    fixLines.push(`| Line | Type | Reference | Deleted path | Fix |`);
    fixLines.push(`|---:|---|---|---|---|`);
    for (const h of fileHits) {
      fixLines.push(
        `| ${h.line} | \`${h.type}\` | \`${h.ref.replace(/\|/g, '\\|')}\` | \`${h.deleted.replace(/\|/g, '\\|')}\` | ${fixAdvice(h.type)} |`,
      );
    }
    fixLines.push('');
  }

  fixLines.push('## How to apply');
  fixLines.push('');
  fixLines.push('1. Subtract keep-overrides from the delete set.');
  fixLines.push('2. Work this file in directory batches: stub or drop deps,');
  fixLines.push('   clear unused `sources`, `e build`, update `REMOVED.md`.');
  fixLines.push('3. Re-run `node purge/scan-fixes.mjs` after large batches.');
  fixLines.push('4. False negatives remain: grit/Python `exec_script`, generated');
  fixLines.push('   copies, and anything not spelled as `//` or a relative source.');
  fixLines.push('');

  fs.writeFileSync(OUT_KEEP, keepLines.join('\n'), 'utf8');
  fs.writeFileSync(OUT_FIX, fixLines.join('\n'), 'utf8');
  if (fs.existsSync(OUT_OLD)) fs.unlinkSync(OUT_OLD);
  console.error(`wrote ${OUT_KEEP} (${fs.statSync(OUT_KEEP).size} bytes)`);
  console.error(`wrote ${OUT_FIX} (${fs.statSync(OUT_FIX).size} bytes)`);
  console.error(
    `keep-overrides=${keepOverrides.size} gnHits=${uniqueGn.length} buildFiles=${byFile.size}`,
  );
}

main();
