import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ReviewService } from '$lib/db/reviewService';
import { HostawayService } from '$lib/services/hostawayService';

interface HostawayListing {
  id: number;
  name: string;
  city: string;
  country: string;
  address: string;
  description: string;
  price: number;
  averageReviewRating: number;
  personCapacity: number;
  bedroomsNumber: number;
  bathroomsNumber: number;
  airbnbListingUrl?: string;
  vrboListingUrl?: string;
  bookingEngineUrls?: string[];
  listingImages?: Array<{ url: string; caption: string; sortOrder: number }>;
  listingAmenities?: Array<{ amenityId: number }>;
}

interface PropertyItem {
  id: string;
  slug: string;
  name: string;
  address: string;
  avgRating: number;
  reviewCount: number;
  channel: string;
  photo: string;
  status: string;
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const includeHostaway = url.searchParams.get('includeHostaway') === 'true';
    const channel = url.searchParams.get('channel');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    console.log(`🏠 Fetching properties from Hostaway API only`);

    let properties: PropertyItem[] = [];

    try {
      console.log('🔄 Fetching listings from Hostaway...');
      const hostawayResponse = await HostawayService.getListings();
      
      if (hostawayResponse && hostawayResponse.result && Array.isArray(hostawayResponse.result)) {
        // Get review counts from database for Hostaway properties
        const reviewCounts = await Promise.all(
          hostawayResponse.result.map(async (listing: HostawayListing) => {
            const stats = await ReviewService.getReviewStats(listing.id.toString());
            return {
              id: listing.id.toString(),
              reviewCount: stats.totalReviews,
              avgRating: stats.averageRating
            };
          })
        );

        const reviewCountMap = new Map(reviewCounts.map(item => [item.id, item]));

        const hostawayProperties: PropertyItem[] = hostawayResponse.result.map((listing: HostawayListing) => {
          const mapped = mapHostawayListingToPropertyItem(listing);
          
          // Enhance with database review counts
          const dbStats = reviewCountMap.get(listing.id.toString());
          if (dbStats) {
            mapped.reviewCount = dbStats.reviewCount;
            mapped.avgRating = dbStats.avgRating;
          }
          
          return mapped;
        });

        properties = hostawayProperties;
        console.log(`✅ Loaded ${hostawayProperties.length} Hostaway listings with database review counts`);
      }
    } catch (error) {
      console.warn('⚠️ Failed to fetch from Hostaway:', error);
      // Return empty array if Hostaway fails
      properties = [];
    }

    // Apply channel filter if provided
    if (channel) {
      properties = properties.filter(p => p.channel === channel);
    }

    // Apply pagination
    const totalProperties = properties.length;
    const paginatedProperties = properties.slice(offset, offset + limit);

    const response = {
      status: 'ok',
      result: {
        properties: paginatedProperties,
        pagination: {
          total: totalProperties,
          limit,
          offset,
          hasMore: offset + limit < totalProperties
        },
        sources: {
          local: 0, // No local properties, all from Hostaway
          hostaway: properties.length // All properties are from Hostaway
        }
      }
    };

    return json(response);

  } catch (error) {
    console.error('❌ Properties API error:', error);
    
    return json(
      {
        status: 'error',
        message: 'Failed to fetch properties',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Convert Hostaway listing to internal PropertyItem format
function mapHostawayListingToPropertyItem(listing: HostawayListing): PropertyItem {
  // Determine primary channel from Hostaway listing URLs
  let channel = 'website'; // default
  if (listing.airbnbListingUrl) channel = 'airbnb';
  else if (listing.vrboListingUrl) channel = 'vrbo';
  else if (listing.bookingEngineUrls && listing.bookingEngineUrls.length > 0) channel = 'booking';

  // Get primary image
  const photo = listing.listingImages && listing.listingImages.length > 0
    ? listing.listingImages.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))[0].url
    : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800';

  return {
    id: listing.id.toString(),
    slug: `property-${listing.id}`,
    name: listing.name || 'Untitled Property',
    address: listing.address || `${listing.city || ''}, ${listing.country || ''}`.trim(),
    avgRating: (listing.averageReviewRating || 0) / 2, // Convert 0-10 to 0-5 scale
    reviewCount: 0, // Hostaway doesn't provide review count in listing
    channel,
    photo,
    status: 'active'
  };
}
