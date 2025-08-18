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
  lat: number;
  lng: number;
  zipcode: string;
  state: string;
  countryCode: string;
  timeZone?: string;
  currency?: string;
  cleaningFee: number;
  // Policies and Rules
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicyId?: number;
  cancellationPolicy?: string;
  houseRules?: string;
  smokingAllowed?: boolean;
  petsAllowed?: boolean;
  partiesEventsAllowed?: boolean;
  securityDepositRequired?: boolean;
  securityDepositAmount?: number;
  minimumStay?: number;
  minimumStayLongTerm?: number;
  // URLs and External Links
  airbnbListingUrl?: string;
  vrboListingUrl?: string;
  bookingEngineUrls?: string[];
  // Comprehensive Data Arrays
  listingImages?: Array<{ 
    id: number;
    url: string; 
    caption: string; 
    sortOrder: number 
  }>;
  listingAmenities?: Array<{ 
    id: number;
    amenityId: number;
    amenityName: string;
  }>;
  listingTags?: Array<{
    id: number;
    name: string;
  }>;
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

    // If not found locally, try to fetch from Hostaway with comprehensive details
    if (!property) {
      console.log('🔄 Property not found locally, fetching comprehensive details from Hostaway...');
      try {
        const hostawayResponse = await HostawayService.getListingDetails(parseInt(id));
        if (hostawayResponse && hostawayResponse.result) {
          hostawayListing = hostawayResponse.result;
          console.log('✅ Found listing in Hostaway with comprehensive details');
          console.log(`📸 Images found: ${hostawayListing.listingImages?.length || 0}`);
          console.log(`🏠 Amenities found: ${hostawayListing.listingAmenities?.length || 0}`);
          console.log(`📍 Location: ${hostawayListing.lat}, ${hostawayListing.lng}`);
          
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
    } else {
      // If we have a local property, still try to get comprehensive Hostaway data for enhancement
      console.log('🔗 Enhancing local property with comprehensive Hostaway data...');
      try {
        const hostawayResponse = await HostawayService.getListingDetails(parseInt(id));
        if (hostawayResponse && hostawayResponse.result) {
          hostawayListing = hostawayResponse.result;
          console.log('✅ Enhanced with comprehensive Hostaway data');
          console.log(`📸 Images found: ${hostawayListing.listingImages?.length || 0}`);
          console.log(`🏠 Amenities found: ${hostawayListing.listingAmenities?.length || 0}`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to enhance with Hostaway data:', error);
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
        // Comprehensive Hostaway data if available
        ...(hostawayListing && {
          hostaway: {
            // Basic Property Info
            price: hostawayListing.price,
            personCapacity: hostawayListing.personCapacity,
            bedroomsNumber: hostawayListing.bedroomsNumber,
            bathroomsNumber: hostawayListing.bathroomsNumber,
            cleaningFee: hostawayListing.cleaningFee,
            
            // Location Details for Maps Integration
            location: {
              lat: hostawayListing.lat,
              lng: hostawayListing.lng,
              address: hostawayListing.address,
              city: hostawayListing.city,
              state: hostawayListing.state,
              country: hostawayListing.country,
              countryCode: hostawayListing.countryCode,
              zipcode: hostawayListing.zipcode,
              timeZone: hostawayListing.timeZone
            },
            
            // Policies & Rules
            policies: {
              checkInTime: hostawayListing.checkInTime || '3:00 PM',
              checkOutTime: hostawayListing.checkOutTime || '10:00 AM',
              smokingAllowed: hostawayListing.smokingAllowed || false,
              petsAllowed: hostawayListing.petsAllowed || false,
              partiesEventsAllowed: hostawayListing.partiesEventsAllowed || false,
              securityDepositRequired: hostawayListing.securityDepositRequired || false,
              securityDepositAmount: hostawayListing.securityDepositAmount,
              minimumStay: hostawayListing.minimumStay,
              minimumStayLongTerm: hostawayListing.minimumStayLongTerm,
              houseRules: hostawayListing.houseRules,
              cancellationPolicy: hostawayListing.cancellationPolicy
            },
            
            // All Images for Gallery
            images: hostawayListing.listingImages?.map(img => ({
              id: img.id,
              url: img.url,
              caption: img.caption,
              sortOrder: img.sortOrder
            })) || [],
            
            // All Amenities
            amenities: hostawayListing.listingAmenities?.map(amenity => ({
              id: amenity.id,
              amenityId: amenity.amenityId,
              name: amenity.amenityName
            })) || [],
            
            // Tags and Categories
            tags: hostawayListing.listingTags?.map(tag => ({
              id: tag.id,
              name: tag.name
            })) || [],
            
            // External Platform URLs
            externalUrls: {
              airbnb: hostawayListing.airbnbListingUrl,
              vrbo: hostawayListing.vrboListingUrl,
              bookingEngine: hostawayListing.bookingEngineUrls
            },
            
            // Counts for UI Display
            amenitiesCount: hostawayListing.listingAmenities?.length || 0,
            imagesCount: hostawayListing.listingImages?.length || 0,
            tagsCount: hostawayListing.listingTags?.length || 0
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
