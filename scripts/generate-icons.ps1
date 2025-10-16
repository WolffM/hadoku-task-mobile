# Android Icon Generator Script
# This script helps you prepare the app icon from your favicon

Write-Host "📱 Android Icon Setup" -ForegroundColor Cyan
Write-Host ""

# Check if favicon exists
$faviconPath = "www/favicon.svg"
if (-not (Test-Path $faviconPath)) {
    Write-Host "❌ favicon.svg not found in www/" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found favicon.svg" -ForegroundColor Green
Write-Host ""
Write-Host "To create Android icons, you have two options:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Option 1: Use an online tool (Easiest)" -ForegroundColor White
Write-Host "  1. Go to: https://easyappicon.com/" -ForegroundColor Gray
Write-Host "  2. Upload www/favicon.svg" -ForegroundColor Gray
Write-Host "  3. Download Android icons" -ForegroundColor Gray
Write-Host "  4. Extract to android/app/src/main/res/" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Manual conversion" -ForegroundColor White
Write-Host "  Convert favicon.svg to these PNG sizes:" -ForegroundColor Gray
Write-Host "    mipmap-mdpi/ic_launcher.png      (48x48)" -ForegroundColor Gray
Write-Host "    mipmap-hdpi/ic_launcher.png      (72x72)" -ForegroundColor Gray
Write-Host "    mipmap-xhdpi/ic_launcher.png     (96x96)" -ForegroundColor Gray
Write-Host "    mipmap-xxhdpi/ic_launcher.png    (144x144)" -ForegroundColor Gray
Write-Host "    mipmap-xxxhdpi/ic_launcher.png   (192x192)" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 The icons will be automatically used after running 'npx cap sync'" -ForegroundColor Cyan
