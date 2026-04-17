# Automates Cloudflare Tunnel + Docker hosting for PouchCare API (remote-managed tunnel).
#
# Requires in repo root .env and/or apps/api/.env:
#   CLOUDFLARE_ACCOUNT_ID
#   CLOUDFLARE_API_TOKEN   (Account: Cloudflare Tunnel Edit; Zone: DNS Edit)
#   CLOUDFLARE_ZONE_ID     (zone for DNS — optional if CLOUDFLARE_ZONE_NAME is set)
#
# Optional:
#   CLOUDFLARE_ZONE_NAME   (default: pouchcare.com)
#
# Usage (repo root):
#   powershell -ExecutionPolicy Bypass -File scripts/cloudflare-tunnel-docker-setup.ps1
#   powershell -ExecutionPolicy Bypass -File scripts/cloudflare-tunnel-docker-setup.ps1 -StartDocker
#
# Or: npm run tunnel:docker:setup
#     npm run tunnel:docker:setup -- -StartDocker
#
# What it does:
#   1) Finds or creates tunnel "pouchcare-docker" (config_src: cloudflare)
#   2) PUTs ingress: api hostname -> http://api:7000 (Docker service name on Compose network)
#   3) Creates proxied CNAME for api.<zone> -> <tunnel_id>.cfargotunnel.com
#   4) Writes TUNNEL_TOKEN to repo root .env (does not print the token)
#   5) If -StartDocker: docker compose hosting + tunnel profile up -d --build

param(
    [string] $TunnelName = "pouchcare-docker",
    [string] $ApiHostname = "api.pouchcare.com",
    [string] $DockerServiceUrl = "http://api:7000",
    [string] $ZoneName = "",
    [switch] $StartDocker
)

$ErrorActionPreference = "Stop"
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

function Read-DotEnvFile([string] $path) {
    $h = @{}
    if (-not (Test-Path $path)) { return $h }
    Get-Content -LiteralPath $path -Encoding UTF8 | ForEach-Object {
        $line = $_.Trim()
        if ($line -match '^\s*#' -or $line -eq "") { return }
        $ix = $line.IndexOf("=")
        if ($ix -lt 1) { return }
        $k = $line.Substring(0, $ix).Trim()
        $v = $line.Substring($ix + 1).Trim()
        if ($v.Length -ge 2 -and (($v.StartsWith('"') -and $v.EndsWith('"')) -or ($v.StartsWith("'") -and $v.EndsWith("'")))) {
            $v = $v.Substring(1, $v.Length - 2)
        }
        $h[$k] = $v
    }
    $h
}

function Merge-Env([hashtable] $base, [hashtable] $overlay) {
    $o = $base.Clone()
    foreach ($k in $overlay.Keys) { $o[$k] = $overlay[$k] }
    $o
}

function Set-EnvFileKey([string] $envPath, [string] $key, [string] $value) {
    $dir = Split-Path -Parent $envPath
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    $lines = @()
    if (Test-Path $envPath) { $lines = @(Get-Content -LiteralPath $envPath -Encoding UTF8) }
    $found = $false
    $out = New-Object System.Collections.ArrayList
    foreach ($line in $lines) {
        if ($line -match "^\s*$key\s*=") {
            [void]$out.Add("$key=$value")
            $found = $true
        } else {
            [void]$out.Add($line)
        }
    }
    if (-not $found) {
        if ($out.Count -gt 0 -and [string]$out[$out.Count - 1] -ne "") { [void]$out.Add("") }
        [void]$out.Add("$key=$value")
    }
    Set-Content -LiteralPath $envPath -Value $out -Encoding UTF8
}

function Invoke-CfApi {
    param([string] $Method, [string] $Uri, [hashtable] $Headers, $Body = $null)
    $params = @{ Uri = $Uri; Method = $Method; Headers = $Headers }
    if ($null -ne $Body) {
        $params.ContentType = "application/json"
        $params.Body = ($Body | ConvertTo-Json -Depth 20 -Compress)
    }
    $resp = Invoke-RestMethod @params
    if (-not $resp.success) {
        $msg = ($resp.errors | ForEach-Object { $_.message }) -join "; "
        if (-not $msg) { $msg = "Cloudflare API error" }
        throw $msg
    }
    $resp
}

