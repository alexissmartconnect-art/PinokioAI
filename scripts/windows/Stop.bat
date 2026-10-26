@echo off
rem ==========================================================================
rem  Pinokio AI Studio - arret du serveur local (celui de CE dossier)
rem ==========================================================================
cd /d "%~dp0"
echo.
echo   Arret de Pinokio AI Studio...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Stop.ps1"
echo.
timeout /t 2 >nul
