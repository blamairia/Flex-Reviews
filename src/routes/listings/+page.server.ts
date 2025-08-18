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
      console.log('🏠 Sample Hostaway listing:', hostawayListings[0] ? {
        id: hostawayListings[0].id,
        name: hostawayListings[0].name,
        bedroomsNumber: hostawayListings[0].bedroomsNumber,
        price: hostawayListings[0].price,
        city: hostawayListings[0].city
      } : 'No Hostaway listings found');
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

    // Convert Hostaway listings to our format and merge with local listings
    const hostawayAsListings = hostawayListings.map((hostawayListing: HostawayListing) => {
      // Look for reviews for this Hostaway listing
      const listingReviews = allReviews.filter((review: any) => 
        review.listingId === hostawayListing.id || 
        review.listingId === parseInt(hostawayListing.id.toString()) || 
        review.listingId.toString() === hostawayListing.id.toString()
      );

      const approvedReviews = listingReviews.filter((r: any) => r.status === 'approved');
      
      let avgRating = 0;
      let reviewCount = listingReviews.length;
      let approvedCount = approvedReviews.length;
      
      // Use ALL reviews for rating calculation
      if (listingReviews.length > 0) {
        const totalRating = listingReviews.reduce((sum: number, review: any) => sum + review.overallRating, 0);
        avgRating = Math.round((totalRating / listingReviews.length) * 10) / 10;
      }

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
        // Calculated ratings
        avgRating,
        reviewCount,
        approvedCount,
        approvalRate: reviewCount > 0 ? Math.round((approvedCount / reviewCount) * 100) : 0
      };
    });

    console.log(`🔄 Converted ${hostawayAsListings.length} Hostaway listings to our format`);

    // Calculate ratings and review counts for local listings
    const localListingsWithStats = listings.map((listing: any) => {
      const listingReviews = allReviews.filter((review: any) => 
        review.listingId === listing.id || 
        review.listingId === parseInt(listing.id) || 
        review.listingId.toString() === listing.id
      );

      const approvedReviews = listingReviews.filter((r: any) => r.status === 'approved');
      
      let avgRating = 0;
      let reviewCount = listingReviews.length;
      let approvedCount = approvedReviews.length;
      
      // MATCH individual listing calculation: Use ALL reviews for rating calculation
      if (listingReviews.length > 0) {
        const totalRating = listingReviews.reduce((sum: number, review: any) => sum + review.overallRating, 0);
        avgRating = Math.round((totalRating / listingReviews.length) * 10) / 10;
      }

      // Find matching Hostaway listing for additional data
      const hostawayListing = hostawayListings.find((h: HostawayListing) => 
        h.id.toString() === listing.id || h.name === listing.title
      );

      console.log(`🔍 Matching for listing ${listing.id} (${listing.title}):`, {
        found: !!hostawayListing,
        hostawayId: hostawayListing?.id,
        hostawayName: hostawayListing?.name,
        bedrooms: hostawayListing?.bedroomsNumber,
        price: hostawayListing?.price
      });

      return {
        ...listing,
        // Use listing.title as name for consistency
        name: listing.title,
        // Add Hostaway data if available - MATCH individual listing structure
        photo: hostawayListing?.listingImages?.[0]?.url || null,
        hostaway: hostawayListing ? {
          bedroomsNumber: hostawayListing.bedroomsNumber,
          bathroomsNumber: hostawayListing.bathroomsNumber,
          personCapacity: hostawayListing.personCapacity,
          price: hostawayListing.price
        } : null,
        // Also keep direct access for backward compatibility
        bedroomsNumber: hostawayListing?.bedroomsNumber || null,
        bathroomsNumber: hostawayListing?.bathroomsNumber || null,
        personCapacity: hostawayListing?.personCapacity || null,
        price: hostawayListing?.price || null,
        description: hostawayListing?.internalListingName || null,
        // Keep calculated ratings
        avgRating,
        reviewCount,
        approvedCount,
        approvalRate: reviewCount > 0 ? Math.round((approvedCount / reviewCount) * 100) : 0
      };
    });

    // Combine local listings and Hostaway listings
    const allListings = [...localListingsWithStats, ...hostawayAsListings];
    
    console.log(`✅ Successfully processed ${allListings.length} total listings (${localListingsWithStats.length} local + ${hostawayAsListings.length} Hostaway)`);
    
    return {
      listings: allListings
    };
  } catch (error) {
    console.error('❌ Error loading listings:', error);
    
    // Fallback to empty array if database fails
    return {
      listings: []
    };
  }
};
