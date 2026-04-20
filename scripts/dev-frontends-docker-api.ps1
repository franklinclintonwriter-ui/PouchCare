# Start landing + management Vite dev servers, proxying /v1 to the Docker dev API
# (npm run docker:hosting:dev — API on http://127.0.0.1:7001).
# Usage (repo root):
#   powershell -ExecutionPolicy Bypass -File scripts/dev-frontends-docker-api.ps1
#   npm run dev:frontends:docker

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$env:POUCHCARE_API_DEV_ORIGIN = "http://127.0.0.1:7001"
Set-Location $ProjectRoot
Write-Host "[PouchCare] Vite frontends -> $env:POUCHCARE_API_DEV_ORIGIN (landing :3001, management :3000)" -ForegroundColor Cyan
npx turbo run dev --filter=./apps/landing --filter=./apps/management
