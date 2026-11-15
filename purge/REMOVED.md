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

- `chrome/android/` — `gn gen` requires `chrome/android/modules/buildflags.gni`
  (pulled in via `chrome/browser/vr`).

## Phase 2 (zero Release-ninja hits)

Removed:

- `fuchsia_web/`
- `chromecast/`

## Explicitly kept

- All **macOS / Darwin / Cocoa** related source
- `chromeos/`, `ash/` — still referenced by the Windows graph
- `remoting/` — ~788 ninja hits on Windows
- Blink, `cc`, `components/viz`, `gpu`, `v8`, linked `third_party`

## Apply on a fresh checkout

From the Chromium `src` directory of an Electron 42.11.3 tree:

```powershell
powershell -NoProfile -File path\to\halluium\purge\apply.ps1
```
