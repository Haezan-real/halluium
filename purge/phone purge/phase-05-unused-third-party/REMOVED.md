# Phase 5 — more unused third_party

Base: Chromium **148.0.7778.280** (Electron 42.11.3).
Paths are relative to `src/`.

## Remove

- `third_party/perl/`
- `third_party/crossbench/`
- `third_party/crossbench-web-tests/`
- `third_party/webgl/`
- `third_party/checkstyle/`
- `third_party/instrumented_libs/`

## Do not remove (tried and restored)

- `third_party/closure_compiler/` — root `BUILD.gn` imports `compile_js.gni`
- `third_party/screen-ai/` — `chrome/test` data_deps
