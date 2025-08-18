import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ListingService } from '$lib/db/listingService';
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

    console.log(`🏠 Fetching properties/listings (includeHostaway: ${includeHostaway})`);

    let properties: PropertyItem[] = [];

    // Get local listings from database
    const localListings = await ListingService.getAllListings();
    
    // Convert local listings to PropertyItem format
    const localProperties: PropertyItem[] = localListings.map(listing => ({
      id: listing.id,
      slug: `property-${listing.id}`,
      name: listing.title,
      address: listing.address || '',
      avgRating: listing.avgRating || 0,
      reviewCount: listing.reviewCount || 0,
      channel: listing.channel,
      photo: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      status: listing.status || 'active'
    }));

    properties = [...localProperties];

    // Optionally include Hostaway listings
    if (includeHostaway) {
      try {
        console.log('🔄 Fetching listings from Hostaway...');
        const hostawayResponse = await HostawayService.getListings();
        
        if (hostawayResponse && hostawayResponse.result && Array.isArray(hostawayResponse.result)) {
          const hostawayProperties: PropertyItem[] = hostawayResponse.result.map((listing: HostawayListing) => 
            mapHostawayListingToPropertyItem(listing)
          );

          // Add Hostaway properties that don't exist locally
          const localIds = new Set(localProperties.map(p => p.id));
          const newHostawayProperties = hostawayProperties.filter(p => !localIds.has(p.id));
          
          properties = [...properties, ...newHostawayProperties];
          console.log(`✅ Added ${newHostawayProperties.length} Hostaway listings`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch from Hostaway:', error);
      }
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
          local: localProperties.length,
          hostaway: includeHostaway ? properties.length - localProperties.length : 0
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
