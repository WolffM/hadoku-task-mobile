#!/usr/bin/env bash
# Android Icon Generator Script
# This script helps you prepare the app icon from your favicon
set -euo pipefail

echo "📱 Android Icon Setup"
echo ""

# Check if favicon exists
FAVICON_PATH="www/favicon.svg"
if [ ! -f "$FAVICON_PATH" ]; then
  echo "❌ favicon.svg not found in www/"
  exit 1
fi

echo "✅ Found favicon.svg"
echo ""
echo "To create Android icons, you have two options:"
echo ""
echo "Option 1: Use an online tool (Easiest)"
echo "  1. Go to: https://easyappicon.com/"
echo "  2. Upload www/favicon.svg"
echo "  3. Download Android icons"
echo "  4. Extract to android/app/src/main/res/"
echo ""
echo "Option 2: Manual conversion"
echo "  Convert favicon.svg to these PNG sizes:"
echo "    mipmap-mdpi/ic_launcher.png      (48x48)"
echo "    mipmap-hdpi/ic_launcher.png      (72x72)"
echo "    mipmap-xhdpi/ic_launcher.png     (96x96)"
echo "    mipmap-xxhdpi/ic_launcher.png    (144x144)"
echo "    mipmap-xxxhdpi/ic_launcher.png   (192x192)"
echo ""
echo "💡 The icons will be automatically used after running 'npx cap sync'"
