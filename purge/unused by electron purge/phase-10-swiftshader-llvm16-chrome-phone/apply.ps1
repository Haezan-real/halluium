param([string]$Src = "")
$ErrorActionPreference = "Stop"
if ($Src) { $env:HALLULIUM_SRC = $Src }
node (Join-Path $PSScriptRoot "..\_bulk-stub-delete.mjs") `
  third_party/swiftshader/third_party/llvm-16.0 `
  third_party/dawn/third_party/dxc/test `
  third_party/dawn/third_party/dxc/tools/clang/test `
  chrome/android `
  chrome/browser/vr `
  chrome/browser/nearby_sharing `
  chrome/browser/share `
  chrome/browser/media/router `
  chrome/browser/ui/webui/ash `
  chrome/browser/ui/webui/chromeos `
  chrome/installer `
  chrome/tools `
  ui/android `
  components/cast `
  components/cast_streaming `
  components/media_router `
  components/mirroring `
  components/openscreen_platform `
  components/chromeos_camera `
  third_party/blink/manual_tests `
  third_party/blink/tools `
  third_party/openscreen
