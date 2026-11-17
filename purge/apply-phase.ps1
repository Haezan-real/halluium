# Shared apply logic for one purge phase directory.
# Expects REMOVED.md with a "## Remove" section of `- `path`` bullets.
# Optional fix.md with "## Stub: relative/path" sections + fenced bodies.
param(
  [Parameter(Mandatory = $true)][string]$PhaseDir,
  [string]$Src = ""
)

$ErrorActionPreference = "Stop"

if (-not $Src) {
  if (Test-Path "C:\hallulium\src") { $Src = "C:\hallulium\src" }
  elseif (Test-Path "C:\electron-42\src") { $Src = "C:\electron-42\src" }
  else { throw "Pass -Src to your Chromium src directory." }
}

$removedPath = Join-Path $PhaseDir "REMOVED.md"
if (-not (Test-Path -LiteralPath $removedPath)) {
  throw "Missing REMOVED.md in $PhaseDir"
}

function Get-RemovePaths([string]$Markdown) {
  $paths = New-Object System.Collections.Generic.List[string]
  $inRemove = $false
  foreach ($line in ($Markdown -split "`r?`n")) {
    if ($line -match '^##\s+') {
      $inRemove = ($line -match '^##\s+Remove\b')
      continue
    }
    if (-not $inRemove) { continue }
    if ($line -match '^\s*-\s+`([^`]+)`') {
      $rel = $Matches[1].Trim().TrimEnd('/').TrimEnd('\').Replace('/', '\')
      if ($rel) { [void]$paths.Add($rel) }
    }
  }
  return $paths
}

function Apply-FixMarkdown([string]$FixPath, [string]$SrcRoot) {
  $text = [IO.File]::ReadAllText($FixPath)
  $lines = $text -split "`r?`n"
  $i = 0
  $stubCount = 0
  while ($i -lt $lines.Length) {
    $line = $lines[$i]
    if ($line -match '^##\s+Stub:\s+(.+)$') {
      $rel = $Matches[1].Trim().Trim('`').Replace('/', '\')
      $i++
      # skip blanks
      while ($i -lt $lines.Length -and $lines[$i] -match '^\s*$') { $i++ }
      if ($i -ge $lines.Length -or $lines[$i] -notmatch '^```') {
        throw "Stub $rel in $FixPath: expected fenced code block"
      }
      $i++ # past opening fence
      $body = New-Object System.Collections.Generic.List[string]
      while ($i -lt $lines.Length -and $lines[$i] -notmatch '^```\s*$') {
        [void]$body.Add($lines[$i])
        $i++
      }
      if ($i -ge $lines.Length) { throw "Stub $rel in $FixPath: unclosed fence" }
      $i++ # past closing fence
      $dest = Join-Path $SrcRoot $rel
      $dir = Split-Path -Parent $dest
      if (-not (Test-Path -LiteralPath $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
      }
      $content = ($body -join "`n") + "`n"
      [IO.File]::WriteAllText($dest, $content)
      Write-Host "Stubbed $rel"
      $stubCount++
      continue
    }
    $i++
  }
  Write-Host "Applied $stubCount stub(s) from $(Split-Path -Leaf $FixPath)"
}

$phaseName = Split-Path -Leaf $PhaseDir
Write-Host "=== Applying phase: $phaseName ==="

$md = [IO.File]::ReadAllText($removedPath)
$removePaths = Get-RemovePaths $md
if ($removePaths.Count -eq 0) {
  Write-Warning "No ## Remove paths parsed from REMOVED.md"
}

foreach ($rel in $removePaths) {
  $path = Join-Path $Src $rel
  if (Test-Path -LiteralPath $path) {
    Write-Host "Removing $rel"
    Remove-Item -LiteralPath $path -Recurse -Force
  } else {
    Write-Host "Already gone: $rel"
  }
}

Get-ChildItem -LiteralPath $PhaseDir -Filter "fix*.md" -File | Sort-Object Name | ForEach-Object {
  Write-Host "Applying fixes: $($_.Name)"
  Apply-FixMarkdown -FixPath $_.FullName -SrcRoot $Src
}

Write-Host "=== Done: $phaseName ==="
