import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { apiKey, input, inputtype, fields } = await request.json();
    
    if (!apiKey || !input) {
      return json({ error: 'API key and input are required' }, { status: 400 });
    }
    
    // Construct the Google Find Place URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json';
    const params = new URLSearchParams({
      key: apiKey,
      input: input,
      inputtype: inputtype || 'textquery'
    });
    
    // Add fields if specified - using basic fields that work with Find Place
    if (fields) {
      params.append('fields', fields);
    } else {
      params.append('fields', 'place_id,name,geometry,formatted_address');
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
      candidates: data.candidates?.map((candidate: any) => ({
        place_id: candidate.place_id,
        name: candidate.name,
        formatted_address: candidate.formatted_address,
        geometry: candidate.geometry,
        rating: candidate.rating,
        user_ratings_total: candidate.user_ratings_total,
        business_status: candidate.business_status
      })) || [],
      total_candidates: data.candidates?.length || 0
    };
    
    return json(processedData);
    
  } catch (error) {
    console.error('Find Place API Error:', error);
    return json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};
