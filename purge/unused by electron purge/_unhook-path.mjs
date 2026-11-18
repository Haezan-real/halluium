/**
 * Stop the build asking for a deleted source by removing it from BUILD.gn
 * `sources` / `public` / `inputs` lists (unhook), instead of planting a stub.
 *
 * Default is dry-run. Do NOT --apply while ninja is mid-compile on this tree
 * unless you accept the current build may fail / regen.
 *
 *   node "_unhook-path.mjs" path/relative/to/src/foo.cc
 *   node "_unhook-path.mjs" path/to/foo.cc --apply
 *   node "_unhook-path.mjs" --from-log %TEMP%/hallulium_e_build.log
 */
import fs from "fs";
import path from "path";

const SRC = path.resolve(
  process.env.HALLULIUM_SRC || "C:/hallulium/src"
);
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const fromLog = args.includes("--from-log");
const logIdx = args.indexOf("--from-log");
const targets = [];

function collectFromLog(logPath) {
  const t = fs.readFileSync(logPath, "utf8");
  const miss = [
    ...t.matchAll(/ninja: error: '((?:\.\.\/)*[^']+)', needed by/g),
  ];
  const fatal = [...t.matchAll(/fatal error: '([^']+)' file not found/g)];
  for (const m of miss) {
    let p = m[1].replace(/\\/g, "/");
    if (p.startsWith("../../")) p = p.slice(6);
    targets.push(p);
  }
  for (const m of fatal) targets.push(m[1].replace(/\\/g, "/"));
}

if (fromLog) {
  const logPath = args[logIdx + 1];
  if (!logPath) {
    console.error("usage: --from-log <file>");
    process.exit(2);
  }
  collectFromLog(logPath);
} else {
  for (const a of args) {
    if (a.startsWith("-")) continue;
    targets.push(a.replace(/\\/g, "/"));
  }
}

if (!targets.length) {
  console.error(
    "usage: node _unhook-path.mjs <rel-path> [--apply]\n" +
      "       node _unhook-path.mjs --from-log <build.log> [--apply]"
  );
  process.exit(2);
}

const uniq = [...new Set(targets)];
const edits = [];

function walkBuildGn(dir, out) {
  let ents;
  try {
    ents = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of ents) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (["out", ".git", "node_modules"].includes(e.name)) continue;
      walkBuildGn(p, out);
    } else if (e.name === "BUILD.gn" || e.name.endsWith(".gni")) {
      out.push(p);
    }
  }
}

const buildFiles = [];
walkBuildGn(SRC, buildFiles);

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

for (const rel of uniq) {
  const base = path.basename(rel);
  const hitFiles = [];
  for (const bf of buildFiles) {
    let text;
    try {
      text = fs.readFileSync(bf, "utf8");
    } catch {
      continue;
    }
    if (!text.includes(base) && !text.includes(rel)) continue;
    // Only touch lines that look like list entries naming this path
    const lines = text.split(/\r?\n/);
    let changed = false;
    const next = [];
    for (const line of lines) {
      const trim = line.trim();
      const isEntry =
        /^["']/.test(trim) &&
        (trim.includes(`"${rel}"`) ||
          trim.includes(`'${rel}'`) ||
          trim.includes(`"${base}"`) ||
          trim.includes(`'${base}'`) ||
          new RegExp(`["'].*${escapeRe(rel)}["']`).test(trim));
      // Prefer full rel match; basename-only only if path segment matches
      const full =
        trim.includes(`"${rel}"`) ||
        trim.includes(`'${rel}'`) ||
        trim.includes(`/${rel}"`) ||
        trim.includes(`/${rel}'`);
      const baseOnly =
        !full &&
        (new RegExp(`["'](\\.\\./)*${escapeRe(base)}["']`).test(trim) ||
          new RegExp(`["'][^"']*/${escapeRe(base)}["']`).test(trim));
      if (full || (baseOnly && text.includes(rel))) {
        changed = true;
        continue; // drop line = unhook
      }
      next.push(line);
    }
    if (!changed) continue;
    const relBf = path.relative(SRC, bf).replace(/\\/g, "/");
    hitFiles.push(relBf);
    if (apply) {
      fs.writeFileSync(bf, next.join("\n"));
    }
  }
  edits.push({ rel, buildFiles: hitFiles, applied: apply && hitFiles.length > 0 });
}

console.log(
  JSON.stringify(
    {
      mode: apply ? "apply" : "dry-run",
      warning: apply
        ? "BUILD.gn edited — avoid during a live ninja of this tree"
        : "dry-run only; pass --apply to write (not while ninja is running)",
      edits,
    },
    null,
    2
  )
);
