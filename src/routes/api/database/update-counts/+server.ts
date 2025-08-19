import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { reviews, listings } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const POST: RequestHandler = async () => {
  try {
    console.log('🔄 Updating listing review counts from database...');
    
    // Get all listings
    const allListings = await db.select().from(listings);
    
    let updated = 0;
    
    for (const listing of allListings) {
      // Count reviews for this listing
      const reviewStats = await db
        .select({ 
          total: sql<number>`count(*)`,
          approved: sql<number>`sum(case when status = 'approved' then 1 else 0 end)`,
          avgRating: sql<number>`avg(case when status = 'approved' and overall_rating is not null then overall_rating else null end)`
        })
        .from(reviews)
        .where(eq(reviews.listingId, listing.id));
      
      const stats = reviewStats[0];
      const totalReviews = stats?.total || 0;
      const approvedReviews = stats?.approved || 0;
      const avgRating = stats?.avgRating || 0;
      
      // Update listing with correct counts
      await db
        .update(listings)
        .set({
          reviewCount: approvedReviews, // Only count approved reviews
          avgRating: avgRating,
          updatedAt: new Date().toISOString()
        } as any)
        .where(eq(listings.id, listing.id));
      
      console.log(`✅ Updated ${listing.name}: ${approvedReviews} approved reviews (${totalReviews} total), avg rating: ${avgRating.toFixed(1)}`);
      updated++;
    }
    
    return json({
      success: true,
      message: `Updated review counts for ${updated} listings`,
      updatedCount: updated
    });
    
  } catch (error) {
    console.error('❌ Error updating review counts:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};
