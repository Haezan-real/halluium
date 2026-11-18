# Hallu C++ port list

Ranked **easiest → hardest**. This is the logic/UI split for moving Hallu
math and (later) UI off pure TypeScript. Paths are under `bin/` unless noted.

## Target structure (locked)

```
hallu.exe          ← shell + app hybrid (Blink → Skia → TS/HTML DOM)
hallu_math.dll     ← (name TBD) pure math / edits compiled from C++
… other .dlls …    ← optional splits (media helpers, audio analysis, …)
```

- **`hallu.exe`** is both the native window/shell **and** Hallu. No separate
  “hallulium” product. Dev can also start Vite from this entry path when wired.
- Easy/medium **C++ sources compile to DLLs** (or static libs linked into the
  exe). The hybrid loads them **in-process** — not WASM, not a second app.
- JS/TS in the page talks to those DLLs through a small native bridge (same
  idea as today’s main-process bindings / IPC, but same process as the shell).
- Until `hallu.exe` exists, TypeScript copies stay the runtime for Vite; C++
  ports can land in parallel and switch over when the shell links them.

Do **not** aim for “CSS/HTML auto-compiler to Qt” here. The face stays
Blink-drawn until a separate UI rewrite is explicitly chosen.

---

## 1. Easy (pure math / data — first DLL candidates)

Port these first into something like `hallu_math.dll`.

| Piece | Where (approx.) | Notes |
|---|---|---|
| Frame / timecode helpers | `src/types.ts` (`FPS`, `framesToSeconds`, `formatTimecode`, …) | Tiny |
| Cubic bezier / CSS easing parse | `src/shared/lib/cubicBezier.ts` | Tiny |
| Media pool zoom maths | `src/modules/dockableWindows/mediaPool/mediaPoolZoom.ts` | Tiny |
| FFmpeg LGPL banner check | `ffmpegLicense.cjs` | Tiny |
| Icon corner rounding | `iconRounding.cjs` | Pixel loop |
| Timeline geometry | `…/timeline/timelineGeometry.ts` | Frames ↔ pixels, track heights |
| Timeline camera / playhead center | `timelineCamera.ts`, `playheadCenter.ts` | Already well tested |
| Timeline edits (pure) | `timelineEdits.ts`, `edgeEdit.ts`, `clipManipulator.ts`, `dropConditions.ts` | Clips in → clips out |
| 2D camera | `src/shared/cameraEngine2d/cameraEngine2d.ts` | Viewer pan/zoom maths |
| Waveform / spectrogram maths | `waveformPeaks.ts`, `waveformColumns.ts`, `spectrogram.ts` | Not the React canvas |
| Torus geometry | `src/features/torus/geometry/*` | Numbers only |
| Graph curve maths | `src/shared/ui/graphEditor/graphGeometry.ts` (+ evaluator) | |
| `.halluproj` parse/serialize core | `src/shared/project/projectFile.ts` | JSON shape; no dialogs |
| Media pool pure helpers | zoom/search/folder helpers next to Media Pool | Small `.ts` beside UI |
| Settings defaults / migration maps | `settingsDefaults.ts`, `storageMigration.ts` | Tables, not Settings UI |

---

## 2. Medium (doable; own DLL or same math DLL later)

| Piece | Where (approx.) | Notes |
|---|---|---|
| Project store + undo snapshots | `projectStore.ts`, `projectHistory.ts` | Need a C++ state/undo model |
| Keyboard command table | `shared/keyboard/commands.ts` | Data easy; OS key wiring medium |
| Shader pack orchestration | `shaderPacks.cjs` | Keep **glslang/tint** as tools; port the driver |
| Media engine control plane | `mediaEngine.cjs` | Keep **ffmpeg**; port open/seek/cache policy |
| Project path I/O rules | `projectFiles.cjs` + path helpers | Without Electron dialogs first |
| Theme / style manifest validation | `styleLibrary.cjs`, color field lists | Validation, not painting CSS |

---

## 3. Hard (UI / platform — not “math DLLs”)

| Piece | Where (approx.) | Notes |
|---|---|---|
| React panels / widgets | most of `src/**/*.tsx` | Rewrite or keep under Blink |
| Dock (dockview) | `app/dock/*` | Layout + drag |
| CSS / themes / animations | `src/**/*.css`, theme vars | Blink (or a full UI rewrite) |
| WebGPU shader backgrounds | `features/shaders/*` | GPU + DOM capture |
| Timeline / torus pointer UX | hooks tied to DOM events | |
| Frameless window chrome | `main.cjs` | Native window API inside `hallu.exe` |

---

## 4. Near-impossible as an “easy translate”

- Keep HTML/CSS/React unchanged but “it’s all C++” with no Blink  
- Auto-translate the DOM/CSS into Qt/Skia widgets  
- Replace Blink by copying three folders out of Chromium  

Those are different projects. This file is for **DLL-sized logic ports** under
the `hallu.exe` hybrid.

---

## Suggested DLL split (when it grows)

| DLL (names TBD) | Contents |
|---|---|
| `hallu_math.dll` | §1 geometry, edits, easing, timecode, torus/graph maths |
| `hallu_media.dll` | Waveform/spectrogram analysis; later media-engine policy |
| `hallu_project.dll` | `.halluproj` + path rules |
| (exe-only) | Window, Blink/Skia embed, bridge to JS |

Static `.lib` into `hallu.exe` is fine for the first slice instead of a DLL.
