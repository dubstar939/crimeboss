#!/bin/bash
# Crime Boss Sprite Build Script
# Generates all 41+ sprite PNG files for the game

set -e

echo "🎨 Crime Boss Sprite Generator"
echo "=============================="
echo ""

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if PIL/Pillow is installed
python3 -c "from PIL import Image" 2>/dev/null || {
    echo "📦 Installing PIL/Pillow..."
    pip3 install Pillow
}

echo "🚀 Running sprite generator..."
python3 generate_sprites.py

echo ""
echo "✅ Sprite generation complete!"
echo ""
echo "📊 Verifying output..."
echo ""

# Count generated sprites
SPRITE_COUNT=$(find src/components -name "*.png" 2>/dev/null | wc -l)
echo "Generated sprites: $SPRITE_COUNT"

# List generated files
echo ""
echo "📁 Generated files in src/components/:"
ls -lh src/components/*.png 2>/dev/null | awk '{print "   " $9 " (" $5 ")"}'

echo ""
echo "✨ All sprites ready for integration!"
