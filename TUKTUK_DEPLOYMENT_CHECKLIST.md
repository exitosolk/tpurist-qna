# TukTuk Prices UX Update - Deployment Checklist

## Pre-Deployment ✅

### 1. Database Migrations
```bash
# Connect to your database
mysql -u root -p oneceylon

# Run migrations in order:
source database/create-places-cache-table.sql;
source database/update-tuktuk-prices-for-anonymous.sql;

# Verify tables created:
SHOW TABLES LIKE 'places_cache';
DESCRIBE tuktuk_prices;
```

### 2. Test Locally
```bash
# Install dependencies (if needed)
npm install

# Run dev server
npm run dev

# Visit: http://localhost:3000/tuktuk-prices
```

### 3. Test Checklist
- [ ] Autocomplete works for locations
- [ ] Can search without login
- [ ] Can report price without login
- [ ] Can report price with login
- [ ] Live Pulse section shows (if data exists)
- [ ] Per-KM rate displays (if data exists)
- [ ] Popular routes section shows
- [ ] Distance calculation works
- [ ] Price ranges display correctly
- [ ] Trust indicators visible

## Deployment Steps 📦

### 1. Commit Changes
```bash
git add .
git commit -m "feat: Major UX improvements to TukTuk prices feature

- Add Google Places autocomplete with intelligent caching
- Enable anonymous price reporting (no login required)
- Add Live Pulse section for social proof
- Display per-KM rates prominently
- Reorder UI: Check price first, report second
- Add trust indicators and price ranges
- Implement distance calculations
- Optimize API costs with local caching"

git push
```

### 2. Run Production Migrations
```bash
# SSH into production server
ssh your-server

# Run migrations on production database
mysql -u prod_user -p prod_database < database/create-places-cache-table.sql
mysql -u prod_user -p prod_database < database/update-tuktuk-prices-for-anonymous.sql
```

### 3. Deploy Application
```bash
# If using Vercel:
vercel --prod

# If using PM2/Node:
npm run build
pm2 restart your-app
```

## Post-Deployment Testing 🧪

### 1. Smoke Tests
- [ ] Visit production /tuktuk-prices
- [ ] Test autocomplete (should cache after first use)
- [ ] Submit anonymous price report
- [ ] Search for a route
- [ ] Verify Live Pulse updates

### 2. Monitor
```bash
# Check application logs
pm2 logs

# Or Vercel logs:
vercel logs
```

### 3. Database Verification
```sql
-- Check if anonymous reports are being saved
SELECT * FROM tuktuk_prices WHERE is_anonymous = TRUE LIMIT 5;

-- Check places cache is working
SELECT place_id, name, hit_count FROM places_cache ORDER BY hit_count DESC LIMIT 10;

-- Verify per-km calculations
SELECT start_location, end_location, distance_km, price_per_km 
FROM tuktuk_prices 
WHERE distance_km IS NOT NULL 
LIMIT 5;
```

## Data Seeding (Optional) 🌱

### Seed Popular Places
```sql
-- Add common Sri Lankan locations to cache
-- This reduces initial API calls

INSERT INTO places_cache (place_id, name, formatted_address, lat, lng, hit_count) VALUES
('ChIJA3B6D4FT4joRM_0HUzTeHy0', 'Colombo Fort Railway Station', 'Colombo Fort, Colombo, Sri Lanka', 6.9344, 79.8428, 10),
('ChIJt291pDNa4joRkurbJiL2qXI', 'Galle Face Green', 'Galle Face Green, Colombo, Sri Lanka', 6.9271, 79.8429, 10),
('ChIJk5WzoXdZ4joRwXDBuzdBQWY', 'Kandy City Center', 'Kandy, Sri Lanka', 7.2906, 80.6337, 8),
('ChIJBw0q7r9S4joROCN0HhM-2Wk', 'Mount Lavinia Beach', 'Mount Lavinia, Sri Lanka', 6.8311, 79.8630, 7),
('ChIJ_SAmL7tW4joRrF2N4w5f9vE', 'Bandaranaike International Airport', 'Katunayake, Sri Lanka', 7.1807, 79.8841, 15)
ON DUPLICATE KEY UPDATE hit_count = hit_count + 1;
```

