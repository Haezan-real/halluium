# Re-apply halluium platform cuts on a Chromium src directory.
# Run from anywhere; pass -Src or rely on C:\electron-42\src / C:\halluium\src.
param(
  [string]$Src = ""
)

$ErrorActionPreference = "Stop"

if (-not $Src) {
  if (Test-Path "C:\electron-42\src") { $Src = "C:\electron-42\src" }
  elseif (Test-Path "C:\halluium\src") { $Src = "C:\halluium\src" }
  else { throw "Pass -Src to your Chromium src directory." }
}

$remove = @(
  "ios",
  "ios_internal",
  "android_webview",
  "clank",
  "fuchsia_web",
  "chromecast",
  "docs",
  "clusterfuzz-data",
  "agents",
  "internal",
  "signing_keys",
  "styleguide"
)

# Never remove these in this script
$keep = @("chrome\android")

foreach ($rel in $remove) {
  $path = Join-Path $Src $rel
  if (Test-Path $path) {
    Write-Host "Removing $rel"
    Remove-Item -LiteralPath $path -Recurse -Force
  } else {
    Write-Host "Already gone: $rel"
  }
}

foreach ($rel in $keep) {
  $path = Join-Path $Src $rel
  if (-not (Test-Path $path)) {
    Write-Warning "Missing kept path $rel — restore from git before building."
  }
}

Write-Host "Purge apply done. Next: e build --gen only && e build (from real path, not a junction)."
