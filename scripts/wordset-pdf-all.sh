#!/usr/bin/env bash
# Generiše PDF priručnik (mreža kartica) za sve wordset JSON-ove u scripts/flashcards/.
# Upotreba: bash scripts/wordset-pdf-all.sh
set -euo pipefail
cd "$(dirname "$0")/.."
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
mkdir -p scripts/flashcards/pdf
for f in scripts/flashcards/*.json; do
  name="$(basename "${f%.json}")"
  npx tsx scripts/generate-wordset-pdf.ts "$f" > "/tmp/$name.html"
  "$CHROME" --headless --disable-gpu --no-pdf-header-footer \
    --print-to-pdf="scripts/flashcards/pdf/$name.pdf" "file:///tmp/$name.html" 2>/dev/null
  echo "$name → PDF ✓"
done
