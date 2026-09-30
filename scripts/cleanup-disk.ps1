# ==============================================================================
# scripts/cleanup-disk.ps1
# Safe High-Yield Disk Cleanup & Cache Reclamation Script
# Standardized for Next.js, Firebase, Vite, and Node.js projects on Drive D:
# ==============================================================================

[CmdletBinding()]
param (
    [string]$TargetDir = (Get-Location).Path,
    [switch]$IncludeNodeModules = $false
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       11PLAYERS DISK CLEANUP & CACHE RECLAMATION         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Target Directory : $TargetDir" -ForegroundColor Yellow

# Initial Drive Status
$driveLetter = (Split-Path -Qualifier $TargetDir).Replace(':', '')
if ($driveLetter) {
    $drivePre = Get-PSDrive $driveLetter -ErrorAction SilentlyContinue
    if ($drivePre) {
        Write-Host ("Drive {0}: Free: {1:N2} GB | Used: {2:N2} GB" -f $drivePre.Name, ($drivePre.Free / 1GB), ($drivePre.Used / 1GB)) -ForegroundColor DarkCyan
    }
}

# Directories and files targeted for safe purging (100% rebuildable)
$targets = @(
    ".next",
    ".firebase",
    "coverage",
    ".turbo",
    ".parcel-cache",
    ".cache",
    "scratch",
    ".zcode"
)

if ($IncludeNodeModules) {
    $targets += "node_modules"
}

$fileTargets = @(
    "tsconfig.tsbuildinfo",
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*"
)

$totalFreedBytes = 0

foreach ($folder in $targets) {
    $folderPath = Join-Path $TargetDir $folder
    if (Test-Path $folderPath) {
        Write-Host "Inspecting folder: $folder ..." -NoNewline
        $sizeBytes = (Get-ChildItem -Path $folderPath -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
        if (-not $sizeBytes) { $sizeBytes = 0 }
        $sizeMB = [math]::Round($sizeBytes / 1MB, 2)
        Write-Host " found $sizeMB MB." -ForegroundColor Yellow
        
        Write-Host "  -> Purging $folder ..." -ForegroundColor DarkGray
        Remove-Item -Path $folderPath -Recurse -Force -ErrorAction SilentlyContinue
        $totalFreedBytes += $sizeBytes
        Write-Host "  -> [CLEANED] $folder" -ForegroundColor Green
    }
}

foreach ($pattern in $fileTargets) {
    $files = Get-ChildItem -Path $TargetDir -Filter $pattern -File -Force -ErrorAction SilentlyContinue
    foreach ($file in $files) {
        $size = $file.Length
        $totalFreedBytes += $size
        Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue
        Write-Host ("  -> [CLEANED FILE] {0} ({1:N2} KB)" -f $file.Name, ($size / 1KB)) -ForegroundColor Green
    }
}

Write-Host "----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ("Total Space Reclaimed: {0:N2} MB ({1:N2} GB)" -f ($totalFreedBytes / 1MB), ($totalFreedBytes / 1GB)) -ForegroundColor Green

if ($driveLetter) {
    $drivePost = Get-PSDrive $driveLetter -ErrorAction SilentlyContinue
    if ($drivePost) {
        Write-Host ("Updated Drive {0}: Free: {1:N2} GB | Used: {2:N2} GB" -f $drivePost.Name, ($drivePost.Free / 1GB), ($drivePost.Used / 1GB)) -ForegroundColor Cyan
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Cleanup completed safely. All production source code preserved." -ForegroundColor Green
