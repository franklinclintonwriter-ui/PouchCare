# Apply migrations to the pouchcare-dev Docker stack database (port 5433 on the host).
# Prerequisite:  npm run docker:hosting:dev  (or postgres on localhost:5433)
# Then restart:   docker restart pouchcare-dev-api

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$apiDir = Join-Path $root "apps\api"
$devEnv = Join-Path $apiDir ".env.dev"

$databaseUrl = $null
if (Test-Path $devEnv) {
  Get-Content $devEnv -ErrorAction SilentlyContinue | ForEach-Object {
    if ($_ -match '^\s*DATABASE_URL\s*=\s*(.+)\s*$') {
      $script:databaseUrl = $Matches[1].Trim().Trim('"').Trim("'")
    }
  }
}
if (-not $databaseUrl) {
  $databaseUrl = "postgresql://pouchcare:pouchcare_dev@localhost:5433/pouchcare_dev"
  Write-Host "No DATABASE_URL in apps\api\.env.dev - using default: localhost:5433/pouchcare_dev" -ForegroundColor Yellow
}

$env:DATABASE_URL = $databaseUrl
Set-Location $apiDir
Write-Host "Using DATABASE_URL (host to Docker Postgres port 5433)..." -ForegroundColor Cyan
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Done. Restart the API:  docker restart pouchcare-dev-api" -ForegroundColor Green
