# Phase 09 — angle CTS / openscreen nested / electron fluff / chrome ash+android (~2.2+ GB)

Build deferred to end. Hollow `BUILD.gn` stubs left where the reference-fix
map names them.

## Remove

### angle test / benchmark trees (not linked into electron.exe)

- `third_party/angle/third_party/VK-GL-CTS/` (~1.7 GB conformance suite)
- `third_party/angle/third_party/glmark2/` (~17 MB benchmark)
- `third_party/angle/third_party/OpenCL-CTS/`

### openscreen nested toolchain / tests

- `third_party/openscreen/src/third_party/llvm-build/` (~333 MB; not Hallu’s
  `third_party/llvm-build` toolchain keep)
- `third_party/openscreen/src/third_party/protobuf/`
- `third_party/openscreen/src/test/`

### electron (not needed to build+run Hallu)

- `electron/spec/`
- `electron/.github/`
- `electron/docs/`
- `third_party/electron_node/doc/`
- `third_party/electron_node/benchmark/`

### chrome ChromeOS / Android browser scraps

- `chrome/browser/ash/`
- `chrome/browser/chromeos/`
- `chrome/browser/android/`
- `chrome/browser/ui/ash/`
- `chrome/browser/ui/android/`
- `chrome/browser/resources/ash/`
- `chrome/updater/`

## Keep (this phase)

- `electron/build/pgo_profiles/` — release.gn / official PGO still points here
- `third_party/angle/third_party/clspv/` — may be pulled by ANGLE OpenCL
- `third_party/openscreen/src/platform/` — keep-overrides for openscreen_platform
- Main `third_party/llvm-build/` and `third_party/rust-toolchain/`

## Fixes

Stubs via `_bulk-stub-delete.mjs`.
