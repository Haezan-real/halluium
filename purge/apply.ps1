# Re-apply the phone-purge stage (phases 01–11).
param([string]$Src = "")
$ErrorActionPreference = "Stop"
& (Join-Path $PSScriptRoot "phone purge\apply.ps1") -Src $Src
