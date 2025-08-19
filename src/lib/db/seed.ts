import fs from 'node:fs';
import path from 'node:path';
import { db, sqlite } from './drizzle';
import { listings, reviews, audits } from './schema';
import { normalizeHostawayRow } from '../normalization/hostaway';
import { eq } from 'drizzle-orm';

function ensureMockFile(): string {
  const mockPath = path.resolve('static/mock/hostaway-reviews.json');
  if (!fs.existsSync(mockPath)) {
    const sample = [
      {
        id: '7453',
        listingName: 'Cozy Downtown Loft',
        overall: 9,
        reviewCategory: [
          { category: 'Cleanliness', rating: 10 },
          { category: 'Communication', rating: 9 }
        ],
        submittedAt: '2024-05-10T12:00:00',
        guestName: 'Alice Lee',
        publicReview: 'Great location and super clean. Would stay again!',
        type: 'guest-to-host'
      },
      {
        id: '7454',
        listingName: 'Cozy Downtown Loft',
        overall: null,
        reviewCategory: [
          { category: 'Cleanliness', rating: 8 },
          { category: 'Location', rating: 9 }
        ],
        submittedAt: '2024-06-15T08:30:00',
        guestName: 'Bob Marley',
        publicReview: 'Nice place, a bit noisy at night but overall good stay.',
        type: 'guest-to-host'
      },
      {
        id: '8120',
        listingName: 'Seaside Villa',
        overall: 10,
        reviewCategory: [
          { category: 'Cleanliness', rating: 10 },
          { category: 'Check-in', rating: 10 }
        ],
        submittedAt: '2024-07-01T09:00:00',
        guestName: 'Charlie Brown',
        publicReview: 'Absolutely stunning views and perfect for families.',
        type: 'guest-to-host'
      }
    ];
    fs.mkdirSync(path.dirname(mockPath), { recursive: true });
    fs.writeFileSync(mockPath, JSON.stringify(sample, null, 2));
  }
  return mockPath;
}

function upsertListing(id: string, name: string, slug: string, address?: string, channel?: string, status?: string) {
  try {
    // @ts-ignore
    db.insert(listings).values({ 
      id, 
      name, 
      slug, 
      address: address || null,
      channel: channel || 'Airbnb',
      status: status || 'active',
      avgRating: 0,
      reviewCount: 0
    }).run?.();
  } catch {
    // @ts-ignore
    db.update(listings).set({ 
      name, 
      slug, 
      address: address || null,
      channel: channel || 'Airbnb',
      status: status || 'active'
    } as any).where(eq(listings.id, id)).run?.();
  }
}

function upsertReview(payload: any) {
  try {
    // @ts-ignore
    db.insert(reviews).values(payload).run?.();
  } catch {
    // @ts-ignore
    db.update(reviews).set(payload).where(eq(reviews.id, payload.id)).run?.();
  }
}

