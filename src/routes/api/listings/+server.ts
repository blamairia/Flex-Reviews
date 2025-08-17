import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ListingService } from '$lib/db/listingService';

export const GET: RequestHandler = async () => {
  try {
    // Fetch real data from database
    const listings = await ListingService.getAllListings();
    
    return json({ listings });
  } catch (error) {
    console.error('Error fetching listings:', error);
    
    // Return error response
    return json(
      { error: 'Failed to fetch listings', listings: [] },
      { status: 500 }
    );
  }
};

export const POST: RequestHandler = async ({ request }) => {
  try {
    const data = await request.json();
    
    // Validate required fields
    if (!data.title || !data.channel) {
      return json(
        { error: 'Title and channel are required' },
        { status: 400 }
      );
    }
    
    // Create new listing
    const id = await ListingService.createListing({
      title: data.title,
      address: data.address,
      channel: data.channel,
      status: data.status || 'active'
    });
    
    return json({ success: true, id }, { status: 201 });
  } catch (error) {
    console.error('Error creating listing:', error);
    
    return json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
};
