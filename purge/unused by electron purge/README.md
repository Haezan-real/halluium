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

Delete in batches with keep-overrides subtracted and stubs from the reference
fix map. **Do not wait for a full `e build` per batch** — one giant compile
at the end (optional cheap `gn gen` between large batches). Cost: harder to
bisect a final failure.

## Phases

| Phase | Folder | Status |
|---|---|---|
| 01 | [`phase-01-headless/`](phase-01-headless/) | Done (~6 MB) |
| 02 | [`phase-02-remoting/`](phase-02-remoting/) | Done (~14 MB) |
| 03 | [`phase-03-testing/`](phase-03-testing/) | Done (~16 MB) |
| 04 | [`phase-04-ash-chromeos-apps-rlz/`](phase-04-ash-chromeos-apps-rlz/) | Done (~145 MB) |
| 05 | [`phase-05-third-party-tools/`](phase-05-third-party-tools/) | Done (~700+ MB tflite/tools/etc.) |
| 06 | [`phase-06-tools-chrome-test/`](phase-06-tools-chrome-test/) | Done (~85+ MB chrome/test + tools) |