export async function seedWithData(rawData: any[]): Promise<{ listingCount: number; reviewCount: number }> {
  // Ensure tables exist
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      address TEXT,
      channel TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      avg_rating REAL DEFAULT 0,
      review_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL,
      listing_name TEXT NOT NULL,
      channel TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      overall_rating REAL,
      categories_json TEXT,
      submitted_at TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      public_review TEXT NOT NULL,
      selected_for_web INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      tags_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_listing_submitted ON reviews(listing_id, submitted_at);
    CREATE INDEX IF NOT EXISTS idx_reviews_channel ON reviews(channel);
    CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
    CREATE TABLE IF NOT EXISTS audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      old_value TEXT,
      new_value TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
  `);
  
  let listingCount = 0;
  let reviewCount = 0;
  const seenListings = new Set<string>();
  
  for (const rawRow of rawData) {
    const normalized = normalizeHostawayRow(rawRow);
    const listing = normalized.listing;
    const review = normalized.review;
    
    if (!seenListings.has(listing.id)) {
      upsertListing(listing.id, listing.name, listing.slug);
      listingCount++;
      seenListings.add(listing.id);
    }
    
    const drizzlePayload = {
      id: review.id,
      listingId: listing.id,
      listingName: listing.name,
      channel: review.channel,
      type: review.type,
      status: review.status,
      overallRating: review.overallRating,
      categoriesJson: JSON.stringify(review.categories || []),
      submittedAt: review.submittedAt,
      guestName: review.guestName,
      publicReview: review.publicReview,
      selectedForWeb: review.selectedForWeb ? 1 : 0,
      note: null as string | null,
      tagsJson: null as string | null
    };
    upsertReview(drizzlePayload);
    reviewCount++;
  }
  
  return { listingCount, reviewCount };
}

async function main() {
  // Ensure tables exist (for Day 1 simplicity)
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      listing_id TEXT NOT NULL,
      listing_name TEXT NOT NULL,
      channel TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      overall_rating REAL,
      categories_json TEXT,
      submitted_at TEXT NOT NULL,
      guest_name TEXT NOT NULL,
      public_review TEXT NOT NULL,
      selected_for_web INTEGER NOT NULL DEFAULT 0,
      note TEXT,
      tags_json TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL DEFAULT 'admin@demo',
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL DEFAULT 'review',
      entity_id TEXT NOT NULL,
      payload_json TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
    CREATE INDEX IF NOT EXISTS reviews_listingId_idx ON reviews(listing_id);
    CREATE INDEX IF NOT EXISTS reviews_channel_idx ON reviews(channel);
    CREATE INDEX IF NOT EXISTS reviews_submittedAt_idx ON reviews(submitted_at);
    CREATE INDEX IF NOT EXISTS reviews_selectedForWeb_idx ON reviews(selected_for_web);
  `);

  // Seed some sample listings with diverse data
  const sampleListings = [
    { id: 'listing-1', name: 'Modern Downtown Apartment', slug: 'modern-downtown-apartment', address: '123 Main St, Downtown', channel: 'Airbnb', status: 'active' },
    { id: 'listing-2', name: 'Cozy Beach House', slug: 'cozy-beach-house', address: '456 Ocean Ave, Beachfront', channel: 'Booking.com', status: 'active' },
    { id: 'listing-3', name: 'Luxury Mountain Retreat', slug: 'luxury-mountain-retreat', address: '789 Mountain View Dr, Hills', channel: 'Airbnb', status: 'active' },
    { id: 'listing-4', name: 'Historic City Loft', slug: 'historic-city-loft', address: '321 Heritage St, Old Town', channel: 'Google', status: 'active' },
    { id: 'listing-5', name: 'Suburban Family Home', slug: 'suburban-family-home', address: '654 Maple Ave, Suburbs', channel: 'Booking.com', status: 'pending' },
    { id: 'listing-6', name: 'Urban Studio Apartment', slug: 'urban-studio-apartment', address: '987 City Center Blvd, Downtown', channel: 'Airbnb', status: 'inactive' },
    { id: 'listing-7', name: 'Countryside Cottage', slug: 'countryside-cottage', address: '147 Rural Rd, Countryside', channel: 'Google', status: 'active' },
    { id: 'listing-8', name: 'Waterfront Condo', slug: 'waterfront-condo', address: '258 Harbor View, Marina', channel: 'Booking.com', status: 'active' }
  ];

  // Insert sample listings
  for (const listing of sampleListings) {
    upsertListing(listing.id, listing.name, listing.slug, listing.address, listing.channel, listing.status);
  }

  const mockPath = ensureMockFile();
  const raw = JSON.parse(fs.readFileSync(mockPath, 'utf-8')) as any[];
  let listingCount = 0;
  let reviewCount = 0;
  const seenListings = new Set<string>();
  for (const row of raw) {
    const { listing, review } = normalizeHostawayRow(row);
    if (!seenListings.has(listing.id)) {
      upsertListing(listing.id, listing.name, listing.slug);
      listingCount++;
      seenListings.add(listing.id);
    }
    const drizzlePayload = {
      id: review.id,
      listingId: review.listingId,
      listingName: review.listingName,
      channel: review.channel,
      type: review.type,
      status: review.status,
      overallRating: review.overallRating,
      categoriesJson: JSON.stringify(review.categories || []),
      submittedAt: review.submittedAt,
      guestName: review.guestName,
      publicReview: review.publicReview,
      selectedForWeb: review.selectedForWeb ? 1 : 0,
      note: null as string | null,
      tagsJson: null as string | null
    };
    upsertReview(drizzlePayload);
    reviewCount++;
  }
  console.log(`Seed complete. Listings: ${listingCount}, Reviews: ${reviewCount}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
