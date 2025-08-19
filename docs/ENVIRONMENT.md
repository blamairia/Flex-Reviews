# Environment Variables Configuration

## Overview
The Flex Living Reviews Dashboard requires specific environment variables for database connections, API integrations, and service configurations.

## Required Environment Variables

### Database Configuration (Required)

#### Turso Database (Production)
```env
# Turso cloud database connection
TURSO_DATABASE_URL=libsql://your-database-url.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token
```

**Usage**:
- Production deployment on Vercel
- Cloud SQLite database with global edge replication
- Required for production functionality

**Configuration Source**: `src/lib/db/drizzle.ts`
```typescript
// Database driver selection based on environment
if (TURSO_DATABASE_URL && TURSO_AUTH_TOKEN) {
  // Use Turso in production
  const client = createClient({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  });
  db = drizzleLibsql(client);
} else {
  // Use local SQLite in development
  db = drizzleBetter(new Database('local.db'));
}
```

### Google APIs Configuration (Required)

#### Google Places API
```env
# Google Places API for location services
GOOGLE_PLACES_API_KEY=your_google_places_api_key
```

**Services Enabled**:
- Places API (New)
- Places API (Legacy) 
- Maps JavaScript API

**Used For**:
- Place search and discovery
- Place details retrieval
- Place reviews access
- Place photo references

#### Google Maps API
```env
# Google Maps API for mapping services
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

**Services Enabled**:
- Maps Static API
- Geocoding API
- Maps Embed API
- Maps JavaScript API

**Used For**:
- Static map generation
- Address geocoding
- Embedded interactive maps
- Coordinate validation

### Hostaway Integration (Optional)

#### Hostaway API Configuration
```env
# Hostaway property management integration
HOSTAWAY_ACCOUNT_ID=your_hostaway_account_id
HOSTAWAY_API_KEY=your_hostaway_api_key
HOSTAWAY_BASE_URL=https://api.hostaway.com/v1
```

**Usage**:
- Property data synchronization
- Booking information access
- Property management features
- Falls back to mock data if not configured

**Configuration Source**: `src/lib/services/hostawayService.ts`
```typescript
// Environment validation
const HOSTAWAY_ACCOUNT_ID = process.env.HOSTAWAY_ACCOUNT_ID || '';
const HOSTAWAY_CLIENT_SECRET = process.env.HOSTAWAY_API_KEY || '';
const HOSTAWAY_BASE_URL = process.env.HOSTAWAY_BASE_URL || 'https://api.hostaway.com/v1';

if (!HOSTAWAY_ACCOUNT_ID || !HOSTAWAY_CLIENT_SECRET) {
  console.warn('⚠️ Missing required Hostaway environment variables. Please check your .env.local file.');
}
```

## Environment File Setup

### Development Configuration (`.env.local`)
```env
# Database (Turso) - Required for production features
TURSO_DATABASE_URL=libsql://your-database.turso.io
TURSO_AUTH_TOKEN=your_turso_auth_token

# Google APIs - Required for mapping and places
GOOGLE_PLACES_API_KEY=AIzaSyD...your_places_api_key
GOOGLE_MAPS_API_KEY=AIzaSyD...your_maps_api_key

# Hostaway Integration - Optional
HOSTAWAY_ACCOUNT_ID=12345
HOSTAWAY_API_KEY=your_hostaway_api_key
HOSTAWAY_BASE_URL=https://api.hostaway.com/v1

# Development settings
NODE_ENV=development
```

### Production Configuration (Vercel)
Environment variables configured in Vercel dashboard:
- Database credentials (Turso)
- API keys (Google services)
- Optional integrations (Hostaway)

## Configuration Validation

### Runtime Validation
**Source File**: `src/routes/api/config/+server.ts`

```typescript
export async function GET() {
  return new Response(JSON.stringify({
    // Database status
    hasTursoConfig: !!(TURSO_DATABASE_URL && TURSO_AUTH_TOKEN),
    
    // Google API status
    googleMapsApiKey: GOOGLE_MAPS_API_KEY ? 'configured' : 'missing',
    hasGooglePlacesKey: !!GOOGLE_PLACES_API_KEY,
    hasGoogleMapsKey: !!GOOGLE_MAPS_API_KEY,
    
    // Hostaway status
    hasHostawayConfig: !!(HOSTAWAY_ACCOUNT_ID && HOSTAWAY_API_KEY),
    
    // Environment info
    environment: process.env.NODE_ENV || 'development'
  }));
}
```

### Startup Validation
**Source File**: `src/lib/db/drizzle.ts`

```typescript
// Database connection validation
let db: ReturnType<typeof drizzleBetter> | ReturnType<typeof drizzleLibsql>;

