$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Push-Location $root
try {
    Write-Host 'Starting WordPress test runtime...'
    npx @wordpress/env start --config ./.wp-env.json

    Write-Host 'Activating plugin/theme...'
    npx @wordpress/env run cli wp plugin activate pouchcare-builder
    npx @wordpress/env run cli wp theme activate pouchcare-theme

    Write-Host 'Checking core plugin/theme status...'
    npx @wordpress/env run cli wp plugin is-active pouchcare-builder | Out-Null
    $themeStatus = npx @wordpress/env run cli wp theme list --status=active --field=name
    if (-not $themeStatus -or ($themeStatus -notmatch 'pouchcare-theme')) {
      throw 'Active theme is not pouchcare-theme.'
    }

    Write-Host 'Checking template inventory and block registry...'
    $templateCountRaw = npx @wordpress/env run cli wp eval "echo count(PouchCare_Template_Importer::get_templates());"
    $templateCountClean = (($templateCountRaw -join '') -replace '[^0-9]', '')
    if ([string]::IsNullOrWhiteSpace($templateCountClean)) {
      throw "Unable to parse template count from output: $templateCountRaw"
    }
    $templateCount = [int]$templateCountClean
    if ($templateCount -lt 24) {
      throw "Expected at least 24 templates, found $templateCount"
    }

    $heroRegistered = npx @wordpress/env run cli wp eval "echo WP_Block_Type_Registry::get_instance()->is_registered('pouchcare/hero') ? '1' : '0';"
    if ($heroRegistered.Trim() -ne '1') {
      throw 'Block pouchcare/hero is not registered.'
    }

    Write-Host 'Creating smoke page from template content...'
    npx @wordpress/env run cli wp eval "`$templates=PouchCare_Template_Importer::get_templates(); `$first=reset(`$templates); wp_insert_post(['post_title'=>'UAT Smoke Page','post_status'=>'publish','post_type'=>'page','post_content'=>wp_kses_post(`$first['content'])]);"

    Write-Host 'Verifying frontend response...'
    $response = Invoke-WebRequest -Uri 'http://localhost:8896' -UseBasicParsing
    if ($response.StatusCode -ne 200) {
      throw 'Frontend did not return HTTP 200.'
    }

    Write-Host 'UAT core smoke passed.'
}
finally {
    Pop-Location
}

