---
name: clean-architecture
description: >-
  Enforces Clean Architecture, strict 200-line file limits, single-responsibility
  functions, and modular folder organization across the Ronda DM codebase.
  Use before creating, editing, or refactoring any source file, stylesheet,
  HTML view, or extension script in this repository.
---

# Clean Architecture & Code Quality Standard

Follow these non-negotiable standards on every change in this repository.

## 1. Hard Limits

- **Max file length:** **200 lines** per source file (`.js`, `.css`, `.html`, `.json`). No exceptions. Aim for 50–160 lines to leave room for maintenance.
- **Function granularity:** Every function must have **one clear purpose**, a descriptive verb-noun name, and stay concise (target ≤ 35 lines). Split multi-step workflows into named helpers.
- **Zero duplication:** Shared rules (e.g., D&D vision/lighting, dice parsing, HP math, sync channels) live once in `src/domain/` or `src/infrastructure/` and are imported everywhere they are needed.

## 2. Clean Architecture Layering

Dependencies must point **inward only**:

```text
presentation / extension  ──▶  application  ──▶  domain  ◀──  data
            │                       │
            └───────▶ infrastructure ┘
```

| Layer | Folder | Allowed Dependencies | Responsibility |
| :--- | :--- | :--- | :--- |
| **Data** | `src/data/` | None | Pure static campaign sheets, spells, actions, feature metadata. |
| **Domain** | `src/domain/` | `src/data/` | Pure D&D 2024 rules, dice math, vision/fog rules, geometry, mappers. **Zero DOM / zero browser APIs.** |
| **Infrastructure** | `src/infrastructure/` | `src/domain/` | Storage (`localStorage`, `chrome.storage`), `BroadcastChannel`, clipboard, file I/O, Chrome extension bridge, external image search. |
| **Application** | `src/application/` | `src/domain/`, `src/infrastructure/`, `src/data/` | Reactive encounter store, combat log, turn flow, HP adjustments, action resolution, dice pool, map state mutations. |
| **Presentation** | `src/presentation/` | `src/application/`, `src/domain/`, `src/infrastructure/` | HTML templates, DOM renderers, event controllers, DM map canvas/drag, Player Map presenter. |
| **Extension** | `src/extension/` | Chrome MV3 APIs | Service worker (`background.js`), popup UI, Nivel20 content-script extractors. |
| **Styles** | `src/styles/` | CSS `@import` | Design tokens, base reset, layout, reusable components, feature styles. |

## 3. Procedure When Adding or Modifying Code

1. **Locate the right layer first.** Never put DOM manipulation in `domain/` or `application/`, and never put D&D rule math directly inside event listeners.
2. **Check file size before and after editing.** If an edit would push a file past 180 lines, extract a cohesive submodule immediately.
3. **Keep entrypoints minimal.** Root `index.html`, `player-map.html`, and `src/styles/main.css` act only as composition shells.
4. **Preserve Chrome MV3 compatibility.**
   - App code uses native ES Modules (`<script type="module">`) with explicit `.js` relative paths.
   - `chrome.scripting.executeScript` scripts in `src/extension/nivel20/` must remain classic scripts executed sequentially in Chrome's isolated world.

## 4. Mandatory Verification

After every refactor or feature edit, run the automated standards audit:

```powershell
python .agents/skills/clean-architecture/scripts/verify-standards.py
```

The command **must exit with code 0** (all files ≤ 200 lines, all JS/CSS imports resolved, no layer violations).
