import type { RequestHandler } from '@sveltejs/kit';
import { queryReviews } from '$lib/services/reviews';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const page = Number(url.searchParams.get('page') || '1');
    const limit = Number(url.searchParams.get('limit') || '20');
    const listingId = url.searchParams.get('listingId') || undefined;
    const channel = url.searchParams.get('channel') || undefined;
    const type = url.searchParams.get('type') || undefined;
    const from = url.searchParams.get('from') || undefined;
    const to = url.searchParams.get('to') || undefined;
    const minRating = url.searchParams.get('minRating');
    const selectedOnly = url.searchParams.get('selectedOnly') === '1';

    const { reviews, total, listings } = queryReviews({
      page, limit, listingId, channel, type, from, to,
      minRating: minRating ? Number(minRating) : undefined,
      selectedOnly
    });

    return new Response(
      JSON.stringify({ reviews, listings, meta: { page, limit, total } }),
      { headers: { 'content-type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Server error' }), { status: 500 });
  }
};
