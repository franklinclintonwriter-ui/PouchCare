$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)

$requiredPaths = @(
  'pouchcare-theme/style.css',
  'pouchcare-theme/theme.json',
  'pouchcare-builder/pouchcare-builder.php',
  'pouchcare-builder/includes/class-pouchcare-builder.php',
  'pouchcare-builder/includes/Import/class-pouchcare-template-importer.php',
  'pouchcare-builder/assets/js/pouchcare-block-factory.js',
  'pouchcare-builder/templates/free-starter/manifest.json'
)

foreach ($relativePath in $requiredPaths) {
  $fullPath = Join-Path $root $relativePath
  if (-not (Test-Path $fullPath)) {
    throw "Missing required path: $relativePath"
  }
}

Write-Host 'Structure smoke validation passed.'
