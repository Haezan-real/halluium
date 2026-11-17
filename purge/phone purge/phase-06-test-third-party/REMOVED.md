# Phase 6 — test / unused third_party (~169 MB)

Base: Chromium **148.0.7778.280** (Electron 42.11.3).
Paths are relative to `src/`.

## Remove

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

## Do not remove (tried and restored)

- `third_party/grpc/` — needed for `gn gen`
- `third_party/vulkan-validation-layers/` — needed for `gn gen`
- `third_party/readability/` — needed for `gn gen`
- `third_party/google-closure-library/` — needed for `gn gen`
