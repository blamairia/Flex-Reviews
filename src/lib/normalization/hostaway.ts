import type { ReviewDTO, ListingDTO, CategoryRating } from '../types';

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export type HostawayReview = {
  id: number | string;
  listingName: string;
  overall: number | null;
  reviewCategory?: { category: string; rating: number }[];
  submittedAt: string; // ISO or without Z
  guestName: string;
  publicReview: string;
  type?: 'host-to-guest' | 'guest-to-host';
};

export function normalizeHostawayRow(row: HostawayReview): { listing: ListingDTO; review: ReviewDTO } {
  const listingSlug = slugify(row.listingName);
  const listingId = `L-${listingSlug}`;
  const categories: CategoryRating[] = (row.reviewCategory || []).map((c) => ({
    key: c.category.toLowerCase(),
    rating: c.rating
  }));
  const s = String(row.submittedAt);
  const submittedIso = new Date(s.endsWith('Z') ? s : s + 'Z').toISOString();
  const review: ReviewDTO = {
    id: String(row.id),
    listingId,
    listingName: row.listingName,
    channel: 'hostaway',
    type: row.type ?? 'guest-to-host',
    status: 'published',
    overallRating: row.overall ?? null,
    categories,
    submittedAt: submittedIso,
    guestName: row.guestName,
    publicReview: row.publicReview,
    selectedForWeb: false
  };
  const listing: ListingDTO = { id: listingId, name: row.listingName, slug: listingSlug };
  return { listing, review };
}
