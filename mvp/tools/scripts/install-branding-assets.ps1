$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$branding = Join-Path $root 'branding'
$plugin = Join-Path $root 'pouchcare-builder'
$theme = Join-Path $root 'pouchcare-theme'

$pluginBranding = Join-Path $plugin 'assets/branding'
$themeIcons = Join-Path $theme 'assets/icons'

New-Item -ItemType Directory -Force -Path $pluginBranding, $themeIcons | Out-Null

Copy-Item (Join-Path $branding 'plugin/plugin-icon-128x128.png') (Join-Path $pluginBranding 'plugin-icon-128x128.png') -Force
Copy-Item (Join-Path $branding 'plugin/plugin-icon-256x256.png') (Join-Path $pluginBranding 'plugin-icon-256x256.png') -Force
Copy-Item (Join-Path $branding 'plugin/plugin-icon-128x128.png') (Join-Path $plugin 'plugin-icon-128x128.png') -Force
Copy-Item (Join-Path $branding 'plugin/plugin-icon-256x256.png') (Join-Path $plugin 'plugin-icon-256x256.png') -Force

Copy-Item (Join-Path $branding 'theme/screenshot-1200x900.png') (Join-Path $theme 'screenshot.png') -Force

Copy-Item (Join-Path $branding 'favicon/favicon-16x16.png') (Join-Path $themeIcons 'favicon-16x16.png') -Force
Copy-Item (Join-Path $branding 'favicon/favicon-32x32.png') (Join-Path $themeIcons 'favicon-32x32.png') -Force
Copy-Item (Join-Path $branding 'favicon/favicon-180x180.png') (Join-Path $themeIcons 'apple-touch-icon.png') -Force
Copy-Item (Join-Path $branding 'favicon/favicon-192x192.png') (Join-Path $themeIcons 'android-chrome-192x192.png') -Force
Copy-Item (Join-Path $branding 'favicon/favicon-512x512.png') (Join-Path $themeIcons 'android-chrome-512x512.png') -Force
Copy-Item (Join-Path $branding 'favicon/favicon.ico') (Join-Path $theme 'favicon.ico') -Force

Write-Host 'Branding assets installed to runtime paths.'
