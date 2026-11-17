param([string]$Src = "")
$ErrorActionPreference = "Stop"
if ($Src) { $env:HALLULIUM_SRC = $Src }
node (Join-Path $PSScriptRoot "..\_bulk-stub-delete.mjs") `
  third_party/swiftshader/tests `
  third_party/dawn/test `
  third_party/expat/src/testdata `
  third_party/litert/src/litert/test `
  third_party/sqlite/src/test `
  third_party/harfbuzz/src/test `
  third_party/ots/src/tests `
  third_party/icu/source/test `
  third_party/libc++/src/test `
  third_party/angle/src/tests `
  third_party/compiler-rt/src/test `
  third_party/crabbyavif/src/tests `
  third_party/opus/tests `
  chrome/updater/test `
  third_party/skia/tests `
  third_party/perfetto/test `
  third_party/spirv-tools/src/test `
  third_party/skia/modules/canvaskit/tests `
  components/variations/test_data `
  third_party/electron_node/test `
  third_party/electron_node/deps/v8/test
