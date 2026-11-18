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

Delete in batches with keep-overrides subtracted. **Do not wait for a full
`e build` per batch** — one giant compile at the end (optional cheap
`gn gen` between large batches). Cost: harder to bisect a final failure.

## When the build still asks for a deleted path (locked)

Phases 01–14 left many hollow `BUILD.gn` / empty-file **stubs**. That
approach is **retired** for new work — empty “ghost” stubs shadow real
headers (e.g. `*_export.h`, grit) and caused a day of whack-a-mole.

On a missing-file / missing-dep failure, pick **one**:

1. **Unhook** — edit `BUILD.gn` / deps / includes so the Electron graph no
   longer asks for the path, then leave it deleted; or
2. **Restore real** — `git checkout` / DEPS clone the actual sources if
   this host still needs them to link.

Do **not** plant new empty stubs to silence ninja. Existing stubs may
still be on disk from older phases; prefer deleting nested/shadowing ones
and unhooking or restoring rather than adding more.

### Tooling

| Script | Role |
|---|---|
| [`_find-hallulium-stubs.mjs`](_find-hallulium-stubs.mjs) | **Read-only** list of ghost stubs (safe during a live `ninja`) |
| [`_unhook-path.mjs`](_unhook-path.mjs) | Dry-run / `--apply` remove a path from `BUILD.gn` lists so ninja stops asking |
| [`_annihilate-stubs.mjs`](_annihilate-stubs.mjs) | Delete content ghosts (keeps hollow `BUILD.gn`/`.gni`) |
| [`_scrub-missing-sources.mjs`](_scrub-missing-sources.mjs) | Safer scrub of missing `sources` entries (still can break `gn gen` if overused) |

**Do not `--apply` unhook / mass-scrub while Electron ninja is running.**
Nov 2025: annihilated ~16k content stubs; a full BUILD scrub broke `gn gen`,
so `BUILD.gn` was restored from git while ghosts stayed deleted. Prefer
per-path unhook or `git checkout` restore when the loop prints
`NEED_UNHOOK_OR_RESTORE`.

The `%TEMP%\hallulium_build_until_sync.mjs` loop no longer auto-creates
empty stubs (restore / DEPS clone only; else exit for unhook).

## Phases

| Phase | Folder | Status |
|---|---|---|
| 01 | [`phase-01-headless/`](phase-01-headless/) | Done (~6 MB) |
| 02 | [`phase-02-remoting/`](phase-02-remoting/) | Done (~14 MB) |
| 03 | [`phase-03-testing/`](phase-03-testing/) | Done (~16 MB) |
| 04 | [`phase-04-ash-chromeos-apps-rlz/`](phase-04-ash-chromeos-apps-rlz/) | Done (~145 MB) |
| 05 | [`phase-05-third-party-tools/`](phase-05-third-party-tools/) | Done (~700+ MB tflite/tools/etc.) |
| 06 | [`phase-06-tools-chrome-test/`](phase-06-tools-chrome-test/) | Done (~85+ MB chrome/test + tools) |
| 07 | [`phase-07-test-trees/`](phase-07-test-trees/) | Done (~870 MB content/media/v8 tests) |
| 08 | [`phase-08-nested-vendor-tests/`](phase-08-nested-vendor-tests/) | Done (~1.5+ GB vendor test data) |
| 09 | [`phase-09-angle-cts-openscreen-electron/`](phase-09-angle-cts-openscreen-electron/) | Done (~2.2+ GB VK-GL-CTS / openscreen llvm / electron fluff) |
| 10 | [`phase-10-swiftshader-llvm16-chrome-phone/`](phase-10-swiftshader-llvm16-chrome-phone/) | Done (~350+ MB llvm-16 / cast / chrome phone) |
| 11 | [`phase-11-webnn-litert-ml/`](phase-11-webnn-litert-ml/) | Done (~200+ MB litert / tflite_support / webnn / ML) |
| 12 | [`phase-12-pgo-profiles/`](phase-12-pgo-profiles/) | Done (~1.0 GB; `chrome_pgo_phase = 0`) |
| 13 | [`phase-13-chrome-browser-app/`](phase-13-chrome-browser-app/) | Done (~224 MB selective; keep-overrides preserved) |
| 14 | [`phase-14-reference-fixes/`](phase-14-reference-fixes/) | Done (pre-stub missing BUILD/gni/sources before e build) |
