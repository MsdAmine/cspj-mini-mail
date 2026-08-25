$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "http://localhost:5182"

# 1. Clean zombie processes
Get-Process -Name "CspjMail.Api", "dotnet" -ErrorAction SilentlyContinue | Stop-Process -Force

# 2. Build backend
dotnet build backend\CspjMail.Api --no-restore -v q

# 3. Ensure a local developer code-signing cert exists
$cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert | Select-Object -First 1
if (-not $cert) {
    $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=DevCert" -CertStoreLocation "Cert:\CurrentUser\My"
}

# 4. Sign the assembly to satisfy WDAC / Smart App Control publisher rules
Set-AuthenticodeSignature -FilePath "backend\CspjMail.Api\bin\Debug\net10.0\CspjMail.Api.dll" -Certificate $cert | Out-Null

# 5. Run the signed assembly
Push-Location backend\CspjMail.Api
try {
    dotnet exec bin\Debug\net10.0\CspjMail.Api.dll
}
finally {
    Pop-Location
}