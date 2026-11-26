@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo.
echo ====================================================
echo   Ronda DM - Actualizando desde GitHub (sin ZIP)
echo ====================================================
echo.
where git >nul 2>nul
if errorlevel 1 (
  echo [ERROR] No se encontro Git instalado en esta PC.
  echo Instalalo desde: https://git-scm.com/download/win
  pause
  exit /b 1
)

git pull --ff-only origin main
if errorlevel 1 (
  echo.
  echo [AVISO] Hubo cambios locales que impidieron actualizar limpio.
  echo Si no editaste codigo a mano, puedes ejecutar: git reset --hard origin/main
  pause
  exit /b 1
)

echo.
echo [OK] Extension actualizada a la ultima version!
echo Ahora entra a chrome://extensions y pulsa el icono Recargar en Ronda DM.
echo.
pause
