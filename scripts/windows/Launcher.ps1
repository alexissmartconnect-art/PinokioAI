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

function Write-Log([string]$Message) {
    $line = "[{0}] {1}" -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $Message
    Add-Content -Path $LogFile -Value $line -Encoding UTF8
    if ($Console) { Write-Host $line }
}

function Show-Error([string]$Message) {
    Write-Log "ERREUR: $Message"
    try {
        Add-Type -AssemblyName PresentationFramework
        [System.Windows.MessageBox]::Show(
            $Message,
            'Pinokio AI Studio',
            'OK',
            'Error'
        ) | Out-Null
    } catch {
        Write-Host $Message
    }
}

function Get-NodePath {
    $bundled = Join-Path $AppDir 'runtime\node.exe'
    if (Test-Path $bundled) { return $bundled }
    $system = Get-Command 'node.exe' -ErrorAction SilentlyContinue
    if ($system) { return $system.Source }
    $system = Get-Command 'node' -ErrorAction SilentlyContinue
    if ($system) { return $system.Source }
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
        $match = Select-String -Path $envFile -Pattern '^\s*PORT\s*=\s*(\d+)' | Select-Object -First 1
        if ($match) { return [int]$match.Matches[0].Groups[1].Value }
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
$ports += @(3000, 3100, 3200, 3300) | Where-Object { $ports -notcontains $_ }

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
    Show-Error ("Node.js est introuvable.`n`nLancez « Setup.bat » une seule fois : il télécharge le runtime embarqué (`runtime\node.exe`).")
    exit 1
}

$serverPath = Join-Path $AppDir 'app\server.cjs'
if (-not (Test-Path $serverPath)) {
    Show-Error ("Fichier manquant : $serverPath`n`nLe dossier de l'application est incomplet : retéléchargez / redécompressez l'archive.")
    exit 1
}

$startedPort = 0
foreach ($port in $ports) {
    $env:NODE_ENV = 'production'
    $env:PORT = "$port"
    $env:APP_VERSION = (Get-Content (Join-Path $AppDir 'VERSION') -ErrorAction SilentlyContinue | Select-Object -First 1)
    Write-Log "Démarrage sur le port $port ($node)"

    $process = Start-Process -FilePath $node `
        -ArgumentList "`"$serverPath`"" `
        -WorkingDirectory $AppDir `
        -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $LogDir 'server.out.log') `
        -RedirectStandardError (Join-Path $LogDir 'server.err.log') `
        -PassThru

    $healthy = $false
    for ($i = 0; $i -lt 25; $i++) {
        Start-Sleep -Milliseconds 600
        if (Test-Server -Port $port) { $healthy = $true; break }
        if ($process.HasExited) { break }
    }

    if ($healthy) {
        $process.Id | Out-File -FilePath (Join-Path $AppDir '.pinokio-ai.pid') -Encoding ASCII
        Write-Log "Serveur prêt sur http://127.0.0.1:$port/"
        Open-AppWindow "http://127.0.0.1:$port/"
        $startedPort = $port
        break
    }

    Write-Log "Échec sur le port $port (processus terminé: $($process.HasExited))"
    if (-not $process.HasExited) { Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue }
    Stop-OurServers
}

if ($startedPort -eq 0) {
    Show-Error ("Le serveur n'a pas démarré.`n`nConsultez :`n$LogDir\server.err.log`n$LogFile`n`nEssayez « Pinokio AI Studio (console).bat » pour voir l'erreur en direct.")
    exit 1
}

exit 0
