import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ fetch }) => {
  try {
    // For now, always generate mock stats based on Hostaway listings
    console.log('🔄 Generating mock stats from Hostaway listings...');
    
    // Fetch Hostaway listings for mock data
    const hostawayRes = await fetch('http://localhost:5173/api/hostaway/test');
    const hostawayData = await hostawayRes.json();
    
    let stats;
    if (hostawayData.success && hostawayData.data?.sampleListings) {
      stats = generateMockStats(hostawayData.data.sampleListings);
    } else {
      stats = getEmptyStats();
    }

    return json(stats);

  } catch (error) {
    console.error('❌ Error fetching review stats:', error);
    return json(getEmptyStats(), { status: 500 });
  }
};

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
