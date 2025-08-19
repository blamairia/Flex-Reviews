import { db, sqlite } from './drizzle';
import { listings, reviews, audits } from './schema';
import { eq } from 'drizzle-orm';
import fs from 'fs';

function generateRealisticReviews(): any[] {
  const reviews = [];
  const channels = ['Airbnb', 'Booking.com', 'Expedia'];
  const statuses = ['published', 'pending'];
  
  // The 3 actual Hostaway properties
  const properties = [
    {
      id: '155613',
      name: 'The Bromley Collection',
      location: 'Bromley, London',
      bedrooms: 2,
      price: 400,
      type: 'upscale collection'
    },
    {
      id: '155615',
      name: 'The Peckham Apartments',
      location: 'Peckham, London',
      bedrooms: 1,
      price: 400,
      type: 'modern apartment'
    },
    {
      id: '346994',
      name: 'The Putney Apart 2',
      location: 'Putney, London',
      bedrooms: 3,
      price: 150,
      type: 'budget apartment'
    }
  ];

  // Realistic review templates for each property type
  const reviewTemplates = {
    '155613': [ // The Bromley Collection - Upscale 2BR
      {
        rating: 4.8,
        review: "Absolutely stunning property in Bromley! The collection really lives up to its name with beautifully curated interiors. Both bedrooms were spacious and comfortable. The kitchen was fully equipped and perfect for cooking. Great transport links to central London. Highly recommend!",
        guest: "Sarah M."
      },
      {
        rating: 4.5,
        review: "Lovely stay at The Bromley Collection. The apartment was clean, modern, and had everything we needed for our week in London. The area is quiet and family-friendly. Only minor issue was parking, but overall excellent value for money.",
        guest: "James R."
      },
      {
        rating: 5.0,
        review: "Perfect for our family trip! The two bedrooms were ideal for us and the kids. Location in Bromley is fantastic - lots of shops and restaurants nearby. The host was very responsive and helpful. Will definitely book again!",
        guest: "Emma K."
      },
      {
        rating: 4.2,
        review: "Great apartment with beautiful design. The Bromley Collection is well-maintained and stylish. Good connectivity to London Bridge. The only downside was some noise from the street in the morning, but nothing major.",
        guest: "Michael D."
      },
      {
        rating: 4.7,
        review: "Exceeded our expectations! The apartment photos don't do justice to how beautiful it is in person. Two spacious bedrooms, lovely living area, and a kitchen with everything needed. Bromley is a great base for exploring London.",
        guest: "Lisa W."
      }
    ],
    '155615': [ // The Peckham Apartments - Modern 1BR
      {
        rating: 4.3,
        review: "Really enjoyed our stay in Peckham! The apartment is modern and well-designed. Perfect size for a couple. The area has undergone amazing transformation - lots of trendy cafes and bars within walking distance. Great value for central London access.",
        guest: "Alex T."
      },
      {
        rating: 4.6,
        review: "Fantastic one-bedroom apartment in up-and-coming Peckham. Loved the industrial-chic design and the local vibe. Easy transport to central London. The rooftop bar at Peckham Levels is a must-visit! Host was excellent.",
        guest: "Sophie L."
      },
      {
        rating: 4.1,
        review: "Good modern apartment with everything needed for a city break. Peckham has so much character - really enjoyed exploring the local markets and art scene. The apartment itself was clean and comfortable, though a bit small for long stays.",
        guest: "David P."
      },
      {
        rating: 4.4,
        review: "Perfect location for young professionals visiting London. The Peckham Apartments are stylish and well-equipped. Love the local food scene - so many great restaurants and cafes. Transport links are excellent for getting around.",
        guest: "Rachel H."
      },
      {
        rating: 4.8,
        review: "Brilliant stay! The apartment is beautifully designed with modern amenities. Peckham is such a cool area - perfect mix of culture, food, and nightlife. Would definitely recommend to friends visiting London. Host communication was top-notch.",
        guest: "Tom B."
      }
    ],
    '346994': [ // The Putney Apart 2 - Budget 3BR
      {
        rating: 3.8,
        review: "Great value for money in Putney! Three bedrooms were perfect for our group trip. The apartment is basic but clean and functional. Putney Bridge station is very close, making it easy to get into central London. Good for budget-conscious travelers.",
        guest: "Mark S."
      },
      {
        rating: 3.5,
        review: "Decent budget accommodation in nice area of London. Putney is lovely - close to the Thames and Hyde Park. The apartment could use some updating but has everything needed. Great for groups who want space without breaking the bank.",
        guest: "Jenny F."
      },
      {
        rating: 4.0,
        review: "Perfect for our family of 5! Three bedrooms gave everyone their own space. Putney is a great area - safe, clean, and well-connected. The apartment is simple but comfortable. Appreciate the honest pricing for what you get.",
        guest: "Paul M."
      },
      {
        rating: 3.6,
        review: "Good basic apartment in excellent location. Putney High Street has everything you need - shops, restaurants, pubs. Easy tube access to central London. The apartment is dated but functional. Fair value for the price point.",
        guest: "Helen C."
      },
      {
        rating: 3.9,
        review: "Solid choice for budget travelers needing space. Three bedrooms were clean and beds comfortable. Putney is lovely - especially enjoyed walks along the Thames. Property is older but well-maintained. Would stay again for the price.",
        guest: "Steve A."
      }
    ]
  };

  // Generate reviews for each property
  let reviewId = 1;
  for (const property of properties) {
    const templates = reviewTemplates[property.id];
    const reviewCount = Math.floor(Math.random() * 3) + 3; // 3-5 reviews per property
    
    for (let i = 0; i < reviewCount && i < templates.length; i++) {
      const template = templates[i];
      const submittedDays = Math.floor(Math.random() * 90) + 1; // Reviews from last 90 days
      const submittedAt = new Date(Date.now() - submittedDays * 24 * 60 * 60 * 1000).toISOString();
      
      reviews.push({
        id: `review-${property.id}-${reviewId}`,
        listingId: property.id,
        listingName: property.name,
        channel: channels[Math.floor(Math.random() * channels.length)],
        type: 'guest',
        status: statuses[Math.floor(Math.random() * statuses.length)],
        overallRating: template.rating,
        categories: [],
        submittedAt,
        guestName: template.guest,
        publicReview: template.review,
        selectedForWeb: Math.random() > 0.3 // 70% chance to be selected for web
      });
      reviewId++;
    }
  }
  
  return reviews;
}

