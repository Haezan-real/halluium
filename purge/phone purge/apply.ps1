# Re-apply all numbered phone-purge phases (01–11) in order.
param([string]$Src = "")
$ErrorActionPreference = "Stop"
$phases = Get-ChildItem -LiteralPath $PSScriptRoot -Directory |
  Where-Object { $_.Name -match '^phase-\d{2}-' } |
  Sort-Object Name
foreach ($dir in $phases) {
  & (Join-Path $dir.FullName "apply.ps1") -Src $Src
}
Write-Host "Phone purge stages (01-11) applied. Next: e build from C:\hallulium\src."
