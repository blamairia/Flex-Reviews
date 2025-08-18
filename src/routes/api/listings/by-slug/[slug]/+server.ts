import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { listings } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const slug = params.slug;
    // @ts-ignore
    const listing = db.select().from(listings).where(eq(listings.slug, slug)).all()[0];
    if (!listing) {
      return new Response('Not found', { status: 404 });
    }
    return new Response(JSON.stringify({ id: listing.id, name: listing.name, slug: listing.slug }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message }), { status: 500 });
  }
};
