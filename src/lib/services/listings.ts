import { db } from '$lib/db/drizzle';
import { listings, reviews } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import type { ListingDTO, ReviewDTO } from '$lib/types';

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export async function getListingBySlug(slug: string): Promise<ListingDTO | null> {
  const row = db.select().from(listings).where(eq(listings.slug, slug)).get?.();
  // better-sqlite3 drizzle has sync .get(); types may vary
  // @ts-ignore
  const r = row ?? db.select().from(listings).where(eq(listings.slug, slug)).all()[0];
  if (!r) return null;
  return { id: r.id, name: r.name, slug: r.slug };
}

export function mapReviewRowToDTO(row: any): ReviewDTO {
  const categories = row.categories_json ? JSON.parse(row.categories_json) : [];
  const tags = row.tags_json ? JSON.parse(row.tags_json) : null;
  return {
    id: row.id,
    listingId: row.listing_id,
    listingName: row.listing_name,
    channel: row.channel,
    type: row.type,
    status: row.status,
    overallRating: row.overall_rating ?? null,
    categories,
    submittedAt: row.submitted_at,
    guestName: row.guest_name,
    publicReview: row.public_review,
    selectedForWeb: !!row.selected_for_web,
    note: row.note ?? null,
    tags: tags ?? undefined
  };
}

export async function getSelectedReviewsForListing(listingId: string): Promise<ReviewDTO[]> {
  // @ts-ignore drizzle better-sqlite3 has .all()
  const rows = db
    .select()
    .from(reviews)
    .where(eq(reviews.listingId, listingId))
    // @ts-ignore
    .all();
  return rows.filter((r: any) => r.selected_for_web === 1).map(mapReviewRowToDTO);
}
