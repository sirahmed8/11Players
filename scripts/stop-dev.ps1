# Stop 11Players Background Dev Server
$conn = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue
if ($conn) {
    foreach ($c in $conn) {
        try {
            Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
            Write-Host "Stopped process $($c.OwningProcess) listening on port 3000."
        } catch {}
    }
} else {
    Write-Host "No process listening on port 3000."
}
