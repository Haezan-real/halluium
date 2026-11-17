# Apply this phase only. Prefer the documented keep-restore flow in REMOVED.md;
# full delete of testing/ then re-stub via fix.md is incomplete without keeps.
param([string]$Src = "")
$ErrorActionPreference = "Stop"
Write-Host "phase-03-testing: use the keep-backup delete flow (see session notes / REMOVED.md). Running stub-only apply-phase after manual delete."
& (Join-Path $PSScriptRoot "..\..\apply-phase.ps1") -PhaseDir $PSScriptRoot -Src $Src
