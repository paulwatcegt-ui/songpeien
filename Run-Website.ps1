$ErrorActionPreference = 'Stop'
$runtime = Join-Path $PSScriptRoot '.runtime'
$nodePath = Join-Path $runtime 'node-v22.14.0-win-x64\node.exe'
$logPath = Join-Path $runtime 'website-supervisor.log'
function Write-ServiceLog($message) {
    Add-Content -LiteralPath $logPath -Value "$(Get-Date -Format o) $message"
}
Write-ServiceLog "Supervisor started, PID=$PID"
while ($true) {
    try {
        # Task Scheduler can leave its child alive when the wrapper is stopped.
        # Reuse that exact project's listener instead of repeatedly fighting for its port.
        $listener = Get-NetTCPConnection -LocalPort 5175 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($listener) {
            $owner = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
            if ($owner.ExecutablePath -eq $nodePath -and $owner.CommandLine -like '*node_modules/vite/bin/vite.js*') {
                Write-ServiceLog "Monitoring surviving Vite, PID=$($owner.ProcessId)"
                Wait-Process -Id $owner.ProcessId -ErrorAction SilentlyContinue
                continue
            }
            throw "Port 5175 is occupied by another program, PID=$($listener.OwningProcess)"
        }
        $child = Start-Process -FilePath $nodePath -ArgumentList 'node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5175','--strictPort' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'vite.stdout.log') -RedirectStandardError (Join-Path $runtime 'vite.stderr.log') -PassThru
        Write-ServiceLog "Vite started, PID=$($child.Id)"
        $null = $child.Handle
        $child.WaitForExit()
        Write-ServiceLog "Vite exited, code=$($child.ExitCode); restarting in 3 seconds"
    } catch {
        Write-ServiceLog "Launch failure: $_"
    }
    Start-Sleep -Seconds 3
}
