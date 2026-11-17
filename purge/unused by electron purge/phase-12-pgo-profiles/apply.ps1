param([string]$Src = "")
$ErrorActionPreference = "Stop"
if (-not $Src) {
  if ($env:HALLULIUM_SRC) { $Src = $env:HALLULIUM_SRC }
  elseif (Test-Path "C:\hallulium\src") { $Src = "C:\hallulium\src" }
  else { throw "Pass -Src" }
}
$env:HALLULIUM_SRC = $Src

$releaseGn = Join-Path $Src "electron\build\args\release.gn"
if (-not (Test-Path -LiteralPath $releaseGn)) {
  throw "Missing $releaseGn"
}

$newRelease = @'
import("//electron/build/args/all.gn")
is_component_build = false
is_official_build = true

# By default, Electron builds ffmpeg with proprietary codecs enabled. In order
# to facilitate users who don't want to ship proprietary codecs in ffmpeg, or
# who have an LGPL requirement to ship ffmpeg as a dynamically linked library,
# we build ffmpeg as a shared library.
is_component_ffmpeg = true

# Hallulium: PGO profiles purged (unused-by-electron phase 12). Official
# Electron defaults chrome_pgo_phase=2 when is_official_build; force off.
chrome_pgo_phase = 0
v8_builtins_profiling_log_file = ""
'@
[IO.File]::WriteAllText($releaseGn, ($newRelease -replace "`r?`n", "`r`n").TrimEnd() + "`r`n")
Write-Host "Patched electron/build/args/release.gn (PGO off)"

node (Join-Path $PSScriptRoot "..\_bulk-stub-delete.mjs") `
  electron/build/pgo_profiles
