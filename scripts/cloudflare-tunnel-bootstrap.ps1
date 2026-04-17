# Automates Cloudflare Tunnel setup AFTER one manual step:
#   cloudflared tunnel login
# (Opens browser - only you can click Authorize in your Cloudflare account.)
#
# Usage (from repo root):
#   powershell -ExecutionPolicy Bypass -File scripts/cloudflare-tunnel-bootstrap.ps1
# Or: npm run tunnel:bootstrap

# Native cloudflared writes JSON logs to stderr; "Stop" turns that into a terminating error.
$ErrorActionPreference = "Continue"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$CfDir = Join-Path $env:USERPROFILE ".cloudflared"
$CertPath = Join-Path $CfDir "cert.pem"
$TunnelName = "pouchcare-dev"
$ConfigOut = Join-Path $ProjectRoot "deploy\cloudflared\config.yml"

function Get-Cloudflared {
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    $cmd = Get-Command cloudflared -ErrorAction SilentlyContinue
    if (-not $cmd) { $ErrorActionPreference = "Stop"; throw "cloudflared not found in PATH. Install: winget install Cloudflare.cloudflared" }
    return $cmd.Source
}

$cloudflared = Get-Cloudflared
Write-Host ""
Write-Host "[PouchCare] Cloudflare Tunnel bootstrap" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $CertPath)) {
    Write-Host "Missing: $CertPath" -ForegroundColor Yellow
    Write-Host "This file is created ONLY after you log in to Cloudflare once." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Do this now on THIS computer:" -ForegroundColor White
    Write-Host "  1. Run:  cloudflared tunnel login" -ForegroundColor Green
    Write-Host "  2. Complete the browser flow (pick your zone, click Authorize)." -ForegroundColor Green
    Write-Host "  3. Run this script again:  npm run tunnel:bootstrap" -ForegroundColor Green
    Write-Host ""
    Write-Host "The AI/agent cannot complete this step for you - it requires your Cloudflare session." -ForegroundColor DarkGray
    exit 1
}

Write-Host "OK: cert.pem found - continuing..." -ForegroundColor Green

# Ensure tunnel exists (suppress stderr: cloudflared logs JSON warnings that break parsing)
$listJson = & $cloudflared tunnel list -o json --name $TunnelName 2>$null
if ($LASTEXITCODE -ne 0) { throw "cloudflared tunnel list failed: exit $LASTEXITCODE" }

function Get-TunnelIdFromListJson([string]$json) {
    $o = $json | ConvertFrom-Json
    if ($null -eq $o) { return $null }
    if ($o -is [System.Array]) {
        if ($o.Length -gt 0 -and $o[0].id) { return [string]$o[0].id }
        return $null
    }
    if ($o.id) { return [string]$o.id }
    return $null
}

$tunnelId = Get-TunnelIdFromListJson $listJson

if ($tunnelId) {
    Write-Host "Using existing tunnel '$TunnelName' id=$tunnelId" -ForegroundColor Green
} else {
    Write-Host "Creating tunnel '$TunnelName'..." -ForegroundColor Yellow
    $createOut = (& $cloudflared tunnel create $TunnelName 2>&1 | Out-String)
    if ($LASTEXITCODE -ne 0) { throw "tunnel create failed: $createOut" }
    $listJson2 = & $cloudflared tunnel list -o json --name $TunnelName 2>$null
    $tunnelId = Get-TunnelIdFromListJson $listJson2
    if (-not $tunnelId -and $createOut -match '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}') {
        $tunnelId = $Matches[0]
    }
    if (-not $tunnelId) { throw "Could not determine tunnel UUID after create. Output:`n$createOut" }
    Write-Host "Created tunnel id=$tunnelId" -ForegroundColor Green
}

$credFile = Join-Path $CfDir "$tunnelId.json"
if (-not (Test-Path $credFile)) {
    throw "Missing credentials file: $credFile"
}

# Windows path with forward slashes for YAML
$credYaml = ($credFile -replace "\\", "/")

$ingressYaml = @"
tunnel: $tunnelId
credentials-file: $credYaml

ingress:
  - hostname: api.pouchcare.com
    service: http://127.0.0.1:7000
  - hostname: m.pouchcare.com
    service: http://127.0.0.1:3000
  - hostname: www.pouchcare.com
    service: http://127.0.0.1:3001
  - hostname: pouchcare.com
    service: http://127.0.0.1:3001
  - service: http_status:404
"@

$deployCf = Join-Path $ProjectRoot "deploy\cloudflared"
if (-not (Test-Path $deployCf)) { New-Item -ItemType Directory -Path $deployCf -Force | Out-Null }
[System.IO.File]::WriteAllText($ConfigOut, $ingressYaml.TrimEnd() + "`n", [System.Text.UTF8Encoding]::new($false))
Write-Host "Wrote: $ConfigOut" -ForegroundColor Green

& $cloudflared tunnel --config $ConfigOut ingress validate
if ($LASTEXITCODE -ne 0) { throw "ingress validate failed" }

$hosts = @(
    "api.pouchcare.com",
    "m.pouchcare.com",
    "pouchcare.com",
    "www.pouchcare.com"
)
Write-Host ""
Write-Host "Routing DNS (ignore errors if records already exist or zone differs)..." -ForegroundColor Yellow
foreach ($h in $hosts) {
    $r = & $cloudflared tunnel route dns $TunnelName $h 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  OK: $h" -ForegroundColor Green
    } else {
        Write-Host "  Skip/fail: $h - $r" -ForegroundColor DarkYellow
    }
}

Write-Host ""
Write-Host "Done." -ForegroundColor Cyan
Write-Host "  1. Terminal A:  npm run dev" -ForegroundColor White
Write-Host "  2. Terminal B:  npm run tunnel:dev" -ForegroundColor White
Write-Host ""
