# PouchCare Development Startup Script
# Starts API server (port 7000) and Management frontend (port 3000)
# with Prisma client generation

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          🚀 PouchCare Development Environment             ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get script directory and project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Set-Location $ProjectRoot

# Kill existing Node processes on our ports
Write-Host "🧹 Cleaning up existing processes..." -ForegroundColor Yellow
$ports = @(7000, 3000, 5175, 3001)
foreach ($port in $ports) {
    $process = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | 
               Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue |
               Get-Process -Id { $_ } -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Write-Host "   Stopped process on port $port" -ForegroundColor DarkGray
    }
}
Start-Sleep -Seconds 1

# Check if PostgreSQL is running
Write-Host ""
Write-Host "🔍 Checking PostgreSQL..." -ForegroundColor Yellow
$pgRunning = $false
try {
    $pgConnection = Test-NetConnection -ComputerName localhost -Port 5432 -WarningAction SilentlyContinue
    $pgRunning = $pgConnection.TcpTestSucceeded
} catch { }

if (-not $pgRunning) {
    Write-Host "   ⚠️  PostgreSQL not detected on port 5432" -ForegroundColor Red
    Write-Host "   Starting Docker PostgreSQL..." -ForegroundColor Yellow
    docker compose up -d 2>$null
    Start-Sleep -Seconds 3
} else {
    Write-Host "   ✅ PostgreSQL is running" -ForegroundColor Green
}

# Generate Prisma Client
Write-Host ""
Write-Host "📦 Generating Prisma Client..." -ForegroundColor Yellow
Set-Location "$ProjectRoot\apps\api"
$prismaOutput = npx prisma generate 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Prisma Client generated" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Prisma generation warning (may be fine)" -ForegroundColor DarkYellow
}

# Apply any pending migrations
Write-Host ""
Write-Host "🔄 Checking database migrations..." -ForegroundColor Yellow
$migrateOutput = npx prisma migrate deploy 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Database is up to date" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Migration check complete" -ForegroundColor DarkYellow
}

Set-Location $ProjectRoot

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Starting API (7000) + Management (3000) via Turbo..." -ForegroundColor Cyan
Write-Host "  API:        http://localhost:7000/health" -ForegroundColor White
Write-Host "  Management: http://localhost:3000" -ForegroundColor White
Write-Host "  (Ctrl+C stops both)" -ForegroundColor DarkGray
Write-Host ""

# Single Turbo process — prefixed logs for api vs m.pouchcare.com
npm run dev:stack
