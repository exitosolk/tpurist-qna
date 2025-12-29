# Favicon and App Icons

Create the following icons for browser tabs and mobile apps:

## Required Icons:

### 1. favicon.ico
- **Size**: 32x32 pixels (can include multiple sizes: 16x16, 32x32, 48x48)
- **Format**: ICO
- **Location**: `/public/favicon.ico`

### 2. Apple Touch Icon (apple-touch-icon.png)
- **Size**: 180x180 pixels
- **Format**: PNG
- **Location**: `/public/apple-touch-icon.png`

### 3. Android Chrome Icons
- **icon-192.png**: 192x192 pixels
- **icon-512.png**: 512x512 pixels
- **Location**: `/public/`

### 4. Web App Manifest (manifest.json)
Already referenced in layout.tsx, create:
```json
{
  "name": "OneCeylon - Sri Lanka Travel Q&A",
  "short_name": "OneCeylon",
  "description": "Your guide to Sri Lanka travel",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#2563eb",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

## Design:
- Use OneCeylon logo/brand mark
- Simple, recognizable design
- Works well at small sizes
- Use brand color #2563eb

## Tools:
- https://realfavicongenerator.net (generates all sizes)
- https://favicon.io (simple favicon maker)
- Figma/Adobe Illustrator for professional design
