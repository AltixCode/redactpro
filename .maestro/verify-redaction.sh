#!/usr/bin/env bash
# Re-OCRs the image RedactPro exported and fails if any planted value survives.
#
# Takes a simulator udid or "android". Text recognition is Vision on iOS and
# ML Kit on Android -- separate engines with separate box geometry -- so one
# platform passing says nothing about the other.
#
# Usage: .maestro/verify-redaction.sh <udid|android>
set -euo pipefail
TARGET="${1:?usage: verify-redaction.sh <udid|android>}"
BIN="$(mktemp -d)/verify"
swiftc -O "$(dirname "$0")/verify-redaction.swift" -o "$BIN"

if [ "$TARGET" = android ]; then
  ADB="$HOME/Library/Android/sdk/platform-tools/adb"
  "$ADB" shell content call --uri content://media/ --method scan_volume --arg external_primary >/dev/null 2>&1 || true
  SRC="$("$ADB" shell "ls -t /sdcard/DCIM/redactpro_*.jpg" 2>/dev/null | tr -d '\r' | head -1)"
  [ -n "$SRC" ] || { echo "FAIL: no export on the device - the save never ran"; exit 1; }
  SHOT="$(mktemp -d)/export.jpg"
  "$ADB" pull "$SRC" "$SHOT" >/dev/null
else
  DCIM="$HOME/Library/Developer/CoreSimulator/Devices/$TARGET/data/Media/DCIM/100APPLE"
  SHOT="$(ls -t "$DCIM"/*.JPG "$DCIM"/*.PNG 2>/dev/null | head -1)"
  [ -n "$SHOT" ] || { echo "FAIL: no export in the camera roll - the save never ran"; exit 1; }
fi
echo "verifying $(basename "$SHOT")"
"$BIN" "$SHOT"
