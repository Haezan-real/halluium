import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const src = process.env.HALLULIUM_SRC || 'C:\\hallulium\\src';
const fix = fs.readFileSync(path.join(dir, 'unrelated code purge reference fix.md'), 'utf8');

// Per-file rows only (dep/label/source-or-data)
const re =
  /^\| (\d+) \| `(dep|label|source-or-data)` \| `([^`]+)` \| `([^`]+)` \|/gm;

let total = 0;
const byType = {};
let deletedPathStubbed = 0;
let deletedPathMissing = 0;
let deletedPathStillReal = 0;
const stillRealSamples = [];
const missingSamples = [];

for (const m of fix.matchAll(re)) {
  total++;
  const type = m[2];
  const deletedPath = m[4].replace(/\\/g, '/');
  byType[type] = (byType[type] || 0) + 1;

  const abs = path.join(src, deletedPath);
  if (!fs.existsSync(abs)) {
    deletedPathMissing++;
    if (missingSamples.length < 10) missingSamples.push(deletedPath);
    continue;
  }
  let body = '';
  try {
    body = fs.readFileSync(abs, 'utf8');
  } catch {
    deletedPathStillReal++;
    continue;
  }
  if (body.includes('Hallulium stub') || /^\s*group\("/m.test(body)) {
    deletedPathStubbed++;
  } else {
    deletedPathStillReal++;
    if (stillRealSamples.length < 15) stillRealSamples.push(`${type} ${deletedPath}`);
  }
}

// relative-source section: count summary lines only
const relSection = fix.includes('## Relative');
const relHits = 75949; // from stats table in the doc

console.log(
  JSON.stringify(
    {
      perFileFixRows: total,
      byType,
      deletedPathStubbed,
      deletedPathMissingNoFile: deletedPathMissing,
      deletedPathStillRealContent: deletedPathStillReal,
      relativeSourceHitsInDoc: relHits,
      note:
        'Stub strategy covers deleted BUILD.gn targets. relative-source edits in kept BUILD.gn files were NOT batch-applied. Phase-13 selective deletes left BUILD.gn listing removed sources.',
      stillRealSamples,
      missingSamples,
    },
    null,
    2
  )
);
