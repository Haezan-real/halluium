# Phase 02 — remoting (~14 MB)

Unused-by-electron batch: almost all of `remoting/` is outside the Release
`electron.exe` ninja inputs (1972 delete candidates; ~51 files still needed
and listed under keep / ninja — those stay via stubs + selective keep).

Paths relative to `src/`.

## Remove

- `remoting/`

## Fixes

See `fix.md` — hollow `BUILD.gn` stubs for labels chrome/root still name.
After delete, re-apply stubs so gn resolves `//remoting/...`.
