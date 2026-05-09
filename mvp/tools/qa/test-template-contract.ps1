$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$paths = @(
  (Join-Path $root 'pouchcare-builder/templates/free-starter'),
  (Join-Path $root 'pouchcare-template-packs/free-starter')
)

$required = @('slug', 'title', 'content')

foreach ($path in $paths) {
  if (-not (Test-Path $path)) {
    continue
  }

  $files = Get-ChildItem -Path $path -Recurse -Filter *.json | Where-Object { $_.Name -ne 'manifest.json' }

  foreach ($file in $files) {
    $data = Get-Content -Raw $file.FullName | ConvertFrom-Json

    foreach ($key in $required) {
      if (-not $data.PSObject.Properties.Name.Contains($key) -or [string]::IsNullOrWhiteSpace([string]$data.$key)) {
        throw "Missing required key '$key' in $($file.FullName)"
      }
    }
  }
}

Write-Host 'Template contract validation passed.'
