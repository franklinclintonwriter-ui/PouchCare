# PouchCare — one-shot local setup: Docker DB/Redis, npm install, Prisma migrate + seed
# Prerequisites: Node.js 20+ on PATH, Docker Desktop running (for PostgreSQL + Redis)
# Usage (from repo root):  npm run bootstrap
#    or:  powershell -ExecutionPolicy Bypass -File scripts/bootstrap-local.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host ""
Write-Host "[PouchCare] Local bootstrap" -ForegroundColor Cyan
Write-Host ""

function Test-PgReady {
  try {
    $c = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue
    return $c.TcpTestSucceeded
  } catch { return $false }
}

$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host "Node.js was not found on PATH." -ForegroundColor Red
  Write-Host "Install Node.js 20 LTS from https://nodejs.org and reopen your terminal, then run again." -ForegroundColor Yellow
  exit 1
}

$npm = Get-Command npm -ErrorAction SilentlyContinue
if (-not $npm) {
  Write-Host "npm was not found on PATH." -ForegroundColor Red
  exit 1
}

$apiEnv = Join-Path $root "apps\api\.env"
$apiEnvExample = Join-Path $root "apps\api\.env.example"
if (-not (Test-Path $apiEnv)) {
  if (Test-Path $apiEnvExample) {
    Write-Host "Creating apps\api\.env from .env.example (edit JWT secrets for anything non-local)." -ForegroundColor Yellow
    Copy-Item $apiEnvExample $apiEnv
  } else {
    Write-Host "Missing apps\api\.env.example" -ForegroundColor Red
    exit 1
  }
}

$docker = Get-Command docker -ErrorAction SilentlyContinue
if (-not $docker) {
  Write-Host "Docker was not found. Install Docker Desktop for PostgreSQL + Redis, or run Postgres/Redis yourself on localhost." -ForegroundColor Red
  exit 1
}

if (-not (Test-PgReady)) {
  Write-Host "Starting PostgreSQL + Redis (docker compose)..." -ForegroundColor Yellow
  docker compose up -d
  if ($LASTEXITCODE -ne 0) {
    Write-Host "docker compose failed. Start Docker Desktop and ensure the engine is running, then retry." -ForegroundColor Red
    exit 1
  }
  $deadline = (Get-Date).AddSeconds(60)
  while (-not (Test-PgReady) -and (Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 2
  }
}

if (-not (Test-PgReady)) {
  Write-Host "PostgreSQL is not reachable on 127.0.0.1:5432." -ForegroundColor Red
  Write-Host "Start Docker Desktop, wait until it is ready, then run:  docker compose up -d" -ForegroundColor Yellow
  exit 1
}

Write-Host "Installing npm dependencies (repo root)..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Set-Location "$root\apps\api"
Write-Host "Prisma generate + migrate deploy + seed..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npm run db:seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Set-Location $root
Write-Host ""
Write-Host "Bootstrap complete." -ForegroundColor Green
Write-Host "  API health:     http://localhost:7000/health" -ForegroundColor White
Write-Host "  Staff example:  ceo@pouchcare.com / Password123!" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Start backend + Management UI:" -ForegroundColor Cyan
Write-Host "  npm run dev:stack    (API 7000 + Management 3000, any shell)" -ForegroundColor White
Write-Host "  npm run dev:full     (same + Prisma generate/migrate first, Windows)" -ForegroundColor White
Write-Host "Or API only:  npm run dev:api" -ForegroundColor DarkGray
Write-Host ""
