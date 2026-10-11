#!/usr/bin/env python3
"""Check bilingual layouts and fail closed until all artwork is reviewed."""
import hashlib
import json
import struct
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
PARTIAL = "--partial" in sys.argv
PAGES = {
    language: json.loads((ROOT / story).read_text(encoding="utf-8"))
    for language, story in (("zh", "storyboard.json"), ("en", "storyboard.en.json"))
}
LAYOUTS = {
    language: json.loads((ROOT / layout).read_text(encoding="utf-8"))
    for language, layout in (("zh", "layout.json"), ("en", "layout.en.json"))
}
errors = []
for language in ("zh", "en"):
    pages, layouts = PAGES[language], LAYOUTS[language]
    if len(pages) != 30 or [p.get("page") for p in pages] != list(range(1, 31)):
        errors.append("%s storyboard must contain pages 1–30 exactly" % language)
    if len(layouts) != 30 or [p.get("page") for p in layouts] != list(range(1, 31)):
        errors.append("%s layout must contain pages 1–30 exactly" % language)

hashes = {}
present = 0
for i in range(1, 31):
    path = ROOT / "pages" / ("%02d.png" % i)
    for language in ("zh", "en"):
        entry = PAGES[language][i - 1] if i <= len(PAGES[language]) else {}
        layout = LAYOUTS[language][i - 1] if i <= len(LAYOUTS[language]) else {}
        lines = entry.get("lines", [])
        balloons = layout.get("balloons", [])
        if not entry.get("scene") or not entry.get("title") or not entry.get("chapter") or not lines:
            errors.append("%s page %02d has incomplete story or dialogue" % (language, i))
        if len(balloons) != len(lines) or not 1 <= layout.get("panel_count", 0) <= 4:
            errors.append("%s page %02d has incomplete panel layout" % (language, i))
        for line in lines:
            if not line.get("speaker", "").strip() or not line.get("text", "").strip():
                errors.append("%s page %02d has an empty dialogue card" % (language, i))
        for bubble in balloons:
            x, y, width = bubble.get("x", -1), bubble.get("y", -1), bubble.get("w", -1)
            if not (0 <= x and 0 <= y <= 90 and width > 0 and x + width <= 99):
                errors.append("%s page %02d has a bubble outside the artwork" % (language, i))
            if not 1 <= bubble.get("panel", 0) <= layout.get("panel_count", 0):
                errors.append("%s page %02d has a bubble assigned to a nonexistent panel" % (language, i))
        if (not PARTIAL or path.is_file()) and not layout.get("reviewed"):
            errors.append("%s page %02d dialogue placement has not been visually reviewed" % (language, i))
    if i <= min(len(PAGES["zh"]), len(PAGES["en"])) and len(PAGES["zh"][i - 1].get("lines", [])) != len(PAGES["en"][i - 1].get("lines", [])):
        errors.append("page %02d has mismatched bilingual dialogue count" % i)
    if not path.is_file():
        if not PARTIAL:
            errors.append("page %02d image missing" % i)
        continue
    present += 1
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
print("PASS: %d unique portrait PNG pages, bilingual storyboards, and reviewed dialogue layouts" % present)
