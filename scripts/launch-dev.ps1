# 11Players Background Dev Server Launcher
$projectDir = "D:\Projects\11Players"
Set-Location -Path $projectDir

function Test-PortOpen([int]$port) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $tcp.Connect("127.0.0.1", $port)
        $tcp.Close()
        return $true
    } catch {
        return $false
    }
}

# If server is already running on port 3000 or 3001, open immediately
if (Test-PortOpen 3000) {
    Start-Process "http://localhost:3000"
    exit 0
}
if (Test-PortOpen 3001) {
    Start-Process "http://localhost:3001"
    exit 0
}

# Resolve node.exe and next CLI binary directly (avoids cmd/batch process drops)
$nodeExe = "C:\Program Files\nodejs\node.exe"
if (-not (Test-Path $nodeExe)) {
    $nodeExe = (Get-Command "node.exe" -ErrorAction SilentlyContinue).Source
    if (-not $nodeExe) { $nodeExe = "node.exe" }
}
$nextBin = Join-Path $projectDir "node_modules\next\dist\bin\next"

# Start next dev silently in the background
Start-Process -FilePath $nodeExe -ArgumentList "`"$nextBin`"", "dev", "-p", "3000" -WorkingDirectory $projectDir -WindowStyle Hidden

# Wait for dev server to bind to port (up to 35 seconds)
$maxAttempts = 70
$attempt = 0
$targetPort = 3000

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Milliseconds 500
    if (Test-PortOpen 3000) {
        $targetPort = 3000
        break
    }
    if (Test-PortOpen 3001) {
        $targetPort = 3001
        break
    }
    $attempt++
}

# Open the site in the user's default browser
Start-Process "http://localhost:$targetPort"

