# Stop 11Players Background Dev Server
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$stoppedAny = $false

# 1. Kill any process listening on port 3000
$conns = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($conns) {
    foreach ($c in $conns) {
        try {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
            $stoppedAny = $true
        } catch {}
    }
}

# 2. Kill any lingering next dev node processes spawned from 11Players
try {
    $processes = Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue
    foreach ($p in $processes) {
        if ($p.CommandLine -match "11Players" -or $p.CommandLine -match "next-dev") {
            try {
                Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
                $stoppedAny = $true
            } catch {}
        }
    }
} catch {}

# 3. Show notification
$notify = New-Object System.Windows.Forms.NotifyIcon
$icoPath = "D:\Projects\11Players\public\11players.ico"
if (Test-Path $icoPath) {
    try {
        $notify.Icon = New-Object System.Drawing.Icon($icoPath)
    } catch {
        $notify.Icon = [System.Drawing.SystemIcons]::Information
    }
} else {
    $notify.Icon = [System.Drawing.SystemIcons]::Information
}

$notify.BalloonTipTitle = "11Players"
if ($stoppedAny) {
    $notify.BalloonTipText = "Dev server has been stopped successfully."
} else {
    $notify.BalloonTipText = "No running dev server was detected on port 3000."
}
$notify.Visible = $true
$notify.ShowBalloonTip(2000)
Start-Sleep -Milliseconds 1200
$notify.Dispose()

