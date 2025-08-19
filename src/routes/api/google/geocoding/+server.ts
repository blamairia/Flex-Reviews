import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { apiKey, address } = await request.json();
    
    if (!apiKey || !address) {
      return json({ error: 'API key and address are required' }, { status: 400 });
    }
    
    // Construct the Google Geocoding URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
    const params = new URLSearchParams({
      key: apiKey,
      address: address
    });
    
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
      results: data.results?.map((result: any) => ({
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        geometry: result.geometry,
        address_components: result.address_components,
        types: result.types
      })) || [],
      total_results: data.results?.length || 0
    };
    
    return json(processedData);
    
  } catch (error) {
    console.error('Geocoding API Error:', error);
    return json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};
