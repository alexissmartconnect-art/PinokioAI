@echo off
rem ==========================================================================
rem  Pinokio AI Studio - installation (a lancer UNE seule fois sur Windows 11)
rem  1. verifie le runtime Node.js (le telecharge si besoin)
rem  2. cree le fichier de configuration .env
rem  3. installe les raccourcis Bureau + Menu Demarrer
rem  4. lance l'application
rem ==========================================================================
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Pinokio AI Studio - installation

set "NODE_VERSION=22.20.0"
set "NODE_ZIP=%TEMP%\node-v%NODE_VERSION%-win-x64.zip"
set "NODE_DIR=%TEMP%\node-v%NODE_VERSION%-win-x64"

echo.
echo   ============================================
echo    Pinokio AI Studio - installation Windows 11
echo   ============================================
echo.

if not exist "app\server.cjs" (
  echo   [erreur] app\server.cjs est absent : le dossier est incomplet.
  echo   Redecompressez l'archive dans un dossier ou vous avez les droits d'ecriture.
  echo.
  pause
  exit /b 1
)

rem --- 1. Runtime Node -------------------------------------------------------
if exist "runtime\node.exe" (
  echo   [1/4] Runtime embarque present : runtime\node.exe
  goto runtime_ok
)

where node >nul 2>nul
if not errorlevel 1 (
  for /f "delims=" %%i in ('where node') do (
    echo   [1/4] Node.js deja installe : %%i
    goto runtime_ok
  )
)

echo   [1/4] Telechargement de Node.js %NODE_VERSION% (environ 30 Mo)...
if not exist "runtime" mkdir "runtime"

where curl.exe >nul 2>nul
if errorlevel 1 goto node_ps

curl.exe -L --fail --silent --show-error -o "%NODE_ZIP%" "https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-win-x64.zip"
if errorlevel 1 goto node_failed
goto node_extract

:node_ps
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri 'https://nodejs.org/dist/v%NODE_VERSION%/node-v%NODE_VERSION%-win-x64.zip' -OutFile '%NODE_ZIP%' -UseBasicParsing } catch { exit 1 }"
if errorlevel 1 goto node_failed

:node_extract
powershell -NoProfile -Command "Expand-Archive -Force -Path '%NODE_ZIP%' -DestinationPath '%TEMP%'"
if errorlevel 1 goto node_failed
copy /y "%NODE_DIR%\node.exe" "runtime\node.exe" >nul
if errorlevel 1 goto node_failed
del "%NODE_ZIP%" >nul 2>nul
echo         OK : runtime\node.exe installe.
goto runtime_ok

:node_failed
echo.
echo   [attention] Le telechargement direct a echoue.
where winget >nul 2>nul
if errorlevel 1 goto node_failed_final
echo   Tentative d'installation de Node.js LTS via winget...
winget install --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
if errorlevel 1 goto node_failed_final
echo   Node.js installe via winget : relancez Setup.bat pour creer les raccourcis.
echo.
pause
exit /b 0

:node_failed_final
echo.
echo   Installez Node.js LTS depuis https://nodejs.org puis relancez Setup.bat.
echo   L'application peut aussi utiliser un Node.js deja installe (PATH).
echo.
goto config

:runtime_ok

rem --- 2. Configuration ------------------------------------------------------
:config
if exist ".env" (
  echo   [2/4] .env deja present : conserve.
) else (
  if exist "app\.env.example" (
    copy /y "app\.env.example" ".env" >nul
  ) else (
    echo GEMINI_API_KEY=""> ".env"
    echo PORT=3000>> ".env"
  )
  echo   [2/4] .env cree ^(clefs vides : ouvrez-le avec le Bloc-notes pour les remplir^).
)

rem --- 3. Raccourcis ---------------------------------------------------------
echo   [3/4] Installation des raccourcis (Bureau + Menu Demarrer)...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0Install-Shortcuts.ps1"
if errorlevel 1 (
  echo         [attention] Raccourcis non crees. Vous pouvez toujours lancer
  echo         "Pinokio AI Studio.vbs" directement.
) else (
  echo         OK : raccourci "Pinokio AI Studio" sur le Bureau.
)

rem --- 4. Lancement ----------------------------------------------------------
echo   [4/4] Demarrage de l'application...
echo.
start "" "%~dp0Pinokio AI Studio.vbs"
echo   L'application s'ouvre dans une fenetre dediee.
echo   ^(Si rien ne s'ouvre, lancez "Pinokio AI Studio ^(console^).bat" pour voir l'erreur.^)
timeout /t 4 >nul
endlocal
