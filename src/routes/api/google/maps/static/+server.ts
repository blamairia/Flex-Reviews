import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { apiKey, center, zoom, size, markers, maptype } = await request.json();
    
    if (!apiKey || !center) {
      return json({ error: 'API key and center are required' }, { status: 400 });
    }
    
    // Construct the Google Static Maps URL
    const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
    const params = new URLSearchParams({
      key: apiKey,
      center: center,
      zoom: zoom?.toString() || '13',
      size: size || '600x400',
      maptype: maptype || 'roadmap'
    });
    
    // Add markers if specified
    if (markers) {
      params.append('markers', markers);
    }
    
    const url = `${baseUrl}?${params.toString()}`;
    
    // For static maps, we return the URL instead of making the request
    // since it returns an image, not JSON
    const responseData = {
      status: 'OK',
      map_url: url,
      parameters: {
        center,
        zoom: zoom || 13,
        size: size || '600x400',
        maptype: maptype || 'roadmap',
        markers: markers || 'none'
      }
    };
    
    return json(responseData);
    
  } catch (error) {
    console.error('Static Maps API Error:', error);
    return json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
};