function Try-ResolveZoneId {
    param(
        [hashtable] $Headers,
        [string] $ApiHost,
        [string] $ExplicitZoneName
    )
    $base = "https://api.cloudflare.com/client/v4"
    if ($ExplicitZoneName) {
        $zr = Invoke-CfApi -Method GET -Uri "$base/zones?name=$ExplicitZoneName" -Headers $Headers
        if ($zr.result -and $zr.result.Count -ge 1) { return [string]$zr.result[0].id }
        Write-Host "Zone '$ExplicitZoneName' not found; matching hostname '$ApiHost' against your zones..." -ForegroundColor Yellow
    }
    $all = Invoke-CfApi -Method GET -Uri "$base/zones?per_page=50" -Headers $Headers
    if (-not $all.result -or $all.result.Count -lt 1) {
        return $null
    }
    $best = $null
    foreach ($z in $all.result) {
        $zn = [string]$z.name
        if ($ApiHost -eq $zn) { $best = $z; break }
        if ($ApiHost.EndsWith(".$zn", [StringComparison]::OrdinalIgnoreCase)) {
            if (-not $best -or $zn.Length -gt [string]$best.name.Length) { $best = $z }
        }
    }
    if ($best) {
        Write-Host "Matched zone '$($best.name)' for hostname '$ApiHost'." -ForegroundColor Green
        return [string]$best.id
    }
    $names = ($all.result | ForEach-Object { $_.name }) -join ", "
    Write-Host "No zone matched '$ApiHost'. Available: $names. Set CLOUDFLARE_ZONE_ID if needed." -ForegroundColor Yellow
    return $null
}

$rootEnv = Read-DotEnvFile (Join-Path $ProjectRoot ".env")
$apiEnv = Read-DotEnvFile (Join-Path $ProjectRoot "apps\api\.env")
$envVars = Merge-Env $apiEnv $rootEnv

$AccountId = $envVars["CLOUDFLARE_ACCOUNT_ID"]
$CfToken = $envVars["CLOUDFLARE_API_TOKEN"]
$ZoneId = $envVars["CLOUDFLARE_ZONE_ID"]
if (-not $ZoneName) { $ZoneName = $envVars["CLOUDFLARE_ZONE_NAME"] }

Write-Host ""
Write-Host "[PouchCare] Cloudflare Tunnel (Docker) setup" -ForegroundColor Cyan
Write-Host ""

if (-not $AccountId -or -not $CfToken) {
    Write-Host "Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN in .env or apps/api/.env." -ForegroundColor Yellow
    Write-Host "Create an API token: Account > Cloudflare Tunnel > Edit, Zone > DNS > Edit." -ForegroundColor Yellow
    Write-Host "Then re-run: npm run tunnel:docker:setup" -ForegroundColor White
    exit 1
}

$headers = @{ Authorization = "Bearer $CfToken" }
$base = "https://api.cloudflare.com/client/v4"

if (-not $ZoneId) {
    Write-Host "Resolving zone for API hostname '$ApiHostname'..." -ForegroundColor Gray
    $explicitZn = $(if ($ZoneName) { $ZoneName } elseif ($envVars["CLOUDFLARE_ZONE_NAME"]) { $envVars["CLOUDFLARE_ZONE_NAME"] } else { $null })
    $ZoneId = Try-ResolveZoneId -Headers $headers -ApiHost $ApiHostname -ExplicitZoneName $explicitZn
}
if ($ZoneId) {
    Write-Host "Zone ID: $ZoneId" -ForegroundColor Green
} else {
    Write-Host "DNS: skipped (no zone). Token may be Tunnel-only. Add Zone > Zone Read + Zone > DNS Edit, set CLOUDFLARE_ZONE_ID, or create a CNAME manually (see below)." -ForegroundColor Yellow
}

# --- List or create tunnel ---
Write-Host "Looking for tunnel '$TunnelName'..." -ForegroundColor Gray
$listUri = "$base/accounts/$AccountId/cfd_tunnel"
$list = Invoke-CfApi -Method GET -Uri $listUri -Headers $headers
$tunnelId = $null
$token = $null
foreach ($t in $list.result) {
    if ($t.name -eq $TunnelName -and -not $t.deleted_at) {
        $tunnelId = [string]$t.id
        break
    }
}

