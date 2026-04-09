# PouchCare — apply Prisma schema + seed demo users (local dev)
# Requires: PostgreSQL on localhost:5432 (see docker-compose.yml) and Redis for some features.
# Usage:  powershell -ExecutionPolicy Bypass -File scripts/dev-db-setup.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path "$root\apps\api\prisma\schema.prisma")) {
  Write-Host "Could not find apps\api\prisma\schema.prisma from $root" -ForegroundColor Red
  exit 1
}
Set-Location "$root\apps\api"

function Test-PgReady {
  try {
    $c = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue
    return $c.TcpTestSucceeded
  } catch { return $false }
}

if (-not (Test-PgReady)) {
  $docker = Get-Command docker -ErrorAction SilentlyContinue
  if ($docker) {
    Write-Host "Starting PostgreSQL + Redis with Docker Compose..."
    Set-Location $root
    docker compose up -d
    Set-Location "$root\apps\api"
    $deadline = (Get-Date).AddSeconds(45)
    while (-not (Test-PgReady) -and (Get-Date) -lt $deadline) {
      Start-Sleep -Seconds 2
    }
  }
}

if (-not (Test-PgReady)) {
  Write-Host ""
  Write-Host "PostgreSQL is not reachable on localhost:5432." -ForegroundColor Red
  Write-Host "Do one of the following:" -ForegroundColor Yellow
  Write-Host "  1) Install Docker Desktop, then from repo root run:  docker compose up -d"
  Write-Host "  2) Install PostgreSQL 16, create user/db matching apps/api/.env.example (DATABASE_URL)"
  Write-Host ""
  exit 1
}

Write-Host "Applying schema (prisma db push)..."
npx prisma generate
npx prisma db push

Write-Host "Seeding demo data..."
npm run db:seed

Write-Host ""
Write-Host "Done. Staff login (Management / Office):  ceo@pouchcare.com  /  Password123!" -ForegroundColor Green
Write-Host "Client portal:  john@example.com  /  Password123!" -ForegroundColor Green
Write-Host "Restart the API dev server if it is already running." -ForegroundColor Cyan
