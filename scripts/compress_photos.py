#!/usr/bin/env python3
"""Keep plant photos small enough for GitHub Pages.

GitHub Pages is comfortable under ~1 GB. At 80–120 KB per photo,
300 plants × 4 photos ≈ 100–150 MB. Original camera JPEGs would not fit.

Usage:
  python3 scripts/compress_photos.py
  python3 scripts/compress_photos.py path/to/photo.jpg
"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
PLANTS = ROOT / "assets" / "img" / "plants"
MAX_SIDE = 960
QUALITY = 80
BG = (248, 247, 245)


def compress(src: Path, dest: Path | None = None) -> Path:
    dest = dest or src.with_suffix(".webp")
    img = Image.open(src)
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "P"):
        bg = Image.new("RGB", img.size, BG)
        rgba = img.convert("RGBA")
        bg.paste(rgba, mask=rgba.split()[-1])
        img = bg
    else:
        img = img.convert("RGB")
    img.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "WEBP", quality=QUALITY, method=6)
    return dest


def main() -> None:
    args = [Path(a) for a in sys.argv[1:]]
    files = args or sorted(p for p in PLANTS.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"})
    if not files:
        print("no photos found")
        return
    for src in files:
        dest = src if src.suffix.lower() == ".webp" else src.with_suffix(".webp")
        before = src.stat().st_size
        compress(src, dest)
        after = dest.stat().st_size
        print(f"{src.name:40} {before/1024:7.1f} KB -> {after/1024:6.1f} KB")
        if dest != src and dest.exists():
            src.unlink()


if __name__ == "__main__":
    main()
