# Phase 7 — large Blink web_tests (~878 MB)

Base: Chromium **148.0.7778.280** (Electron 42.11.3).
Paths are relative to `src/`.

Also trimmed bulk under `chrome/android/` (~42 MB) while **keeping** `modules/buildflags.gni`, `modules/`, `BUILD.gn`, and `DEPS`. That trim is not fully listed as delete paths here — do not delete all of `chrome/android/`.

## Remove

- `third_party/blink/web_tests/platform/`
- `third_party/blink/web_tests/external/`
- `third_party/blink/web_tests/svg/`
- `third_party/blink/web_tests/http/`
- `third_party/blink/web_tests/fast/`
- `third_party/blink/web_tests/images/`
- `third_party/blink/web_tests/virtual/`
- `third_party/blink/web_tests/flag-specific/`
- `third_party/blink/web_tests/editing/`
- `third_party/blink/web_tests/webaudio/`
- `third_party/blink/web_tests/media/`
- `third_party/blink/web_tests/css3/`
- `third_party/blink/web_tests/third_party/`
