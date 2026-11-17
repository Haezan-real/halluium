# Phase 10 — zero electron_app hits (~85 MB)

Base: Chromium **148.0.7778.280** (Electron 42.11.3).
Paths are relative to `src/`.

After delete, `fix.md` writes hollow `BUILD.gn` stubs for targets gn still names.

## Remove

- `third_party/webgpu-cts/`
- `infra/`
- `components/exo/`
- `ui/chromeos/`
- `ui/file_manager/`
- `codelabs/`

## Do not remove (tried and restored)

- `chrome/updater/` — deep GN imports (`zip.gni`, branding, browser_sources)

## Fixes

See `fix.md` in this folder (applied by `apply.ps1` after deletes).
