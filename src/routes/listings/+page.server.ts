import type { ServerLoad } from '@sveltejs/kit';
import { ListingService } from '$lib/db/listingService';
import { HostawayService, type HostawayListing } from '$lib/services/hostawayService';

export const load: ServerLoad = async ({ fetch }) => {
  try {
    // Fetch real data from database
    const listings = await ListingService.getAllListings();
    console.log(`📦 Loaded ${listings.length} listings from database`);
    
    // Fetch Hostaway data for images and additional details
    let hostawayListings: HostawayListing[] = [];
    try {
      console.log('🔌 Attempting to fetch Hostaway data...');
      const hostawayResponse = await HostawayService.getListings({ 
        limit: 50,
        attachObjects: ['listingImages', 'listingAmenities']
      });
      hostawayListings = hostawayResponse.result;
      console.log(`🏠 Loaded ${hostawayListings.length} Hostaway listings`);
    } catch (error) {
      console.warn('⚠️ Failed to fetch Hostaway data, continuing without images:', error);
    }
    
    // Fetch all reviews to calculate ratings and counts per listing
    let allReviews = [];
    try {
      console.log('📊 Fetching reviews for rating calculations...');
      const reviewsRes = await fetch('/api/reviews');
      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json();
        if (reviewsData.success && reviewsData.reviews) {
          allReviews = reviewsData.reviews;
          console.log(`⭐ Loaded ${allReviews.length} reviews for calculations`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch reviews for listings:', error);
    }

    // Calculate ratings and review counts for each listing
    const listingsWithStats = listings.map((listing: any) => {
      const listingReviews = allReviews.filter((review: any) => 
        review.listingId === listing.id || 
        review.listingId === parseInt(listing.id) || 
        review.listingId.toString() === listing.id
      );

      const approvedReviews = listingReviews.filter((r: any) => r.status === 'approved');
      
      let avgRating = 0;
      let reviewCount = listingReviews.length;
      let approvedCount = approvedReviews.length;
      
      if (approvedReviews.length > 0) {
        const totalRating = approvedReviews.reduce((sum: number, review: any) => sum + review.overallRating, 0);
        avgRating = Math.round((totalRating / approvedReviews.length) * 10) / 10;
      }

      // Find matching Hostaway listing for additional data
      const hostawayListing = hostawayListings.find((h: HostawayListing) => 
        h.id.toString() === listing.id || h.name === listing.title
      );

      return {
        ...listing,
        // Use listing.title as name for consistency
        name: listing.title,
        // Add Hostaway data if available
        photo: hostawayListing?.listingImages?.[0]?.url || null,
        bedroomsNumber: hostawayListing?.bedroomsNumber || null,
        bathroomsNumber: hostawayListing?.bathroomsNumber || null,
        personCapacity: hostawayListing?.personCapacity || null,
        description: hostawayListing?.internalListingName || null,
        // Keep calculated ratings
        avgRating,
        reviewCount,
        approvedCount,
        approvalRate: reviewCount > 0 ? Math.round((approvedCount / reviewCount) * 100) : 0
      };
    });
    
    console.log(`✅ Successfully processed ${listingsWithStats.length} listings with ratings`);
    
    return {
      listings: listingsWithStats
    };
  } catch (error) {
    console.error('❌ Error loading listings:', error);
    
    // Fallback to empty array if database fails
    return {
      listings: []
    };
  }
};
