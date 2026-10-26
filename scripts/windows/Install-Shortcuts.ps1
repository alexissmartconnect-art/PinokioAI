# ============================================================================
#  Pinokio AI Studio — raccourcis Bureau + Menu Démarrer
#  Créés par Setup.bat, ou relançables seuls après un déplacement du dossier.
# ============================================================================
[CmdletBinding()]
param(
    [switch]$Remove
)

$ErrorActionPreference = 'Stop'
$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Icon = Join-Path $AppDir 'icon.ico'
$Launcher = Join-Path $AppDir 'Pinokio AI Studio.vbs'
$Stopper = Join-Path $AppDir 'Stop.bat'
$Wscript = Join-Path $env:SystemRoot 'System32\wscript.exe'

if (-not (Test-Path $Launcher)) {
    Write-Host "  [erreur] Lanceur introuvable : $Launcher"
    exit 1
}

$desktop = [Environment]::GetFolderPath('Desktop')
$startMenu = Join-Path ([Environment]::GetFolderPath('Programs')) 'Pinokio AI Studio'
if (-not (Test-Path $startMenu)) { New-Item -ItemType Directory -Path $startMenu | Out-Null }

$shortcutPaths = @(
    (Join-Path $desktop 'Pinokio AI Studio.lnk'),
    (Join-Path $startMenu 'Pinokio AI Studio.lnk')
)

if ($Remove) {
    foreach ($p in $shortcutPaths) { if (Test-Path $p) { Remove-Item $p -Force } }
    $stopLink = Join-Path $startMenu 'Arrêter Pinokio AI Studio.lnk'
    if (Test-Path $stopLink) { Remove-Item $stopLink -Force }
    Write-Host '  Raccourcis supprimés.'
    exit 0
}

$shell = New-Object -ComObject WScript.Shell
foreach ($linkPath in $shortcutPaths) {
    $shortcut = $shell.CreateShortcut($linkPath)
    $shortcut.TargetPath = $Wscript
    $shortcut.Arguments = "`"$Launcher`""
    $shortcut.WorkingDirectory = $AppDir
    $shortcut.Description = 'Pinokio AI Studio & Copilot - LoRA training, Wan2GP, LTX'
    if (Test-Path $Icon) { $shortcut.IconLocation = "$Icon,0" }
    $shortcut.WindowStyle = 1
    $shortcut.Save()
}

$stopLink = Join-Path $startMenu 'Arrêter Pinokio AI Studio.lnk'
$stop = $shell.CreateShortcut($stopLink)
$stop.TargetPath = $Stopper
$stop.WorkingDirectory = $AppDir
$stop.Description = "Arrête le serveur local de Pinokio AI Studio"
if (Test-Path $Icon) { $stop.IconLocation = "$Icon,0" }
$stop.Save()

Write-Host "  Raccourci créé : $($shortcutPaths[0])"
Write-Host "  Menu Démarrer  : $startMenu"
exit 0
