# Phase 1 — phone platforms

Base: Chromium **148.0.7778.280** (Electron 42.11.3).
Paths are relative to `src/`.

First purge phase: phone-only trees.

## Remove

- `ios/`
- `ios_internal/`
- `android_webview/`
- `clank/`

## Do not remove (tried and restored)

- `chrome/android/` — needs `chrome/android/modules/buildflags.gni` (Windows still needs it)
