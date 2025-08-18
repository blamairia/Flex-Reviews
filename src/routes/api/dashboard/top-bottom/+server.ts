import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, fetch }) => {
  try {
    const searchParams = url.searchParams;
    const dateFrom = searchParams.get('dateFrom') || '2025-06-01';
    const dateTo = searchParams.get('dateTo') || '2025-08-18';
    const metric = searchParams.get('metric') || 'avgRating';
    const limit = parseInt(searchParams.get('limit') || '5');

    // Fetch Hostaway listings for context
    const hostawayRes = await fetch('http://localhost:5173/api/hostaway/test');
    const hostawayData = await hostawayRes.json();

    let topProperties = [];
    let bottomProperties = [];
    
    if (hostawayData.success && hostawayData.data?.sampleListings) {
      const properties = hostawayData.data.sampleListings;
      const enrichedProperties = properties.map((property: any) => ({
        ...property,
        avgRating: 3.5 + (Math.random() * 1.5),
        reviewCount: Math.floor(Math.random() * 50) + 10,
        avgResponseTime: Math.floor(Math.random() * 8) + 1, // hours
        occupancyRate: 0.6 + (Math.random() * 0.4) // 60-100%
      }));

      // Sort by the requested metric
      const sortedProperties = [...enrichedProperties].sort((a, b) => {
        switch (metric) {
          case 'avgRating':
            return b.avgRating - a.avgRating;
          case 'reviewCount':
            return b.reviewCount - a.reviewCount;
          case 'avgResponseTime':
            return a.avgResponseTime - b.avgResponseTime; // Lower is better
          case 'occupancyRate':
            return b.occupancyRate - a.occupancyRate;
          default:
            return b.avgRating - a.avgRating;
        }
      });

      topProperties = sortedProperties.slice(0, limit);
      bottomProperties = sortedProperties.slice(-limit).reverse();
    }

    return json({
      success: true,
      topProperties,
      bottomProperties,
      metric,
      dateRange: { dateFrom, dateTo }
    });

  } catch (error) {
    console.error('❌ Error fetching top/bottom properties:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        topProperties: [],
        bottomProperties: []
      },
      { status: 500 }
    );
  }
};
