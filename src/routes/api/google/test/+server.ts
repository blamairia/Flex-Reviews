import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';

// Mock Google Places API integration for exploration
export const GET: RequestHandler = async ({ url }) => {
  const placeId = url.searchParams.get('placeId');
  
  if (!placeId) {
    return json({ ok: false, reason: 'Missing placeId parameter' });
  }
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Mock success case with sample data
  if (placeId.startsWith('ChIJ') && placeId.length > 20) {
    const mockReviews = [
      {
        guestName: 'John Smith',
        overallRating: 9,
        publicReview: 'Amazing place to stay! The host was very responsive and the location was perfect for exploring the city. Clean, comfortable, and exactly as described.',
        submittedAt: '2024-01-15T10:30:00Z'
      },
      {
        guestName: 'Sarah Johnson',
        overallRating: 8,
        publicReview: 'Great experience overall. The apartment was well-equipped and in a fantastic neighborhood. Would definitely recommend to other travelers.',
        submittedAt: '2024-01-10T14:20:00Z'
      },
      {
        guestName: 'Mike Chen',
        overallRating: 10,
        publicReview: 'Outstanding! Everything exceeded our expectations. The host went above and beyond to make our stay comfortable.',
        submittedAt: '2024-01-08T09:15:00Z'
      }
    ];
    
    return json({
      ok: true,
      count: mockReviews.length,
      samples: mockReviews,
      message: 'Successfully fetched reviews from Google Places API'
    });
  }
  
  // Mock error cases
  if (placeId === 'ChIJInvalid') {
    return json({ ok: false, reason: 'Place not found' });
  }
  
  if (placeId === 'ChIJNoReviews') {
    return json({ ok: true, count: 0, samples: [], message: 'No reviews found for this place' });
  }
  
  return json({ 
    ok: false, 
    reason: 'Invalid Place ID format. Must start with "ChIJ" and be at least 20 characters long.' 
  });
};
