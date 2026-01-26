#!/bin/bash
#
# Prepare DeckLink SDK for GitHub Secrets
#
# Usage:
#   ./scripts/prepare-decklink-sdk.sh [mac|win]
#
# Prerequisites:
#   Place the Blackmagic_DeckLink_SDK_*.zip in the sdk-download/ folder
#
# macOS: Extracts essential .h header files only
# Windows: Extracts essential .idl files only (compiled with MIDL in CI)
#

set -e

PLATFORM="$1"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SDK_DOWNLOAD_DIR="$PROJECT_DIR/sdk-download"

# Essential files only (no legacy headers, no DeckControl for tape)
ESSENTIAL_MAC_FILES=(
    "DeckLinkAPI.h"
    "DeckLinkAPITypes.h"
    "DeckLinkAPIModes.h"
    "DeckLinkAPIDiscovery.h"
    "DeckLinkAPIConfiguration.h"
    "DeckLinkAPIVersion.h"
    "DeckLinkAPIDispatch.cpp"
)

ESSENTIAL_WIN_FILES=(
    "DeckLinkAPI.idl"
    "DeckLinkAPITypes.idl"
    "DeckLinkAPIModes.idl"
    "DeckLinkAPIDiscovery.idl"
    "DeckLinkAPIConfiguration.idl"
    "DeckLinkAPIVersion.h"
)

if [ -z "$PLATFORM" ]; then
    echo "Usage: $0 [mac|win]"
    echo ""
    echo "Prerequisites:"
    echo "  1. Download DeckLink SDK from blackmagicdesign.com"
    echo "  2. Place the ZIP in: sdk-download/"
    echo ""
    echo "Example:"
    echo "  $0 mac   # Extract macOS headers (.h)"
    echo "  $0 win   # Extract Windows IDL files (.idl)"
    exit 1
fi

# Find SDK ZIP
SDK_ZIP=$(find "$SDK_DOWNLOAD_DIR" -name "Blackmagic_DeckLink_SDK*.zip" -type f 2>/dev/null | head -1)

if [ -z "$SDK_ZIP" ]; then
    echo "Error: No Blackmagic_DeckLink_SDK*.zip found in sdk-download/"
    echo "Please download the SDK from:"
    echo "  https://www.blackmagicdesign.com/support/family/capture-and-playback"
    exit 1
fi

echo "Found SDK: $SDK_ZIP"

# Create temp directories
TEMP_EXTRACT=$(mktemp -d)
TEMP_OUTPUT=$(mktemp -d)
echo "Extracting SDK..."

# Extract the ZIP
unzip -q "$SDK_ZIP" -d "$TEMP_EXTRACT"

# Find the actual SDK folder (has space in name)
SDK_ROOT=$(find "$TEMP_EXTRACT" -maxdepth 1 -type d -name "Blackmagic*" | head -1)
if [ -z "$SDK_ROOT" ]; then
    SDK_ROOT="$TEMP_EXTRACT"
fi

echo "SDK Root: $SDK_ROOT"

if [ "$PLATFORM" == "mac" ]; then
    INCLUDE_PATH="$SDK_ROOT/Mac/include"
    ESSENTIAL_FILES=("${ESSENTIAL_MAC_FILES[@]}")
elif [ "$PLATFORM" == "win" ]; then
    INCLUDE_PATH="$SDK_ROOT/Win/include"
    ESSENTIAL_FILES=("${ESSENTIAL_WIN_FILES[@]}")
else
    echo "Error: Unknown platform '$PLATFORM'. Use 'mac' or 'win'."
    rm -rf "$TEMP_EXTRACT" "$TEMP_OUTPUT"
    exit 1
fi

if [ ! -d "$INCLUDE_PATH" ]; then
    echo "Error: Include path not found: $INCLUDE_PATH"
    ls -la "$SDK_ROOT"
    rm -rf "$TEMP_EXTRACT" "$TEMP_OUTPUT"
    exit 1
fi

echo ""
echo "Copying essential files for $PLATFORM..."

COPIED=0
for file in "${ESSENTIAL_FILES[@]}"; do
    SRC="$INCLUDE_PATH/$file"
    if [ -f "$SRC" ]; then
        cp "$SRC" "$TEMP_OUTPUT/"
        echo "  ✓ $file"
        COPIED=$((COPIED + 1))
    else
        echo "  ✗ $file (not found)"
    fi
done

if [ "$COPIED" -eq 0 ]; then
    echo "Error: No files copied!"
    rm -rf "$TEMP_EXTRACT" "$TEMP_OUTPUT"
    exit 1
fi

echo ""
echo "Copied $COPIED essential files"

# Create small ZIP
OUTPUT_ZIP="/tmp/decklink-sdk-$PLATFORM.zip"
rm -f "$OUTPUT_ZIP"
echo ""
echo "Creating ZIP archive..."
cd "$TEMP_OUTPUT"
zip -r "$OUTPUT_ZIP" . > /dev/null
cd - > /dev/null

ZIP_SIZE=$(stat -f%z "$OUTPUT_ZIP" 2>/dev/null || stat -c%s "$OUTPUT_ZIP" 2>/dev/null)
echo "ZIP size: $ZIP_SIZE bytes ($((ZIP_SIZE / 1024)) KB)"

# Base64 encode
echo ""
echo "Base64 encoding..."
BASE64_FILE="/tmp/decklink-sdk-$PLATFORM.b64"

if [[ "$OSTYPE" == "darwin"* ]]; then
    base64 -i "$OUTPUT_ZIP" -o "$BASE64_FILE"
else
    base64 -w 0 "$OUTPUT_ZIP" > "$BASE64_FILE"
fi

BASE64_SIZE=$(stat -f%z "$BASE64_FILE" 2>/dev/null || stat -c%s "$BASE64_FILE" 2>/dev/null)
echo "Base64 size: $BASE64_SIZE bytes ($((BASE64_SIZE / 1024)) KB)"

# Check GitHub Secret limits (48KB = 49152 bytes)
if [ "$BASE64_SIZE" -gt 49152 ]; then
    echo ""
    echo "⚠️  WARNING: Base64 output ($((BASE64_SIZE / 1024))KB) exceeds GitHub Secret limit (48KB)"
    echo "    Consider removing more files or using a different approach."
else
    echo "✓ Size OK for GitHub Secrets (limit: 48KB)"
fi

# Cleanup
rm -rf "$TEMP_EXTRACT" "$TEMP_OUTPUT"

echo ""
echo "=========================================="
echo "Done!"
echo ""
echo "Output files:"
echo "  ZIP:    $OUTPUT_ZIP"
echo "  Base64: $BASE64_FILE"
echo ""
echo "To add to GitHub Secrets:"
echo "  1. Go to: Repository → Settings → Secrets → Actions"
echo "  2. Click 'New repository secret'"
if [ "$PLATFORM" == "mac" ]; then
    echo "  3. Name: DECKLINK_SDK_MAC"
else
    echo "  3. Name: DECKLINK_SDK_WIN"
fi
echo "  4. Value: Paste contents of $BASE64_FILE"
echo ""
echo "Quick copy (macOS):"
echo "  cat $BASE64_FILE | pbcopy"
echo "=========================================="
