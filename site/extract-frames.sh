#!/usr/bin/env bash
# Usage: ./extract-frames.sh <video> [fps]
set -euo pipefail
VIDEO="$1"
FPS="${2:-15}"
ROOT="$(cd "$(dirname "$0")" && pwd)"
OUT="$ROOT/assets/frames"

rm -rf "$OUT/desktop" "$OUT/mobile"
mkdir -p "$OUT/desktop" "$OUT/mobile"

ffmpeg -loglevel error -y -i "$VIDEO" -vf "fps=$FPS,scale=1600:-2:flags=lanczos" -q:v 4 "$OUT/desktop/%04d.jpg"
ffmpeg -loglevel error -y -i "$VIDEO" -vf "fps=$FPS,scale=900:-2:flags=lanczos" -q:v 5 "$OUT/mobile/%04d.jpg"

COUNT=$(ls "$OUT/desktop" | wc -l | tr -d ' ')
cat > "$ROOT/js/film-config.js" <<EOF
window.FILM_CONFIG = {
  count: $COUNT,
  fps: $FPS,
  path: "assets/frames/desktop/",
  mobilePath: "assets/frames/mobile/"
};
EOF

echo "Extracted $COUNT frames"
du -sh "$OUT/desktop" "$OUT/mobile"
