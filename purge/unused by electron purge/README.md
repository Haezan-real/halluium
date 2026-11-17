# Unused by electron purge (stage)

Scan artifacts for deleting `src/` files that are **not** ninja inputs of
Release `electron.exe` (minus macOS/toolchain policy keeps).

| File | Role |
|---|---|
| `unrelated code purge.md` | Full delete-candidate list (~11 GB) |
| `unrelated code purge keep overrides.md` | Subtract from delete set |
| `unrelated code purge reference fix.md` | GN dep/source/label edits |

Regenerate:

```powershell
node "purge/unused by electron purge/scan-unrelated.mjs"
node "purge/unused by electron purge/scan-fixes.mjs"
```

Delete in batches with keep-overrides subtracted and reference fixes applied;
prove `e build` each batch. Add new `phase-*` folders under this stage as
batches complete.
