Write-Output "🛡️ Sentinel: Atomizing stale browser processes..."
Stop-Process -Name chrome -Force -ErrorAction SilentlyContinue
Stop-Process -Name msedge -Force -ErrorAction SilentlyContinue
Stop-Process -Name chromedriver -Force -ErrorAction SilentlyContinue
Stop-Process -Name msedgedriver -Force -ErrorAction SilentlyContinue

Write-Output "🧹 Sentinel: Purging browser locks and temporary states..."
$tempDirs = @(
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Default\Web Data-journal",
    "$env:LOCALAPPDATA\Google\Chrome\User Data\Local State"
)

foreach ($dir in $tempDirs) {
    if (Test-Path $dir) {
        Remove-Item $dir -Force -ErrorAction SilentlyContinue
        Write-Output "   Deleted: $dir"
    }
}

Write-Output "🎯 Sentinel: Port 9222 reclamation..."
$conn = Get-NetTCPConnection -LocalPort 9222 -ErrorAction SilentlyContinue
if ($conn) {
    Write-Output "   Found blocker on 9222. Terminating PID: $($conn.OwningProcess)"
    Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
}

Write-Output "✅ Environment Solidified. Ready for subagent relaunch."
