import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, fetch }) => {
  try {
    const searchParams = url.searchParams;
    const dateFrom = searchParams.get('dateFrom') || '2025-06-01';
    const dateTo = searchParams.get('dateTo') || '2025-08-18';
    const metric = searchParams.get('metric') || 'avgCategoryScore';

    // Fetch Hostaway listings for context
    const hostawayRes = await fetch('http://localhost:5173/api/hostaway/test');
    const hostawayData = await hostawayRes.json();

    let heatmapData = [];
    
    if (hostawayData.success && hostawayData.data?.sampleListings) {
      const properties = hostawayData.data.sampleListings;
      const categories = ['Cleanliness', 'Location', 'Communication', 'Check-in', 'Value', 'Amenities'];

      heatmapData = properties.map((property: any) => {
        const categoryScores: any = {};
        categories.forEach(category => {
          categoryScores[category] = 3.5 + (Math.random() * 1.5); // Random score 3.5-5.0
        });

        return {
          propertyId: property.id,
          propertyName: property.name,
          city: property.city,
          country: property.country,
          avgScore: Object.values(categoryScores).reduce((sum: number, score: any) => sum + score, 0) / categories.length,
          categoryScores,
          reviewCount: Math.floor(Math.random() * 50) + 10,
          lastUpdated: new Date().toISOString()
        };
      });
    }

    return json({
      success: true,
      heatmapData,
      metric,
      dateRange: { dateFrom, dateTo },
      categories: ['Cleanliness', 'Location', 'Communication', 'Check-in', 'Value', 'Amenities']
    });

  } catch (error) {
    console.error('❌ Error fetching heatmap data:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        heatmapData: []
      },
      { status: 500 }
    );
  }
};
