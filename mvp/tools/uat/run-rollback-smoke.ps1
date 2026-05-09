$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $root
try {
    Write-Host 'Starting runtime for rollback smoke...'
    npx @wordpress/env start --config ./.wp-env.json

    Write-Host 'Preparing active state...'
    npx @wordpress/env run cli wp plugin activate pouchcare-builder
    npx @wordpress/env run cli wp theme activate pouchcare-theme

    Write-Host 'Simulating rollback: switch fallback state and recover...'
    npx @wordpress/env run cli wp theme activate twentytwentyfour
    npx @wordpress/env run cli wp plugin deactivate pouchcare-builder
    npx @wordpress/env run cli wp plugin activate pouchcare-builder
    npx @wordpress/env run cli wp theme activate pouchcare-theme

    npx @wordpress/env run cli wp plugin is-active pouchcare-builder | Out-Null
    $themeStatus = npx @wordpress/env run cli wp theme list --status=active --field=name
    if ($themeStatus -notmatch 'pouchcare-theme') {
      throw 'Theme recovery failed after rollback smoke.'
    }

    Write-Host 'Rollback smoke passed.'
}
finally {
    Pop-Location
}
