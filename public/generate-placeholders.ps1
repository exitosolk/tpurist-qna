# Generate Placeholder Images for OneCeylon
# This creates basic placeholder images for development
# Replace with professional designs before production

$publicDir = "$PSScriptRoot"

Write-Host "Generating placeholder images for OneCeylon..." -ForegroundColor Cyan

# Check if ImageMagick is installed
try {
    $magickVersion = magick -version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "ImageMagick not found"
    }
} catch {
    Write-Host "ERROR: ImageMagick is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Install with: winget install ImageMagick.ImageMagick" -ForegroundColor Yellow
    Write-Host "Or download from: https://imagemagick.org/script/download.php" -ForegroundColor Yellow
    exit 1
}

# Brand colors
$brandBlue = "#2563eb"
$white = "#ffffff"

# 1. OG Image (1200x630) - Social sharing
Write-Host "Creating og-image.png (1200x630)..." -ForegroundColor Green
magick -size 1200x630 "xc:$brandBlue" `
    -gravity center `
    -fill "$white" `
    -font Arial -pointsize 72 -annotate +0-100 "OneCeylon" `
    -font Arial -pointsize 36 -annotate +0+50 "Sri Lanka Travel Q&A Community" `
    -font Arial -pointsize 28 -annotate +0+150 "Ask • Answer • Explore" `
    "$publicDir\og-image.png"

# 2. Twitter Image (same as OG)
Write-Host "Creating twitter-image.png (1200x630)..." -ForegroundColor Green
Copy-Item "$publicDir\og-image.png" "$publicDir\twitter-image.png"

# 3. Favicon (32x32)
Write-Host "Creating favicon.ico (32x32)..." -ForegroundColor Green
magick -size 32x32 "xc:$brandBlue" `
    -gravity center `
    -fill "$white" `
    -font Arial-Bold -pointsize 20 -annotate +0+0 "OC" `
    "$publicDir\favicon.ico"

# 4. Apple Touch Icon (180x180)
Write-Host "Creating apple-touch-icon.png (180x180)..." -ForegroundColor Green
magick -size 180x180 "xc:$brandBlue" `
    -gravity center `
    -fill "$white" `
    -font Arial-Bold -pointsize 48 -annotate +0-20 "OneCeylon" `
    -font Arial -pointsize 20 -annotate +0+30 "Sri Lanka" `
    "$publicDir\apple-touch-icon.png"

# 5. PWA Icon 192x192
Write-Host "Creating icon-192.png (192x192)..." -ForegroundColor Green
magick -size 192x192 "xc:$brandBlue" `
    -gravity center `
    -fill "$white" `
    -font Arial-Bold -pointsize 56 -annotate +0-20 "OC" `
    -font Arial -pointsize 24 -annotate +0+40 "OneCeylon" `
    "$publicDir\icon-192.png"

# 6. PWA Icon 512x512
Write-Host "Creating icon-512.png (512x512)..." -ForegroundColor Green
magick -size 512x512 "xc:$brandBlue" `
    -gravity center `
    -fill "$white" `
    -font Arial-Bold -pointsize 120 -annotate +0-60 "OneCeylon" `
    -font Arial -pointsize 48 -annotate +0+80 "Sri Lanka Travel Q&A" `
    "$publicDir\icon-512.png"

Write-Host "`nPlaceholder images generated successfully!" -ForegroundColor Cyan
Write-Host "`nCreated files:" -ForegroundColor Yellow
Write-Host "  - og-image.png (1200x630)" -ForegroundColor Gray
Write-Host "  - twitter-image.png (1200x630)" -ForegroundColor Gray
Write-Host "  - favicon.ico (32x32)" -ForegroundColor Gray
Write-Host "  - apple-touch-icon.png (180x180)" -ForegroundColor Gray
Write-Host "  - icon-192.png (192x192)" -ForegroundColor Gray
Write-Host "  - icon-512.png (512x512)" -ForegroundColor Gray

Write-Host "`nIMPORTANT:" -ForegroundColor Red
Write-Host "These are basic placeholders for development." -ForegroundColor Yellow
Write-Host "Replace with professional designs before production!" -ForegroundColor Yellow
Write-Host "`nSee OG-IMAGE-SPECS.md and ICONS-SPECS.md for design guidelines." -ForegroundColor Cyan
