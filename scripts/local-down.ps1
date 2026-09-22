# Shetu - Local Development Stop Script (PowerShell)
Set-Location -Path (Join-Path $PSScriptRoot "..")

Write-Host "Stopping Shetu containers..." -ForegroundColor Yellow
docker compose --env-file .env.local -f docker-compose.local.yml down
Write-Host "Stopped." -ForegroundColor Green
