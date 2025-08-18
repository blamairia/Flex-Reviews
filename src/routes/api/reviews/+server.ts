import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, fetch }) => {
  try {
    const searchParams = url.searchParams;
    
    // Extract all filter parameters
    const q = searchParams.get('q') || '';
    const status = searchParams.get('status')?.split(',').filter(Boolean) || [];
    const channel = searchParams.get('channel')?.split(',').filter(Boolean) || [];
    const listingId = searchParams.get('listingId') || '';
    const ratingMin = parseInt(searchParams.get('ratingMin') || '0');
    const ratingMax = parseInt(searchParams.get('ratingMax') || '5');
    const selectedForWeb = searchParams.get('selectedForWeb');
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const sort = searchParams.get('sort') || 'submittedAt:desc';
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = parseInt(searchParams.get('offset') || '0');

    console.log('🔄 Generating filtered mock reviews from Hostaway listings...');
    console.log('📋 Filters:', { q, status, channel, listingId, ratingMin, ratingMax, selectedForWeb, dateFrom, dateTo, sort, limit, offset });
    
    // Fetch Hostaway listings to create mock reviews
    const hostawayRes = await fetch('http://localhost:5173/api/hostaway/test');
    const hostawayData = await hostawayRes.json();
    
    if (hostawayData.success && hostawayData.data?.sampleListings) {
      const allMockReviews = generateMockReviews(hostawayData.data.sampleListings);
      
      // Apply filters
      let filteredReviews = allMockReviews;
      
      // Text search filter
      if (q) {
        const query = q.toLowerCase();
        filteredReviews = filteredReviews.filter(review => 
          review.publicReview?.toLowerCase().includes(query) ||
          review.guestName?.toLowerCase().includes(query) ||
          review.listingName?.toLowerCase().includes(query)
        );
      }
      
      // Status filter
      if (status.length > 0) {
        filteredReviews = filteredReviews.filter(review => status.includes(review.status));
      }
      
      // Channel filter  
      if (channel.length > 0) {
        filteredReviews = filteredReviews.filter(review => channel.includes(review.channel));
      }
      
      // Listing ID filter
      if (listingId) {
        filteredReviews = filteredReviews.filter(review => review.listingId === listingId);
      }
      
      // Rating range filter
      filteredReviews = filteredReviews.filter(review => 
        review.overallRating !== null && 
        review.overallRating >= ratingMin && 
        review.overallRating <= ratingMax
      );
      
      // Selected for web filter
      if (selectedForWeb !== null) {
        const isSelected = selectedForWeb === 'true';
        filteredReviews = filteredReviews.filter(review => review.selectedForWeb === isSelected);
      }
      
      // Date range filter
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        filteredReviews = filteredReviews.filter(review => 
          new Date(review.submittedAt) >= fromDate
        );
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day
        filteredReviews = filteredReviews.filter(review => 
          new Date(review.submittedAt) <= toDate
        );
      }
      
      // Apply sorting
      const [sortField, sortOrder] = sort.split(':');
      filteredReviews.sort((a, b) => {
        let aValue, bValue;
        
        switch (sortField) {
          case 'submittedAt':
            aValue = new Date(a.submittedAt).getTime();
            bValue = new Date(b.submittedAt).getTime();
            break;
          case 'overallRating':
            aValue = a.overallRating || 0;
            bValue = b.overallRating || 0;
            break;
          case 'listingName':
            aValue = a.listingName.toLowerCase();
            bValue = b.listingName.toLowerCase();
            break;
          default:
            aValue = new Date(a.submittedAt).getTime();
            bValue = new Date(b.submittedAt).getTime();
        }
        
        if (sortOrder === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
      
      // Apply pagination
      const total = filteredReviews.length;
      const paginatedReviews = filteredReviews.slice(offset, offset + limit);
      
      console.log(`✅ Returning ${paginatedReviews.length} reviews (${total} total after filtering)`);
      
      return json({
        success: true,
        reviews: paginatedReviews,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total
        }
      });
    }

    return json({
      success: true,
      reviews: [],
      pagination: {
        total: 0,
        limit,
        offset,
        hasMore: false
      }
    });

  } catch (error) {
    console.error('❌ Error fetching reviews:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        reviews: [],
        pagination: {
          total: 0,
          limit: 25,
          offset: 0,
          hasMore: false
        }
      },
      { status: 500 }
    );
  }
};

