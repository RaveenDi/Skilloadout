#!/usr/bin/env python
"""Generate cinematic frames via OpenRouter image models.

Usage:
  OPENROUTER_API_KEY=... python gen_stills.py hero out/ "art direction paragraph"
  OPENROUTER_API_KEY=... python gen_stills.py seq  out/ prompts.txt   # one prompt per line

Models: hero mode uses openai/gpt-5.4-image-2 (best quality, slow ~109s/img);
seq mode uses google/gemini-3-pro-image (fast, best cross-frame consistency).
Never print the key, never commit it.

RESOLUTION (learned the hard way): asking for "2048px" INSIDE the prompt is
IGNORED; models return ~1024px. The only lever that works is the structured
"image_config" field below (Gemini image models honor it; set SIZE_2K=1 to
request 2K). Provider routing is inconsistent: some backends still return
1024, so RETRY a frame that comes back small (2 tries), and for a stubborn
frame fall back to a Lanczos upscale of the best 1024 (optimize.py). Ship 2K
frames: at ~300-430KB WebP each the sharpness upgrade is dramatic, and a
"bandwidth budget" 1024 reads as intentional blur to a reviewer. After ANY
resolution change, REGENERATE the depth maps: old maps no longer match the
new pixels.
"""
import base64
import json
import os
import sys
import urllib.request

URL = "https://openrouter.ai/api/v1/chat/completions"
KEY = os.environ.get("OPENROUTER_API_KEY", "")
MODE = sys.argv[1] if len(sys.argv) > 1 else "hero"
OUT = sys.argv[2] if len(sys.argv) > 2 else "out"
ARG = sys.argv[3] if len(sys.argv) > 3 else ""
MODEL = "openai/gpt-5.4-image-2" if MODE == "hero" else "google/gemini-3-pro-image"
SIZE_2K = os.environ.get("SIZE_2K", "") == "1"
os.makedirs(OUT, exist_ok=True)


def gen(prompt, name):
    payload = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "modalities": ["image", "text"],
    }
    if SIZE_2K:
        # The structured config is the ONLY working resolution request.
        payload["image_config"] = {"aspect_ratio": "1:1", "image_size": "2K"}
    req = urllib.request.Request(
        URL,
        data=json.dumps(payload).encode(),
        headers={"Authorization": "Bearer " + KEY, "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=360) as r:
            data = json.loads(r.read())
    except Exception as exc:  # noqa: BLE001
        print(f"[{name}] ERROR {exc}")
        return
    try:
        url = data["choices"][0]["message"]["images"][0]["image_url"]["url"]
    except (KeyError, IndexError, TypeError):
        print(f"[{name}] no image :: {str(data)[:200]}")
        return
    b64 = url.split(",", 1)[1] if "," in url else url
    path = os.path.join(OUT, name + ".png")
    with open(path, "wb") as f:
        f.write(base64.b64decode(b64))
    print(f"[{name}] saved {path} ({os.path.getsize(path) // 1024}KB)")


if not KEY:
    print("NO KEY (set OPENROUTER_API_KEY)")
    sys.exit(1)
print(f"mode={MODE} model={MODEL}")
if MODE == "hero":
    gen(ARG, "frame1")
else:
    with open(ARG, encoding="utf-8") as f:
        prompts = [ln.strip() for ln in f if ln.strip()]
    for i, p in enumerate(prompts, start=2):
        gen(p, f"frame{i}")
print("DONE")
