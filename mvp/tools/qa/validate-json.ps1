$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$jsonFiles = Get-ChildItem -Path $root -Recurse -Filter *.json

foreach ($file in $jsonFiles) {
  $null = Get-Content -Raw -Path $file.FullName | ConvertFrom-Json
}

Write-Host "JSON validation passed for $($jsonFiles.Count) files."
