/**
 * Safer scrub: remove only complete quoted path entries from sources=/inputs=
 * lists when the file is missing. Never leaves `foo =` hanging.
 *
 *   node _scrub-missing-sources.mjs [--dry-run]
 */
import fs from "fs";
import path from "path";

const SRC = path.resolve(process.env.HALLULIUM_SRC || "C:/hallulium/src");
const dry = process.argv.includes("--dry-run");

function walk(dir, out) {
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
      walk(p, out);
    } else if (e.name === "BUILD.gn" || e.name.endsWith(".gni")) {
      out.push(p);
    }
  }
}

const files = [];
walk(SRC, files);

// Match a full list entry line: optional indent, quoted path, optional comma
const entryRe = /^(\s*)(["'])([^"']+\.[A-Za-z0-9_+-]+)\2(\s*,\s*)?$/;

let scrubbedFiles = 0;
let scrubbedLines = 0;

for (const bf of files) {
  let text;
  try {
    text = fs.readFileSync(bf, "utf8");
  } catch {
    continue;
  }
  if (!/\b(sources|inputs|public|data)\s*=/.test(text)) continue;

  const dir = path.dirname(bf);
  const lines = text.split(/\r?\n/);
  const next = [];
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(entryRe);
    if (!m) {
      next.push(line);
      continue;
    }
    const quoted = m[3];
    if (
      quoted.startsWith("//") ||
      quoted.includes("$") ||
      quoted.includes("{{")
    ) {
      next.push(line);
      continue;
    }
    const exists =
      fs.existsSync(path.resolve(dir, quoted)) ||
      fs.existsSync(path.resolve(SRC, quoted));
    if (exists) {
      next.push(line);
      continue;
    }
    // Drop missing source entry only
    changed = true;
    scrubbedLines++;
  }

  if (!changed) continue;

  // Clean empty sources = [ ] leftovers is fine for GN
  // Fix trailing commas before ] 
  let out = next.join("\n");
  out = out.replace(/,(\s*\])/g, "$1");

  scrubbedFiles++;
  if (!dry) fs.writeFileSync(bf, out);
}

console.log(JSON.stringify({ dry, scrubbedFiles, scrubbedLines }, null, 2));
