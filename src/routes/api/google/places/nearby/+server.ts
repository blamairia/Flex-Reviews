import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { apiKey, location, radius, type, keyword } = await request.json();
    
    if (!apiKey || !location) {
      return json({ error: 'API key and location are required' }, { status: 400 });
    }
    
    // Construct the Google Places Nearby Search URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
    const params = new URLSearchParams({
      key: apiKey,
      location: location,
      radius: radius?.toString() || '1500'
    });
    
    // Add optional parameters
    if (type) {
      params.append('type', type);
    }
    
    if (keyword) {
      params.append('keyword', keyword);
    }
    
    const url = `${baseUrl}?${params.toString()}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      return json({ 
        error: 'Google API request failed', 
        details: data 
      }, { status: response.status });
    }
    
    // Process and format the response
    const processedData = {
      status: data.status,
      results: data.results?.map((place: any) => ({
        place_id: place.place_id,
        name: place.name,
        vicinity: place.vicinity,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        price_level: place.price_level,
        types: place.types,
        geometry: place.geometry,
        photos: place.photos?.slice(0, 3), // Limit photos
        business_status: place.business_status,
        opening_hours: place.opening_hours
      })) || [],
      total_results: data.results?.length || 0,
      next_page_token: data.next_page_token
    };
    
    return json(processedData);
    
  } catch (error) {
    console.error('Nearby Search API Error:', error);
    return json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};
