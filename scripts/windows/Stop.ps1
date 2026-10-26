# ============================================================================
#  Pinokio AI Studio — arrête le serveur local de ce dossier.
#  Seuls les node.exe dont la ligne de commande référence app\server.cjs
#  de CE dossier sont arrêtés : vos autres projets Node ne sont pas touchés.
# ============================================================================
$ErrorActionPreference = 'SilentlyContinue'
$AppDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$serverPath = Join-Path $AppDir 'app\server.cjs'

$stopped = 0
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
    Where-Object { $_.CommandLine -and $_.CommandLine -like "*$serverPath*" } |
    ForEach-Object {
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        Write-Host "  Serveur arrêté (PID $($_.ProcessId))."
        $stopped++
    }

$pidFile = Join-Path $AppDir '.pinokio-ai.pid'
if (Test-Path $pidFile) { Remove-Item $pidFile -Force }

if ($stopped -eq 0) {
    Write-Host '  Aucun serveur Pinokio AI Studio en cours.'
} else {
    Write-Host '  Terminé. Vous pouvez relancer par le raccourci du Bureau.'
}
