$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $root
try {
    Write-Host 'Starting WordPress runtime for multisite smoke...'
    npx @wordpress/env start --config ./.wp-env.json

    Write-Host 'Converting to multisite (subdirectory mode)...'
    $multiBefore = npx @wordpress/env run cli wp eval "echo is_multisite() ? '1' : '0';"
    $multiBeforeText = ($multiBefore -join "`n")
    if ($multiBeforeText -notmatch '1') {
      npx @wordpress/env run cli wp core multisite-convert --title='PouchCare Network' --base='/'
    } else {
      Write-Host 'Multisite already enabled. Skipping conversion.'
    }

    Write-Host 'Creating network test site...'
    $existingQa = npx @wordpress/env run cli wp site list --field=url
    if (($existingQa -join "`n") -notmatch '/qa/?') {
      npx @wordpress/env run cli wp site create --slug=qa --title='QA Site' --email='admin@example.com'
    } else {
      Write-Host 'QA site already exists. Skipping creation.'
    }

    Write-Host 'Verifying multisite state...'
    $isMulti = npx @wordpress/env run cli wp eval "echo is_multisite() ? '1' : '0';"
    if ($isMulti.Trim() -ne '1') {
      throw 'Multisite conversion did not succeed.'
    }

    $sites = npx @wordpress/env run cli wp site list --fields=blog_id,url --format=csv
    $sitesText = ($sites -join "`n")
    if ($sitesText -notmatch '/qa/?') {
      throw 'QA multisite child site was not created.'
    }

    Write-Host 'Multisite smoke passed.'
}
finally {
    Pop-Location
}
