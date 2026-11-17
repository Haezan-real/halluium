/**
 * Emit "unrelated code purge fixes.md": what must change (or be kept)
 * for Hallulium to still `e build` after deleting scan-unrelated candidates.
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
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_MD = path.join(ROOT, 'purge', 'unrelated code purge fixes.md');

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

  const lines = [];
  lines.push('# Unrelated code purge fixes');
  lines.push('');
  lines.push('What to change in `src/` (or **keep** despite the delete scan) so');
  lines.push('Hallulium still `e build`s after the purge in');
  lines.push('[`unrelated code purge.md`](unrelated%20code%20purge.md).');
  lines.push('');
  lines.push('## Cut-and-fix model');
  lines.push('');
  lines.push('The delete scan is `walk(src) − ninja −t inputs(electron.exe) −');
  lines.push('policy`. That under-lists real compile inputs (especially headers),');
  lines.push('so many “delete candidates” are still required.');
  lines.push('');
  lines.push('| Situation | What to do |');
  lines.push('|---|---|');
  lines.push('| Ninja-needed `.cc` / `.h` `#include`s a delete-candidate file | **Keep** that file (ninja-inputs miss many headers), *or* rewrite/delete the includer |');
  lines.push('| Needed-dir `BUILD.gn` `import()`s a delete-candidate `.gni` | **Keep** the `.gni`, *or* remove/gate the import and stub |');
  lines.push('| Needed-dir target `deps` a package with **zero** needed files | Drop the dep, or stub an empty `BUILD.gn` group |');
  lines.push('| Needed-dir `BUILD.gn` lists delete-candidate relative `sources` | Clear unused sibling targets, or leave empty stub files |');
  lines.push('');
  lines.push('Deleting the ~11 GB does **not** shrink `hallulium.exe` / DLLs.');
  lines.push('These edits only keep `gn gen` / compile green.');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## Stats');
  lines.push('');
  lines.push('| Metric | Count |');
  lines.push('|---|---:|');
  lines.push(`| Delete candidates | ${deleteFiles.size} |`);
  lines.push(`| Keep files (ninja + policy) | ${keepFiles.length} |`);
  lines.push(`| Ninja-needed sources scanned for includes | ${sourcesScanned} |`);
  lines.push(`| Import-keep edges (folded into overrides) | ${importKeepEdges} |`);
  lines.push(`| **Keep-override files** | **${keepOverrides.size}** |`);
  lines.push(`| Build files scanned (needed dirs) | ${buildScanned} |`);
  lines.push(`| **GN edit hits** | **${uniqueGn.length}** |`);
  lines.push(`| Build files with GN edit hits | ${byFile.size} |`);
  lines.push('');
  lines.push('### GN edit hits by type');
  lines.push('');
  lines.push('| Type | Count | Typical fix |');
  lines.push('|---|---:|---|');
  for (const [t, n] of [...byType.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`| \`${t}\` | ${n} | ${fixAdvice(t)} |`);
  }
  lines.push('');

  // ----- Part 1: keep overrides -----
  lines.push('## Part 1 — Keep overrides (subtract from the purge)');
  lines.push('');
  lines.push('Delete-candidate paths still required because a ninja-needed');
  lines.push('source `#include`s them or a needed-dir build file `import()`s');
  lines.push('them. Default action: **do not delete**. Cut-and-fix only if you');
  lines.push('also remove every includer/import.');
  lines.push('');
  lines.push(`Total: **${keepOverrides.size}** files, ` +
    `${[...keepOverrides.values()].reduce((a, s) => a + s.size, 0)} reference edges.`);
  lines.push('');
  lines.push('### By directory prefix');
  lines.push('');
  lines.push('| Prefix | Files to keep | Edges |');
  lines.push('|---|---:|---:|');
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
  for (const [p, o] of [...overrideByPrefix.entries()].sort((a, b) => b[1].headers - a[1].headers)) {
    lines.push(`| \`${p}/\` | ${o.headers} | ${o.edges} |`);
  }
  lines.push('');
  lines.push('### Full keep-override list');
  lines.push('');
  lines.push('Format: `path` ← `referencer` [, more…]');
  lines.push('');
  lines.push('```');
  for (const [hdr, includers] of [...keepOverrides.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    const list = [...includers].sort();
    const shown = list.slice(0, 5).join(', ');
    const more = list.length > 5 ? ` (+${list.length - 5} more)` : '';
    lines.push(`${hdr}  ←  ${shown}${more}`);
  }
  lines.push('```');
  lines.push('');

  // ----- Part 2: GN fixes -----
  lines.push('## Part 2 — GN / build-file edits');
  lines.push('');
  lines.push('References from `BUILD.gn` / `*.gni` / `DEPS` that live in directories');
  lines.push('containing ninja-needed files (ninja `-t inputs` omits most');
  lines.push('`BUILD.gn`, but gn still loads them). These are the import-path /');
  lines.push('dep fixes. A build file that is itself a delete candidate usually');
  lines.push('becomes a **hollow stub** rather than being deleted outright.');
  lines.push('');
  lines.push('### Deleted paths most often named');
  lines.push('');
  lines.push('| Deleted path | Hits | Types | Kept files |');
  lines.push('|---|---:|---|---|');
  for (const [d, info] of gnDeletedRows.slice(0, 200)) {
    const types = [...info.types].sort().join(', ');
    const examples = [...info.files].sort().slice(0, 2).map((f) => `\`${f}\``).join(', ');
    const more = info.files.size > 2 ? ` (+${info.files.size - 2})` : '';
    lines.push(`| \`${d}\` | ${info.count} | ${types} | ${examples}${more} |`);
  }
  if (gnDeletedRows.length > 200) {
    lines.push('');
    lines.push(`*(${gnDeletedRows.length - 200} more deleted paths omitted from this table; see per-file list.)*`);
  }
  lines.push('');
  lines.push('### Relative `sources` / `data` summaries');
  lines.push('');
  lines.push('Kept `BUILD.gn` files that list many delete-candidate relative');
  lines.push('paths (usually unused sibling targets). Fix by clearing those');
  lines.push('targets or stubbing files — not by keeping all sources.');
  lines.push('');
  lines.push('| Kept BUILD file | Relative-source hits |');
  lines.push('|---|---:|');
  for (const [f, hs] of [...relSourceByBuild.entries()].sort((a, b) => b[1].length - a[1].length)) {
    lines.push(`| \`${f}\` | ${hs.length} |`);
  }
  lines.push('');
  lines.push('### Per-file fix list (deps / labels / source-or-data only)');
  lines.push('');
  lines.push('`relative-source` hits are summarized above (too many to list).');
  lines.push('Below: import-path style edits — drop dep/label or stub the');
  lines.push('deleted package.');
  lines.push('');

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
    lines.push(`### \`${file}\`${note}`);
    lines.push('');
    lines.push(`| Line | Type | Reference | Deleted path | Fix |`);
    lines.push(`|---:|---|---|---|---|`);
    for (const h of fileHits) {
      lines.push(
        `| ${h.line} | \`${h.type}\` | \`${h.ref.replace(/\|/g, '\\|')}\` | \`${h.deleted.replace(/\|/g, '\\|')}\` | ${fixAdvice(h.type)} |`,
      );
    }
    lines.push('');
  }

  lines.push('## How to apply');
  lines.push('');
  lines.push('1. Subtract **Part 1** paths from the delete set (or regenerate the');
  lines.push('   scan after marking them kept).');
  lines.push('2. Work **Part 2** in directory batches: stub or drop imports/deps,');
  lines.push('   clear unused `sources`, `e build`, update `REMOVED.md`.');
  lines.push('3. Re-run `node purge/scan-fixes.mjs` after large batches.');
  lines.push('4. False negatives remain: grit/Python `exec_script`, generated');
  lines.push('   copies, and anything not spelled as `//` or a relative source.');
  lines.push('');

  fs.writeFileSync(OUT_MD, lines.join('\n'), 'utf8');
  console.error(`wrote ${OUT_MD} (${fs.statSync(OUT_MD).size} bytes)`);
  console.error(
    `keep-overrides=${keepOverrides.size} gnHits=${uniqueGn.length} buildFiles=${byFile.size}`,
  );
}

main();
