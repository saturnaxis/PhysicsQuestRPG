#!/usr/bin/env python3
"""Update the offline asset list and cache version for a new release."""

import hashlib
import json
from pathlib import Path


def main():
    root = Path(__file__).resolve().parents[1]
    worker = root / "sw.js"
    extensions = {".html", ".js", ".css", ".webmanifest", ".webp", ".png", ".svg", ".ico", ".flac"}
    candidates = list(root.iterdir())
    for folder in ("art", "audio", "icons"):
        candidates.extend((root / folder).rglob("*"))
    paths = sorted(
        file.relative_to(root).as_posix()
        for file in candidates
        if file.is_file() and file.suffix in extensions and file != worker
    )

    version = hashlib.sha256()
    for path in paths:
        version.update(path.encode("utf-8") + b"\0")
        with (root / path).open("rb") as stream:
            version.update(hashlib.file_digest(stream, "sha256").digest())

    marker = "// BEGIN GENERATED PRECACHE\n"
    end = "// END GENERATED PRECACHE"
    source = worker.read_text(encoding="utf-8")
    prefix, generated = source.split(marker, 1)
    _, suffix = generated.split(end, 1)
    build = f"const buildVersion = {json.dumps(version.hexdigest()[:20])};\n"
    assets = f"const assets = {json.dumps(paths, indent=2)};\n"
    worker.write_text(prefix + marker + build + assets + end + suffix, encoding="utf-8")
    print(f"Updated the offline list for {len(paths)} files.")


if __name__ == "__main__":
    main()
