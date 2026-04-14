# PouchCare Quick Dev Start
# Runs API and Management in separate terminal windows

$ErrorActionPreference = "SilentlyContinue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Write-Host ""
Write-Host "[PouchCare] Dev Startup" -ForegroundColor Cyan
Write-Host ""

# Kill existing processes on dev ports
Write-Host "Cleaning up ports..." -ForegroundColor Yellow
$ports = @(7000, 3000)
foreach ($port in $ports) {
    $pid = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess
    if ($pid) { Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 1

# Generate Prisma
Write-Host "Generating Prisma Client..." -ForegroundColor Yellow
Push-Location "$ProjectRoot\apps\api"
npx prisma generate 2>$null | Out-Null
npx prisma migrate deploy 2>$null | Out-Null
Pop-Location

Write-Host ""
Write-Host "Starting services..." -ForegroundColor Green
Write-Host ""

# Start API in new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\apps\api'; Write-Host '[API Server - port 7000]' -ForegroundColor Cyan; npx tsx watch src/server.ts"

# Start Management in new terminal  
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ProjectRoot\apps\management'; Write-Host '[Management - port 3000]' -ForegroundColor Magenta; npm run dev"

Start-Sleep -Seconds 2

Write-Host "Dev servers launched in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "   API:        http://localhost:7000" -ForegroundColor White
Write-Host "   Management: http://localhost:3000" -ForegroundColor White
Write-Host ""
