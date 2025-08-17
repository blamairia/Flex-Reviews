export type CategoryRating = { key: string; rating: number };
export type ReviewDTO = {
  id: string;
  listingId: string;
  listingName: string;
  channel: 'hostaway' | 'google' | 'airbnb' | 'booking' | 'direct';
  type: 'host-to-guest' | 'guest-to-host';
  status: 'published' | 'draft';
  overallRating: number | null;
  categories: CategoryRating[];
  submittedAt: string; // ISO
  guestName: string;
  publicReview: string;
  selectedForWeb: boolean;
  note?: string | null;
  tags?: string[];
};
export type ListingDTO = { id: string; name: string; slug: string };
