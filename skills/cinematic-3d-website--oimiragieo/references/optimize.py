#!/usr/bin/env python
"""Optimize frames and depth maps to web-ready WebP with Pillow.

Usage:
  python optimize.py <src_dir> <out_dir>          # color frames
  python optimize.py <src_dir> <out_dir> --depth  # grayscale depth maps

Frames: RGB, max width 1024, quality 84 (target 60-140KB).
Depths: grayscale L, quality 86 (target 16-36KB).
On Windows use C:/ style paths (Pillow rejects /c/ MSYS-style paths).
"""
import os
import sys

from PIL import Image

SRC = sys.argv[1]
OUT = sys.argv[2]
IS_DEPTH = "--depth" in sys.argv
os.makedirs(OUT, exist_ok=True)

for name in sorted(os.listdir(SRC)):
    if not name.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
        continue
    im = Image.open(os.path.join(SRC, name))
    im = im.convert("L") if IS_DEPTH else im.convert("RGB")
    if im.size[0] > 1024:
        im = im.resize((1024, round(im.size[1] * 1024 / im.size[0])), Image.LANCZOS)
    stem = os.path.splitext(name)[0]
    out = os.path.join(OUT, stem + ".webp")
    im.save(out, "WEBP", quality=86 if IS_DEPTH else 84, method=6)
    print(f"{out} {im.size} {os.path.getsize(out) // 1024}KB")
print("OPTIMIZED")
