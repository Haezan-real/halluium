# Phase 01 — headless shell (~6 MB)

First batch of the **unused by electron** stage. Every file under `headless/`
was a delete candidate (0 ninja inputs for Release `electron.exe`, 0
keep-overrides).

Paths relative to `src/`.

## Remove

- `headless/`

## Fixes

See `fix.md` — hollow `BUILD.gn` so root/chrome/os_crypt visibility and
test deps that still name `//headless:*` keep resolving.
