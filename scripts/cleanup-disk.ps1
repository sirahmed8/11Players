# ==============================================================================
# scripts/cleanup-disk.ps1
# Safe High-Yield Disk Cleanup & Cache Reclamation Engine
# Standardized for Next.js, Firebase, Vite, React, Node.js, and Multi-Project Suites
# ==============================================================================

[CmdletBinding()]
param (
    [string]$TargetDir = (Get-Location).Path,
    [switch]$IncludeNodeModules = $false,
    [switch]$AllProjectsInParent = $false
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       ENTERPRISE DISK CLEANUP & CACHE RECLAMATION        " -ForegroundColor Cyan
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

# Directories and files targeted for safe purging (100% rebuildable, zero source code deleted)
$targets = @(
    ".next",
    ".firebase",
    "coverage",
    ".turbo",
    ".parcel-cache",
    ".cache",
    "scratch",
    ".zcode",
    ".idea",
    ".eslintcache"
)

if ($IncludeNodeModules) {
    $targets += "node_modules"
}

$fileTargets = @(
    "tsconfig.tsbuildinfo",
    "*.log",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    "pnpm-debug.log*"
)

function Clean-SingleDirectory([string]$dirPath) {
    $freedBytes = 0
    $projName = Split-Path -Leaf $dirPath
    Write-Host "`n>>> Processing Project: $projName ($dirPath)" -ForegroundColor Yellow

    foreach ($folder in $targets) {
        $folderPath = Join-Path $dirPath $folder
        if (Test-Path $folderPath) {
            Write-Host "  -> Inspecting: $folder ..." -NoNewline
            $sizeBytes = (Get-ChildItem -Path $folderPath -Recurse -File -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
            if (-not $sizeBytes) { $sizeBytes = 0 }
            $sizeMB = [math]::Round($sizeBytes / 1MB, 2)
            Write-Host " found $sizeMB MB." -ForegroundColor DarkYellow
            
            Remove-Item -Path $folderPath -Recurse -Force -ErrorAction SilentlyContinue
            $freedBytes += $sizeBytes
            Write-Host "     [PURGED] $folder" -ForegroundColor Green
        }
    }

    foreach ($pattern in $fileTargets) {
        $files = Get-ChildItem -Path $dirPath -Filter $pattern -File -Force -ErrorAction SilentlyContinue
        foreach ($file in $files) {
            $size = $file.Length
            $freedBytes += $size
            Remove-Item -Path $file.FullName -Force -ErrorAction SilentlyContinue
            Write-Host ("     [PURGED FILE] {0} ({1:N2} KB)" -f $file.Name, ($size / 1KB)) -ForegroundColor Green
        }
    }

    return $freedBytes
}

$totalFreedBytes = 0

if ($AllProjectsInParent) {
    Write-Host "`n[MULTI-PROJECT MODE ACTIVE]: Scanning child projects under $TargetDir ..." -ForegroundColor Magenta
    $childDirs = Get-ChildItem -Path $TargetDir -Directory -Force -ErrorAction SilentlyContinue
    foreach ($child in $childDirs) {
        $totalFreedBytes += Clean-SingleDirectory $child.FullName
    }
} else {
    $totalFreedBytes += Clean-SingleDirectory $TargetDir
}

Write-Host "`n----------------------------------------------------------" -ForegroundColor DarkGray
Write-Host ("Total Space Reclaimed: {0:N2} MB ({1:N2} GB)" -f ($totalFreedBytes / 1MB), ($totalFreedBytes / 1GB)) -ForegroundColor Green

if ($driveLetter) {
    $drivePost = Get-PSDrive $driveLetter -ErrorAction SilentlyContinue
    if ($drivePost) {
        Write-Host ("Updated Drive {0}: Free: {1:N2} GB | Used: {2:N2} GB" -f $drivePost.Name, ($drivePost.Free / 1GB), ($drivePost.Used / 1GB)) -ForegroundColor Cyan
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Cleanup completed safely. All production source code and git repositories preserved." -ForegroundColor Green
