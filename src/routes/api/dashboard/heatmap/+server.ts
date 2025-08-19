import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { reviews, listings } from '$lib/db/schema';
import { sql, eq, and, gte, lte } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  try {
    console.log('🔄 Fetching real heatmap data from database...');
    
    const searchParams = url.searchParams;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const metric = searchParams.get('metric') || 'avgCategoryScore';

    // Build date filter condition
    let dateCondition = undefined;
    if (dateFrom && dateTo) {
      dateCondition = and(
        gte(reviews.submittedAt, dateFrom),
        lte(reviews.submittedAt, dateTo)
      );
    } else if (dateFrom) {
      dateCondition = gte(reviews.submittedAt, dateFrom);
    } else if (dateTo) {
      dateCondition = lte(reviews.submittedAt, dateTo);
    }

    // Get listings with their review data
    const listingsWithReviews = await db
      .select({
        propertyId: listings.id,
        propertyName: listings.name,
        channel: listings.channel,
        reviewCount: sql<number>`count(${reviews.id})`,
        avgRating: sql<number>`avg(${reviews.overallRating})`,
        categoriesData: sql<string>`group_concat(${reviews.categoriesJson}, '||')`,
      })
      .from(listings)
      .leftJoin(reviews, eq(listings.id, reviews.listingId))
      .where(dateCondition)
      .groupBy(listings.id, listings.name, listings.channel)
      .having(sql`count(${reviews.id}) > 0`);

    // Process the data to extract category scores
    const heatmapData = listingsWithReviews.map(item => {
      const categoryScores: Record<string, number> = {
        'Cleanliness': 0,
        'Location': 0,
        'Communication': 0,
        'Check-in': 0,
        'Value': 0,
        'Amenities': 0
      };
      
      const categoryCounts: Record<string, number> = {
        'Cleanliness': 0,
        'Location': 0,
        'Communication': 0,
        'Check-in': 0,
        'Value': 0,
        'Amenities': 0
      };

      // Parse categories from concatenated JSON data
      if (item.categoriesData) {
        const categoryJsonArray = item.categoriesData.split('||').filter(Boolean);
        
        categoryJsonArray.forEach(categoriesJson => {
          try {
            const categories = JSON.parse(categoriesJson);
            Object.entries(categories).forEach(([category, rating]) => {
              if (typeof rating === 'number' && categoryScores.hasOwnProperty(category)) {
                categoryScores[category] += rating;
                categoryCounts[category]++;
              }
            });
          } catch (e) {
            // Skip invalid JSON
          }
        });
      }

      // Calculate averages
      Object.keys(categoryScores).forEach(category => {
        if (categoryCounts[category] > 0) {
          categoryScores[category] = categoryScores[category] / categoryCounts[category];
        } else {
          // Use overall rating as fallback
          categoryScores[category] = item.avgRating || 4.0;
        }
      });

      // Calculate overall average score
      const avgScore = Object.values(categoryScores).reduce((sum, score) => sum + score, 0) / Object.keys(categoryScores).length;

      return {
        propertyId: item.propertyId,
        propertyName: item.propertyName,
        channel: item.channel,
        avgScore: Number(avgScore.toFixed(2)),
        categoryScores: Object.fromEntries(
          Object.entries(categoryScores).map(([k, v]) => [k, Number(v.toFixed(2))])
        ),
        reviewCount: item.reviewCount || 0,
        lastUpdated: new Date().toISOString()
      };
    });

    console.log('✅ Generated real heatmap data:', {
      propertiesCount: heatmapData.length,
      totalReviews: heatmapData.reduce((sum, item) => sum + item.reviewCount, 0)
    });

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
        heatmapData: [],
        categories: []
      },
      { status: 500 }
    );
  }
};
