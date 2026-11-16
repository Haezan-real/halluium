# Paths removed from the local halluium Chromium tree

Base: Chromium **148.0.7778.280** (Electron 42.11.3).  
Rebuild proven after each phase with `e build` → `electron.exe` (exit 0).

## Phase 1 (phone platforms)

Removed:

- `ios/`
- `ios_internal/`
- `android_webview/`
- `clank/`

Tried and **restored** (Windows still needs it):

- `chrome/android/` — needs `chrome/android/modules/buildflags.gni`

## Phase 2 (zero Release-ninja hits)

Removed:

- `fuchsia_web/`
- `chromecast/`

## Phase 3 (docs / metadata)

Removed:

- `docs/`
- `clusterfuzz-data/`
- `agents/`
- `internal/`
- `signing_keys/`
- `styleguide/`

Skipped: `codelabs/` (ninja hits)

## Phase 4 (benchmarks + Android/Fuchsia stubs)

Removed:

- `third_party/jetstream/`
- `third_party/speedometer/`
- `third_party/apache-windows-arm64/`
- `third_party/nearby/`
- `third_party/androidx/` (+ related android_* / arcore / robolectric / hamcrest / byte_buddy stubs)
- `third_party/fuchsia-sdk/`, `third_party/fuchsia-gn-sdk/`
- `.github/`, `.claude/`, `.gemini/`, `.agents/`

## Phase 5 (more unused third_party)

Removed:

- `third_party/perl/`
- `third_party/crossbench/`, `third_party/crossbench-web-tests/`
- `third_party/webgl/`
- `third_party/checkstyle/`
- `third_party/instrumented_libs/`

Tried and **restored**:

- `third_party/closure_compiler/` — root `BUILD.gn` imports `compile_js.gni`
- `third_party/screen-ai/` — `chrome/test` data_deps

## Phase 6 (test / unused third_party)

Removed (~169 MB):

- `third_party/blink/perf_tests/`
- `third_party/webxr_test_pages/`
- `third_party/apache-win32/`
- `third_party/js_code_coverage/`
- `third_party/nlohmann_json/`
- `third_party/webdriver/`
- `third_party/wpt_tools/`
- `third_party/libpfm4/`
- `third_party/liblouis/`
- `third_party/cldr/`
- `third_party/google_input_tools/`
- `third_party/material_web_components/`

Tried earlier and **restored** (needed for `gn gen`):

- `third_party/grpc/`
- `third_party/vulkan-validation-layers/`
- `third_party/readability/`
- `third_party/google-closure-library/`

## Phase 7 (large test trees)

Removed (~878 MB from `third_party/blink/web_tests/`):

- `platform/`, `external/`, `svg/`, `http/`, `fast/`, `images/`,
  `virtual/`, `flag-specific/`, `editing/`, `webaudio/`, `media/`,
  `css3/`, `third_party/`

Trimmed `chrome/android/` (~42 MB) while keeping `modules/buildflags.gni`
(and the `modules/` tree, `BUILD.gn`, `DEPS`).

## Explicitly kept

- All **macOS / Darwin / Cocoa** related source (including `libdmg-hfsplus`)
- `chromeos/`, `ash/`, `remoting/`
- Build toolchains (`rust-toolchain`, `llvm-build`, `depot_tools`, `siso`)
- Blink, `cc`, `components/viz`, `gpu`, `v8`, linked `third_party`

## Apply on a fresh checkout

```powershell
powershell -NoProfile -File path\to\halluium\purge\apply.ps1
```
