import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch }) => {
  try {
    // Fetch Hostaway listings for mock KPI data
    const hostawayRes = await fetch('http://localhost:5173/api/hostaway/test');
    const hostawayData = await hostawayRes.json();
    
    let kpis;
    if (hostawayData.success && hostawayData.data?.sampleListings) {
      const listings = hostawayData.data.sampleListings;
      const totalReviews = listings.length * 6; // Average 6 reviews per listing
      
      kpis = {
        totalReviews,
        avgRating: 4.3,
        fiveStarRate: 65, // Percentage
        thirtyDayGrowth: 12, // Percentage
        totalListings: listings.length,
        selectedReviews: Math.floor(totalReviews * 0.7), // 70% selected
        pendingReviews: Math.floor(totalReviews * 0.15) // 15% pending
      };
    } else {
      kpis = {
        totalReviews: 0,
        avgRating: 0,
        fiveStarRate: 0,
        thirtyDayGrowth: 0,
        totalListings: 0,
        selectedReviews: 0,
        pendingReviews: 0
      };
    }

    return json({
      success: true,
      kpis
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard KPIs:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        kpis: {
          totalReviews: 0,
          avgRating: 0,
          fiveStarRate: 0,
          thirtyDayGrowth: 0,
          totalListings: 0,
          selectedReviews: 0,
          pendingReviews: 0
        }
      },
      { status: 500 }
    );
  }
};
