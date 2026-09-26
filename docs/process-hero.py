#!/usr/bin/env python3
"""Olah hero art: buang letterbox bar, buat crop desktop + portrait card."""
from PIL import Image
import os

SRC = "/home/mariio77/nixeon-408/assets/imagen_20260926-123256_0.png"
OUT = "/home/mariio77/nixeon-408/assets/"

im = Image.open(SRC).convert("RGB")
w, h = im.size
print(f"sumber: {w}x{h}")

# --- 1. deteksi & buang letterbox bar (pakai downscale agar cepat) ---
small = im.resize((w // 8, h // 8), Image.NEAREST)
sw, sh = small.size
px = small.load()


def barish(values):
    if not values or max(values) > 24:
        return False
    mean = sum(values) / len(values)
    var = sum((v - mean) ** 2 for v in values) / len(values)
    return var ** 0.5 < 6


rows = [barish([max(px[x, y]) for x in range(sw)]) for y in range(sh)]
cols = [barish([max(px[x, y]) for y in range(sh)]) for x in range(sw)]

top = 0
while top < sh and rows[top]:
    top += 1
bottom = sh
while bottom > top and rows[bottom - 1]:
    bottom -= 1
left = 0
while left < sw and cols[left]:
    left += 1
right = sw
while right > left and cols[right - 1]:
    right -= 1

top, bottom, left, right = top * 8, bottom * 8, left * 8, right * 8
print(f"bar dipotong: atas={top} bawah={h-bottom} kiri={left} kanan={w-right}")

pad = 2
cropped = im.crop((max(0, left + pad), max(0, top + pad),
                   min(w, right - pad), min(h, bottom - pad)))
cw, ch = cropped.size
print(f"setelah crop: {cw}x{ch}")


def save(img, name, width, q=82):
    ww, hh = img.size
    if width and ww > width:
        img = img.resize((width, int(hh * width / ww)), Image.LANCZOS)
    path = OUT + name
    img.save(path, "WEBP", quality=q, method=6)
    print(f"{name}: {img.size} {os.path.getsize(path)/1024:.0f} KB")


def rect(img, x0f, y0, x1f, hh):
    """Crop pakai fraksi x dan piksel y (biar headroom bisa diatur)."""
    iw, ih = img.size
    x0, x1 = int(iw * x0f), int(iw * x1f)
    y1 = min(ih, y0 + hh)
    return img.crop((x0, y0, x1, y1))


# --- 2. portrait card 3:4 — ada headroom di atas tanduk ---
# lebar 900 px, tinggi 1200 px, y digeser turun agar tanduk tidak mepet
portrait = rect(cropped, 0.47, 60, 0.47 + 900 / cw, 1200)
save(portrait, "hero-portrait.webp", 900)

# --- 3. landscape 16:9 untuk background desktop ---
lw = cw
lh = int(lw * 9 / 16)
if lh <= ch:
    y0 = int((ch - lh) * 0.22)
    land = cropped.crop((0, y0, lw, y0 + lh))
else:
    land = cropped
save(land, "hero-wide.webp", 1920, q=80)
