# Flex Living Reviews Dashboard - Complete Documentation

This is the comprehensive evidence-only documentation for the Flex Living Reviews Dashboard codebase. All information documented here is derived directly from source code analysis.

## 📁 Documentation Structure

### Core Documentation
- [Architecture Overview](./ARCHITECTURE.md) - System design and technical stack
- [Database Schema](./DATABASE.md) - Complete database structure and relationships
- [Environment Variables](./ENVIRONMENT.md) - Required configuration settings

### API Documentation  
- [API Endpoints Overview](./api/README.md) - Complete API endpoint listing
- [Review APIs](./api/reviews.md) - Review management endpoints
- [Property APIs](./api/properties.md) - Property management endpoints
- [Dashboard APIs](./api/dashboard.md) - Analytics and dashboard endpoints
- [Export APIs](./api/export.md) - Data export endpoints
- [Audit APIs](./api/audit.md) - System audit endpoints

### Frontend Documentation
- [Routes Overview](./frontend/README.md) - All frontend routes and pages
- [Components Guide](./frontend/components.md) - Reusable UI components
- [Pages Documentation](./frontend/pages.md) - Individual page functionality

### Integration Documentation
- [Google APIs](./integrations/google.md) - Google Places, Maps, Geocoding
- [Hostaway Integration](./integrations/hostaway.md) - Property management sync
- [Third-party Services](./integrations/services.md) - External service integrations

### Development Documentation
- [Setup Guide](./SETUP.md) - Development environment setup
- [Scripts Reference](./SCRIPTS.md) - Available npm scripts
- [Testing Guide](./TESTING.md) - Testing interfaces and validation

## 🔍 Quick Reference

### Application Stats
- **API Endpoints**: 42+ endpoints across 8 domains
- **Frontend Routes**: 65+ route files
- **Database Tables**: 3 primary tables (listings, reviews, audit_logs)
- **UI Components**: 16 reusable Svelte components
- **Integration Points**: Google APIs (8+ endpoints), Hostaway service

### Technology Stack
- **Framework**: SvelteKit with TypeScript
- **Database**: Turso (libsql) with local SQLite fallback
- **ORM**: Drizzle ORM
- **Styling**: Tailwind CSS with SkeletonLabs components
- **Deployment**: Vercel platform

### Key Features
- Multi-channel review aggregation (Airbnb, Booking.com, Direct, Google)
- Real-time analytics dashboard with KPIs and trends
- Property management with detailed insights
- Google Maps integration with place discovery
- Hostaway property management system sync
- CSV export functionality
- Audit logging system

## 📊 Application Domains

### Review Management
Complete review lifecycle management including filtering, searching, batch operations, and web visibility control.

### Property Analytics
Comprehensive property performance tracking with ratings analysis, occupancy metrics, and geographic insights.

### Dashboard Analytics
Real-time business intelligence with KPI tracking, trend analysis, anomaly detection, and comparative analytics.

### Integration Layer
External API integrations for property data sync, mapping services, and place discovery.

## 🗄️ Data Architecture

The application uses a 3-table normalized database design:
- **listings**: Property master data with calculated metrics
- **reviews**: Guest feedback with ratings and metadata
- **audit_logs**: System activity tracking for compliance

All data operations use Drizzle ORM with proper indexing and query optimization.

## 🔧 Configuration Management

Environment-based configuration supporting:
- Development mode with local SQLite
- Production mode with Turso cloud database
- Google API integration with multiple endpoints
- Optional Hostaway integration with fallback to mock data

This documentation provides complete visibility into the actual codebase without assumptions or generated content.
