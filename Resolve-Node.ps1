# Resolves the Node.js executable used by the local website helper scripts.
#
# The scheduled task runs without the interactive shell's PATH, so anything that relies on
# `Get-Command node` silently fails there. To bridge that gap, a successful start records the
# interpreter it used in .runtime\node-path.txt, which later runs read first.
#
# Lookup order (first hit wins):
#   1. The path persisted by a previous successful start
#   2. The pinned runtime under .runtime  (matches .node-version; gitignored, absent on a fresh clone)
#   3. Whatever `node` resolves to on PATH
#   4. Well-known install locations, including managed version folders
#
# Dot-source this file and call Resolve-Node -Runtime $runtime to get an absolute path,
# or $null when nothing is available. Callers decide how to report that.

function Resolve-Node {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Runtime
    )

    $candidates = @()

    # 1. Remembered from a previous successful start.
    $nodePathFile = Join-Path $Runtime 'node-path.txt'
    if (Test-Path -LiteralPath $nodePathFile) {
        $recorded = Get-Content -LiteralPath $nodePathFile -TotalCount 1 -ErrorAction SilentlyContinue
        if ($recorded) { $candidates += $recorded.Trim() }
    }

    # 2. The pinned runtime matching .node-version.
    $candidates += (Join-Path $Runtime 'node-v22.14.0-win-x64\node.exe')

    # 3. Whatever resolves on PATH.
    $onPath = Get-Command node -ErrorAction SilentlyContinue
    if ($onPath) { $candidates += $onPath.Source }

    # 4. Well-known install locations.
    foreach ($dir in @($env:ProgramFiles, ${env:ProgramFiles(x86)}, (Join-Path $env:LOCALAPPDATA 'Programs\nodejs'))) {
        if ($dir) { $candidates += (Join-Path $dir 'node.exe') }
    }

    # Version managers lay out as <root>\<version>\node.exe; newest first.
    foreach ($root in @((Join-Path $env:USERPROFILE '.workbuddy\binaries\node\versions'), $env:NVM_HOME, (Join-Path $env:LOCALAPPDATA 'nvm'))) {
        if ($root -and (Test-Path -LiteralPath $root)) {
            $candidates += @(
                Get-ChildItem -LiteralPath $root -Filter 'node.exe' -Recurse -Depth 3 -ErrorAction SilentlyContinue |
                    Sort-Object FullName -Descending |
                    ForEach-Object { $_.FullName }
            )
        }
    }

    foreach ($candidate in $candidates) {
        if ($candidate -and (Test-Path -LiteralPath $candidate)) {
            return (Resolve-Path -LiteralPath $candidate).Path
        }
    }
    return $null
}