// Generate mock reviews for Hostaway listings
function generateMockReviews(listings: any[]): any[] {
  const channels = ['airbnb', 'booking', 'vrbo', 'website'];
  const statuses = ['approved', 'pending', 'rejected'];
  const guestNames = ['Sarah M.', 'John D.', 'Emma L.', 'Michael R.', 'Lisa K.', 'David P.', 'Anna S.', 'James W.', 'Sophie T.', 'Robert H.'];
  const reviewTemplates = [
    'Amazing property! Very clean and well-located. The host was responsive and helpful.',
    'Great stay overall. The apartment was exactly as described and in a perfect location.',
    'Wonderful experience! The place was spotless and had everything we needed.',
    'Fantastic location and beautiful property. Highly recommend for anyone visiting the area.',
    'Clean, comfortable, and conveniently located. Would definitely stay here again.',
    'Lovely apartment with great amenities. The host provided excellent service.',
    'Perfect for our trip! The property exceeded our expectations in every way.',
    'Excellent value for money. The location is unbeatable and the place is very clean.',
    'Beautiful space with all the amenities we needed. Host was very communicative.',
    'Outstanding location and stunning property. Would book again without hesitation.',
    'Cozy and comfortable with a great view. Everything was as advertised.',
    'Modern, clean, and perfectly located. The host went above and beyond.',
    'Exceptional property in an ideal location. Highly recommend to other travelers.',
    'Stylish apartment with all modern conveniences. Great communication from host.',
    'Perfect base for exploring the city. Clean, safe, and well-equipped.',
    'Could not have asked for a better place to stay. Absolutely fantastic!'
  ];

  const categories = [
    ['cleanliness', 'location', 'communication'],
    ['amenities', 'value', 'accuracy'],
    ['check-in', 'location', 'cleanliness'],
    ['communication', 'amenities', 'accuracy'],
    ['value', 'location', 'check-in']
  ];

  const mockReviews: any[] = [];
  let reviewId = 1;

  listings.forEach((listing) => {
    // Generate 5-12 reviews per listing for better testing
    const reviewCount = Math.floor(Math.random() * 8) + 5;
    
    for (let i = 0; i < reviewCount; i++) {
      const rating = Math.random() > 0.1 ? Math.floor(Math.random() * 2) + 4 : Math.floor(Math.random() * 3) + 1; // Mostly 4-5 stars
      const daysAgo = Math.floor(Math.random() * 180) + 1; // Last 6 months
      const submittedAt = new Date();
      submittedAt.setDate(submittedAt.getDate() - daysAgo);

      const status = statuses[Math.floor(Math.random() * statuses.length)];
      // Bias towards approved for realistic data
      const finalStatus = Math.random() > 0.2 ? 'approved' : status;

      const review = {
        id: `rv_${reviewId++}`,
        listingId: listing.id.toString(),
        listingName: listing.name,
        channel: channels[Math.floor(Math.random() * channels.length)],
        type: 'guest',
        status: finalStatus,
        overallRating: rating,
        categoriesJson: JSON.stringify(categories[Math.floor(Math.random() * categories.length)]),
        submittedAt: submittedAt.toISOString(),
        guestName: guestNames[Math.floor(Math.random() * guestNames.length)],
        publicReview: reviewTemplates[Math.floor(Math.random() * reviewTemplates.length)],
        selectedForWeb: Math.random() > 0.4, // 60% selected for web
        note: null,
        tagsJson: null,
        createdAt: submittedAt.toISOString()
      };

      mockReviews.push(review);
    }
  });

  return mockReviews;
}
