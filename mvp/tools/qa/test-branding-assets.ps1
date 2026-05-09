$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$required = @(
  'pouchcare-builder/assets/branding/plugin-icon-128x128.png',
  'pouchcare-builder/assets/branding/plugin-icon-256x256.png',
  'pouchcare-builder/plugin-icon-128x128.png',
  'pouchcare-builder/plugin-icon-256x256.png',
  'pouchcare-theme/screenshot.png',
  'pouchcare-theme/favicon.ico',
  'pouchcare-theme/assets/icons/favicon-16x16.png',
  'pouchcare-theme/assets/icons/favicon-32x32.png',
  'pouchcare-theme/assets/icons/apple-touch-icon.png',
  'pouchcare-theme/assets/icons/android-chrome-192x192.png',
  'pouchcare-theme/assets/icons/android-chrome-512x512.png'
)

foreach ($item in $required) {
  $full = Join-Path $root $item
  if (-not (Test-Path $full)) {
    throw "Missing branding asset: $item"
  }
}

Write-Host 'Branding asset validation passed.'
