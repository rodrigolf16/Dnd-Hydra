#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

echo ""
echo "===================================================="
echo "  Ronda DM - Actualizando desde GitHub (sin ZIP)"
echo "===================================================="
echo ""

git pull --ff-only origin main

echo ""
echo "[OK] Extensión actualizada a la última versión."
echo "Ahora entra a chrome://extensions y pulsa Recargar en Ronda DM."
