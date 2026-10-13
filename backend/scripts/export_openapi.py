"""Grava o OpenAPI da API em um arquivo JSON, sem subir servidor nem conectar ao banco.

Uso: uv run python -m scripts.export_openapi caminho/openapi.json
"""

import json
import sys
from pathlib import Path

from app.main import create_app


def main(target: str) -> None:
    schema = create_app().openapi()
    Path(target).write_text(json.dumps(schema, ensure_ascii=False, indent=2), encoding="utf-8")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "openapi.json")
