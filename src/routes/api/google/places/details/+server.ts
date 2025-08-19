import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { apiKey, placeId, fields } = await request.json();
    
    if (!apiKey || !placeId) {
      return json({ error: 'API key and place ID are required' }, { status: 400 });
    }
    
    // Construct the Google Place Details URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const params = new URLSearchParams({
      key: apiKey,
      place_id: placeId
    });
    
    // Add fields if specified
    if (fields) {
      params.append('fields', fields);
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
      result: data.result ? {
        place_id: data.result.place_id,
        name: data.result.name,
        formatted_address: data.result.formatted_address,
        formatted_phone_number: data.result.formatted_phone_number,
        international_phone_number: data.result.international_phone_number,
        website: data.result.website,
        rating: data.result.rating,
        user_ratings_total: data.result.user_ratings_total,
        price_level: data.result.price_level,
        types: data.result.types,
        geometry: data.result.geometry,
        opening_hours: data.result.opening_hours,
        photos: data.result.photos?.slice(0, 5), // Limit photos
        reviews: data.result.reviews?.map((review: any) => ({
          author_name: review.author_name,
          author_url: review.author_url,
          language: review.language,
          profile_photo_url: review.profile_photo_url,
          rating: review.rating,
          relative_time_description: review.relative_time_description,
          text: review.text,
          time: review.time
        })) || [],
        business_status: data.result.business_status,
        vicinity: data.result.vicinity
      } : null
    };
    
    return json(processedData);
    
  } catch (error) {
    console.error('Place Details API Error:', error);
    return json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};
