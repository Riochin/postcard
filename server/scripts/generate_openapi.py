#!/usr/bin/env python3
"""
OpenAPI spec generator for the Postcard API
Run this script to generate the OpenAPI specification JSON file
"""

import json
import sys
from pathlib import Path

# Add parent directory to path to import main
sys.path.insert(0, str(Path(__file__).parent.parent))

from main import app

if __name__ == "__main__":
    openapi_spec = app.openapi()

    output_path = Path(__file__).parent.parent / "openapi.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_spec, f, indent=2, ensure_ascii=False)

    print("OpenAPI specification generated: openapi.json")
    print(f"API Title: {openapi_spec['info']['title']}")
    print(f"API Version: {openapi_spec['info']['version']}")
    print(
        f"Total endpoints: {len([path for paths in openapi_spec['paths'].values() for path in paths])}"
    )
