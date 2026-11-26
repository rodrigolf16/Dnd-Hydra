#!/usr/bin/env python3
"""Automated Clean Architecture & Code Quality verifier for Ronda DM."""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

MAX_LINES = 200
ROOT = Path(__file__).resolve().parents[4]
CHECK_EXTS = {".js", ".mjs", ".css", ".html", ".json"}
IGNORE_DIRS = {".git", ".agents", "assets", "lib", "node_modules"}
IGNORE_FILES = {"package-lock.json"}

JS_IMPORT_RE = re.compile(
    r"""(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]"""
)
CSS_IMPORT_RE = re.compile(r"""@import\s+(?:url\()?['"]([^'"]+)['"]\)?;""")
DOM_FORBIDDEN_RE = re.compile(r"\b(document|window|localStorage|chrome)\b")


def iter_source_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT)
        if any(part in IGNORE_DIRS for part in rel.parts):
            continue
        if path.name in IGNORE_FILES or path.suffix not in CHECK_EXTS:
            continue
        files.append(path)
    return sorted(files)


def check_line_limits(files: list[Path]) -> list[str]:
    errors: list[str] = []
    for path in files:
        lines = path.read_text(encoding="utf-8").splitlines()
        if len(lines) > MAX_LINES:
            rel = path.relative_to(ROOT)
            errors.append(f"[LINE LIMIT] {rel}: {len(lines)} lines (max {MAX_LINES})")
    return errors


def check_imports(files: list[Path]) -> list[str]:
    errors: list[str] = []
    for path in files:
        text = path.read_text(encoding="utf-8")
        rel = path.relative_to(ROOT)
        if path.suffix == ".js":
            for match in JS_IMPORT_RE.finditer(text):
                spec = match.group(1)
                if spec.startswith("."):
                    target = (path.parent / spec).resolve()
                    if not target.is_file():
                        errors.append(f"[BROKEN JS IMPORT] {rel} -> {spec}")
        elif path.suffix == ".css":
            for match in CSS_IMPORT_RE.finditer(text):
                spec = match.group(1)
                if not spec.startswith("http"):
                    target = (path.parent / spec).resolve()
                    if not target.is_file():
                        errors.append(f"[BROKEN CSS IMPORT] {rel} -> {spec}")
    return errors


def check_domain_purity(files: list[Path]) -> list[str]:
    errors: list[str] = []
    domain_root = ROOT / "src" / "domain"
    for path in files:
        if path.suffix != ".js":
            continue
        try:
            path.relative_to(domain_root)
        except ValueError:
            continue
        text = path.read_text(encoding="utf-8")
        # Strip line comments before checking for DOM/browser globals
        stripped = re.sub(r"//.*", "", text)
        match = DOM_FORBIDDEN_RE.search(stripped)
        if match:
            rel = path.relative_to(ROOT)
            errors.append(
                f"[LAYER VIOLATION] {rel} references browser global '{match.group(1)}'"
            )
    return errors


def check_manifest() -> list[str]:
    errors: list[str] = []
    manifest_path = ROOT / "manifest.json"
    if not manifest_path.is_file():
        return ["[MANIFEST] manifest.json missing"]
    data = json.loads(manifest_path.read_text(encoding="utf-8"))
    refs = [
        data.get("action", {}).get("default_popup"),
        data.get("side_panel", {}).get("default_path"),
        data.get("background", {}).get("service_worker"),
        *data.get("icons", {}).values(),
    ]
    for ref in refs:
        if ref and not (ROOT / ref).is_file():
            errors.append(f"[MANIFEST REF] Missing file: {ref}")
    return errors


def main() -> int:
    files = iter_source_files()
    errors = [
        *check_line_limits(files),
        *check_imports(files),
        *check_domain_purity(files),
        *check_manifest(),
    ]
    max_seen = max(
        (len(p.read_text(encoding="utf-8").splitlines()) for p in files), default=0
    )
    print(f"Checked {len(files)} source files (max length: {max_seen} lines).")
    if errors:
        print(f"FAILED with {len(errors)} issue(s):")
        for err in errors:
            print(f"  - {err}")
        return 1
    print("PASSED: Clean Architecture & <= 200 lines/file standards verified.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
