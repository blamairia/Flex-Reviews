export const load = async ({ params, fetch }: any) => {
  try {
    const id = params.id;
    
    // Get listing details
    const listingRes = await fetch(`/api/reviews/hostaway?listingId=${id}&limit=1`);
    const listingData = await listingRes.json();
    const listing = listingData.listings[0] || { id, name: id, slug: id };
    
    // Get stats for this listing
    const statsRes = await fetch(`/api/reviews/stats?listingId=${id}`);
    const stats = await statsRes.json();
    
    // Get reviews for this listing
    const reviewsRes = await fetch(`/api/reviews/hostaway?listingId=${id}&limit=50`);
    const reviews = await reviewsRes.json();
    
    return { listing, stats, reviews };
  } catch {
    return { 
      listing: { id: params.id, name: params.id, slug: params.id }, 
      stats: { kpis: {}, channels: [], trend: [], categories: [] },
      reviews: { reviews: [], meta: { total: 0 } }
    };
  }
};
