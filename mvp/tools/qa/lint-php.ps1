$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$phpFiles = Get-ChildItem -Path $root -Recurse -Filter *.php | Where-Object { -not $_.FullName.Contains('vendor') }

if (-not (Get-Command php -ErrorAction SilentlyContinue)) {
  throw 'php command is required for linting.'
}

foreach ($file in $phpFiles) {
  php -l $file.FullName | Out-Host
}

Write-Host "PHP lint passed for $($phpFiles.Count) files."
