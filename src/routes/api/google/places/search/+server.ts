import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { apiKey, query, location, radius } = await request.json();
    
    if (!apiKey || !query) {
      return json({ error: 'API key and query are required' }, { status: 400 });
    }
    
    // Construct the Google Places Text Search URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
    const params = new URLSearchParams({
      key: apiKey,
      query: query
    });
    
    // Add optional parameters
    if (location) {
      params.append('location', location);
    }
    
    if (radius) {
      params.append('radius', radius.toString());
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
        formatted_address: place.formatted_address,
        rating: place.rating,
        user_ratings_total: place.user_ratings_total,
        price_level: place.price_level,
        types: place.types,
        geometry: place.geometry,
        photos: place.photos?.slice(0, 3), // Limit photos
        business_status: place.business_status
      })) || [],
      total_results: data.results?.length || 0,
      next_page_token: data.next_page_token
    };
    
    return json(processedData);
    
  } catch (error) {
    console.error('Places Search API Error:', error);
    return json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};
