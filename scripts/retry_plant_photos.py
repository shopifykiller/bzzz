#!/usr/bin/env python3
"""Retry missing plant thumbnails via Wikipedia pageimages API (640px thumbs only)."""
from __future__ import annotations

import io
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "assets" / "img" / "plants"
UA = "PchelosharingPlantCatalog/1.0 (local static catalog; contact: local-dev)"
BG = (248, 247, 245)
SIZE = 640

NEED = {
    "calathea-orbifolia": "Goeppertia_orbifolia",
    "alocasia-amazonica": "Alocasia",
    "sansevieria-cylindrica": "Dracaena_angolensis",
    "hoya-carnosa": "Hoya_carnosa",
    "nephrolepis": "Nephrolepis_exaltata",
    "yucca": "Yucca_gigantea",
    "pilea-peperomioides": "Pilea_peperomioides",
    "pomegranate-dwarf": "Punica_granatum",
    "japonica-quince": "Chaenomeles_japonica",
    "apple-antonovka": "Malus_domestica",
    "plum-vengerka": "Prunus_domestica",
    "walnut-ideal": "Juglans_regia",
    "lemon-meyer": "Meyer_lemon",
    "mandarin-unshiu": "Citrus_unshiu",
    "calamondin": "Citrus_microcarpa",
    "kumquat-nagami": "Kumquat",
    "feijoa": "Acca_sellowiana",
    "lemon-eucalyptus": "Corymbia_citriodora",
    "magnolia-grandiflora": "Magnolia_grandiflora",
    "camellia": "Camellia_japonica",
    "date-palm": "Phoenix_roebelenii",
}


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "application/json,image/*"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def pageimage(title: str) -> str | None:
    q = urllib.parse.urlencode({
        "action": "query",
        "titles": title.replace("_", " "),
        "prop": "pageimages",
        "format": "json",
        "pithumbsize": 800,
        "redirects": 1,
    })
    url = "https://en.wikipedia.org/w/api.php?" + q
    data = json.loads(fetch(url).decode("utf-8"))
    pages = (data.get("query") or {}).get("pages") or {}
    for page in pages.values():
        thumb = (page.get("thumbnail") or {}).get("source")
        if thumb:
            return thumb.split("?")[0]
    return None


def to_square(img: Image.Image) -> Image.Image:
    img = ImageOps.exif_transpose(img)
    if img.mode in ("RGBA", "P"):
        bg = Image.new("RGB", img.size, BG)
        rgba = img.convert("RGBA")
        bg.paste(rgba, mask=rgba.split()[-1])
        img = bg
    else:
        img = img.convert("RGB")
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = int((h - side) * 0.28)
    if top + side > h:
        top = (h - side) // 2
    img = img.crop((left, top, left + side, top + side))
    img = img.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    canvas = Image.new("RGB", (SIZE, SIZE), BG)
    inner = int(SIZE * 0.92)
    img = img.resize((inner, inner), Image.Resampling.LANCZOS)
    off = (SIZE - inner) // 2
    canvas.paste(img, (off, off))
    return canvas


def main() -> None:
    for i, (pid, title) in enumerate(NEED.items(), 1):
        dest = OUT_DIR / f"{pid}.webp"
        print(f"[{i}/{len(NEED)}] {pid}")
        try:
            src = pageimage(title)
            print("  thumb", src)
            if not src:
                continue
            time.sleep(0.8)
            raw = fetch(src)
            img = to_square(Image.open(io.BytesIO(raw)))
            img.save(dest, "WEBP", quality=82, method=6)
            print("  saved", dest.stat().st_size)
        except Exception as exc:
            print("  fail", exc)
        time.sleep(1.2)


if __name__ == "__main__":
    main()
