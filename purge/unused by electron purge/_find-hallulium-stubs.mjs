/**
 * Read-only: list Hallulium stub / ghost files under the engine src tree.
 * Safe to run while ninja is compiling (does not modify anything).
 *
 *   node "_find-hallulium-stubs.mjs" [srcRoot]
 *   node "_find-hallulium-stubs.mjs" --json
 */
import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const json = args.includes("--json");
const srcRoot = path.resolve(
  args.find((a) => !a.startsWith("-")) || "C:/hallulium/src"
);

const SKIP = new Set(["out", ".git", "node_modules", "android"]);
const stubs = [];

function isStubText(t) {
  return (
    t.includes("Hallulium stub") ||
    t.trim() === "<!-- Hallulium stub -->" ||
    /^#pragma once\s*\/\/ Hallulium stub\s*$/m.test(t.trim()) ||
    /^\/\/ Hallulium stub\s*$/m.test(t.trim()) ||
    /^# Hallulium stub\s*$/m.test(t.trim())
  );
}

function walk(dir) {
  let ents;
  try {
    ents = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP.has(e.name)) continue;
      walk(p);
      continue;
    }
    if (e.size > 64 * 1024) continue;
    let t;
    try {
      t = fs.readFileSync(p, "utf8");
    } catch {
      continue;
    }
    if (!isStubText(t) && !(e.size < 120 && /_export\.h$/i.test(e.name))) continue;
    const rel = path.relative(srcRoot, p).replace(/\\/g, "/");
    const nested =
      /\/content\/.*\/content\//.test(rel) ||
      /\/([A-Za-z0-9_.-]+)\/.*\/\1\//.test(rel);
    stubs.push({
      rel,
      bytes: e.size,
      nested,
      kind: path.extname(e.name).slice(1) || "none",
    });
  }
}

walk(srcRoot);
stubs.sort((a, b) => a.rel.localeCompare(b.rel));

if (json) {
  console.log(JSON.stringify({ srcRoot, count: stubs.length, stubs }, null, 2));
} else {
  console.log(`srcRoot=${srcRoot}`);
  console.log(`stub_count=${stubs.length}`);
  console.log(`nested_shadow_count=${stubs.filter((s) => s.nested).length}`);
  for (const s of stubs.slice(0, 200)) {
    console.log(`${s.nested ? "NESTED" : "stub  "} ${s.bytes}\t${s.rel}`);
  }
  if (stubs.length > 200) console.log(`... and ${stubs.length - 200} more`);
}
