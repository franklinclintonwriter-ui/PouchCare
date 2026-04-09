# PouchCare — full local dev cycle: free ports -> DB up -> prisma push + seed -> restart API + 3 frontends
# Run from repo root:  powershell -ExecutionPolicy Bypass -File scripts/dev-full.ps1
# Or:  npm run dev:full

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

function Stop-ListenPort {
  param([int]$Port)
  Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}

function Test-Pg {
  try {
    (Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue).TcpTestSucceeded
  } catch { $false }
}

function Find-Docker {
  if (Get-Command docker -ErrorAction SilentlyContinue) { return "docker" }
  $candidates = @(
    "${env:ProgramFiles}\Docker\Docker\resources\bin\docker.exe",
    "${env:ProgramFiles}\Docker\Docker\resources\docker.exe"
  )
  foreach ($p in $candidates) {
    if (Test-Path $p) { return $p }
  }
  $null
}

function Start-NpmDev {
  param([string]$ScriptName)
  $npmExe = (Get-Command npm.cmd -ErrorAction SilentlyContinue).Source
  if (-not $npmExe) { $npmExe = "npm.cmd" }
  $inner = "Set-Location -LiteralPath '$root'; & '$npmExe' run $ScriptName"
  Start-Process powershell -ArgumentList "-NoProfile", "-WindowStyle", "Minimized", "-Command", $inner
}

Write-Host ""
Write-Host "=== PouchCare dev-full ===" -ForegroundColor Cyan

# 1) Stop previous dev servers
Write-Host ""
Write-Host "[1/5] Stopping dev processes on ports 7000, 3000, 5175, 5176..." -ForegroundColor Yellow
foreach ($p in 7000, 3000, 5175, 5176) { Stop-ListenPort -Port $p }
Start-Sleep -Seconds 1

# 2) PostgreSQL via Docker if available and not already listening
if (-not (Test-Pg)) {
  $docker = Find-Docker
  if ($docker) {
    Write-Host "[2/5] Starting docker compose (Postgres + Redis)..." -ForegroundColor Yellow
    if ($docker -eq "docker") { docker compose up -d }
    else { & $docker compose up -d }
    $deadline = (Get-Date).AddSeconds(60)
    while (-not (Test-Pg) -and (Get-Date) -lt $deadline) { Start-Sleep -Seconds 2 }
  } else {
    Write-Host "[2/5] Docker not found - install Docker Desktop, or install PostgreSQL on localhost:5432" -ForegroundColor Red
  }
}

# 3) Prisma push + seed
if (Test-Pg) {
  Write-Host ""
  Write-Host "[3/5] prisma generate + db push + seed..." -ForegroundColor Yellow
  Set-Location "$root\apps\api"
  npx prisma generate
  npx prisma db push
  npx prisma db seed
  if ($LASTEXITCODE -ne 0) {
    Write-Host "Seed failed - check apps/api/.env DATABASE_URL" -ForegroundColor Red
  } else {
    Write-Host "Database ready (demo users: Password123!)" -ForegroundColor Green
  }
  Set-Location $root
} else {
  Write-Host ""
  Write-Host "[3/5] SKIP prisma - PostgreSQL not reachable on 127.0.0.1:5432" -ForegroundColor Red
  Write-Host "      Fix: install Docker Desktop and run: docker compose up -d" -ForegroundColor Yellow
  Write-Host "      Or install PostgreSQL 16 and match DATABASE_URL in apps/api/.env" -ForegroundColor Yellow
}

# 4) PATH for child processes
$machinePath = [System.Environment]::GetEnvironmentVariable('PATH', 'Machine')
$userPath = [System.Environment]::GetEnvironmentVariable('PATH', 'User')
$env:PATH = $machinePath + ';' + $userPath

Write-Host ""
Write-Host "[4/5] Starting API (7000)..." -ForegroundColor Yellow
Start-NpmDev -ScriptName "dev:api"

Start-Sleep -Seconds 2

Write-Host "[5/5] Starting Management (3000), Office (5175), Client portal (5176)..." -ForegroundColor Yellow
Start-NpmDev -ScriptName "dev:mgmt"
Start-NpmDev -ScriptName "dev:office"
Start-NpmDev -ScriptName "dev:portal"

Write-Host ""
Write-Host "Done. URLs:" -ForegroundColor Green
Write-Host "  API:        http://localhost:7000"
Write-Host "  Management: http://localhost:3000"
Write-Host "  Office:     http://localhost:5175"
Write-Host "  Portal:     http://localhost:5176"
Write-Host ""
