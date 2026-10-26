@echo off
rem ==========================================================================
rem  Pinokio AI Studio - lanceur avec console (diagnostic)
rem  Affiche les logs du serveur. Ctrl+C pour arreter.
rem ==========================================================================
setlocal
cd /d "%~dp0"

if exist "runtime\node.exe" (
  set "NODE_EXE=%~dp0runtime\node.exe"
) else (
  where node >nul 2>nul
  if errorlevel 1 goto nonode
  set "NODE_EXE=node"
)

if not exist "app\server.cjs" goto noserver

set "NODE_ENV=production"
if "%PORT%"=="" set "PORT=3000"

echo.
echo   Pinokio AI Studio - demarrage sur http://127.0.0.1:%PORT%
echo   (fermez cette fenetre ou Ctrl+C pour arreter)
echo.

start "" cmd /c "timeout /t 3 >nul & start http://127.0.0.1:%PORT%/"
"%NODE_EXE%" "app\server.cjs"
goto end

:nonode
echo.
echo   [erreur] Node.js introuvable.
echo   Lancez "Setup.bat" une seule fois (il telecharge runtime\node.exe),
echo   ou installez Node.js LTS depuis https://nodejs.org
echo.
pause
goto end

:noserver
echo.
echo   [erreur] app\server.cjs est absent : dossier incomplet.
echo.
pause

:end
endlocal
