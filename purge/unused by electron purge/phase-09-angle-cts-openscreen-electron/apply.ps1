param([string]$Src = "")
$ErrorActionPreference = "Stop"
if ($Src) { $env:HALLULIUM_SRC = $Src }
node (Join-Path $PSScriptRoot "..\_bulk-stub-delete.mjs") `
  third_party/angle/third_party/VK-GL-CTS `
  third_party/angle/third_party/glmark2 `
  third_party/angle/third_party/OpenCL-CTS `
  third_party/openscreen/src/third_party/llvm-build `
  third_party/openscreen/src/third_party/protobuf `
  third_party/openscreen/src/test `
  electron/spec `
  electron/.github `
  electron/docs `
  third_party/electron_node/doc `
  third_party/electron_node/benchmark `
  chrome/browser/ash `
  chrome/browser/chromeos `
  chrome/browser/android `
  chrome/browser/ui/ash `
  chrome/browser/ui/android `
  chrome/browser/resources/ash `
  chrome/updater
