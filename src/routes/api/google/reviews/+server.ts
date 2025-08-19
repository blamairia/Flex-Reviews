import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { apiKey, placeId } = await request.json();
    
    if (!apiKey || !placeId) {
      return json({ error: 'API key and place ID are required' }, { status: 400 });
    }
    
    // Construct the Google Place Details URL with reviews fields
    const baseUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
    const params = new URLSearchParams({
      key: apiKey,
      place_id: placeId,
      fields: 'name,rating,user_ratings_total,reviews'
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
    
    // Process and format the reviews response
    const processedData = {
      status: data.status,
      place_name: data.result?.name,
      rating: data.result?.rating,
      user_ratings_total: data.result?.user_ratings_total,
      reviews: data.result?.reviews?.map((review: any) => ({
        author_name: review.author_name,
        author_url: review.author_url,
        language: review.language,
        profile_photo_url: review.profile_photo_url,
        rating: review.rating,
        relative_time_description: review.relative_time_description,
        text: review.text,
        time: review.time,
        translated: review.translated
      })) || [],
      total_reviews: data.result?.reviews?.length || 0
    };
    
    return json(processedData);
    
  } catch (error) {
    console.error('Reviews API Error:', error);
    return json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};
