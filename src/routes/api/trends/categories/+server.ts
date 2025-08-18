import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const searchParams = url.searchParams;
    const dateFrom = searchParams.get('dateFrom') || '2025-06-01';
    const dateTo = searchParams.get('dateTo') || '2025-08-18';
    const groupBy = searchParams.get('groupBy') || 'week';
    const categories = searchParams.getAll('category[]').length > 0 
      ? searchParams.getAll('category[]') 
      : ['Cleanliness', 'Communication'];

    const trends = generateCategoryTrends(dateFrom, dateTo, groupBy, categories);

    return json({
      success: true,
      trends,
      dateRange: { dateFrom, dateTo },
      groupBy,
      categories
    });

  } catch (error) {
    console.error('❌ Error fetching category trends:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        trends: []
      },
      { status: 500 }
    );
  }
};

function generateCategoryTrends(dateFrom: string, dateTo: string, groupBy: string, categories: string[]) {
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const points = groupBy === 'day' ? daysDiff : 
                groupBy === 'week' ? Math.ceil(daysDiff / 7) :
                groupBy === 'month' ? Math.ceil(daysDiff / 30) : 10;

  const trends = [];
  
  for (let i = 0; i < points; i++) {
    const date = new Date(startDate);
    if (groupBy === 'day') {
      date.setDate(date.getDate() + i);
    } else if (groupBy === 'week') {
      date.setDate(date.getDate() + (i * 7));
    } else if (groupBy === 'month') {
      date.setMonth(date.getMonth() + i);
    }

    const dataPoint: any = {
      date: date.toISOString().split('T')[0],
      totalReviews: Math.floor(Math.random() * 30) + 10
    };

    // Add category scores
    categories.forEach(category => {
      const baseScore = getBaseCategoryScore(category);
      const variation = (Math.random() - 0.5) * 0.8; // ±0.4 variation
      dataPoint[category.toLowerCase()] = Math.max(1, Math.min(5, baseScore + variation));
    });

    trends.push(dataPoint);
  }

  return trends;
}

function getBaseCategoryScore(category: string): number {
  const baseScores: { [key: string]: number } = {
    'Cleanliness': 4.3,
    'Location': 4.5,
    'Communication': 4.1,
    'Check-in': 4.2,
    'Value': 3.9,
    'Amenities': 4.0,
    'Comfort': 4.2,
    'Noise': 3.8
  };
  
  return baseScores[category] || 4.0;
}
