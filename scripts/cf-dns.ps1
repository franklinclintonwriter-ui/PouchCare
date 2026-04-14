$token = "v1.0-be899afa3d57c7c7a3c6e59f-e1d0d2d2ecbe5cb126129e99c7cb758959c29c730498807a180ec936edab0eee1bfccd8597bf1bb87a03be6f95a578cabb7b4aab461155f904c2fb383d2beca54920a8fd25b5d7a6cd"
$zoneId = "a8107da0ca5a77baaa450eab987adba0"
$baseUrl = "https://api.cloudflare.com/client/v4/zones/$zoneId/dns_records"
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# 1. Verify token
Write-Host "=== Verifying token ==="
try {
    $v = Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/user/tokens/verify" -Headers $headers -Method Get
    Write-Host "Token status: $($v.result.status)"
} catch {
    Write-Host "Verify failed: $($_.Exception.Message)"
    $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
    Write-Host $sr.ReadToEnd()
    exit 1
}

# 2. DKIM TXT record
Write-Host "`n=== Adding DKIM TXT record ==="
$dkim = @{
    type    = "TXT"
    name    = "resend._domainkey"
    content = "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC39C5Duy9QyxvH61YkoS3HyBQGbnPKb0hy0oMaNF5PyQ7NzC9SyZubXsNhjgykAKRsBP6RVyS67GXNFj+FEJdpLLOqbzle0nwbQJvfGhaaIbIhxf5D0w+Lg8nw3rpcLfEbkTyRbnRqQB6hSfW68Y+9iiuqyKI70B1CkjC/wtG7lwIDAQAB"
    ttl     = 1
} | ConvertTo-Json
try {
    $r1 = Invoke-RestMethod -Uri $baseUrl -Headers $headers -Method Post -Body $dkim
    Write-Host "DKIM: success=$($r1.success) id=$($r1.result.id)"
} catch {
    Write-Host "DKIM failed: $($_.Exception.Message)"
    try { $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()); Write-Host $sr.ReadToEnd() } catch {}
}

# 3. MX record for send subdomain
Write-Host "`n=== Adding MX record ==="
$mx = @{
    type     = "MX"
    name     = "send"
    content  = "feedback-smtp.us-east-1.amazonses.com"
    priority = 10
    ttl      = 1
} | ConvertTo-Json
try {
    $r2 = Invoke-RestMethod -Uri $baseUrl -Headers $headers -Method Post -Body $mx
    Write-Host "MX: success=$($r2.success) id=$($r2.result.id)"
} catch {
    Write-Host "MX failed: $($_.Exception.Message)"
    try { $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()); Write-Host $sr.ReadToEnd() } catch {}
}

# 4. SPF TXT record for send subdomain
Write-Host "`n=== Adding SPF TXT record ==="
$spf = @{
    type    = "TXT"
    name    = "send"
    content = "v=spf1 include:amazonses.com ~all"
    ttl     = 1
} | ConvertTo-Json
try {
    $r3 = Invoke-RestMethod -Uri $baseUrl -Headers $headers -Method Post -Body $spf
    Write-Host "SPF: success=$($r3.success) id=$($r3.result.id)"
} catch {
    Write-Host "SPF failed: $($_.Exception.Message)"
    try { $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream()); Write-Host $sr.ReadToEnd() } catch {}
}

Write-Host "`n=== Done ==="
