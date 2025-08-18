import type { ServerLoad } from '@sveltejs/kit';
import { ListingService } from '$lib/db/listingService';
import { ReviewService } from '$lib/db/reviewService';
import { error } from '@sveltejs/kit';

export const load: ServerLoad = async ({ params }) => {
  try {
    const slug = params.slug;
    
    // Get property by slug (we'll need to add this method)
    const property = await ListingService.getListingBySlug(slug);
    
    if (!property) {
      throw error(404, 'Property not found');
    }
    
    // Get selected reviews for this property
    const selectedReviews = await ReviewService.getSelectedReviewsForProperty(property.id);
    
    return {
      property,
      selectedReviews
    };
  } catch (err) {
    console.error('Error loading property:', err);
    throw error(404, 'Property not found');
  }
};