function ensureMockFile(): string {
  const mockPath = './src/lib/db/realistic-reviews.json';
  if (!fs.existsSync(mockPath)) {
    const mockData = generateRealisticReviews();
    fs.writeFileSync(mockPath, JSON.stringify(mockData, null, 2));
  }
  return mockPath;
}

function normalizeHostawayRow(row: any) {
  return {
    listing: {
      id: row.listingId,
      name: row.listingName,
      slug: row.listingName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || row.listingId
    },
    review: row
  };
}

function upsertListing(id: string, name: string, slug: string, address?: string, channel?: string, status?: string) {
  try {
    db.insert(listings).values({
      id,
      name,
      slug,
      address: address || null,
      channel: channel || 'Airbnb',
      status: status || 'active',
      avgRating: 0,
      reviewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }).run();
  } catch {
    db.update(listings).set({
      name,
      slug,
      address: address || null,
      channel: channel || 'Airbnb',
      status: status || 'active',
      updatedAt: new Date().toISOString()
    }).where(eq(listings.id, id)).run();
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
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
      FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
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

  let listingCount = 0;
  let reviewCount = 0;
  const seenListings = new Set<string>();

  for (const row of rawData) {
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

  return { listingCount, reviewCount };
}

// Execute seeding when module is loaded (server-side only)
if (typeof window === 'undefined') {
  async function runStartupSeeding() {
    try {
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
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
          FOREIGN KEY (listing_id) REFERENCES listings (id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS audits (
          id TEXT PRIMARY KEY,
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

      // Only seed realistic reviews for the 3 actual Hostaway properties
      // Do NOT create fake listings - they come from Hostaway API
      const mockPath = ensureMockFile();
      const raw = JSON.parse(fs.readFileSync(mockPath, 'utf-8')) as any[];
      let reviewCount = 0;
      
      for (const row of raw) {
        const { review } = normalizeHostawayRow(row);
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
      
      console.log(`Seed complete. Reviews: ${reviewCount} (for 3 real Hostaway properties)`);
    } catch (error) {
      console.error('Seeding error:', error);
    }
  }

  // Run seeding - DISABLED for deployment (use existing app.db)
  // runStartupSeeding();
}
