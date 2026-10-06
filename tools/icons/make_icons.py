"""Cuts the orange tile out of tools/icons/source.png and writes icons/{16,32,48,128}.png.

    pip install pillow
    python tools/icons/make_icons.py
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
TILE = (200, 195, 822, 822)  # the orange tile inside the 1024x1024 source, without the glass frame and shadow
RADIUS = 0.16  # corner radius as a share of the tile width

src = Image.open(ROOT / "tools" / "icons" / "source.png").convert("RGB").crop(TILE)
side = max(src.size)
src = src.resize((side, side), Image.LANCZOS)
mask = Image.new("L", (side * 4, side * 4), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, side * 4 - 1, side * 4 - 1), radius=int(side * 4 * RADIUS), fill=255)
tile = src.convert("RGBA")
tile.putalpha(mask.resize((side, side), Image.LANCZOS))

for size in (16, 32, 48, 128):
    pad = 0 if size < 48 else round(size / 16)  # Chrome draws 128px icons with some breathing room
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    inner = tile.resize((size - 2 * pad, size - 2 * pad), Image.LANCZOS)
    canvas.paste(inner, (pad, pad), inner)
    canvas.save(ROOT / "icons" / f"{size}.png", optimize=True)
print("wrote icons/16.png, 32.png, 48.png, 128.png")
