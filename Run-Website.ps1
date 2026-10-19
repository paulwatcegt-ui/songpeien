$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Resolve-Node.ps1')
$runtime = Join-Path $PSScriptRoot '.runtime'
# The pinned runtime lives in .runtime, which is gitignored and absent on a fresh clone;
# Resolve-Node falls back to PATH and the usual install locations.
$nodePath = Resolve-Node -Runtime $runtime
# Both the log file and Vite's stdout/stderr redirects target .runtime, so it must exist first.
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
$logPath = Join-Path $runtime 'website-supervisor.log'
if (!$nodePath) {
    Add-Content -LiteralPath $logPath -Value "$(Get-Date -Format o) Supervisor aborted: no Node.js found"
    exit 1
}
function Write-ServiceLog($message) {
    Add-Content -LiteralPath $logPath -Value "$(Get-Date -Format o) $message"
}
Write-ServiceLog "Supervisor started, PID=$PID, node=$nodePath"
while ($true) {
    try {
        # Task Scheduler can leave its child alive when the wrapper is stopped.
        # Reuse that exact project's listener instead of repeatedly fighting for its port.
        $listener = Get-NetTCPConnection -LocalPort 5175 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
        if ($listener) {
            $owner = Get-CimInstance Win32_Process -Filter "ProcessId=$($listener.OwningProcess)"
            # npm run dev launches Vite through the .bin shim, so the command line reads
            # "node_modules\.bin\\..\vite\bin\vite.js" rather than "node_modules/vite/bin/vite.js".
            # Match on both this project's path and Vite itself, otherwise the supervisor
            # mistakes its own Vite for a foreign squatter and never takes over.
            $escapedRoot = [WildcardPattern]::Escape($PSScriptRoot)
            $commandLine = [string]$owner.CommandLine
            $isProjectVite = ($commandLine -like "*$escapedRoot*") -and
                             ($commandLine -like '*vite\bin\vite.js*' -or $commandLine -like '*vite.js*')
            # Take over monitoring even when a sibling supervisor started that Vite, otherwise
            # every duplicate instance logs the same "occupied" error forever and eats CPU.
            if ($isProjectVite) {
                Write-ServiceLog "Monitoring surviving Vite, PID=$($owner.ProcessId)"
                Wait-Process -Id $owner.ProcessId -ErrorAction SilentlyContinue
                continue
            }
            throw "Port 5175 is occupied by another program, PID=$($listener.OwningProcess)"
        }
        # Pass an absolute path so the command line carries the project folder. A relative
        # "node_modules/vite/bin/vite.js" hides the project identity from ProcessId checks
        # below, which then mistakes its own Vite for a foreign squatter.
        $viteBin = Join-Path $PSScriptRoot 'node_modules\vite\bin\vite.js'
        $child = Start-Process -FilePath $nodePath -ArgumentList "`"$viteBin`"",'--host','127.0.0.1','--port','5175','--strictPort' -WorkingDirectory $PSScriptRoot -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtime 'vite.stdout.log') -RedirectStandardError (Join-Path $runtime 'vite.stderr.log') -PassThru
        Write-ServiceLog "Vite started, PID=$($child.Id)"
        $null = $child.Handle
        $child.WaitForExit()
        Write-ServiceLog "Vite exited, code=$($child.ExitCode); restarting in 3 seconds"
    } catch {
        Write-ServiceLog "Launch failure: $_"
    }
    Start-Sleep -Seconds 3
}
