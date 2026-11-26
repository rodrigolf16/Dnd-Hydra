@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ====================================================
echo   Ronda DM - Actualizando a la ultima version...
echo ====================================================
echo.

if exist ".git" (
  where git >nul 2>nul
  if not errorlevel 1 (
    echo [Modo Git] Ejecutando git pull...
    git pull --ff-only origin main
    if not errorlevel 1 (
      echo.
      echo [OK] Extension actualizada con Git!
      echo Entra a chrome://extensions y pulsa el icono Recargar en Ronda DM.
      echo.
      pause
      exit /b 0
    )
    echo [AVISO] git pull no pudo avanzar limpio. Usando descarga directa...
  )
)

echo [Modo Directo] Descargando ultima version desde GitHub Releases...
powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "$ErrorActionPreference = 'Stop'; " ^
  "$url = 'https://github.com/rodrigolf16/Dnd-Hydra/releases/download/latest/Ronda-Extension-Chrome.zip'; " ^
  "$tmp = Join-Path $env:TEMP ('ronda-update-' + [guid]::NewGuid().ToString()); " ^
  "$zip = $tmp + '.zip'; " ^
  "Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing; " ^
  "Expand-Archive -Path $zip -DestinationPath $tmp -Force; " ^
  "Get-ChildItem -Path $tmp -Force | Where-Object { $_.Name -ne 'actualizar.bat' } | Copy-Item -Destination (Get-Location) -Recurse -Force; " ^
  "Remove-Item $zip -Force -ErrorAction SilentlyContinue; " ^
  "Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue"

if errorlevel 1 (
  echo.
  echo [ERROR] No se pudo descargar la actualizacion. Revisa tu conexion a internet.
  pause
  exit /b 1
)

echo.
echo [OK] Extension actualizada a la ultima version!
echo Ahora entra a chrome://extensions y pulsa el icono Recargar en Ronda DM.
echo.
pause
