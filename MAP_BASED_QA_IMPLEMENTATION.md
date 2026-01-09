# Map-Based Q&A Feature Implementation

## Overview
Implemented a comprehensive location-based question browsing system for OneCeylon, allowing users to discover questions and answers tied to specific places across Sri Lanka.

## Database Schema

### Migration File: `database/add-location-to-questions.sql`

Added location fields to both `questions` and `answers` tables:
- `place_id` - Google Places API identifier
- `place_name` - Display name (e.g., "Ella", "Galle Fort")
- `formatted_address` - Full address from Places API
- `latitude` - Decimal(10,8) for precise coordinates
- `longitude` - Decimal(11,8) for precise coordinates
- Indexes on `place_id` and spatial index on coordinates

## API Endpoints

### 1. `/api/questions/nearby` - Find Questions Near Location
**Purpose**: Get questions within a radius of a specific point

**Query Parameters**:
- `latitude` (required) - Center point latitude
- `longitude` (required) - Center point longitude
- `radius` (optional, default: 50) - Search radius in kilometers
- `tag` (optional) - Filter by tag
- `page` (optional, default: 1)
- `limit` (optional, default: 20)

**Response**:
```json
{
  "questions": [...],
  "center": { "latitude": 7.123, "longitude": 80.456 },
  "radius": 50,
  "total": 15
}
```

**Implementation Details**:
- Uses Haversine formula for accurate distance calculation
- Bounding box optimization for initial filtering (faster than full scan)
- Returns questions sorted by distance (closest first)
- Includes user info, tags, collectives, and badge counts

### 2. `/api/questions/map-data` - Get All Map Pins
**Purpose**: Retrieve all questions with locations for map visualization

**Query Parameters**:
- `bounds` (optional) - Viewport bounds: "minLat,minLon,maxLat,maxLon"
- `tag` (optional) - Filter by tag

**Response**:
```json
{
  "questions": [
    {
      "id": 123,
      "title": "Best time to visit Sigiriya?",
      "place_name": "Sigiriya",
      "latitude": 7.956,
      "longitude": 80.759,
      "tags": [...]
    }
  ],
  "total": 42
}
```

**Implementation Details**:
- Optimized for map rendering (limited fields)
- Viewport filtering to reduce data transfer
- Limit of 500 pins to prevent performance issues
- Includes first 3 tags per question

## Components

### `components/QuestionsMap.tsx`
Interactive Google Maps component with question pins

**Features**:
- Auto-loads questions in current viewport
- Color-coded pins (blue = unanswered, green = has answers)
- Click pin to show question preview card
- "Find Near Me" button for geolocation
- Real-time map bounds tracking
- Smooth pan animations

**Props**:
- `center` - Initial map center (default: Sri Lanka center)
- `zoom` - Initial zoom level (default: 8)
- `tag` - Optional tag filter
- `onQuestionSelect` - Callback when question clicked

### `app/questions/map/page.tsx`
Full page for browsing questions by location

**Features**:
- **Map View**: Interactive map with pins
- **List View**: Sortable list with distance from user
- **Tag Filter**: Filter questions by topic
- **Radius Control**: Adjust search radius (10-200km)
- **"Questions Near Me"**: One-click geolocation search
- **Auto-expand**: Suggests larger radius if no results

**UX Highlights**:
- Empty state with clear CTA
- Loading indicators
- Distance formatting (meters/kilometers)
- Relative time display
- Mobile-responsive layout

## Form Updates

### `app/questions/ask/page.tsx`
Added optional location picker to question creation form

**New Fields**:
- Location autocomplete (reuses `LocationAutocomplete` component)
- Preview of selected location
- Clear/remove location option

**Data Flow**:
```typescript
{
  location: {
    placeId: "ChIJ...",
    placeName: "Ella",
    formattedAddress: "Ella, Sri Lanka",
    latitude: 6.866,
    longitude: 81.045
  }
}
```

### `app/api/questions/route.ts`
Updated POST endpoint to accept and store location data

## Navigation Integration

### `components/Navbar.tsx`
Added "📍 Questions by Location" to:
- Desktop "Explore" dropdown (top of list)
- Mobile navigation menu (under "Navigate")

## Key Features

### 1. Geographic Discovery
- Browse questions by Sri Lankan landmarks
- Find answers specific to exact locations
- Visual map exploration

### 2. Proximity Search
- "Questions Near Me" for travelers
- Configurable radius (10-200km)
- Distance display in results

### 3. Smart Filtering
- Combine location + topic (tag)
- Viewport-aware loading
- Answered/unanswered indicators

### 4. Performance Optimizations
- Bounding box pre-filtering
- Limited to 500 map pins
- Lazy loading in list view
- Debounced map updates

## Usage Examples

### Finding Questions Near Ella
1. Navigate to `/questions/map`
2. Click "Questions Near Me" (if in Ella)
3. Or search map for "Ella" and zoom in
4. Click pins to see questions

### Asking Location-Specific Question
1. Go to `/questions/ask`
2. Fill in title/body
3. Type location in "Location" field
4. Select from autocomplete
5. Question now pinned to that place

### Browsing by Area
1. Map view shows all questions with pins
2. Pan to area of interest (e.g., South coast)
3. Click any pin for preview
4. Switch to list view for detailed results

## Database Indexing Strategy

```sql
-- Fast place lookups
INDEX idx_place_id (place_id)

-- Bounding box queries
SPATIAL INDEX idx_location (latitude, longitude)

-- Combined with existing indexes
INDEX idx_created_at (created_at DESC)
```

## Google Maps Integration

**API Key**: Already configured from TukTuk Prices feature
**Libraries**: `places` (for Places API)
**Restrictions**: Sri Lanka country bias (`country:lk`)

## Mobile Considerations

- Geolocation permission prompts
- Touch-friendly pin size
- Responsive map controls
- List view fallback for small screens
- Bottom-sheet question cards

## Future Enhancements

### Potential Additions:
1. **Clustering**: Group nearby pins when zoomed out
2. **Heatmap**: Show question density by region
3. **Route Planning**: "Questions along my route"
4. **Location Stats**: "Most asked about places"
5. **Answer Locations**: Pin answers to different places than question
6. **Photo Markers**: Show user photos on map
7. **Temporal Filter**: "Questions asked in last week"

## Analytics Opportunities

Track:
- Most queried locations
- Geographic distribution of users
- Popular routes (origin → destination patterns)
- Seasonal location trends

## SEO Benefits

- Location-specific landing pages
- Rich snippets with coordinates
- Schema.org markup for local business content
- "Questions near [landmark]" pages

## Migration Instructions

1. Run database migration:
   ```sql
   source database/add-location-to-questions.sql
   ```

2. Existing questions without locations:
   - Will work normally (location is optional)
   - Won't appear on map
   - Can be edited to add location later

3. Backward compatibility:
   - All existing features work unchanged
   - Location fields are nullable
   - No breaking changes to API

## Testing Checklist

- [ ] Ask question with location
- [ ] Ask question without location
- [ ] Map view loads pins
- [ ] Click pin shows preview
- [ ] "Near Me" requests geolocation
- [ ] List view shows distances
- [ ] Tag filter works in both views
- [ ] Radius adjustment updates results
- [ ] Mobile geolocation works
- [ ] Empty state displays correctly

## Notes

- Uses same Google Places API and caching as TukTuk Prices
- Haversine formula accurate for Sri Lanka's small geographic area
- Spatial indexes require MySQL 5.7+ with spatial support
- Consider PostGIS for more advanced geo queries in future
