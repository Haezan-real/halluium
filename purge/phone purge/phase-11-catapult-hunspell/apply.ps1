# Apply this phase only.
param([string]$Src = "")
$ErrorActionPreference = "Stop"
& (Join-Path $PSScriptRoot "..\..\apply-phase.ps1") -PhaseDir $PSScriptRoot -Src $Src