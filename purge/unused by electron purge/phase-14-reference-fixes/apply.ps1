param([string]$Src = "")
$ErrorActionPreference = "Stop"
if ($Src) { $env:HALLULIUM_SRC = $Src }
$here = $PSScriptRoot
node (Join-Path $here "..\_apply-reference-fixes.mjs")
node (Join-Path $here "..\_stub-missing-in-build.mjs") `
  chrome/browser chrome/app chrome components content base net ui `
  extensions media device services cc gpu printing
