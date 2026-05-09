$ErrorActionPreference = 'Stop'

Write-Host 'Running core UAT...'
& "$PSScriptRoot\run-uat.ps1"

Write-Host 'Running multisite smoke...'
& "$PSScriptRoot\run-multisite-smoke.ps1"

Write-Host 'Running rollback smoke...'
& "$PSScriptRoot\run-rollback-smoke.ps1"

Write-Host 'All UAT suites passed.'
