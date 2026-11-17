param([string]$Src = "")
$ErrorActionPreference = "Stop"
if (-not $Src) {
  if ($env:HALLULIUM_SRC) { $Src = $env:HALLULIUM_SRC }
  elseif (Test-Path "C:\hallulium\src") { $Src = "C:\hallulium\src" }
  else { throw "Pass -Src" }
}
$env:HALLULIUM_SRC = $Src

node (Join-Path $PSScriptRoot "..\_bulk-stub-delete.mjs") `
  third_party/tflite_support `
  third_party/litert `
  services/webnn `
  services/on_device_model `
  components/optimization_guide `
  components/language_detection `
  components/permissions/prediction_service `
  chrome/browser/webnn

# Leave importable feature stubs so leftover GN imports resolve.
$webnnFeatures = @'
# Hallulium stub — WebNN ML backends off
declare_args() {
  webnn_use_tflite = false
  webnn_use_litert = false
  webnn_use_chrome_ml_api = false
  webnn_enable_tflite_profiler = false
  webnn_install_runtime_in_chrome_installer = false
}
'@
$litertFeatures = @'
# Hallulium stub
declare_args() {
  build_litert_with_xnnpack = false
}
'@
$webnnDir = Join-Path $Src "services\webnn"
New-Item -ItemType Directory -Force -Path $webnnDir | Out-Null
[IO.File]::WriteAllText((Join-Path $webnnDir "features.gni"), $webnnFeatures.Replace("`n", "`r`n") + "`r`n")
$litertDir = Join-Path $Src "third_party\litert"
New-Item -ItemType Directory -Force -Path $litertDir | Out-Null
[IO.File]::WriteAllText((Join-Path $litertDir "features.gni"), $litertFeatures.Replace("`n", "`r`n") + "`r`n")
Write-Host "Wrote stub features.gni for webnn + litert"
