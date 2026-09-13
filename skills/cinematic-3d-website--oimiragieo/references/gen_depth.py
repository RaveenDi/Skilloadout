#!/usr/bin/env python
"""Generate grayscale depth maps for cinematic frames (image to depth).

Usage: OPENROUTER_API_KEY=... python gen_depth.py <frames_dir> <out_dir> [n_frames]

Reads frame1..N (.webp/.png/.jpg) from frames_dir, writes depth1..N.png.
Verify each map by eye: near geometry white, background black.
"""
import base64
import json
import os
import sys
import urllib.request

URL = "https://openrouter.ai/api/v1/chat/completions"
KEY = os.environ.get("OPENROUTER_API_KEY", "")
SRC = sys.argv[1] if len(sys.argv) > 1 else "out"
OUT = sys.argv[2] if len(sys.argv) > 2 else "depth"
N = int(sys.argv[3]) if len(sys.argv) > 3 else 5
MODEL = "google/gemini-3-pro-image"
os.makedirs(OUT, exist_ok=True)

PROMPT = (
    "Output ONLY a precise grayscale DEPTH MAP of this exact image with the same "
    "framing and composition. The nearest surfaces to the camera must be pure "
    "white, the farthest background pure black, with a smooth continuous gradient "
    "in between. Grayscale only, no colour, no text, no labels."
)


def find_frame(i):
    for ext in ("webp", "png", "jpg"):
        p = os.path.join(SRC, f"frame{i}.{ext}")
        if os.path.exists(p):
            return p
    return None


def gen(i):
    src = find_frame(i)
    if not src:
        print(f"MISSING frame{i}")
        return
    mime = "image/webp" if src.endswith("webp") else "image/png"
    with open(src, "rb") as f:
        b = base64.b64encode(f.read()).decode()
    payload = {
        "model": MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": PROMPT},
                    {"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b}"}},
                ],
            }
        ],
        "modalities": ["image", "text"],
    }
    req = urllib.request.Request(
        URL,
        data=json.dumps(payload).encode(),
        headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=240) as r:
            data = json.loads(r.read())
    except Exception as exc:  # noqa: BLE001
        print(f"[frame{i}] ERROR {exc}")
        return
    try:
        url = data["choices"][0]["message"]["images"][0]["image_url"]["url"]
    except (KeyError, IndexError, TypeError):
        print(f"[frame{i}] no image :: {str(data)[:200]}")
        return
    b64 = url.split(",", 1)[1] if "," in url else url
    out = os.path.join(OUT, f"depth{i}.png")
    with open(out, "wb") as f:
        f.write(base64.b64decode(b64))
    print(f"[frame{i}] saved {out} ({os.path.getsize(out) // 1024}KB)")


if not KEY:
    print("NO KEY (set OPENROUTER_API_KEY)")
    sys.exit(1)
for n in range(1, N + 1):
    gen(n)
print("DEPTH DONE")
