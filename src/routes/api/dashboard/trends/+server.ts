import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, fetch }) => {
  try {
    const searchParams = url.searchParams;
    const dateFrom = searchParams.get('dateFrom') || '2025-06-01';
    const dateTo = searchParams.get('dateTo') || '2025-08-18';
    const groupBy = searchParams.get('groupBy') || 'week';
    const by = searchParams.get('by') || 'channel';

    // Fetch Hostaway listings for context
    const hostawayRes = await fetch('http://localhost:5173/api/hostaway/test');
    const hostawayData = await hostawayRes.json();

    let trends = [];
    
    if (hostawayData.success && hostawayData.data?.sampleListings) {
      trends = generateTrendData(dateFrom, dateTo, groupBy, by);
    }

    return json({
      success: true,
      trends,
      dateFrom,
      dateTo,
      groupBy,
      by
    });

  } catch (error) {
    console.error('❌ Error fetching dashboard trends:', error);
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

function generateTrendData(dateFrom: string, dateTo: string, groupBy: string, by: string) {
  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);
  const trends = [];

  // Generate trend points based on groupBy period
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const points = groupBy === 'day' ? daysDiff : 
                groupBy === 'week' ? Math.ceil(daysDiff / 7) :
                groupBy === 'month' ? Math.ceil(daysDiff / 30) : 10;

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
      totalReviews: Math.floor(Math.random() * 20) + 5,
      avgRating: 3.5 + (Math.random() * 1.5)
    };

    if (by === 'channel') {
      dataPoint.channels = {
        airbnb: Math.floor(Math.random() * 10) + 2,
        booking: Math.floor(Math.random() * 8) + 1,
        vrbo: Math.floor(Math.random() * 5) + 1,
        website: Math.floor(Math.random() * 3) + 1
      };
    } else if (by === 'category') {
      dataPoint.categories = {
        cleanliness: 4.0 + (Math.random() * 1.0),
        location: 4.2 + (Math.random() * 0.8),
        communication: 4.1 + (Math.random() * 0.9),
        checkin: 4.3 + (Math.random() * 0.7),
        value: 3.8 + (Math.random() * 1.2)
      };
    }

    trends.push(dataPoint);
  }

  return trends;
}
