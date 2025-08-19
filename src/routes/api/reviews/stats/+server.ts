import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { reviews, listings } from '$lib/db/schema';
import { sql, eq, and, gte, lte, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  try {
    console.log('🔄 Fetching real stats from database...');
    
    // Get query parameters
    const searchParams = url.searchParams;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    
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

    // Get total review count and basic stats
    const totalStats = await db
      .select({
        totalReviews: sql<number>`count(*)`,
        avgRating: sql<number>`avg(${reviews.overallRating})`,
        fiveStarCount: sql<number>`sum(case when ${reviews.overallRating} >= 5.0 then 1 else 0 end)`,
      })
      .from(reviews)
      .where(dateCondition);

    const total = totalStats[0];
    const fiveStarRate = total.totalReviews > 0 ? (total.fiveStarCount / total.totalReviews) * 100 : 0;

    // Get 30-day comparison for growth calculation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentStats = await db
      .select({
        recentReviews: sql<number>`count(*)`,
        recentAvgRating: sql<number>`avg(${reviews.overallRating})`,
      })
      .from(reviews)
      .where(and(
        gte(reviews.submittedAt, thirtyDaysAgo.toISOString()),
        dateCondition
      ));

    const recent = recentStats[0];
    const thirtyDayGrowth = total.totalReviews > 0 ? 
      ((recent.recentReviews / total.totalReviews) * 100) - 100 : 0;

    // Generate trend data for the last 30 days
    const trendData = await db
      .select({
        date: sql<string>`date(${reviews.submittedAt})`,
        count: sql<number>`count(*)`,
        avgRating: sql<number>`avg(${reviews.overallRating})`,
      })
      .from(reviews)
      .where(and(
        gte(reviews.submittedAt, thirtyDaysAgo.toISOString()),
        dateCondition
      ))
      .groupBy(sql`date(${reviews.submittedAt})`)
      .orderBy(sql`date(${reviews.submittedAt})`);

    // Get channel distribution
    const channelStats = await db
      .select({
        channel: reviews.channel,
        count: sql<number>`count(*)`,
        avgRating: sql<number>`avg(${reviews.overallRating})`,
        percentage: sql<number>`(count(*) * 100.0) / ${total.totalReviews}`,
      })
      .from(reviews)
      .where(dateCondition)
      .groupBy(reviews.channel);

    // Get top listings by review count and rating
    const topListings = await db
      .select({
        id: listings.id,
        title: listings.name,
        slug: listings.slug,
        channel: listings.channel,
        reviewCount: sql<number>`count(${reviews.id})`,
        avgRating: sql<number>`avg(${reviews.overallRating})`,
      })
      .from(listings)
      .leftJoin(reviews, eq(listings.id, reviews.listingId))
      .where(dateCondition)
      .groupBy(listings.id, listings.name, listings.slug, listings.channel)
      .having(sql`count(${reviews.id}) > 0`)
      .orderBy(desc(sql`avg(${reviews.overallRating})`), desc(sql`count(${reviews.id})`))
      .limit(10);

    // Get category breakdown (parse categories from existing reviews)
    const categoryReviews = await db
      .select({
        categoriesJson: reviews.categoriesJson,
        overallRating: reviews.overallRating,
      })
      .from(reviews)
      .where(and(
        sql`${reviews.categoriesJson} IS NOT NULL`,
        dateCondition
      ));

    // Process categories
    const categoryStats: Record<string, { total: number; sum: number; avg: number }> = {};
    
    categoryReviews.forEach(review => {
      if (review.categoriesJson) {
        try {
          const categories = JSON.parse(review.categoriesJson);
          Object.entries(categories).forEach(([category, rating]) => {
            if (typeof rating === 'number') {
              if (!categoryStats[category]) {
                categoryStats[category] = { total: 0, sum: 0, avg: 0 };
              }
              categoryStats[category].total++;
              categoryStats[category].sum += rating;
              categoryStats[category].avg = categoryStats[category].sum / categoryStats[category].total;
            }
          });
        } catch (e) {
          // Skip invalid JSON
        }
      }
    });

    const categories = Object.entries(categoryStats).map(([name, stats]) => ({
      name,
      avgRating: Number(stats.avg.toFixed(2)),
      count: stats.total
    }));

    const stats = {
      kpis: {
        totalReviews: total.totalReviews || 0,
        avgRating: Number((total.avgRating || 0).toFixed(2)),
        fiveStarRate: Number(fiveStarRate.toFixed(1)),
        thirtyDayGrowth: Number(thirtyDayGrowth.toFixed(1))
      },
      trend: trendData.map(item => ({
        date: item.date,
        count: item.count || 0,
        avgRating: Number((item.avgRating || 0).toFixed(2))
      })),
      channels: channelStats.map(item => ({
        name: item.channel,
        count: item.count || 0,
        percentage: Number((item.percentage || 0).toFixed(1)),
        avgRating: Number((item.avgRating || 0).toFixed(2))
      })),
      categories,
      topListings: topListings.map(item => ({
        id: item.id,
        title: item.title,
        slug: item.slug,
        channel: item.channel,
        reviewCount: item.reviewCount || 0,
        avgRating: Number((item.avgRating || 0).toFixed(2))
      }))
    };

    console.log('✅ Generated real stats:', {
      totalReviews: stats.kpis.totalReviews,
      avgRating: stats.kpis.avgRating,
      topListingsCount: stats.topListings.length,
      channelsCount: stats.channels.length
    });

    return json(stats);

  } catch (error) {
    console.error('❌ Error fetching review stats:', error);
    return json(getEmptyStats(), { status: 500 });
  }
};

