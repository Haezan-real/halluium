# Re-apply via bulk stub deleter (needs the reference-fix markdown present).
param([string]$Src = "")
$ErrorActionPreference = "Stop"
if ($Src) { $env:HALLULIUM_SRC = $Src }
node (Join-Path $PSScriptRoot "..\_bulk-stub-delete.mjs") ash chromeos apps rlz
