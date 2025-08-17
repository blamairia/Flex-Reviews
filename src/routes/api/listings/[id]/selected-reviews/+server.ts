import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { listings, reviews } from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { mapRow } from '$lib/services/reviews';

export const GET: RequestHandler = async ({ params }) => {
  const id = params.id;
  // @ts-ignore
  const listing = db.select().from(listings).where(eq(listings.id, id)).get?.();
  // @ts-ignore fallback
  const l = listing ?? db.select().from(listings).where(eq(listings.id, id)).all()[0];
  if (!l) return new Response('Not found', { status: 404 });
  // @ts-ignore
  const rows = db
    // @ts-ignore
    .select()
    .from(reviews)
    .where(and(eq(reviews.listingId, id), eq(reviews.selectedForWeb, 1)))
    // @ts-ignore
    .all();
  const payload = {
    listing: { id: l.id, name: l.name, slug: l.slug },
    reviews: rows.map(mapRow)
  };
  return new Response(JSON.stringify(payload), { headers: { 'content-type': 'application/json' } });
};
