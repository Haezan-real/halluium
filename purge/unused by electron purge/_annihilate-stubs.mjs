/**
 * Annihilate Hallulium ghost stubs + scrub BUILD.gn asks for missing files.
 *
 *   node _annihilate-stubs.mjs [--dry-run] [--list %TEMP%/hallulium_stub_files.txt]
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

const SRC = path.resolve(process.env.HALLULIUM_SRC || "C:/hallulium/src");
const dry = process.argv.includes("--dry-run");
const listIdx = process.argv.indexOf("--list");
const listPath =
  listIdx >= 0
    ? process.argv[listIdx + 1]
    : path.join(process.env.TEMP || "/tmp", "hallulium_stub_files.txt");

function relOf(abs) {
  return path.relative(SRC, abs).replace(/\\/g, "/");
}

function ensureList() {
  if (fs.existsSync(listPath) && fs.statSync(listPath).size > 0) return;
  console.log("generating stub list via git grep...");
  const r = spawnSync(
    "git",
    ["grep", "-l", "Hallulium stub", "--", ":!out"],
    { cwd: SRC, encoding: "utf8", maxBuffer: 128 * 1024 * 1024 }
  );
  fs.writeFileSync(listPath, r.stdout || "");
}

ensureList();
const rels = fs
  .readFileSync(listPath, "utf8")
  .split(/\r?\n/)
  .map((s) => s.trim())
  .filter(Boolean);

let deleted = 0;
let keptBuildMeta = 0;
const deletedRels = [];

for (const rel of rels) {
  const base = path.basename(rel);
  // Keep hollow BUILD.gn / .gni so //label deps still resolve
  if (base === "BUILD.gn" || base.endsWith(".gni")) {
    keptBuildMeta++;
    continue;
  }
  const abs = path.join(SRC, rel);
  if (!fs.existsSync(abs)) continue;
  if (!dry) {
    try {
      fs.unlinkSync(abs);
    } catch (e) {
      console.error("DEL_FAIL", rel, e.message);
      continue;
    }
  }
  deleted++;
  deletedRels.push(rel);
}

// Scrub BUILD.gn: drop quoted file paths that do not exist on disk
function walkBuild(dir, out) {
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
      walkBuild(p, out);
    } else if (e.name === "BUILD.gn" || e.name.endsWith(".gni")) {
      out.push(p);
    }
  }
}

const buildFiles = [];
// Prefer scrubbing only BUILD files under dirs that had stubs + common roots
const scrubRoots = new Set();
for (const rel of rels) {
  const parts = rel.split("/");
  if (parts.length) scrubRoots.add(parts[0]);
}
for (const root of scrubRoots) {
  walkBuild(path.join(SRC, root), buildFiles);
}
// always scrub electron + content + components + chrome + media + net + base
for (const root of [
  "electron",
  "content",
  "components",
  "chrome",
  "media",
  "net",
  "base",
  "third_party",
  "services",
  "ui",
  "gpu",
  "v8",
]) {
  walkBuild(path.join(SRC, root), buildFiles);
}
const uniqBuild = [...new Set(buildFiles)];

const pathLineRe = /^(\s*)(["'])([^"']+)\2(\s*,?\s*)$/;
let scrubbedFiles = 0;
let scrubbedLines = 0;

for (const bf of uniqBuild) {
  let text;
  try {
    text = fs.readFileSync(bf, "utf8");
  } catch {
    continue;
  }
  if (!/\bsources\s*=/.test(text) && !/\binputs\s*=/.test(text) && !/\bpublic\s*=/.test(text)) {
    continue;
  }
  const dir = path.dirname(bf);
  const lines = text.split(/\r?\n/);
  let changed = false;
  const next = [];
  for (const line of lines) {
    const m = line.match(pathLineRe);
    if (!m) {
      next.push(line);
      continue;
    }
    const quoted = m[3];
    if (
      quoted.startsWith("//") ||
      quoted.startsWith(":") ||
      quoted.includes("$") ||
      quoted.includes("{{") ||
      quoted.startsWith("-I") ||
      quoted.startsWith("-D") ||
      quoted.length < 3
    ) {
      next.push(line);
      continue;
    }
    if (!/\.[A-Za-z0-9_+-]+$/.test(quoted)) {
      next.push(line);
      continue;
    }
    // Resolve relative to BUILD.gn dir
    const cand = [
      path.resolve(dir, quoted),
      path.resolve(SRC, quoted),
    ];
    if (cand.some((c) => fs.existsSync(c))) {
      next.push(line);
      continue;
    }
    // keep gen/ placeholders
    if (quoted.includes("gen/") || quoted.startsWith("//")) {
      next.push(line);
      continue;
    }
    changed = true;
    scrubbedLines++;
  }
  if (changed) {
    scrubbedFiles++;
    if (!dry) fs.writeFileSync(bf, next.join("\n"));
  }
}

const report = {
  dry,
  stubList: rels.length,
  contentStubsDeleted: deleted,
  hollowBuildMetaKept: keptBuildMeta,
  buildFilesScrubbed: scrubbedFiles,
  sourceLinesRemoved: scrubbedLines,
  sampleDeleted: deletedRels.slice(0, 30),
};
fs.writeFileSync(
  path.join(process.env.TEMP || "/tmp", "hallulium_annihilate_report.json"),
  JSON.stringify(report, null, 2)
);
console.log(JSON.stringify(report, null, 2));
