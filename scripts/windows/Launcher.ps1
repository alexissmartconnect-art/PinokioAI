# ============================================================================
#  Pinokio AI Studio — lanceur Windows 11
#  Démarre le serveur local (app/server.cjs) puis ouvre la fenêtre de l'app.
#  Appelé sans fenêtre par « Pinokio AI Studio.vbs ».
# ============================================================================
[CmdletBinding()]
param(
    [switch]$Console
)

$ErrorActionPreference = 'Stop'
$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogDir = Join-Path $AppDir 'logs'
if (-not (Test-Path $LogDir)) { New-Item -ItemType Directory -Path $LogDir | Out-Null }
$LogFile = Join-Path $LogDir 'launcher.log'
$OutLog = Join-Path $LogDir 'server.out.log'
$ErrLog = Join-Path $LogDir 'server.err.log'

function Write-Log([string]$Message) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    try { Add-Content -LiteralPath $LogFile -Value $line -Encoding UTF8 } catch { }
    if ($Console) { Write-Host $line }
}

function Show-Error([string]$Message) {
    Write-Log "ERREUR: $Message"
    try {
        Add-Type -AssemblyName PresentationFramework
        [System.Windows.MessageBox]::Show($Message, 'Pinokio AI Studio', 'OK', 'Error') | Out-Null
    } catch {
        Write-Host $Message
    }
}

function Get-NodePath {
    $bundled = Join-Path $AppDir 'runtime\node.exe'
    if (Test-Path $bundled) { return $bundled }
    foreach ($name in @('node.exe', 'node')) {
        $found = Get-Command $name -ErrorAction SilentlyContinue
        if ($found -and $found.Source) { return $found.Source }
    }
    return $null
}

function Test-Server([int]$Port) {
    try {
        $response = Invoke-WebRequest -Uri "http://127.0.0.1:$Port/api/health" -UseBasicParsing -TimeoutSec 2
        return ($response.StatusCode -eq 200)
    } catch {
        return $false
    }
}

function Get-ConfiguredPort {
    $envFile = Join-Path $AppDir '.env'
    if (Test-Path $envFile) {
        $line = Select-String -Path $envFile -Pattern '^\s*PORT\s*=\s*(\d+)' | Select-Object -First 1
        if ($line) { return [int]$line.Matches[0].Groups[1].Value }
    }
    return 0
}

function Stop-OurServers {
    # Ne tue que les node.exe dont la ligne de commande pointe sur NOTRE server.cjs
    $serverPath = Join-Path $AppDir 'app\server.cjs'
    Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -and $_.CommandLine -like "*$serverPath*" } |
        ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
}

function Start-ServerProcess([string]$NodeExe, [string]$ServerPath) {
    # Start-Process ne permet pas -WindowStyle Hidden avec des redirections
    # (jeux de paramètres incompatibles) : on passe par l'API .NET, qui donne
    # une vraie fenêtre invisible (CreateNoWindow) + les logs sur disque.
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $NodeExe
    $psi.Arguments = '"' + $ServerPath + '"'
    $psi.WorkingDirectory = $AppDir
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8

    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi
    $process.EnableRaisingEvents = $true

    # Les pipes doivent être lus en continu, sinon node se bloque dès que le
    # tampon (~4 Ko) est plein.
    $null = Register-ObjectEvent -InputObject $process -EventName OutputDataReceived -MessageData $OutLog -Action {
        if ($EventArgs.Data) {
            Add-Content -LiteralPath $Event.MessageData -Value $EventArgs.Data -Encoding UTF8 -ErrorAction SilentlyContinue
        }
    }
    $null = Register-ObjectEvent -InputObject $process -EventName ErrorDataReceived -MessageData $ErrLog -Action {
        if ($EventArgs.Data) {
            Add-Content -LiteralPath $Event.MessageData -Value $EventArgs.Data -Encoding UTF8 -ErrorAction SilentlyContinue
        }
    }

    if (-not $process.Start()) { throw 'Start() a échoué pour node.exe' }
    $process.BeginOutputReadLine()
    $process.BeginErrorReadLine()
    return $process
}

