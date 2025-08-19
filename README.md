# Flex Reviews - Review Management Dashboard

A comprehensive review management platform built with SvelteKit, featuring real-time analytics, multi-platform integration, and intelligent insights for property managers.

## 🚀 Features

### 📊 Management Dashboard
- **Performance Heatmap** - Visual category-wise property analysis
- **Real-time Anomaly Detection** - Automatic issue identification
- **Trend Analysis** - Rating patterns and volume insights
- **Smart Alerts** - Proactive problem notifications

### 🏠 Property Management
- **Multi-platform Integration** - Airbnb, Booking.com, Google Reviews
- **Hostaway Sync** - Real-time property data synchronization
- **Performance Tracking** - Individual property analytics
- **Category Breakdowns** - Detailed rating analysis

### 📝 Review Operations
- **Unified Dashboard** - All reviews in one place
- **Bulk Operations** - Efficient review selection/management
- **Advanced Filtering** - Channel, date, rating, status filters
- **Export Capabilities** - CSV reports for analysis

## 🛠 Tech Stack

- **Framework**: SvelteKit (TypeScript)
- **Styling**: Tailwind CSS
- **Database**: SQLite + Drizzle ORM
- **APIs**: Google Places/Reviews, Hostaway
- **Charts**: Chart.js for data visualization

## 🔧 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation
```bash
# Install dependencies
pnpm install

# Environment setup
cp .env.example .env.local
# Edit .env.local with your API keys

# Initialize database & seed data
pnpm db:seed

# Start development server
pnpm dev
```

### Environment Variables
```env
# Hostaway Integration
HOSTAWAY_CLIENT_ID=your_hostaway_client_id
HOSTAWAY_CLIENT_SECRET=your_hostaway_client_secret

# Google APIs
GOOGLE_API_KEY=your_google_api_key
```

## 📁 Project Structure

```
src/
├── routes/                 # SvelteKit routes
│   ├── dashboard/         # Management dashboard
│   ├── reviews/           # Review management
│   ├── listings/          # Property management
│   └── api/               # API endpoints
├── lib/
│   ├── components/        # Reusable UI components
│   ├── db/               # Database schema & operations
│   └── services/         # External API integrations
└── app.html              # Application shell
```

## 🔌 API Endpoints

### Core APIs
```bash
# Dashboard analytics
curl "http://localhost:5173/api/reviews/stats"
curl "http://localhost:5173/api/dashboard/heatmap"

# Review management
curl "http://localhost:5173/api/reviews?channel=airbnb&status=approved"
curl -X POST "http://localhost:5173/api/reviews/selection" \
  -H "content-type: application/json" \
  -d '{"reviewId":"7453","selectedForWeb":true}'

# Property data
curl "http://localhost:5173/api/listings"
curl "http://localhost:5173/api/trends/anomalies?dateFrom=2025-06-01"
```

## 📊 Key Features

### Performance Heatmap
Visual matrix showing category-specific ratings (Cleanliness, Location, Communication, etc.) across all properties. Color-coded from red (needs attention) to green (excellent).

### Anomaly Detection
Algorithms identify unusual patterns:
- Rating drops and improvements
- Volume spikes and declines
- Channel-specific issues
- Recurring problems requiring attention

### Smart Dashboard
Real-time management interface featuring:
- Critical issue alerts
- Performance trends across time periods
- Channel insights and comparisons
- Actionable recommendations for managers

## 🎯 Core Pages

- **`/dashboard`** - Executive overview with heatmaps and trends
- **`/reviews`** - Comprehensive review management with filters
- **`/listings`** - Property performance and management
- **`/listings/[id]`** - Individual property deep-dive analytics
- **`/google-test`** - Google APIs integration testing

## 🏗 Architecture Highlights

### Frontend
- **Component-Based Design** - Modular, reusable UI components
- **Server-Side Rendering** - Fast initial page loads with pre-fetched data
- **Real-time Updates** - Auto-refreshing dashboards every 2 minutes
- **Responsive Design** - Mobile-first approach with Tailwind CSS

### Backend
- **API-First Design** - RESTful endpoints with consistent JSON responses
- **Type Safety** - Full TypeScript coverage from frontend to database
- **Error Handling** - Graceful degradation with meaningful error messages
- **Rate Limiting** - Respectful API usage patterns

### Database Schema
```sql
-- Core entities
listings (id, name, slug, channel, avgRating, reviewCount)
reviews (id, listingId, channel, rating, status, categories)
audits (id, action, entityId, timestamp)
```

## 🔒 Security & Environment

### API Security
- Server-side API key management via hooks.server.ts
- Environment variable protection (never exposed to client)
- Input validation and sanitization
- Graceful error handling without information leakage

### Data Protection
- Type-safe database operations with Drizzle ORM
- SQL injection prevention
- XSS protection via SvelteKit defaults

## 🚀 Development

### Code Quality
```bash
# Type checking
pnpm check

# Build verification
pnpm build

# Database operations
pnpm db:push      # Push schema changes
pnpm db:studio    # Visual database browser
```

### Database Notes
- SQLite file at `./data/app.db` created automatically
- Seed data from `static/mock/hostaway-reviews.json`
- Production should use PostgreSQL/MySQL
- Drizzle migrations for schema versioning

## 🌟 Integration Highlights

### Google APIs
- Places API for property details and location data
- Reviews API for review aggregation and analysis
- Maps API for visual property mapping
- Geocoding for address standardization

### Hostaway Integration
- OAuth2 authentication for secure API access
- Real-time property synchronization
- Booking data integration for revenue correlation

## 📱 Responsive Design

Fully responsive with optimized breakpoints:
- **Mobile**: < 640px (stacked layouts, touch-friendly)
- **Tablet**: 640px - 1024px (grid adjustments)
- **Desktop**: > 1024px (full feature set)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Follow TypeScript strict mode and component naming conventions
4. Add error handling for all API calls
5. Maintain responsive design principles
6. Open Pull Request with detailed description

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with ❤️ using SvelteKit, TypeScript, and modern web technologies**

