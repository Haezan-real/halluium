# Phase 10 — swiftshader llvm-16 / dawn DXC tests / chrome phone+cast (~350+ MB)

Build deferred to end.

## Remove

### swiftshader unused LLVM checkout

- `third_party/swiftshader/third_party/llvm-16.0/` (~278 MB; Reactor on Win/x64
  uses Subzero; llvm-10 kept for non-Subzero / Mac policy)

### dawn DXC test trees

- `third_party/dawn/third_party/dxc/test/`
- `third_party/dawn/third_party/dxc/tools/clang/test/`

### chrome / ui phone + cast leftovers

- `chrome/android/`
- `chrome/browser/vr/`
- `chrome/browser/nearby_sharing/`
- `chrome/browser/share/`
- `chrome/browser/media/router/`
- `chrome/browser/ui/webui/ash/`
- `chrome/browser/ui/webui/chromeos/`
- `chrome/installer/`
- `chrome/tools/`
- `ui/android/`
- `components/cast/`
- `components/cast_streaming/`
- `components/media_router/`
- `components/mirroring/`
- `components/openscreen_platform/`
- `components/chromeos_camera/`
- `third_party/blink/manual_tests/`
- `third_party/blink/tools/`
- `third_party/openscreen/` (platform headers only needed via openscreen_platform,
  which is also stubbed this phase)

## Keep (this phase)

- `third_party/swiftshader/third_party/llvm-10.0/`
- `third_party/swiftshader/third_party/llvm-subzero/`
- `third_party/litert/` / `tflite_support/` (webnn still flags them on; later phase)
- `electron/build/pgo_profiles/`

## Fixes

Stubs via `_bulk-stub-delete.mjs`.
