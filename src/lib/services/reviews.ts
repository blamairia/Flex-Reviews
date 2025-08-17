import { db } from '$lib/db/drizzle';
import { listings, reviews } from '$lib/db/schema';
import { and, eq, gte, lte } from 'drizzle-orm';
import type { ListingDTO, ReviewDTO, CategoryRating } from '$lib/types';

export type QueryParams = {
  page?: number;
  limit?: number;
  listingId?: string;
  channel?: string;
  type?: string;
  from?: string; // ISO or yyyy-mm-dd
  to?: string; // ISO or yyyy-mm-dd
  minRating?: number;
  selectedOnly?: boolean;
};

export function parseCategories(val: any): CategoryRating[] {
  if (!val) return [];
  try {
    return Array.isArray(val) ? (val as any) : JSON.parse(val as string);
  } catch {
    return [];
  }
}

export function mapRow(row: any): ReviewDTO {
  const categories = parseCategories(row.categoriesJson ?? row.categories_json);
  const tagsArr = (() => {
    const t = row.tagsJson ?? row.tags_json;
    if (!t) return undefined;
    try {
      const parsed = JSON.parse(t as string);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  })();
  return {
    id: String(row.id),
    listingId: row.listingId ?? row.listing_id,
    listingName: row.listingName ?? row.listing_name,
    channel: row.channel,
    type: row.type,
    status: row.status,
    overallRating: row.overallRating ?? row.overall_rating ?? null,
    categories,
    submittedAt: row.submittedAt ?? row.submitted_at,
    guestName: row.guestName ?? row.guest_name,
    publicReview: row.publicReview ?? row.public_review,
    selectedForWeb: Boolean(row.selectedForWeb ?? row.selected_for_web),
    note: row.note ?? null,
    tags: tagsArr
  };
}

export function computeRatingWithFallback(row: any): number | null {
  const overall = row.overallRating ?? row.overall_rating ?? null;
  if (overall != null) return overall;
  const cats = parseCategories(row.categoriesJson ?? row.categories_json);
  if (!cats.length) return null;
  const avg = cats.reduce((a, c) => a + (c.rating ?? 0), 0) / cats.length;
  return Number.isFinite(avg) ? avg : null;
}

export function getReviewById(id: string): ReviewDTO | null {
  // @ts-ignore
  const row = db.select().from(reviews).where(eq(reviews.id, id)).all()[0];
  if (!row) return null;
  return mapRow(row);
}

export function getStats(): { total: number; selected: number; avgRating: number | null } {
  // @ts-ignore
  const all = db.select().from(reviews).all();
  const total = all.length;
  let selected = 0;
  let sum = 0;
  let count = 0;
  for (const r of all as any[]) {
    if ((r.selectedForWeb ?? r.selected_for_web) === 1) selected++;
    const v = computeRatingWithFallback(r);
    if (v != null) {
      sum += v;
      count++;
    }
  }
  const avgRating = count ? Math.round((sum / count) * 10) / 10 : null;
  return { total, selected, avgRating };
}

function normalizeDateInput(s?: string | null, isEnd?: boolean): string | undefined {
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return isEnd ? `${s}T23:59:59.999Z` : `${s}T00:00:00.000Z`;
  }
  try {
    const d = new Date(s);
    return d.toISOString();
  } catch {
    return undefined;
  }
}

export function queryReviews(params: QueryParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.max(1, Math.min(100, params.limit || 20));
  const offset = (page - 1) * limit;

  const fromIso = normalizeDateInput(params.from);
  const toIso = normalizeDateInput(params.to, true);

  const whereClauses: any[] = [];
  if (params.listingId) whereClauses.push(eq(reviews.listingId, params.listingId));
  if (params.channel) whereClauses.push(eq(reviews.channel, params.channel));
  if (params.type) whereClauses.push(eq(reviews.type, params.type));
  if (fromIso) whereClauses.push(gte(reviews.submittedAt, fromIso));
  if (toIso) whereClauses.push(lte(reviews.submittedAt, toIso));
  if (params.selectedOnly) whereClauses.push(eq(reviews.selectedForWeb, 1));

  // Base query fetch
  // @ts-ignore better-sqlite3 supports .all()
  const baseRows = db
    .select()
    .from(reviews)
    .where(whereClauses.length ? and(...whereClauses) : undefined)
    .all();

  // Filter by minRating with fallback average
  const filtered = (baseRows as any[]).filter((r) => {
    if (params.minRating == null) return true;
    const overall = r.overallRating ?? r.overall_rating;
    if (overall != null) return overall >= (params.minRating as number);
    const cats = parseCategories(r.categoriesJson ?? r.categories_json);
    if (!cats.length) return false;
    const avg = cats.reduce((a, c) => a + (c.rating ?? 0), 0) / cats.length;
    return avg >= (params.minRating as number);
  });

  const total = filtered.length;
  const pageRows = filtered.slice(offset, offset + limit);
  const reviewsDTO = pageRows.map(mapRow);

  // Build listings set for filters (top N by name out of filtered set)
  const listingMap = new Map<string, ListingDTO>();
  for (const r of filtered) {
    const id = r.listingId ?? r.listing_id;
    const name = r.listingName ?? r.listing_name;
    // find slug from listings table if possible
    if (!listingMap.has(id)) listingMap.set(id, { id, name, slug: '' as any });
  }
  // Fill slugs by querying listings table for those ids
  const ids = Array.from(listingMap.keys());
  if (ids.length) {
    // @ts-ignore
    const listingRows = db.select().from(listings).all();
    for (const lr of listingRows as any[]) {
      if (listingMap.has(lr.id)) listingMap.set(lr.id, { id: lr.id, name: lr.name, slug: lr.slug });
    }
  }
  const listingsArr = Array.from(listingMap.values()).slice(0, 50);

  return { reviews: reviewsDTO, total, listings: listingsArr };
}

