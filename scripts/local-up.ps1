# Shetu - Local Development Startup Script (PowerShell)
$ErrorActionPreference = "Stop"

Set-Location -Path (Join-Path $PSScriptRoot "..")

Write-Host "Checking Docker status..." -ForegroundColor Cyan
try {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not responding"
    }
}
catch {
    Write-Host "Docker daemon is not running." -ForegroundColor Yellow
    $dockerDesktopExe = "C:\Users\User\AppData\Local\Programs\DockerDesktop\Docker Desktop.exe"
    if (Test-Path $dockerDesktopExe) {
        Write-Host "Launching Docker Desktop..." -ForegroundColor Cyan
        Start-Process $dockerDesktopExe
        Write-Host "Waiting for Docker daemon to become ready (up to 30s)..." -ForegroundColor Cyan
        $ready = $false
        for ($i = 0; $i -lt 15; $i++) {
            Start-Sleep -Seconds 2
            $null = docker info 2>&1
            if ($LASTEXITCODE -eq 0) {
                $ready = $true
                break
            }
        }
        if (-not $ready) {
            Write-Host "Docker Desktop is still initializing. Please wait until Docker Desktop shows 'Engine running', then re-run this script." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "Please start Docker Desktop and run this script again." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Starting Shetu containers with Docker Compose..." -ForegroundColor Green
docker compose --env-file .env.local -f docker-compose.local.yml up --build
