# download_apks.ps1 - Automated APK fetcher for USB stick
$ErrorActionPreference = "SilentlyContinue"

$targetDir = Join-Path $PSScriptRoot "01_APKS"
if (!(Test-Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

Write-Host "Fetching verified Android TV APKs for Fire OS 7 (JVC 43')..." -ForegroundColor Cyan

# 1. SmartTube (100% Ad-Free YouTube)
$smartTubeUrl = "https://github.com/yuliskov/SmartTube/releases/download/latest/smarttube_stable.apk"
$smartTubeOut = Join-Path $targetDir "SmartTube_AdFree_4K.apk"
Write-Host "Downloading SmartTube 4K (Ad-Free)..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $smartTubeUrl -OutFile $smartTubeOut -UserAgent "curl/7.68.0"

# 2. Stremio 4K Android TV
$stremioUrl = "https://dl.strem.io/four/v1.6.12/android/arm/com.stremio.one-1.6.12-7049870-arm.apk"
$stremioOut = Join-Path $targetDir "Stremio_AndroidTV_4K.apk"
Write-Host "Downloading Stremio 4K Android TV..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $stremioUrl -OutFile $stremioOut -UserAgent "curl/7.68.0"

Write-Host "APK package preparation complete in $targetDir" -ForegroundColor Green
