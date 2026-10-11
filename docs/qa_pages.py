#!/usr/bin/env python3
"""Fail closed until all 30 unique, portrait PNG pages exist."""
import hashlib
import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PAGES = json.loads((ROOT / "storyboard.json").read_text(encoding="utf-8"))
errors = []
if len(PAGES) != 30 or [p.get("page") for p in PAGES] != list(range(1, 31)):
    errors.append("storyboard must contain pages 1–30 exactly")

hashes = {}
for i in range(1, 31):
    entry = PAGES[i - 1] if i <= len(PAGES) else {}
    if not entry.get("scene") or not entry.get("title") or not entry.get("lines"):
        errors.append("page %02d has incomplete story or dialogue" % i)
    for line in entry.get("lines", []):
        if not line.get("speaker") or not line.get("text"):
            errors.append("page %02d has an empty dialogue card" % i)
    path = ROOT / "pages" / ("%02d.png" % i)
    if not path.is_file():
        errors.append("page %02d image missing" % i)
        continue
    data = path.read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n" or data[12:16] != b"IHDR":
        errors.append("page %02d is not a valid PNG" % i)
        continue
    width, height = struct.unpack(">II", data[16:24])
    if width < 768 or height < 1100 or height <= width:
        errors.append("page %02d is too small or not portrait (%d×%d)" % (i, width, height))
    digest = hashlib.sha256(data).hexdigest()
    if digest in hashes:
        errors.append("page %02d duplicates page %02d" % (i, hashes[digest]))
    hashes[digest] = i

if errors:
    for error in errors:
        print("FAIL:", error)
    sys.exit(1)
print("PASS: 30 unique portrait PNG pages and storyboard entries")