function getEmptyStats() {
  return {
    kpis: { totalReviews: 0, avgRating: 0, fiveStarRate: 0, thirtyDayGrowth: 0 },
    trend: [],
    channels: [],
    categories: [],
    topListings: []
  };
}

function generateMockStats(listings: any[]) {
  const totalListings = listings.length;
  const totalReviews = totalListings * 6; // Average 6 reviews per listing
  const avgRating = 4.3;
  const fiveStarRate = 0.65;
  const thirtyDayGrowth = 0.12;

  // Generate trend data for last 30 days
  const trend: Array<{date: string; count: number; avgRating: number}> = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dailyReviews = Math.floor(Math.random() * 3) + 1;
    trend.push({
      date: date.toISOString().split('T')[0],
      count: dailyReviews,
      avgRating: 4.0 + Math.random() * 1.0
    });
  }

  // Generate channel distribution
  const channels = [
    { name: 'Airbnb', count: Math.floor(totalReviews * 0.4), percentage: 40 },
    { name: 'Booking.com', count: Math.floor(totalReviews * 0.35), percentage: 35 },
    { name: 'VRBO', count: Math.floor(totalReviews * 0.15), percentage: 15 },
    { name: 'Website', count: Math.floor(totalReviews * 0.1), percentage: 10 }
  ];

  // Generate top listings
  const topListings = listings.map((listing, index) => ({
    id: listing.id.toString(),
    name: listing.name,
    avgRating: 4.0 + Math.random() * 1.0,
    reviewCount: 5 + Math.floor(Math.random() * 10),
    city: listing.city,
    channel: ['Airbnb', 'Booking.com', 'VRBO'][Math.floor(Math.random() * 3)]
  })).sort((a, b) => b.avgRating - a.avgRating);

  // Generate category breakdown
  const categories = [
    { name: 'Cleanliness', count: Math.floor(totalReviews * 0.9), percentage: 90 },
    { name: 'Location', count: Math.floor(totalReviews * 0.85), percentage: 85 },
    { name: 'Communication', count: Math.floor(totalReviews * 0.8), percentage: 80 },
    { name: 'Check-in', count: Math.floor(totalReviews * 0.75), percentage: 75 },
    { name: 'Amenities', count: Math.floor(totalReviews * 0.7), percentage: 70 },
    { name: 'Value', count: Math.floor(totalReviews * 0.65), percentage: 65 }
  ];

  return {
    kpis: {
      totalReviews,
      avgRating: Math.round(avgRating * 10) / 10,
      fiveStarRate: Math.round(fiveStarRate * 100),
      thirtyDayGrowth: Math.round(thirtyDayGrowth * 100)
    },
    trend,
    channels,
    categories,
    topListings: topListings.slice(0, 5)
  };
}

function getEmptyStats() {
  return {
    kpis: {
      totalReviews: 0,
      avgRating: 0,
      fiveStarRate: 0,
      thirtyDayGrowth: 0
    },
    trend: [],
    channels: [],
    categories: [],
    topListings: []
  };
}
