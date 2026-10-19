$ErrorActionPreference = 'Stop'
$taskName = 'SongPeienLocalWebsite'
$nodePath = Join-Path $PSScriptRoot '.runtime\node-v22.14.0-win-x64\node.exe'
$vitePath = Join-Path $PSScriptRoot 'node_modules\vite\bin\vite.js'
if (!(Test-Path -LiteralPath $nodePath) -or !(Test-Path -LiteralPath $vitePath)) {
    throw 'Missing local Node.js or Vite. Restore .runtime and install dependencies first.'
}
$userId = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$shellPath = Join-Path $env:SystemRoot 'System32\WindowsPowerShell\v1.0\powershell.exe'
$supervisorPath = Join-Path $PSScriptRoot 'Run-Website.ps1'
$action = New-ScheduledTaskAction -Execute $shellPath -Argument ('-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $supervisorPath + '"') -WorkingDirectory $PSScriptRoot
$trigger = @(
    (New-ScheduledTaskTrigger -AtLogOn -User $userId)
    (New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 1))
)
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew -StartWhenAvailable
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
if ($existing -and $existing.State -eq 'Running') {
    if ($existing.Actions.Execute -ne $shellPath -or $existing.Actions.Arguments -ne $action.Arguments -or $existing.Actions.WorkingDirectory -ne $PSScriptRoot) {
        throw 'The website task is running from another folder. Stop it before moving the project.'
    }
} else {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description 'Local Song Peien website on 127.0.0.1:5175; starts at user logon.' -Force | Out-Null
    Start-ScheduledTask -TaskName $taskName
}
$ready = $false
for ($attempt = 0; $attempt -lt 20; $attempt++) {
    try {
        $status = & $nodePath --input-type=module -e "const r = await fetch('http://127.0.0.1:5175/'); console.log(r.status);" 2>$null
        if ($LASTEXITCODE -eq 0 -and $status -eq '200') { $ready = $true; break }
    } catch { }
    Start-Sleep -Milliseconds 500
}
if (!$ready) {
    $info = Get-ScheduledTaskInfo -TaskName $taskName
    throw "Website did not respond. Task result: $($info.LastTaskResult). Check port 5175 and Task Scheduler."
}
Write-Host 'Website ready: http://127.0.0.1:5175/'
