$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$blockRoot = Join-Path $root 'pouchcare-builder/blocks'

$required = @('hero', 'features', 'pricing', 'testimonials', 'cta', 'faq', 'contact', 'footer')

foreach ($slug in $required) {
  $blockJsonPath = Join-Path $blockRoot "$slug/block.json"
  if (-not (Test-Path $blockJsonPath)) {
    throw "Missing $blockJsonPath"
  }

  $data = Get-Content -Raw $blockJsonPath | ConvertFrom-Json
  if ($data.name -ne "pouchcare/$slug") {
    throw "Unexpected block name in $blockJsonPath"
  }
}

Write-Host 'Block manifest validation passed.'
