# Ronda — Extensión de Chrome / Panel DM D&D 2024

Extensión de **Chrome / Edge (Manifest V3)** y aplicación web local para el **Director de Juego (DM)** de **D&D 5.5 (2024)** con dados físicos en mesa y sincronización directa de fichas abiertas en **Nivel20**.

---

## Cómo instalar la extensión en Chrome o Edge (en esta PC o en otra)

1. Abre **Chrome** y entra a `chrome://extensions` (en Edge: `edge://extensions`).
2. Activa el interruptor **Modo de desarrollador** (arriba a la derecha).
3. Haz clic en **Cargar descomprimida** (*Load unpacked*).
4. Selecciona la carpeta del proyecto (o la carpeta descomprimida de `Ronda-Extension-Chrome.zip` en otra PC).
5. Fija el icono **R (Ronda DM)** en la barra de extensiones de Chrome.

### Cómo usarla durante la partida
- **Panel Lateral (al lado de Nivel20):** haz clic en el icono de Ronda → **◫ Abrir Panel Lateral** para tener el gestor de turnos pegado al costado de tu pestaña de Nivel20.
- **Pestaña completa:** clic en **↗ Abrir en Pestaña Completa** para pantalla grande.
- **Actualizar cualquier personaje desde Nivel20 (sin tocar código):**
  1. Abre en Chrome la hoja del personaje dentro de tu campaña en `nivel20.com`.
  2. Pulsa **⟳ Sincronizar ficha abierta de Nivel20** (desde el icono de la extensión o el botón superior dentro de Ronda).
  3. Ronda actualiza automáticamente PG, CA, atributos, nivel, velocidad, armas y **la imagen real del personaje en Nivel20**.

---

## Funciones del Panel DM (dados físicos)
- **Dados físicos (cantidades totales + resultados):** cada ataque, conjuro, poción o acción indica exactamente cuántos dados físicos tirar (ej. `3 × d6 + 1 × d4 (+5) · 4 dados físicos`). Al anotar el `d20` físico comprueba automáticamente contra la CA si impacta o es crítico (duplicando los dados de daño); al anotar el daño o curación física actualiza al instante la barra de PG y calcula la CD de Concentración.
- **Panel lateral «Dados físicos en mesa»:** toca `d20..d4` (clic para sumar, clic derecho para restar) o carga fórmulas como `2d6+1d4+5` y anota el resultado en el historial o aplícalo directo como daño/curación.
- **Recursos del turno automáticos:** *Acción*, *Acción adicional*, *Movimiento* y *Reacción* se marcan automáticamente al registrar cada movimiento.
- **Iniciativa manual + dote Alerta:** carga los valores físicos de mayor a menor (`✎ Cargar iniciativas`) e intercambia lugares con `⇄ Intercambiar`.
- **Enemigos y retratos:** los 6 personajes tienen retratos en `assets/portraits/` con exportación (`⇩ Retrato`), y al crear enemigos sin imagen la app busca automáticamente una imagen por nombre (con acceso rápido a Google Imágenes).
- **Mapa táctico 2D en dos pestañas (DM + Pantalla Jugadores con Niebla de Guerra):**
  - Abre el **🗺 Mapa DM aparte** (`index.html?view=map`) para ver todo el mapa completo (incluidos enemigos ocultos en la oscuridad marcados con `🌑`, trampas privadas `🔒` y radios de visión) y abre la **🖥 Pantalla Jugadores** (`player-map.html`) en otra pestaña para compartir por Discord/TV/segundo monitor.
  - **Sincronización en tiempo real** entre pestañas al mover pines, cambiar iluminación, activar antorchas o avanzar turnos.
  - **Iluminación y visión según D&D 2024:** elige entre **☀ Día**, **🌆 Penumbra**, **🌙 Noche** y **⬛ Oscuridad total**. Cada personaje aplica automáticamente su visión de ficha (**Khael 27 m** por *Visión en la umbra*, **Ojo de Bife_, Kygan y Volstagg 18 m**, **Doozer y Clive 0 m** en oscuridad salvo que lleven **🔥 Antorcha / 🏮 Linterna** o haya una fogata `🔥`).
  - Los enemigos colocados en zonas oscuras o con el ojo oculto (`◌`) permanecen **100% invisibles para los jugadores** hasta entrar en el radio de visión o luz de algún personaje.
- **Llevar a otra PC:** comparte el archivo **`Ronda-Extension-Chrome.zip`** y cárgalo en `chrome://extensions`. Para pasar un encuentro en curso (con posiciones del mapa incluidas) usa `⚙ Ajustes → ⇩ Exportar / ⇧ Cargar encuentro JSON`.
