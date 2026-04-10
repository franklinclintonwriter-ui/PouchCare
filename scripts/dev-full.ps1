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
$ports = @(7000, 3000, 5175, 5176)
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

# Start API Server
Write-Host "🔧 Starting API Server (port 7000)..." -ForegroundColor Cyan
$apiJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location "$root\apps\api"
    npx tsx watch src/server.ts
} -ArgumentList $ProjectRoot

# Wait a moment for API to initialize
Start-Sleep -Seconds 2

# Start Management Frontend
Write-Host "🎨 Starting Management Frontend (port 3000)..." -ForegroundColor Cyan
$mgmtJob = Start-Job -ScriptBlock {
    param($root)
    Set-Location "$root\apps\management"
    npm run dev
} -ArgumentList $ProjectRoot

# Wait for services to start
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✅ Development servers starting!" -ForegroundColor Green
Write-Host ""
Write-Host "   📡 API:        http://localhost:7000" -ForegroundColor White
Write-Host "   🖥️  Management: http://localhost:3000" -ForegroundColor White
Write-Host "   📊 Prisma:     npx prisma studio (run manually)" -ForegroundColor DarkGray
Write-Host ""
Write-Host "   Press Ctrl+C to stop all servers" -ForegroundColor DarkGray
Write-Host ""

# Monitor jobs and stream output
try {
    while ($true) {
        # Get and display API output
        $apiOutput = Receive-Job -Job $apiJob -ErrorAction SilentlyContinue
        if ($apiOutput) {
            $apiOutput | ForEach-Object { Write-Host "[API] $_" -ForegroundColor Blue }
        }

        # Get and display Management output
        $mgmtOutput = Receive-Job -Job $mgmtJob -ErrorAction SilentlyContinue
        if ($mgmtOutput) {
            $mgmtOutput | ForEach-Object { Write-Host "[MGMT] $_" -ForegroundColor Magenta }
        }

        # Check if jobs are still running
        if ($apiJob.State -eq "Failed" -or $mgmtJob.State -eq "Failed") {
            Write-Host "⚠️  A job has failed. Check the output above." -ForegroundColor Red
        }

        Start-Sleep -Milliseconds 500
    }
} finally {
    Write-Host ""
    Write-Host "🛑 Stopping servers..." -ForegroundColor Yellow
    Stop-Job -Job $apiJob -ErrorAction SilentlyContinue
    Stop-Job -Job $mgmtJob -ErrorAction SilentlyContinue
    Remove-Job -Job $apiJob -Force -ErrorAction SilentlyContinue
    Remove-Job -Job $mgmtJob -Force -ErrorAction SilentlyContinue
    Write-Host "✅ Servers stopped" -ForegroundColor Green
}
