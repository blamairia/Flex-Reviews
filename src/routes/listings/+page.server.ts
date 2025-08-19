import type { ServerLoad } from '@sveltejs/kit';
import { ReviewService } from '$lib/db/reviewService';
import { HostawayService, type HostawayListing } from '$lib/services/hostawayService';

export const load: ServerLoad = async ({ fetch }) => {
  try {
    console.log('🏠 Loading listings from Hostaway API only');
    
    // Fetch Hostaway data for images and additional details
    let hostawayListings: HostawayListing[] = [];
    try {
      console.log('🔌 Fetching Hostaway listings...');
      const hostawayResponse = await HostawayService.getListings({ 
        limit: 50,
        attachObjects: ['listingImages', 'listingAmenities']
      });
      hostawayListings = hostawayResponse.result;
      console.log(`🏠 Loaded ${hostawayListings.length} Hostaway listings`);
    } catch (error) {
      console.warn('⚠️ Failed to fetch Hostaway data:', error);
      return { listings: [] };
    }

    // Convert Hostaway listings to our format with database review stats
    const listingsWithStats = await Promise.all(
      hostawayListings.map(async (hostawayListing: HostawayListing) => {
        // Get review stats from database for this Hostaway property
        const stats = await ReviewService.getReviewStats(hostawayListing.id.toString());

        return {
          id: hostawayListing.id.toString(),
          title: hostawayListing.name,
          name: hostawayListing.name,
          description: hostawayListing.internalListingName,
          address: hostawayListing.address,
          city: hostawayListing.city,
          country: hostawayListing.country,
          channel: 'Hostaway',
          photo: hostawayListing.listingImages?.[0]?.url || null,
          // Hostaway specific data
          hostaway: {
            bedroomsNumber: hostawayListing.bedroomsNumber,
            bathroomsNumber: hostawayListing.bathroomsNumber,
            personCapacity: hostawayListing.personCapacity,
            price: hostawayListing.price
          },
          // Also keep direct access for backward compatibility
          bedroomsNumber: hostawayListing.bedroomsNumber,
          bathroomsNumber: hostawayListing.bathroomsNumber,
          personCapacity: hostawayListing.personCapacity,
          price: hostawayListing.price,
          // Database review stats
          avgRating: stats.averageRating,
          reviewCount: stats.totalReviews,
          approvedCount: stats.selectedReviews,
          approvalRate: stats.totalReviews > 0 ? Math.round((stats.selectedReviews / stats.totalReviews) * 100) : 0
        };
      })
    );

    console.log(`✅ Successfully processed ${listingsWithStats.length} Hostaway listings with database review stats`);
    
    return {
      listings: listingsWithStats
    };
  } catch (error) {
    console.error('❌ Error loading listings:', error);
    
    // Fallback to empty array if Hostaway fails
    return {
      listings: []
    };
  }
};
