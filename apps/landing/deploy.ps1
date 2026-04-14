# PouchCare Landing — One-click Cloudflare Pages Deploy
# Run this script from PowerShell (NOT inside Cursor terminal)
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"
$ProjectName = "pouchcare"
$BuildDir = "dist"

Write-Host ""
Write-Host "=== PouchCare Cloudflare Pages Deploy ===" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Build ────────────────────────────────────────────────────────────
Write-Host "[1/3] Building production bundle..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "Build failed!" -ForegroundColor Red; exit 1 }
Write-Host "      Build complete." -ForegroundColor Green

# ── Step 2: Login (skipped if already authenticated) ─────────────────────────
Write-Host ""
Write-Host "[2/3] Checking Cloudflare authentication..." -ForegroundColor Yellow
$tokenCheck = npx wrangler whoami 2>&1
if ($tokenCheck -match "You are not authenticated") {
    Write-Host "      Not logged in — opening browser for login..." -ForegroundColor Yellow
    npx wrangler login
    if ($LASTEXITCODE -ne 0) { Write-Host "Login failed!" -ForegroundColor Red; exit 1 }
} else {
    Write-Host "      Already authenticated." -ForegroundColor Green
}

# ── Step 3: Deploy ───────────────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/3] Deploying to Cloudflare Pages..." -ForegroundColor Yellow
npx wrangler pages deploy $BuildDir --project-name $ProjectName --branch main
if ($LASTEXITCODE -ne 0) { Write-Host "Deploy failed!" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "=== Deploy complete! ===" -ForegroundColor Green
Write-Host "Your site is live. Set your custom domain in:" -ForegroundColor Cyan
Write-Host "https://dash.cloudflare.com -> Pages -> $ProjectName -> Custom Domains" -ForegroundColor Cyan
Write-Host ""
