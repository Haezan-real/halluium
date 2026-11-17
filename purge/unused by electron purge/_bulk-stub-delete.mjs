/**
 * Delete a src tree and leave hollow group() BUILD.gn stubs for every
 * path named in the reference-fix doc under that prefix, plus a root stub.
 *
 * Usage: node _bulk-stub-delete.mjs ash chromeos apps rlz
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = process.env.HALLULIUM_SRC || 'C:\\hallulium\\src';
const dir = path.dirname(fileURLToPath(import.meta.url));
const fixMd = fs.readFileSync(path.join(dir, 'unrelated code purge reference fix.md'), 'utf8');

const trees = process.argv.slice(2);
if (!trees.length) {
  console.error('usage: node _bulk-stub-delete.mjs <tree>...');
  process.exit(1);
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

function writeStub(rel, groups) {
  const abs = path.join(SRC, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  const uniq = [...new Set(groups.length ? groups : ['stub'])];
  const body =
    '# Hallulium stub\n' + uniq.map((g) => `group("${g}") {}`).join('\n') + '\n';
  fs.writeFileSync(abs, body);
  console.error('stub', rel, uniq.join(','));
}

for (const tree of trees) {
  const root = path.join(SRC, tree);
  if (!fs.existsSync(root)) {
    console.error('missing', tree);
    continue;
  }
  // Collect BUILD.gn paths under tree from reference fix backticks
  const buildPaths = new Set();
  const re = new RegExp('`(' + tree.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/[^`]+/BUILD\\.gn)`', 'g');
  for (const m of fixMd.matchAll(re)) buildPaths.add(m[1]);
  // Also root
  buildPaths.add(`${tree}/BUILD.gn`);

  console.error(`Deleting ${tree}/ (${buildPaths.size} stub targets)...`);
  rmrf(root);

  for (const rel of [...buildPaths].sort()) {
    // Guess group name from dirname
    const base = path.posix.basename(path.posix.dirname(rel));
    writeStub(rel, [base === tree ? tree : base, 'stub']);
  }
  console.error(`done ${tree}`);
}
