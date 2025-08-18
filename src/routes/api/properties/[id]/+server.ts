import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ListingService, type ListingWithStats } from '$lib/db/listingService';
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

export const GET: RequestHandler = async ({ params }) => {
  try {
    const { id } = params;

    if (!id) {
      return json(
        { status: 'error', message: 'Property ID is required' },
        { status: 400 }
      );
    }

    console.log(`🏠 Fetching property (listing) details for ID: ${id}`);

    // Try to get listing from local database
    let property: ListingWithStats | null = await ListingService.getListingById(id);
    let hostawayListing: HostawayListing | null = null;

    // If not found locally, try to fetch from Hostaway
    if (!property) {
      console.log('🔄 Property not found locally, fetching from Hostaway...');
      try {
        const hostawayResponse = await HostawayService.getListing(parseInt(id));
        if (hostawayResponse && hostawayResponse.result) {
          hostawayListing = hostawayResponse.result;
          console.log('✅ Found listing in Hostaway');
          
          // Create a mock local property from Hostaway data
          property = {
            id: hostawayListing.id.toString(),
            title: hostawayListing.name,
            address: `${hostawayListing.city}, ${hostawayListing.country}`,
            channel: determineChannel(hostawayListing),
            status: 'active',
            avgRating: (hostawayListing.averageReviewRating || 0) / 2, // Convert 0-10 to 0-5
            reviewCount: 0,
            createdAt: new Date().toISOString()
          };
        }
      } catch (error) {
        console.warn('⚠️ Failed to fetch from Hostaway:', error);
      }
    }

    if (!property) {
      return json(
        { status: 'error', message: 'Property not found' },
        { status: 404 }
      );
    }

    // Get additional stats from reviews
    const reviews = await ReviewService.getReviewsForProperty(property.id);
    const approvedReviews = reviews.filter((r: any) => r.status === 'approved');
    const approvedPct = reviews.length > 0 ? approvedReviews.length / reviews.length : 0;

    // Determine channels from listing data
    const channels = hostawayListing ? getChannelsFromHostawayListing(hostawayListing) : [property.channel || 'website'];

    // Get primary image
    const photo = hostawayListing && hostawayListing.listingImages && hostawayListing.listingImages.length > 0
      ? hostawayListing.listingImages.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))[0].url
      : 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800';

    const response = {
      status: 'ok',
      result: {
        id: property.id,
        slug: `property-${property.id}`,
        name: property.title,
        address: property.address,
        description: hostawayListing?.description || '',
        channels,
        photo,
        summary: {
          avgRating: property.avgRating || 0,
          reviews: reviews.length,
          approvedPct: Math.round(approvedPct * 100) / 100
        },
        // Additional Hostaway data if available
        ...(hostawayListing && {
          hostaway: {
            price: hostawayListing.price,
            personCapacity: hostawayListing.personCapacity,
            bedroomsNumber: hostawayListing.bedroomsNumber,
            bathroomsNumber: hostawayListing.bathroomsNumber,
            amenitiesCount: hostawayListing.listingAmenities?.length || 0,
            imagesCount: hostawayListing.listingImages?.length || 0
          }
        })
      }
    };

    return json(response);

  } catch (error) {
    console.error('❌ Property details API error:', error);
    
    return json(
      {
        status: 'error',
        message: 'Failed to fetch property details',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Determine primary channel from Hostaway listing
function determineChannel(listing: HostawayListing): string {
  if (listing.airbnbListingUrl) return 'airbnb';
  if (listing.vrboListingUrl) return 'vrbo';
  if (listing.bookingEngineUrls && listing.bookingEngineUrls.length > 0) return 'booking';
  return 'website';
}

// Get all channels from Hostaway listing
function getChannelsFromHostawayListing(listing: HostawayListing): string[] {
  const channels: string[] = [];
  if (listing.airbnbListingUrl) channels.push('airbnb');
  if (listing.vrboListingUrl) channels.push('vrbo');
  if (listing.bookingEngineUrls && listing.bookingEngineUrls.length > 0) channels.push('booking');
  if (channels.length === 0) channels.push('website');
  return channels;
}
