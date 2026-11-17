# Phase 9 — small leftover test data (~11 MB)

Base: Chromium **148.0.7778.280** (Electron 42.11.3).
Paths are relative to `src/`.

## Remove

- `chrome/test/data/dromaeo/`
- `chrome/test/data/ocr/`

## Do not remove (tried and restored)

- `third_party/test_fonts/` — `skia/BUILD.gn`, `pdfium/testing`
- `third_party/updater/` — chrome updater graph
- `third_party/enterprise_companion/` — `chrome/enterprise_companion`
- `third_party/catapult/third_party/vinn/` — was needed then; phase 11 later removed most of catapult with stubs
- `third_party/catapult/third_party/gsutil/` — was needed then; phase 11 stubbed
