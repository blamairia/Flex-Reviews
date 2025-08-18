import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, fetch }) => {
  try {
    const searchParams = url.searchParams;
    const listingId = searchParams.get('listingId') || undefined;
    const channel = searchParams.get('channel') || undefined;
    const status = searchParams.get('status') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔄 Generating mock reviews from Hostaway listings...');
    
    // Fetch Hostaway listings to create mock reviews
    const hostawayRes = await fetch('http://localhost:5173/api/hostaway/test');
    const hostawayData = await hostawayRes.json();
    
    if (hostawayData.success && hostawayData.data?.sampleListings) {
      const mockReviews = generateMockReviews(hostawayData.data.sampleListings, limit, offset);
      return json({
        success: true,
        reviews: mockReviews,
        totalCount: mockReviews.length,
        limit,
        offset
      });
    }

    return json({
      success: true,
      reviews: [],
      totalCount: 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reviews: []
      },
      { status: 500 }
    );
  }
};

// Generate mock reviews for Hostaway listings
function generateMockReviews(listings: any[], limit: number, offset: number): any[] {
  const channels = ['airbnb', 'booking', 'vrbo', 'website'];
  const guestNames = ['Sarah M.', 'John D.', 'Emma L.', 'Michael R.', 'Lisa K.', 'David P.', 'Anna S.', 'James W.'];
  const reviewTemplates = [
    'Amazing property! Very clean and well-located. The host was responsive and helpful.',
    'Great stay overall. The apartment was exactly as described and in a perfect location.',
    'Wonderful experience! The place was spotless and had everything we needed.',
    'Fantastic location and beautiful property. Highly recommend for anyone visiting the area.',
    'Clean, comfortable, and conveniently located. Would definitely stay here again.',
    'Lovely apartment with great amenities. The host provided excellent service.',
    'Perfect for our trip! The property exceeded our expectations in every way.',
    'Excellent value for money. The location is unbeatable and the place is very clean.'
  ];

  const mockReviews: any[] = [];
  let reviewId = 1;

  listings.forEach((listing) => {
    // Generate 3-8 reviews per listing
    const reviewCount = Math.floor(Math.random() * 6) + 3;
    
    for (let i = 0; i < reviewCount; i++) {
      const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars mostly
      const daysAgo = Math.floor(Math.random() * 90) + 1; // Last 90 days
      const submittedAt = new Date();
      submittedAt.setDate(submittedAt.getDate() - daysAgo);

      const review = {
        id: `rv_${reviewId++}`,
        listingId: listing.id.toString(),
        listingName: listing.name,
        channel: channels[Math.floor(Math.random() * channels.length)],
        type: 'guest',
        status: 'approved',
        overallRating: rating,
        categoriesJson: JSON.stringify(['cleanliness', 'location', 'communication']),
        submittedAt: submittedAt.toISOString(),
        guestName: guestNames[Math.floor(Math.random() * guestNames.length)],
        publicReview: reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)],
        selectedForWeb: Math.random() > 0.3, // 70% selected
        note: null,
        tagsJson: null,
        createdAt: submittedAt.toISOString()
      };

      mockReviews.push(review);
    }
  });

  // Sort by submitted date (newest first)
  mockReviews.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());

  // Apply pagination
  return mockReviews.slice(offset, offset + limit);
}
