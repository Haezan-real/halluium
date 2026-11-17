# Phase 08 — nested vendor test trees (~1.5+ GB)

Deleted `test`/`tests`/`testdata` under kept third_party packages (and a few
chrome/components paths). Build deferred to end.

## Remove

- `third_party/swiftshader/tests/` (~744 MB)
- `third_party/dawn/test/` (~170 MB)
- `third_party/expat/src/testdata/` (~128 MB)
- `third_party/litert/src/litert/test/` (~119 MB)
- `third_party/sqlite/src/test/` (~84 MB)
- `third_party/harfbuzz/src/test/` (~81 MB)
- `third_party/ots/src/tests/` (~53 MB)
- `third_party/icu/source/test/` (~45 MB)
- `third_party/libc++/src/test/` (~39 MB)
- `third_party/angle/src/tests/` (~37 MB)
- `third_party/compiler-rt/src/test/`
- `third_party/crabbyavif/src/tests/`
- `third_party/opus/tests/`
- `chrome/updater/test/`
- `third_party/skia/tests/`
- `third_party/perfetto/test/`
- `third_party/spirv-tools/src/test/`
- `third_party/skia/modules/canvaskit/tests/`
- `components/variations/test_data/`
- `third_party/electron_node/test/`
- `third_party/electron_node/deps/v8/test/`

## Fixes

Stubs via `_bulk-stub-delete.mjs`.
