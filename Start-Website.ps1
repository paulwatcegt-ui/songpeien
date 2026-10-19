$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Resolve-Node.ps1')
$taskName = 'SongPeienLocalWebsite'
$runtime = Join-Path $PSScriptRoot '.runtime'
# The pinned runtime lives in .runtime, which is gitignored and absent on a fresh clone;
# Resolve-Node falls back to PATH and the usual install locations.
$nodePath = Resolve-Node -Runtime $runtime
$vitePath = Join-Path $PSScriptRoot 'node_modules\vite\bin\vite.js'
if (!$nodePath) {
    throw 'No Node.js found. Restore .runtime\node-v22.14.0-win-x64\node.exe, or install Node.js and add it to PATH.'
}
if (!(Test-Path -LiteralPath $vitePath)) {
    throw 'Missing local Vite. Restore .runtime and install dependencies first.'
}
# Start-Process needs these redirect targets to exist before it will launch anything.
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
# Record the interpreter so the scheduled task, which runs without this shell's PATH,
# resolves exactly the same Node instead of finding nothing.
Set-Content -LiteralPath (Join-Path $runtime 'node-path.txt') -Value $nodePath
$userId = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$wscriptPath = Join-Path $env:SystemRoot 'System32\wscript.exe'
$supervisorPath = Join-Path $PSScriptRoot 'Run-Website.vbs'
# Launch through wscript, which has no console and starts the child hidden. Going direct to
# PowerShell does not work: Windows Terminal ignores -WindowStyle Hidden and pops a visible
# window, and closing that window kills the supervisor. The original task also repeated its
# trigger every minute to "keep the supervisor alive", but the supervisor never exits, so
# each re-trigger only added an instance that then errored forever against its own sibling.
$action = New-ScheduledTaskAction -Execute $wscriptPath -Argument ('//B //NoLogo "' + $supervisorPath + '"') -WorkingDirectory $PSScriptRoot
$trigger = New-ScheduledTaskTrigger -AtLogOn -User $userId
$principal = New-ScheduledTaskPrincipal -UserId $userId -LogonType Interactive -RunLevel Limited
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -ExecutionTimeLimit ([TimeSpan]::Zero) -RestartCount 999 -RestartInterval (New-TimeSpan -Minutes 1) -MultipleInstances IgnoreNew -StartWhenAvailable
$existing = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue
$registered = @($existing.Actions)[0]
if ($existing -and $registered.WorkingDirectory -ne $PSScriptRoot) {
    throw 'The website task is registered from another folder. Stop it before moving the project.'
}
if ($existing -and $existing.State -eq 'Running' -and $registered.Execute -eq $action.Execute -and $registered.Arguments -eq $action.Arguments) {
    # Already running with the current definition; leave it alone.
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
