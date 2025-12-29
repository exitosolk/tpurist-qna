# Generate Placeholder Images Script

This PowerShell script generates placeholder images for development/testing.
Once you have professional designs, replace these files.

## Instructions:

1. Install ImageMagick (if not already installed):
   ```powershell
   winget install ImageMagick.ImageMagick
   ```

2. Run this script to create placeholder images:
   ```powershell
   .\generate-placeholders.ps1
   ```

3. Replace placeholders with professional designs when ready

## What this creates:
- favicon.ico (32x32, blue with "OC")
- apple-touch-icon.png (180x180, blue with "OneCeylon")
- icon-192.png (192x192, PWA icon)
- icon-512.png (512x512, PWA icon)
- og-image.png (1200x630, social sharing)
- twitter-image.png (1200x630, Twitter cards)

Note: These are basic placeholders. For production, use professional designs
that reflect your brand identity.
