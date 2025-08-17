import type { ServerLoad } from '@sveltejs/kit';
import { ListingService } from '$lib/db/listingService';

export const load: ServerLoad = async () => {
  try {
    // Fetch real data from database
    const listings = await ListingService.getAllListings();
    
    return {
      listings
    };
  } catch (error) {
    console.error('Error loading listings:', error);
    
    // Fallback to empty array if database fails
    return {
      listings: []
    };
  }
};
