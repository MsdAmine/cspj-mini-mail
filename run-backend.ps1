$env:ASPNETCORE_ENVIRONMENT = "Development"
$env:ASPNETCORE_URLS = "http://localhost:5182"

dotnet build backend\CspjMail.Api --no-restore -v q
Push-Location backend\CspjMail.Api
try {
    dotnet exec bin\Debug\net10.0\CspjMail.Api.dll
}
finally {
    Pop-Location
}