import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const listings = sqliteTable('listings', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  address: text('address'),
  channel: text('channel', { length: 50 }).notNull(),
  status: text('status', { length: 20 }).notNull().default('active'),
  avgRating: real('avg_rating').default(0),
  reviewCount: integer('review_count').notNull().default(0),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
});

export const reviews = sqliteTable('reviews', {
  id: text('id').primaryKey(),
  listingId: text('listing_id').notNull(),
  listingName: text('listing_name').notNull(),
  channel: text('channel', { length: 20 }).notNull(),
  type: text('type', { length: 20 }).notNull(),
  status: text('status', { length: 20 }).notNull(),
  overallRating: real('overall_rating'),
  categoriesJson: text('categories_json'),
  submittedAt: text('submitted_at').notNull(),
  guestName: text('guest_name').notNull(),
  publicReview: text('public_review').notNull(),
  selectedForWeb: integer('selected_for_web').notNull().default(0),
  note: text('note'),
  tagsJson: text('tags_json'),
  createdAt: text('created_at').notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at').notNull().default(sql`CURRENT_TIMESTAMP`)
}, (table) => ({
  listingIdIdx: index('reviews_listingId_idx').on(table.listingId),
  channelIdx: index('reviews_channel_idx').on(table.channel),
  submittedAtIdx: index('reviews_submittedAt_idx').on(table.submittedAt),
  selectedForWebIdx: index('reviews_selectedForWeb_idx').on(table.selectedForWeb)
}));

export const audits = sqliteTable('audits', {
  id: text('id').primaryKey(),
  actor: text('actor').notNull().default('admin@demo'),
  action: text('action').notNull(), // 'select'|'unselect'
  entityType: text('entity_type').notNull().default('review'),
  entityId: text('entity_id').notNull(),
  payloadJson: text('payload_json'),
  createdAt: integer('created_at').notNull().default(sql`(unixepoch() * 1000)`)
});
