# Phase 11 — catapult + hunspell dictionaries (~784 MB)

Base: Chromium **148.0.7778.280** (Electron 42.11.3).
Paths are relative to `src/`.

Gen was green with stubs; full `e build` proof was still pending in the original log. `fix.md` recreates stub `BUILD.gn` trees. The `typ` stub expects a `typ/` data dir — if grit fails, sparse-clone typ under `third_party/catapult/third_party/typ/typ/`. Electron hunspell copy rules were also emptied in-tree (not fully captured as stubs here).

## Remove

- `third_party/catapult/`
- `third_party/hunspell_dictionaries/`

## Fixes

See `fix.md` in this folder (applied by `apply.ps1` after deletes).
