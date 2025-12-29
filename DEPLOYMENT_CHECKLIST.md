# Pre-Production SEO Deployment Checklist

Complete this checklist before deploying to production.

## ⚠️ Critical (Must Do Before Launch)

### 1. Brand Assets
- [ ] Create professional `favicon.ico` (32x32)
  - Current: Placeholder
  - Tool: https://realfavicongenerator.net
  - File: `/public/favicon.ico`

- [ ] Create `og-image.png` (1200x630)
  - Current: Placeholder
  - Design: OneCeylon branding + Sri Lanka imagery
  - File: `/public/og-image.png`

- [ ] Create `apple-touch-icon.png` (180x180)
  - Current: Placeholder
  - File: `/public/apple-touch-icon.png`

- [ ] Create PWA icons
  - [ ] `icon-192.png` (192x192)
  - [ ] `icon-512.png` (512x512)
  - Files: `/public/icon-*.png`

### 2. Verification Codes
- [ ] Get Google Search Console verification code
  - Go to: https://search.google.com/search-console
  - Add property: `https://oneceylon.space`
  - Choose: HTML tag method
  - Copy verification code
  - Update in: `app/layout.tsx` (line ~76)
  - Replace: `'your-google-verification-code'`

- [ ] Get Bing Webmaster verification code (optional)
  - Go to: https://www.bing.com/webmasters
  - Add site
  - Get meta tag code
  - Add in: `app/layout.tsx`

### 3. Analytics
- [ ] Set up Google Analytics 4
  - Create GA4 property: https://analytics.google.com
  - Get measurement ID (G-XXXXXXXXXX)
  - Add to `app/layout.tsx`:
  ```tsx
  import Script from 'next/script'
  
  // In layout body, before </body>
  <Script src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX" />
  <Script id="google-analytics">
    {`
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', 'G-XXXXXXXXXX');
    `}
  </Script>
  ```

### 4. Environment Check
- [ ] Verify `metadataBase` in layout.tsx:
  - Current: `https://oneceylon.space`
  - Matches production URL? ✓

- [ ] Check robots.txt is accessible:
  - URL: https://oneceylon.space/robots.txt
  - Should allow Googlebot, GPTBot, etc.

- [ ] Check sitemap is accessible:
  - URL: https://oneceylon.space/sitemap.xml
  - Should list all pages

## 🔧 Important (Should Do)

### 5. Content Optimization
- [ ] Review question titles for SEO
  - Include keywords
  - Keep under 60 characters
  - Make descriptive

- [ ] Add alt text to uploaded images
  - Describe image content
  - Include keywords naturally

- [ ] Write compelling question openings
  - First 155 chars = meta description
  - Front-load important info

### 6. Technical SEO
- [ ] Test page load speed
  - Tool: https://pagespeed.web.dev
  - Target: 90+ score (mobile & desktop)
  - Fix any critical issues

- [ ] Validate Schema.org markup
  - Tool: https://validator.schema.org
  - Test a question page
  - Fix any errors

- [ ] Test rich results
  - Tool: https://search.google.com/test/rich-results
  - Test question page
  - Should show QAPage schema

- [ ] Test social sharing
  - Facebook: https://developers.facebook.com/tools/debug/
  - Twitter: https://cards-dev.twitter.com/validator
  - Fix any warnings

### 7. Mobile Optimization
- [ ] Test on mobile devices
  - Navigation works
  - Forms are usable
  - Images load properly

- [ ] Check viewport meta tag
  - Should be in layout.tsx: ✓
  - `width=device-width, initial-scale=1`

- [ ] Verify touch targets
  - Buttons at least 48x48px
  - Links easy to tap

## 📊 Post-Launch (Do Within 48 Hours)

### 8. Search Console Setup
- [ ] Submit sitemap in Google Search Console
  - Add sitemap: `https://oneceylon.space/sitemap.xml`
  - Wait for processing (24-48 hours)

- [ ] Request indexing for key pages
  - Homepage
  - Top 5 questions
  - Tags page
  - Users page

- [ ] Check for crawl errors
  - Fix any 404s
  - Fix any server errors

### 9. Monitor Initial Results
- [ ] Check indexing status daily
  - Google Search Console → Coverage
  - Should start indexing within 48 hours

- [ ] Monitor server logs
  - Look for Googlebot visits
  - Look for GPTBot visits (AI crawler)

- [ ] Test search results
  - Search: `site:oneceylon.space`
  - Should show indexed pages

## 🎯 Week 1 Goals

### 10. Content & Links
- [ ] Share on social media
  - Facebook page post
  - Twitter announcement
  - LinkedIn (if applicable)

- [ ] Submit to directories
  - TripAdvisor forum (if allowed)
  - Lonely Planet Thorn Tree (Sri Lanka section)
  - Reddit r/srilanka (check rules)

- [ ] Reach out to Sri Lankan travel bloggers
  - Offer to answer questions
  - Request backlinks

### 11. Performance Baseline
- [ ] Record initial metrics
  - Pages indexed: _____
  - Impressions: _____
  - Clicks: _____
  - Average position: _____

- [ ] Set goals for Month 1
  - Pages indexed: 100+
  - Impressions: 1,000+
  - Clicks: 50+
  - Average position: <30

## ⚙️ Testing Commands

### Local Testing
```bash
# Test build
npm run build

# Test production server
npm run start

# Check for errors
npm run lint
```

### URL Testing
```bash
# Test robots.txt
curl https://oneceylon.space/robots.txt

# Test sitemap
curl https://oneceylon.space/sitemap.xml

# Test manifest
curl https://oneceylon.space/manifest.json
```

### Schema Testing
1. Visit: https://oneceylon.space/questions/[any-id]
2. View source (Ctrl+U)
3. Search for: `application/ld+json`
4. Copy JSON
5. Validate at: https://validator.schema.org

## 🚨 Common Issues

### Images not loading?
- Check files exist in `/public/`
- Verify correct filenames
- Clear browser cache

### Robots.txt not working?
- Check Next.js build output
- Verify route exists in `/app/robots.ts`
- Test in incognito mode

### Sitemap empty?
- Check database connection
- Verify query returns data
- Check revalidation (may take 1 hour)

### Schema errors?
- Validate property names match interfaces
- Check for typos in schema
- Ensure all required fields present

## ✅ Final Pre-Launch Check

Run through this 5-minute checklist:

1. [ ] Homepage loads without errors
2. [ ] Navigation works (all links)
3. [ ] Question pages show breadcrumbs
4. [ ] Images display (favicon, OG image)
5. [ ] robots.txt accessible
6. [ ] sitemap.xml accessible
7. [ ] manifest.json accessible
8. [ ] No console errors in browser
9. [ ] Mobile view works properly
10. [ ] Google Search Console verification ready

## 📞 Support Resources

### If something breaks:
1. Check browser console for errors
2. Review `/SEO_IMPLEMENTATION.md`
3. Check Next.js docs: https://nextjs.org/docs
4. Validate markup: https://validator.w3.org

### Need help?
- Next.js Discord: https://nextjs.org/discord
- Stack Overflow: Tag `next.js` + `seo`
- Schema.org docs: https://schema.org/docs/

---

## 🎉 Ready to Launch?

When all critical items are checked:
1. Deploy to production
2. Verify all URLs work
3. Submit sitemap to Google Search Console
4. Monitor for 48 hours
5. Fix any urgent issues
6. Follow Week 1 checklist

**Good luck! 🚀**

---

**Last Updated**: December 2024  
**Next Review**: After launch  
**Status**: Ready for production (pending brand assets)
