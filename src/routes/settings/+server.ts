import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { listings, reviews } from '$lib/db/schema';
import { seedWithData } from '$lib/db/seed';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    
    if (body.action === 'upload') {
      // Clear existing data
      await db.delete(reviews);
      await db.delete(listings);
      
      // Import and reseed with new data
      const result = await seedWithData(body.data);
      
      return json({ 
        ok: true, 
        reviewCount: result.reviewCount, 
        listingCount: result.listingCount 
      });
    }
    
    return json({ ok: false, error: 'Invalid action' });
  } catch (error) {
    return json({ 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};
