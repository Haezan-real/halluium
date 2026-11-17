param([string]$Src = "")
$ErrorActionPreference = "Stop"
if ($Src) { $env:HALLULIUM_SRC = $Src }
node (Join-Path $PSScriptRoot "..\_bulk-stub-delete.mjs") `
  tools/android tools/binary_size tools/traffic_annotation tools/style_variable_generator `
  tools/crates tools/cr tools/memory tools/polymer tools/win tools/clang `
  third_party/anonymous_tokens third_party/shell-encryption third_party/ukey2 `
  third_party/ocmock third_party/pywebsocket3 third_party/cros-components `
  third_party/mako third_party/dragonbox third_party/fast_float `
  chrome/test chrome/credential_provider components/test
