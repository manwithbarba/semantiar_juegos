#!/usr/bin/env python3
"""Gate for the GitHub Pages artifact.

The public site may contain synthetic teaching cases and the aggregate SNOMED
explorer, but never clinical note fragments or identifiers from annotation
lotes. This check runs before the Pages build.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
ALLOWED_DEMO = PUBLIC / "example-input.json"
SCHEMA_NAMES = {"semantiar-annotation.schema.json"}
FORBIDDEN_DATA_SUFFIXES = {".csv", ".tsv", ".xlsx", ".xls", ".parquet", ".sqlite", ".db"}
FORBIDDEN_PUBLIC_FILES = {"snomed-context-data.local.json"}
FORBIDDEN_KEYS = {
    "caseId",
    "caseIds",
    "cases",
    "annotatorId",
    "annotatorIds",
    "annotators",
    "surfaces",
    "textoLiteral",
    "textNorm",
    "before",
    "mention",
    "after",
    "sourceFile",
    "annotationSource",
    "embeddingSource",
    "metadataSource",
    "hierarchySource",
}


def key_paths(value: object, path: str = "$") -> list[str]:
    found: list[str] = []
    if isinstance(value, dict):
        for key, child in value.items():
            child_path = f"{path}.{key}"
            if key in FORBIDDEN_KEYS:
                found.append(child_path)
            found.extend(key_paths(child, child_path))
    elif isinstance(value, list):
        for index, child in enumerate(value):
            found.extend(key_paths(child, f"{path}[{index}]"))
    return found


def check() -> list[str]:
    failures: list[str] = []
    if not PUBLIC.is_dir():
        return [f"No existe el directorio público: {PUBLIC}"]

    for path in PUBLIC.rglob("*"):
        if not path.is_file():
            continue
        relative = path.relative_to(ROOT)
        if path.name in FORBIDDEN_PUBLIC_FILES:
            failures.append(f"fragmentos clínicos locales presentes en public/: {relative}")
        if path.suffix.lower() in FORBIDDEN_DATA_SUFFIXES:
            failures.append(f"formato de datos no permitido en public/: {relative}")
        if path.suffix.lower() != ".json" or path.name in SCHEMA_NAMES:
            continue
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, UnicodeError, json.JSONDecodeError) as exc:
            failures.append(f"JSON público ilegible ({relative}): {exc}")
            continue

        if path.name == "snomed-concepts-data.json":
            paths = key_paths(value)
            if paths:
                failures.append(f"payload SNOMED contiene campos sensibles: {', '.join(paths[:5])}")
            policy = value.get("source", {}).get("publicDataPolicy", {}) if isinstance(value, dict) else {}
            for field in ("clinicalTextIncluded", "caseIdentifiersIncluded", "annotatorIdentifiersIncluded", "sourcePathsIncluded"):
                if policy.get(field) is not False:
                    failures.append(f"payload SNOMED no declara {field}=false")
            continue

        if not isinstance(value, dict) or "cases" not in value:
            continue
        if path != ALLOWED_DEMO:
            failures.append(f"documento de anotación no permitido en public/: {relative}")
            continue
        if value.get("batch") != "EJEMPLO_SINTETICO_CAL3":
            failures.append("example-input.json no declara el lote sintético de calibración 3")
        if value.get("annotatorId") != "DEMO":
            failures.append("example-input.json no usa el identificador DEMO")
        cases = value.get("cases")
        if not isinstance(cases, list) or not cases or any(
            not isinstance(item, dict) or not str(item.get("id", "")).startswith("CAL3-SYN-")
            for item in cases
        ):
            failures.append("example-input.json contiene casos que no tienen IDs sintéticos CAL3-SYN-")

    return failures


if __name__ == "__main__":
    errors = check()
    if errors:
        for error in errors:
            print(f"ERROR: {error}")
        raise SystemExit(1)
    print("OK: public/ contiene sólo el ejemplo sintético y el mapa SNOMED agregado.")