function Open-AppWindow([string]$Url) {
    $candidates = @(
        (Join-Path $env:ProgramFiles 'Microsoft\Edge\Application\msedge.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'Microsoft\Edge\Application\msedge.exe'),
        (Join-Path $env:ProgramFiles 'Google\Chrome\Application\chrome.exe'),
        (Join-Path ${env:ProgramFiles(x86)} 'Google\Chrome\Application\chrome.exe'),
        (Join-Path $env:LOCALAPPDATA 'Google\Chrome\Application\chrome.exe')
    )
    foreach ($browser in $candidates) {
        if ($browser -and (Test-Path $browser)) {
            # Mode « application » : fenêtre sans barre d'adresse ni onglets.
            Start-Process -FilePath $browser -ArgumentList "--app=$Url", '--window-size=1500,950'
            Write-Log "Fenêtre ouverte via $browser"
            return
        }
    }
    Start-Process $Url
    Write-Log 'Navigateur par défaut utilisé'
}

# --- 1. Déjà lancé ? on ouvre juste la fenêtre -------------------------------
$configuredPort = Get-ConfiguredPort
$ports = @()
if ($configuredPort -gt 0) { $ports += $configuredPort }
foreach ($candidate in @(3000, 3100, 3200, 3300)) {
    if ($ports -notcontains $candidate) { $ports += $candidate }
}

foreach ($port in $ports) {
    if (Test-Server -Port $port) {
        Write-Log "Serveur déjà actif sur le port $port"
        Open-AppWindow "http://127.0.0.1:$port/"
        exit 0
    }
}

# --- 2. Démarrage ------------------------------------------------------------
$node = Get-NodePath
if (-not $node) {
    Show-Error ("Node.js est introuvable.`n`nLancez « Setup.bat » une seule fois : il télécharge le runtime embarqué (runtime\node.exe).")
    exit 1
}

$serverPath = Join-Path $AppDir 'app\server.cjs'
if (-not (Test-Path $serverPath)) {
    Show-Error ("Fichier manquant : $serverPath`n`nLe dossier de l'application est incomplet : retéléchargez / redécompressez l'archive.")
    exit 1
}

$env:NODE_ENV = 'production'
$versionFile = Join-Path $AppDir 'VERSION'
if (Test-Path $versionFile) {
    $env:APP_VERSION = (Get-Content -LiteralPath $versionFile | Select-Object -First 1)
}

$startedPort = 0
foreach ($port in $ports) {
    $env:PORT = "$port"
    Write-Log "Démarrage sur le port $port ($node)"

    # Logs neufs : on garde une trace de la session précédente à part.
    foreach ($log in @($OutLog, $ErrLog)) {
        if (Test-Path $log) {
            try { Move-Item -LiteralPath $log -Destination "$log.previous" -Force } catch { }
        }
    }

    $process = $null
    try {
        $process = Start-ServerProcess -NodeExe $node -ServerPath $serverPath
    } catch {
        Write-Log "Échec du lancement de node : $($_.Exception.Message)"
        continue
    }

    $healthy = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Milliseconds 500
        if (Test-Server -Port $port) { $healthy = $true; break }
        if ($process.HasExited) { break }
    }

    if ($healthy) {
        $process.Id | Out-File -FilePath (Join-Path $AppDir '.pinokio-ai.pid') -Encoding ASCII
        Write-Log "Serveur prêt sur http://127.0.0.1:$port/ (PID $($process.Id))"
        Open-AppWindow "http://127.0.0.1:$port/"
        $startedPort = $port
        break
    }

    Write-Log "Échec sur le port $port (processus terminé : $($process.HasExited))"
    if (-not $process.HasExited) {
        try { $process.Kill() } catch { }
        Stop-OurServers
    }
}

if ($startedPort -eq 0) {
    Show-Error ("Le serveur n'a pas démarré.`n`nConsultez :`n$ErrLog`n$LogFile`n`nEssayez « Pinokio AI Studio (console).bat » pour voir l'erreur en direct.")
    exit 1
}

exit 0
