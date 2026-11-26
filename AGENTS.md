# Ronda DM — Project Architecture & Code Quality Rules

These rules are mandatory for every change in this repository.

## Core Standards

1. **Maximum 200 lines per file:** No `.js`, `.css`, `.html`, or `.json` source file may exceed 200 lines. Target 50–160 lines per file.
2. **Single Responsibility Principle (SRP):**
   - Every file owns one clear responsibility.
   - Every function has one clear purpose and a descriptive verb-noun name (keep functions focused and short).
   - Never mix domain rules with DOM rendering or storage I/O.
3. **Clean Architecture folder boundaries:**
   - `src/data/` — Static campaign data, character sheets, spell/feature/action catalogs.
   - `src/domain/` — Pure business rules & D&D 2024 mechanics (zero DOM, zero `window`/`document`/`localStorage`/`chrome`).
   - `src/infrastructure/` — Storage, `BroadcastChannel`, clipboard, file I/O, Chrome extension bridge, external image search.
   - `src/application/` — Encounter store and use cases orchestrating domain + infrastructure.
   - `src/presentation/` — Templates, DOM renderers, event controllers, DM map UI, Player map UI.
   - `src/extension/` — Chrome Extension MV3 service worker, popup, and Nivel20 extractors.
   - `src/styles/` — Modular stylesheets split by concern (`base/`, `layout/`, `components/`, `features/`).
4. **Always activate the `clean-architecture` skill** (`.agents/skills/clean-architecture/SKILL.md`) when refactoring or adding new modules, and run `python .agents/skills/clean-architecture/scripts/verify-standards.py` before finishing.
