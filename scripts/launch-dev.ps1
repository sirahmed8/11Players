# 11Players Background Dev Server Launcher
$projectDir = "D:\Projects\11Players"
Set-Location -Path $projectDir

function Test-PortOpen([int]$port) {
    try {
        $tcp = New-Object System.Net.Sockets.TcpClient
        $async = $tcp.BeginConnect("127.0.0.1", $port, $null, $null)
        $wait = $async.AsyncWaitHandle.WaitOne(400, $false)
        if ($wait -and $tcp.Connected) {
            $tcp.EndConnect($async)
            $tcp.Close()
            return $true
        }
        $tcp.Close()
        return $false
    } catch {
        return $false
    }
}

$isAlreadyRunning = Test-PortOpen 3000

if ($isAlreadyRunning) {
    # Server is already running, open browser immediately
    Start-Process "http://localhost:3000"
    exit 0
}

# Start npm run dev silently in the background
$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = "cmd.exe"
$startInfo.Arguments = "/c npm run dev"
$startInfo.WorkingDirectory = $projectDir
$startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
$startInfo.CreateNoWindow = $true
$startInfo.UseShellExecute = $true

[System.Diagnostics.Process]::Start($startInfo) | Out-Null

# Wait for dev server to spin up and bind to port 3000 (up to 35 seconds)
$maxAttempts = 70
$attempt = 0
$serverReady = $false

while ($attempt -lt $maxAttempts) {
    Start-Sleep -Milliseconds 500
    if (Test-PortOpen 3000) {
        $serverReady = $true
        break
    }
    $attempt++
}

# Open the site in the user's default browser
Start-Process "http://localhost:3000"
