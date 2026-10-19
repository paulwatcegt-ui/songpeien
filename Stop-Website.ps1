$ErrorActionPreference = 'Stop'
$taskName = 'SongPeienLocalWebsite'
$task = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($task) {
    Disable-ScheduledTask -TaskName $taskName | Out-Null
    Stop-ScheduledTask -TaskName $taskName
}
$nodePath = Join-Path $PSScriptRoot '.runtime\node-v22.14.0-win-x64\node.exe'
Get-CimInstance Win32_Process -Filter "name='node.exe'" | Where-Object {
    $_.ExecutablePath -eq $nodePath -and $_.CommandLine -like '*node_modules/vite/bin/vite.js*'
} | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Write-Host 'Website stopped. Automatic startup disabled until Start-Website is run again.'
