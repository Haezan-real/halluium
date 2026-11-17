# Phase 13 — chrome/browser + chrome/app (~370 MB candidates)

Build deferred to end.

Electron still `#include`s many paths under these trees (keep-overrides:
devtools, printing, PDF, profiles, desktop capturer, etc.). Blind hollow
stubs would break the shell.

## Method

1. Subtract keep-overrides from the unrelated-code delete set.
2. Delete only remaining delete-candidate files under `chrome/browser/` and
   `chrome/app/`.
3. Never delete keep-override paths; never delete `BUILD.gn` / `*.gni` /
   `DEPS` / `*.grd*` (GN still needs them for kept sources — relative
   `sources` pointing at deleted files get fixed at the giant `e build` or
   via reference-fix stubs where whole targets die).

## Remove

Delete-candidate files under:

- `chrome/browser/` (minus keep-overrides)
- `chrome/app/` (minus keep-overrides)

## Keep

All keep-override paths under those prefixes (~188 files), plus build
metadata (`BUILD.gn`, `*.gni`, …) and anything not on the delete-candidate
list (ninja inputs).

## Fixes

Selective delete via `apply.ps1` → `_selective-delete.mjs`. Residual GN
`sources` entries for removed files: fix at end / as gen fails.