### Seed Sample Price Data (for testing)
```sql
-- Add sample tuktuk prices for demonstration
INSERT INTO tuktuk_prices 
(user_id, is_anonymous, start_location, end_location, price, distance_km, price_per_km, date_of_travel) 
VALUES
(NULL, TRUE, 'Colombo Fort', 'Galle Face', 300, 2.5, 120, CURDATE()),
(NULL, TRUE, 'Colombo Fort', 'Mount Lavinia', 1200, 12, 100, DATE_SUB(CURDATE(), INTERVAL 1 DAY)),
(NULL, TRUE, 'Airport', 'Colombo Fort', 3500, 35, 100, DATE_SUB(CURDATE(), INTERVAL 2 DAY)),
(NULL, TRUE, 'Kandy', 'Temple of Tooth', 400, 3, 133, DATE_SUB(CURDATE(), INTERVAL 3 DAY));
```

## Monitoring & Optimization 📊

### 1. Google Places API Usage
- Check: https://console.cloud.google.com/apis/dashboard
- Monitor daily requests
- Expected: 80% reduction after cache warms up

### 2. Database Performance
```sql
-- Check cache hit distribution
SELECT hit_count, COUNT(*) as places 
FROM places_cache 
GROUP BY hit_count 
ORDER BY hit_count DESC;

-- Monitor anonymous vs authenticated reports
SELECT 
  is_anonymous,
  COUNT(*) as reports,
  AVG(price) as avg_price
FROM tuktuk_prices
GROUP BY is_anonymous;
```

### 3. User Behavior
- Track search → report conversion
- Monitor anonymous report volume
- Check Live Pulse engagement

## Rollback Plan 🔄

If issues arise:

```bash
# 1. Revert code
git revert HEAD
git push

# 2. Redeploy previous version
vercel --prod

# 3. Database rollback (if needed)
ALTER TABLE tuktuk_prices DROP COLUMN is_anonymous;
ALTER TABLE tuktuk_prices DROP COLUMN anonymous_session;
ALTER TABLE tuktuk_prices DROP COLUMN ip_hash;
ALTER TABLE tuktuk_prices DROP COLUMN distance_km;
ALTER TABLE tuktuk_prices DROP COLUMN price_per_km;
ALTER TABLE tuktuk_prices DROP COLUMN start_place_id;
ALTER TABLE tuktuk_prices DROP COLUMN end_place_id;
ALTER TABLE tuktuk_prices MODIFY COLUMN user_id INT NOT NULL;

DROP TABLE places_cache;
```

## Success Metrics 📈

Track these after 1 week:

- [ ] Anonymous reports > 50% of total
- [ ] Total reports increased by 3x+
- [ ] Live Pulse shows consistent activity
- [ ] Places API costs reduced by 70%+
- [ ] User sessions on page increased
- [ ] Bounce rate decreased

## Support & Maintenance 🔧

### Common Issues

**1. Autocomplete not working**
- Check API key is valid
- Verify network requests in browser console
- Check database connection

**2. No Live Pulse data**
- Verify recent data exists: `SELECT * FROM tuktuk_prices ORDER BY created_at DESC LIMIT 5`
- Check API endpoint: `/api/tuktuk-prices?type=recent`

**3. Cache not working**
- Verify FULLTEXT index: `SHOW INDEX FROM places_cache`
- Check query performance: Use EXPLAIN on cache queries

### Maintenance Tasks

**Weekly:**
- Review anonymous submission quality
- Check API usage vs budget
- Monitor cache hit rate

**Monthly:**
- Clean up low-quality anonymous submissions
- Update popular places seed data
- Review and adjust "rip-off" threshold (currently 1.5x)

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Rollback Tested**: [ ] Yes [ ] No
**Monitoring Set Up**: [ ] Yes [ ] No
