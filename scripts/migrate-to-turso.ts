import { createClient } from '@libsql/client';
import Database from 'better-sqlite3';
import path from 'node:path';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL) {
  console.error('TURSO_DATABASE_URL is required');
  process.exit(1);
}

async function main() {
  const client = createClient({ url: TURSO_URL!, authToken: TURSO_TOKEN });

  // Ensure tables exist in Turso (idempotent)
  await client.execute(`
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
  `);
  await client.execute(`
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
  `);
  await client.execute(`
    CREATE TABLE IF NOT EXISTS audits (
      id TEXT PRIMARY KEY,
      actor TEXT NOT NULL DEFAULT 'admin@demo',
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL DEFAULT 'review',
      entity_id TEXT NOT NULL,
      payload_json TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
  `);

  // Read from local SQLite file
  const localDbPath = path.resolve('./data/app.db');
  const local = new Database(localDbPath, { readonly: true });

  const localListings = local.prepare('SELECT * FROM listings').all() as Array<{
    id: string; name: string; slug: string; address: string | null; channel: string; status: string;
    avg_rating: number | null; review_count: number; created_at: string; updated_at: string;
  }>;
  const localReviews = local.prepare('SELECT * FROM reviews').all() as Array<{
    id: string; listing_id: string; listing_name: string; channel: string; type: string; status: string;
    overall_rating: number | null; categories_json: string | null; submitted_at: string; guest_name: string; public_review: string;
    selected_for_web: number; note: string | null; tags_json: string | null; created_at: string; updated_at: string;
  }>;
  const localAudits = local.prepare('SELECT * FROM audits').all() as Array<{
    id: string; actor: string; action: string; entity_type: string; entity_id: string; payload_json: string | null; created_at: number;
  }>;

  // Upsert into Turso using parameterized execute()
  for (const r of localListings) {
    await client.execute({
      sql: `
        INSERT INTO listings (id, name, slug, address, channel, status, avg_rating, review_count, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          name=excluded.name,
          slug=excluded.slug,
          address=excluded.address,
          channel=excluded.channel,
          status=excluded.status,
          avg_rating=excluded.avg_rating,
          review_count=excluded.review_count,
          updated_at=excluded.updated_at;
      `,
  args: [r.id, r.name, r.slug, r.address, r.channel, r.status, r.avg_rating, r.review_count, r.created_at, r.updated_at]
    });
  }

  for (const r of localReviews) {
    await client.execute({
      sql: `
        INSERT INTO reviews (id, listing_id, listing_name, channel, type, status, overall_rating, categories_json, submitted_at, guest_name, public_review, selected_for_web, note, tags_json, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          listing_id=excluded.listing_id,
          listing_name=excluded.listing_name,
          channel=excluded.channel,
          type=excluded.type,
          status=excluded.status,
          overall_rating=excluded.overall_rating,
          categories_json=excluded.categories_json,
          submitted_at=excluded.submitted_at,
          guest_name=excluded.guest_name,
          public_review=excluded.public_review,
          selected_for_web=excluded.selected_for_web,
          note=excluded.note,
          tags_json=excluded.tags_json,
          updated_at=excluded.updated_at;
      `,
      args: [
        r.id, r.listing_id, r.listing_name, r.channel, r.type, r.status, r.overall_rating, r.categories_json,
        r.submitted_at, r.guest_name, r.public_review, r.selected_for_web, r.note, r.tags_json, r.created_at, r.updated_at
      ]
    });
  }

  for (const r of localAudits) {
    await client.execute({
      sql: `
        INSERT INTO audits (id, actor, action, entity_type, entity_id, payload_json, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          actor=excluded.actor,
          action=excluded.action,
          entity_type=excluded.entity_type,
          entity_id=excluded.entity_id,
          payload_json=excluded.payload_json,
          created_at=excluded.created_at;
      `,
  args: [r.id, r.actor, r.action, r.entity_type, r.entity_id, r.payload_json, r.created_at]
    });
  }

  console.log(`Migrated: listings=${localListings.length}, reviews=${localReviews.length}, audits=${localAudits.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