if (typeof window === 'undefined') {
  if (TURSO_DATABASE_URL && TURSO_AUTH_TOKEN) {
    console.log('🚀 Using Turso database in production mode');
    const client = createClient({
      url: TURSO_DATABASE_URL,
      authToken: TURSO_AUTH_TOKEN,
    });
    db = drizzleLibsql(client);
  } else {
    console.log('🔧 Using local SQLite database in development mode');
    const sqlite = new Database('local.db');
    db = drizzleBetter(sqlite);
  }
}
```

## Environment-Specific Behavior

### Database Selection Logic
```typescript
// Development mode
if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  // Use local SQLite database
  // File: local.db in project root
  // Driver: better-sqlite3
  // Features: Full functionality with local data
}

// Production mode  
if (TURSO_DATABASE_URL && TURSO_AUTH_TOKEN) {
  // Use Turso cloud database
  // Connection: libsql over HTTPS
  // Features: Edge replication, scaling
  // Required: Valid Turso credentials
}
```

### Google API Fallbacks
```typescript
// Google Places API
if (!GOOGLE_PLACES_API_KEY) {
  // Disable place search features
  // Show configuration warnings
  // Provide mock data for testing
}

// Google Maps API
if (!GOOGLE_MAPS_API_KEY) {
  // Disable map components
  // Hide geocoding features
  // Show configuration alerts
}
```

### Hostaway Integration Fallbacks
```typescript
// Hostaway configuration check
if (!HOSTAWAY_ACCOUNT_ID || !HOSTAWAY_API_KEY) {
  // Use mock property data
  // Disable sync features
  // Show integration status
  // Provide sample data for testing
}
```

## Security Best Practices

### Environment Variable Security
- **Never commit** `.env.local` to version control
- **Use different keys** for development and production
- **Rotate API keys** regularly
- **Restrict API key permissions** to minimum required scope

### API Key Restrictions
#### Google API Keys
- **HTTP referrer restrictions** for web usage
- **IP restrictions** for server usage  
- **API restrictions** to limit scope

#### Hostaway API Keys
- **Account-specific** access tokens
- **Limited scope** permissions
- **Secure token storage**

### Git Configuration
```bash
# .gitignore entries
.env.local
.env.production
.env.*.local
*.env
```

## Troubleshooting

### Common Configuration Issues

#### Database Connection Issues
```typescript
// Check Turso credentials
if (!TURSO_DATABASE_URL) {
  console.error('❌ TURSO_DATABASE_URL is required for production');
}

if (!TURSO_AUTH_TOKEN) {
  console.error('❌ TURSO_AUTH_TOKEN is required for production');
}
```

#### Google API Issues
```typescript
// Validate API keys format
if (GOOGLE_PLACES_API_KEY && !GOOGLE_PLACES_API_KEY.startsWith('AIza')) {
  console.warn('⚠️ Invalid Google Places API key format');
}

// Check API quotas
if (response.status === 429) {
  console.error('❌ Google API quota exceeded');
}
```

#### Hostaway Configuration Issues
```typescript
// Check required credentials
if (!HOSTAWAY_ACCOUNT_ID || !HOSTAWAY_API_KEY) {
  console.warn('⚠️ Hostaway integration disabled - missing credentials');
  // Application continues with mock data
}
```

### Environment Variable Testing
Access `/api/config` endpoint to verify configuration status:
```bash
GET /api/config
```

Response includes configuration validation for all services.

This environment configuration ensures secure, flexible deployment across development and production environments with appropriate fallbacks for optional services.
