import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { HostawayService } from '$lib/services/hostawayService';

export const GET: RequestHandler = async () => {
  try {
    console.log('🔌 Testing Hostaway API connection...');
    
    // Test the connection
    const isConnected = await HostawayService.testConnection();
    
    if (!isConnected) {
      return json(
        { 
          success: false, 
          error: 'Failed to connect to Hostaway API',
          message: 'Check credentials and network connection'
        },
        { status: 500 }
      );
    }

    // If connection is successful, fetch some sample data
    const listingsResponse = await HostawayService.getListings({ 
      limit: 5,
      attachObjects: ['bookingEngineUrls']
    });

    return json({
      success: true,
      message: 'Hostaway API connection successful',
      data: {
        totalListings: listingsResponse.count,
        totalPages: listingsResponse.totalPages,
        sampleListings: listingsResponse.result.map(listing => ({
          id: listing.id,
          name: listing.name,
          city: listing.city,
          country: listing.country,
          price: listing.price,
          rating: listing.averageReviewRating,
          bedrooms: listing.bedroomsNumber,
          images: listing.listingImages?.length || 0,
          amenities: listing.listingAmenities?.length || 0
        }))
      }
    });

  } catch (error) {
    console.error('❌ Hostaway API test failed:', error);
    
    return json(
      { 
        success: false, 
        error: 'Hostaway API test failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: {
          accountId: '61148',
          baseUrl: 'https://api.hostaway.com/v1'
        }
      },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { action, ...params } = await request.json();

    switch (action) {
      case 'authenticate':
        console.log('🔑 Authenticating with Hostaway...');
        const token = await HostawayService.authenticate();
        return json({
          success: true,
          message: 'Authentication successful',
          tokenLength: token.length,
          tokenPrefix: token.substring(0, 20) + '...'
        });

      case 'sync':
        console.log('🔄 Starting listings sync...');
        const listings = await HostawayService.syncListings({
          limit: params.limit || 10,
          city: params.city,
          country: params.country
        });
        
        return json({
          success: true,
          message: 'Listings sync completed',
          data: {
            totalSynced: listings.length,
            listings: listings.map(listing => ({
              id: listing.id,
              name: listing.name,
              city: listing.city,
              country: listing.country
            }))
          }
        });

      default:
        return json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('❌ Hostaway operation failed:', error);
    
    return json(
      { 
        success: false, 
        error: 'Operation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};
