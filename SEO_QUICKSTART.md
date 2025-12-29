# SEO Quick Start Checklist

## Immediate Actions (Do This Week)

### 1. Submit to Search Engines
- [ ] **Google Search Console**
  - Go to: https://search.google.com/search-console
  - Add property: `https://oneceylon.space`
  - Verify ownership (HTML tag method - code in layout.tsx)
  - Submit sitemap: `https://oneceylon.space/sitemap.xml`
  
- [ ] **Bing Webmaster Tools**
  - Go to: https://www.bing.com/webmasters
  - Import from Google Search Console (easiest)
  - Or manually add site and verify

### 2. Create Brand Assets
Priority order:
1. **favicon.ico** (shows in browser tabs)
2. **og-image.png** (social media sharing)
3. **apple-touch-icon.png** (iOS home screen)

Use: https://realfavicongenerator.net for quick generation

### 3. Test Current Implementation
- [ ] Rich Results: https://search.google.com/test/rich-results
  - Test: `https://oneceylon.space/questions/[any-question-id]`
  - Should show QAPage and BreadcrumbList
  
- [ ] Facebook Debugger: https://developers.facebook.com/tools/debug/
  - Should show title, description, image
  
- [ ] Schema Validator: https://validator.schema.org
  - Paste a question page URL
  - Should validate without errors

## Week 2-4 Actions

### 4. Monitor Indexing
- [ ] Check Google Search Console daily
- [ ] Verify pages are being indexed
- [ ] Fix any crawl errors
- [ ] Monitor Core Web Vitals

### 5. Content Optimization
- [ ] Add alt text to images
- [ ] Write descriptive question titles (include keywords)
- [ ] Add location tags (cities, places)
- [ ] Encourage quality answers

## Month 2+ Actions

### 6. Link Building
- [ ] Share questions on social media
- [ ] Comment on travel blogs (with backlinks)
- [ ] Partner with Sri Lankan tourism sites
- [ ] Guest post on travel websites

### 7. Performance
- [ ] Check PageSpeed Insights
- [ ] Optimize images (compress, WebP format)
- [ ] Improve Core Web Vitals scores
- [ ] Consider CDN for static assets

## Key Metrics to Watch

### Google Search Console (check weekly)
1. **Total clicks** - organic traffic
2. **Total impressions** - how often you appear
3. **Average CTR** - click-through rate (target: >3%)
4. **Average position** - ranking (target: <10)
5. **Coverage** - indexed pages (should be growing)

### Expected Progress
- **Week 1**: Submitted sitemap, initial crawling
- **Week 2-4**: First pages indexed, appearing in search
- **Month 2**: Growing impressions, some clicks
- **Month 3**: Steady traffic growth, improved positions
- **Month 6**: Established authority, consistent traffic

## Quick Wins

### Internal Linking
Link related questions:
```markdown
Related: [Best beaches in Galle](/questions/123)
See also: [Getting to Ella](/questions/456)
```

### Question Titles (SEO-Friendly)
❌ Bad: "Help needed"
✅ Good: "Best beaches in Galle for swimming - Sri Lanka"

❌ Bad: "How to get there?"
✅ Good: "How to travel from Colombo to Kandy by train?"

### Meta Descriptions (Auto-Generated)
First 155 characters of question body = meta description
- Write clear, compelling openings
- Include keywords naturally
- Make it readable (not keyword stuffing)

## Tools Reference

### Free SEO Tools
- **Google Search Console** - Essential, must-have
- **Google Analytics 4** - Track user behavior
- **PageSpeed Insights** - Performance testing
- **Schema Markup Validator** - Structured data testing
- **Ubersuggest** (Free tier) - Keyword research

### Paid Tools (Optional)
- **Ahrefs** - Comprehensive SEO toolkit
- **SEMrush** - Competitor analysis
- **Moz** - Rank tracking

## Common Issues & Fixes

### ❌ Pages not indexed?
**Check:**
1. robots.txt allows crawling: `https://oneceylon.space/robots.txt`
2. Sitemap submitted in Search Console
3. No `noindex` tags (we don't have any)
4. Wait 2-4 weeks (Google is slow)

**Fix:**
- Request indexing in Search Console
- Share URLs on social media (get initial crawls)
- Add internal links from homepage

### ❌ No rich snippets?
**Check:**
1. Schema.org markup validates
2. Waited 2-4 weeks (Google needs time)
3. Content quality (Google only shows for good content)

**Fix:**
- Test with Rich Results tool
- Improve answer quality
- Add more upvotes to answers

### ❌ Poor rankings?
**Check:**
1. Keyword competition (travel is competitive)
2. Content depth (longer, detailed answers rank better)
3. Backlinks (how many sites link to you)

**Fix:**
- Target long-tail keywords ("best beaches in Unawatuna" vs "beaches")
- Write comprehensive guides
- Get backlinks from travel forums

## Monthly Reporting Template

```
Month: __________

Traffic:
- Organic visits: _____
- Top pages: _____
- Top queries: _____

Rankings:
- Average position: _____
- Keywords in top 10: _____
- Keywords in top 3: _____

Technical:
- Pages indexed: _____
- Crawl errors: _____
- Core Web Vitals: PASS/FAIL

Goals for next month:
1. _____
2. _____
3. _____
```

## Emergency Contacts

### SEO Issues
- Google Search Console Help: https://support.google.com/webmasters
- Schema.org Documentation: https://schema.org/docs/gs.html
- Next.js SEO Docs: https://nextjs.org/learn/seo

### Technical Issues
- Check server logs for crawler errors
- Test robots.txt: https://oneceylon.space/robots.txt
- Validate sitemap: https://oneceylon.space/sitemap.xml

---

**Remember:** SEO is a marathon, not a sprint. Focus on creating great content and the rankings will follow.

**Questions?** Check `/SEO_IMPLEMENTATION.md` for detailed documentation.
