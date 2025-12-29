# SEO & AEO Implementation Guide

This document outlines all SEO (Search Engine Optimization) and AEO (Answer Engine Optimization) improvements made to OneCeylon.

## ✅ Implemented Features

### 1. Meta Tags & Open Graph
- **Root Layout** (`app/layout.tsx`):
  - Comprehensive title template: `{page} | OneCeylon`
  - Meta description with 13 Sri Lanka travel keywords
  - Open Graph tags (1200x630 images, locale, type)
  - Twitter Card configuration (large image summary)
  - Theme color (#2563eb)
  - Verification placeholders (Google, Yandex, Bing)
  - Canonical URLs and alternates
  - Font display optimization (swap)

- **Dynamic Pages**:
  - Question detail pages: Title, description, keywords (tags), OG tags
  - Tags page: Category-specific metadata
  - Users page: Community-focused metadata

### 2. Schema.org Structured Data

#### QAPage Schema (Question Details)
```json
{
  "@type": "QAPage",
  "mainEntity": {
    "@type": "Question",
    "name": "Question title",
    "text": "Question body",
    "answerCount": 5,
    "upvoteCount": 10,
    "dateCreated": "2024-01-01",
    "author": {...},
    "acceptedAnswer": {...},
    "suggestedAnswer": [...]
  }
}
```

Benefits:
- Rich snippets in Google Search
- Better visibility in AI answer engines (ChatGPT, Perplexity, Google SGE)
- Displays vote counts, answer counts, author info

#### BreadcrumbList Schema
```json
{
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "position": 1, "name": "Home", "item": "..." },
    { "position": 2, "name": "Questions", "item": "..." },
    { "position": 3, "name": "Question title", "item": "..." }
  ]
}
```

Benefits:
- Breadcrumb trail in search results
- Better site structure understanding
- Improved navigation UX

### 3. Robots.txt (`app/robots.ts`)

**AI Crawler Support:**
- ✅ GPTBot (ChatGPT)
- ✅ ChatGPT-User
- ✅ Google-Extended (Bard/Gemini)
- ✅ anthropic-ai (Claude)
- ✅ ClaudeBot
- ✅ Googlebot (Search)
- ✅ Bingbot (Bing Search)

**Protected Routes:**
- ❌ `/api/*` (API endpoints)
- ❌ `/settings` (User settings)
- ❌ `/profile` (User profiles)
- ❌ URLs with `utm_*` or `session` parameters

**Sitemap Reference:**
- Points to `https://oneceylon.space/sitemap.xml`

### 4. Dynamic Sitemap (`app/sitemap.ts`)

**Content Included:**
- Static pages (home, questions, tags, users, etc.)
- 1000 most recent questions (priority: 0.8)
- Top 100 tags by question count (priority: 0.7)
- Top 100 users by reputation (priority: 0.5-0.6)
- All collectives (priority: 0.7)

**Update Frequency:**
- Revalidates every hour (3600 seconds)
- Uses `lastModified` from database (`created_at`/`edited_at`)
- Proper `changeFrequency` values (daily, weekly, monthly)

**Priorities:**
- Home: 1.0
- Questions listing: 0.9
- Individual questions: 0.8
- TukTuk prices, Scams: 0.8
- Tags: 0.7
- Collectives: 0.7
- Users: 0.5-0.6

### 5. Breadcrumb Navigation
- Visual breadcrumbs on question pages
- Home → Questions → Tag → Current question
- Aria-label for accessibility
- Schema.org markup for rich snippets

### 6. Performance Optimizations
- Font display: swap (prevents FOIT)
- Max-snippet: -1 (no length restriction)
- Max-image-preview: large (full-size previews)
- Robots directives: index, follow

## 🚧 Next Steps (Not Yet Implemented)

### 1. Create Brand Assets
Create the following files in `/public/`:

#### OG Images
- `og-image.png` (1200x630) - Default social share image
- `twitter-image.png` (1200x630) - Twitter card image
- See `/public/OG-IMAGE-SPECS.md` for design guidelines

#### Favicons
- `favicon.ico` (32x32, multi-size)
- `apple-touch-icon.png` (180x180)
- `icon-192.png` (192x192)
- `icon-512.png` (512x512)
- See `/public/ICONS-SPECS.md` for specifications

### 2. Add Verification Codes
In `app/layout.tsx`, replace placeholders:

```typescript
verification: {
  google: 'YOUR_GOOGLE_SEARCH_CONSOLE_CODE',
  yandex: 'YOUR_YANDEX_VERIFICATION_CODE',
  bing: 'YOUR_BING_WEBMASTER_CODE',
}
```

**How to get codes:**
1. **Google Search Console**: https://search.google.com/search-console
   - Add property → HTML tag method
2. **Bing Webmaster Tools**: https://www.bing.com/webmasters
   - Add site → Meta tag option
3. **Yandex Webmaster**: https://webmaster.yandex.com (optional)

### 3. Analytics Integration

Add Google Analytics 4:

```typescript
// In app/layout.tsx
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

### 4. Performance Enhancements
- [ ] Add ISR (Incremental Static Regeneration) to popular questions
- [ ] Implement lazy loading for images
- [ ] Add preconnect for critical domains
- [ ] Optimize Core Web Vitals (LCP, FID, CLS)

### 5. Content Optimization
- [ ] Add FAQ schema to scams page
- [ ] Create topic clusters (link related questions)
- [ ] Add alt text to all images
- [ ] Optimize URL slugs for keywords

### 6. Link Building
- [ ] Internal linking strategy
- [ ] Related questions suggestions
- [ ] Tag page SEO content
- [ ] User profile canonical URLs

## 📊 Monitoring & Testing

### Tools to Use:
1. **Google Search Console**
   - Submit sitemap
   - Monitor indexing status
   - Check mobile usability
   - Track search performance

2. **Rich Results Test**
   - https://search.google.com/test/rich-results
   - Test QAPage and Breadcrumb markup

3. **PageSpeed Insights**
   - https://pagespeed.web.dev
   - Optimize Core Web Vitals

4. **Social Preview Tools**
   - Facebook Debugger: https://developers.facebook.com/tools/debug/
   - Twitter Card Validator: https://cards-dev.twitter.com/validator
   - LinkedIn Inspector: https://www.linkedin.com/post-inspector/

5. **Schema Validator**
   - https://validator.schema.org
   - Test JSON-LD markup

### Key Metrics to Track:
- Organic traffic growth
- Click-through rate (CTR)
- Average position in search results
- Indexed pages count
- Core Web Vitals scores
- Mobile vs desktop traffic
- AI crawler visits (check server logs)

## 🤖 AEO (Answer Engine Optimization)

### How It Works:
AI engines like ChatGPT, Perplexity, Google SGE crawl your content and cite it in answers.

### Optimizations Made:
1. ✅ Allow AI crawlers in robots.txt
2. ✅ QAPage schema with structured Q&A data
3. ✅ Clear question-answer format
4. ✅ Author attribution (Person schema)
5. ✅ Vote counts and accepted answers
6. ✅ Comprehensive meta descriptions

### Best Practices:
- Write clear, concise answers (AI preference)
- Use proper heading hierarchy (H1, H2, H3)
- Include specific facts and data
- Cite sources where applicable
- Keep content updated (edit timestamps)

## 🔧 Maintenance

### Regular Tasks:
1. **Weekly**: Check Google Search Console for errors
2. **Monthly**: Review top-performing pages
3. **Quarterly**: Update outdated content
4. **Annual**: Refresh OG images and branding

### Content Guidelines:
- Keep question titles under 60 characters (search result limit)
- Meta descriptions: 150-160 characters
- Use descriptive URLs (slugs)
- Add alt text to images
- Internal links to related questions

## 📈 Expected Results

### Timeline:
- **1-2 weeks**: Google indexing begins
- **1 month**: Sitemap fully indexed
- **2-3 months**: Organic traffic starts growing
- **6 months**: Established search presence
- **1 year**: Authority in Sri Lanka travel niche

### Success Indicators:
- Pages indexed in Google Search Console
- Rich snippets appearing in search results
- AI engines citing your content
- Increasing organic CTR
- Growing backlink profile

## 🆘 Troubleshooting

### Not Indexed?
1. Check robots.txt: `https://oneceylon.space/robots.txt`
2. Submit sitemap in Search Console
3. Request indexing for individual pages
4. Check for `noindex` tags (shouldn't exist)

### No Rich Snippets?
1. Validate Schema.org markup
2. Wait 2-4 weeks (Google needs time)
3. Check for markup errors in Search Console
4. Ensure structured data is visible to Googlebot

### Poor Rankings?
1. Improve content quality
2. Add more internal links
3. Get backlinks from travel sites
4. Optimize for featured snippets
5. Reduce page load time

## 📚 Resources

- [Google Search Central](https://developers.google.com/search)
- [Schema.org Q&A Documentation](https://schema.org/QAPage)
- [Next.js SEO Guide](https://nextjs.org/learn/seo/introduction-to-seo)
- [Core Web Vitals](https://web.dev/vitals/)
- [Answer Engine Optimization](https://www.semrush.com/blog/answer-engine-optimization/)

---

**Last Updated**: December 2024
**Status**: ✅ Core implementation complete, pending brand assets and verification codes
