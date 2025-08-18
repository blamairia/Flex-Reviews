export const load = async ({ params, fetch }: any) => {
  try {
    const id = params.id;
    console.log(`🏠 Loading property details page for ID: ${id}`);
    
    // Get comprehensive property details from our enhanced properties API
    const propertyUrl = `/api/properties/${id}`;
    console.log(`📡 Fetching property from: ${propertyUrl}`);
    const propertyRes = await fetch(propertyUrl);
    
    if (!propertyRes.ok) {
      throw new Error(`Property API request failed: ${propertyRes.status} ${propertyRes.statusText}`);
    }
    
    const propertyText = await propertyRes.text();
    console.log(`📄 Property response preview: ${propertyText.substring(0, 100)}...`);
    
    let propertyData;
    try {
      propertyData = JSON.parse(propertyText);
    } catch (parseError) {
      console.error('❌ Failed to parse property response as JSON:', parseError);
      console.log('📄 Full response content:', propertyText);
      throw new Error(`Invalid JSON response from property API: ${parseError}`);
    }
    
    if (propertyData.status !== 'ok') {
      throw new Error(`Property not found: ${propertyData.message || 'Unknown error'}`);
    }

    const property = propertyData.result;
    
    // Get all reviews and filter for this property
    const reviewsUrl = `/api/reviews`;
    console.log(`📡 Fetching reviews from: ${reviewsUrl}`);
    const reviewsRes = await fetch(reviewsUrl);
    
    let propertyReviews = [];
    let reviewStats = {};
    
    if (reviewsRes.ok) {
      try {
        const reviewsText = await reviewsRes.text();
        const reviewsData = JSON.parse(reviewsText);
        
        if (reviewsData.success && reviewsData.reviews) {
          // Filter reviews for this specific property
          const allReviews = reviewsData.reviews;
          
          propertyReviews = allReviews.filter((review: any) => {
            return review.listingId === id || review.listingId === parseInt(id) || review.listingId.toString() === id;
          });
          
          console.log(`🔍 Found ${propertyReviews.length} reviews for property ${id}`);
          
          // Calculate basic stats from filtered reviews
          if (propertyReviews.length > 0) {
            const totalRating = propertyReviews.reduce((sum: number, review: any) => sum + review.overallRating, 0);
            const averageRating = totalRating / propertyReviews.length;
            
            // Count by sentiment/status
            const approvedReviews = propertyReviews.filter((r: any) => r.status === 'approved');
            const channelBreakdown = propertyReviews.reduce((acc: any, review: any) => {
              acc[review.channel] = (acc[review.channel] || 0) + 1;
              return acc;
            }, {});
            
            reviewStats = {
              totalReviews: propertyReviews.length,
              averageRating: Math.round(averageRating * 10) / 10,
              approvedCount: approvedReviews.length,
              approvalRate: approvedReviews.length / propertyReviews.length,
              channelBreakdown,
              sentimentBreakdown: {
                positive: propertyReviews.filter((r: any) => r.overallRating >= 4).length,
                neutral: propertyReviews.filter((r: any) => r.overallRating === 3).length,
                negative: propertyReviews.filter((r: any) => r.overallRating <= 2).length
              },
              categoryBreakdown: {
                cleanliness: averageRating,
                location: averageRating,
                communication: averageRating,
                value: averageRating
              }
            };
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse reviews response:', error);
      }
    }
    
    // Transform reviews to match component expectations
    const transformedReviews = propertyReviews.map((review: any) => ({
      id: review.id,
      guestName: review.guestName,
      rating: review.overallRating,
      comment: review.publicReview,
      date: review.submittedAt,
      channel: review.channel,
      status: review.status,
      sentiment: review.overallRating >= 4 ? 'positive' : (review.overallRating === 3 ? 'neutral' : 'negative'),
      categories: review.categoriesJson ? JSON.parse(review.categoriesJson).reduce((acc: any, cat: string) => {
        acc[cat] = review.overallRating; // Use overall rating for each category
        return acc;
      }, {}) : {}
    }));
    
    // Get property-specific insights
    const insightsUrl = `/api/properties/${id}/insights`;
    console.log(`📡 Fetching insights from: ${insightsUrl}`);
    const insightsRes = await fetch(insightsUrl);
    
    let insightsData = { status: 'error', result: {} };
    if (insightsRes.ok) {
      try {
        const insightsText = await insightsRes.text();
        insightsData = JSON.parse(insightsText);
      } catch (error) {
        console.warn('⚠️ Failed to parse insights response:', error);
      }
    }
    
    console.log(`✅ Successfully loaded property details for ${property.name || property.id}`);
    
    return { 
      property,
      reviews: {
        reviews: transformedReviews,
        stats: reviewStats,
        pagination: { 
          total: propertyReviews.length,
          limit: 50,
          offset: 0
        }
      },
      insights: insightsData.status === 'ok' ? insightsData.result : {}
    };
  } catch (error) {
    console.error('Failed to load property details:', error);
    return { 
      property: { 
        id: params.id, 
        name: `Property ${params.id}`, 
        slug: `property-${params.id}`,
        address: 'Address not available',
        summary: { avgRating: 0, reviews: 0, approvedPct: 0 }
      }, 
      reviews: { reviews: [], pagination: { total: 0 }, stats: {} },
      stats: {},
      insights: {},
      error: error instanceof Error ? error.message : 'Failed to load property data'
    };
  }
};
