#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "===================================================="
echo "  Ronda DM - Actualizando a la última versión..."
echo "===================================================="
echo ""

if [ -d ".git" ] && command -v git >/dev/null 2>&1; then
  echo "[Modo Git] Ejecutando git pull..."
  if git pull --ff-only origin main; then
    echo ""
    echo "[OK] Extensión actualizada con Git."
    echo "Entra a chrome://extensions y pulsa Recargar en Ronda DM."
    exit 0
  fi
  echo "[AVISO] git pull no pudo avanzar limpio. Usando descarga directa..."
fi

echo "[Modo Directo] Descargando última versión desde GitHub Releases..."
TMP_ZIP="$(mktemp /tmp/ronda-update-XXXXXX.zip)"
curl -fsSL "https://github.com/rodrigolf16/Dnd-Hydra/releases/download/latest/Ronda-Extension-Chrome.zip" -o "$TMP_ZIP"
unzip -oq "$TMP_ZIP" -d .
rm -f "$TMP_ZIP"

echo ""
echo "[OK] Extensión actualizada a la última versión."
echo "Ahora entra a chrome://extensions y pulsa Recargar en Ronda DM."
