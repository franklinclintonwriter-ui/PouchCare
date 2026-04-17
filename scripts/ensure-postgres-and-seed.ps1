# Start Docker (if needed), bring up Postgres/Redis, then prisma db push + seed.
# From repo root:  powershell -ExecutionPolicy Bypass -File scripts/ensure-postgres-and-seed.ps1

$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path "$root\apps\api\prisma\schema.prisma")) {
  Write-Host "Could not find apps\api\prisma\schema.prisma" -ForegroundColor Red
  exit 1
}

function Test-PgReady {
  try {
    $c = Test-NetConnection -ComputerName 127.0.0.1 -Port 5432 -WarningAction SilentlyContinue
    return $c.TcpTestSucceeded
  } catch { return $false }
}

function Test-DockerDaemon {
  try {
    docker info 2>$null | Out-Null
    return $LASTEXITCODE -eq 0
  } catch { return $false }
}

function Start-DockerDesktopIfNeeded {
  if (Test-DockerDaemon) { return $true }
  $candidates = @(
    "${env:ProgramFiles}\Docker\Docker\Docker Desktop.exe",
    "${env:ProgramFiles(x86)}\Docker\Docker\Docker Desktop.exe",
    "$env:LOCALAPPDATA\Docker\Docker Desktop.exe"
  )
  foreach ($exe in $candidates) {
    if (Test-Path $exe) {
      Write-Host "Starting Docker Desktop (one-time launch)..." -ForegroundColor Yellow
      Start-Process -FilePath $exe -ErrorAction SilentlyContinue
      return $true
    }
  }
  return $false
}

$dockerCmd = Get-Command docker -ErrorAction SilentlyContinue
if (-not $dockerCmd) {
  Write-Host "Docker CLI not found. Install Docker Desktop from https://www.docker.com/products/docker-desktop/" -ForegroundColor Red
  exit 1
}

if (-not (Test-PgReady)) {
  if (-not (Test-DockerDaemon)) {
    Start-DockerDesktopIfNeeded | Out-Null
    Write-Host "Waiting for Docker engine (up to 120s)..." -ForegroundColor Yellow
    $deadline = (Get-Date).AddSeconds(120)
    while (-not (Test-DockerDaemon) -and (Get-Date) -lt $deadline) {
      Start-Sleep -Seconds 3
    }
  }
  if (Test-DockerDaemon) {
    Write-Host "Starting containers (docker compose up -d)..." -ForegroundColor Cyan
    Set-Location $root
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    Set-Location "$root\apps\api"
    $deadline = (Get-Date).AddSeconds(60)
    while (-not (Test-PgReady) -and (Get-Date) -lt $deadline) {
      Start-Sleep -Seconds 2
    }
  }
}

if (-not (Test-PgReady)) {
  Write-Host ""
  Write-Host "PostgreSQL is not reachable on 127.0.0.1:5432." -ForegroundColor Red
  Write-Host "Start Docker Desktop manually, wait until it shows ""Running"", then run this script again." -ForegroundColor Yellow
  Write-Host "Or:  docker compose up -d   from repo root" -ForegroundColor DarkGray
  exit 1
}

Set-Location "$root\apps\api"
if (-not (Test-Path ".env")) {
  if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env"
    Write-Host "Created apps\api\.env from .env.example" -ForegroundColor Yellow
  }
}

Write-Host "Prisma generate + db push..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx prisma db push
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "Seeding database..." -ForegroundColor Cyan
npm run db:seed
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "Database ready." -ForegroundColor Green
Write-Host "  Staff:   ceo@pouchcare.com / Password123!" -ForegroundColor White
Write-Host "  Portal:  Test@pouchcare.com / Test@123" -ForegroundColor White
Write-Host "  (Also: john@example.com / Password123!)" -ForegroundColor DarkGray
Write-Host ""