if ($tunnelId) {
    Write-Host "Using existing tunnel id=$tunnelId" -ForegroundColor Green
    $tokResp = Invoke-CfApi -Method GET -Uri "$base/accounts/$AccountId/cfd_tunnel/$tunnelId/token" -Headers $headers
    $token = [string]$tokResp.result
} else {
    Write-Host "Creating tunnel '$TunnelName'..." -ForegroundColor Yellow
    $body = @{ name = $TunnelName; config_src = "cloudflare" }
    $cr = Invoke-CfApi -Method POST -Uri $listUri -Headers $headers -Body $body
    $tunnelId = [string]$cr.result.id
    $token = [string]$cr.result.token
    if (-not $token) {
        $tokResp = Invoke-CfApi -Method GET -Uri "$base/accounts/$AccountId/cfd_tunnel/$tunnelId/token" -Headers $headers
        $token = [string]$tokResp.result
    }
    Write-Host "Created tunnel id=$tunnelId" -ForegroundColor Green
}

# --- Ingress (Docker network: api service) ---
Write-Host "Publishing ingress: $ApiHostname -> $DockerServiceUrl" -ForegroundColor Gray
$ingressBody = @{
    config = @{
        ingress = @(
            @{
                hostname     = $ApiHostname
                service      = $DockerServiceUrl
                originRequest = @{}
            },
            @{
                service = "http_status:404"
            }
        )
    }
}
Invoke-CfApi -Method PUT -Uri "$base/accounts/$AccountId/cfd_tunnel/$tunnelId/configurations" -Headers $headers -Body $ingressBody | Out-Null
Write-Host "Ingress updated." -ForegroundColor Green

# --- DNS CNAME (needs Zone permissions on token, or CLOUDFLARE_ZONE_ID) ---
$cnameTarget = "$tunnelId.cfargotunnel.com"
if ($ZoneId) {
    $recordName = $ApiHostname
    Write-Host "Ensuring DNS CNAME: $recordName -> $cnameTarget" -ForegroundColor Gray
    $existing = Invoke-RestMethod -Uri "$base/zones/$ZoneId/dns_records?type=CNAME&name=$recordName" -Headers $headers -Method GET
    $rec = $null
    if ($existing.success -and $existing.result) {
        foreach ($r in $existing.result) {
            if ($r.name -eq $recordName -or $r.name -eq ($recordName + ".")) { $rec = $r; break }
        }
    }
    $dnsBody = @{
        type    = "CNAME"
        name    = $recordName
        content = $cnameTarget
        proxied = $true
    }
    if ($rec) {
        Invoke-CfApi -Method PUT -Uri "$base/zones/$ZoneId/dns_records/$($rec.id)" -Headers $headers -Body $dnsBody | Out-Null
        Write-Host "DNS record updated." -ForegroundColor Green
    } else {
        Invoke-CfApi -Method POST -Uri "$base/zones/$ZoneId/dns_records" -Headers $headers -Body $dnsBody | Out-Null
        Write-Host "DNS record created." -ForegroundColor Green
    }
} else {
    Write-Host "Manual DNS: in Cloudflare DNS for your zone, add (or edit) a CNAME:" -ForegroundColor Yellow
    Write-Host "  Name: $ApiHostname  ->  Target: $cnameTarget  (Proxied / orange cloud ON)" -ForegroundColor White
}

# --- Write .env ---
$envOut = Join-Path $ProjectRoot ".env"
Set-EnvFileKey -envPath $envOut -key "TUNNEL_TOKEN" -value $token
Write-Host "Wrote TUNNEL_TOKEN to .env (value not shown)." -ForegroundColor Green

# --- Optional: Docker ---
if ($StartDocker) {
    Write-Host ""
    Write-Host "Starting Docker stack (hosting + tunnel profile)..." -ForegroundColor Cyan
    Push-Location $ProjectRoot
    try {
        & docker compose -f docker-compose.hosting.yml --profile tunnel up -d --build
        if ($LASTEXITCODE -ne 0) { throw "docker compose exited with $LASTEXITCODE" }
    } finally {
        Pop-Location
    }
    Write-Host "Done. Check: https://$ApiHostname/health" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Next: npm run docker:hosting:tunnel   (or re-run with -StartDocker)" -ForegroundColor White
}

Write-Host ""
