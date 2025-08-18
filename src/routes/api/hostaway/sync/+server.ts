import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ReviewService } from '$lib/db/reviewService';
import { ListingService } from '$lib/db/listingService';

interface HostawayListing {
  id: number;
  name: string;
  city: string;
  country: string;
  address: string;
  price: number;
  averageReviewRating: number;
  airbnbListingUrl?: string;
  vrboListingUrl?: string;
  bookingEngineUrls?: string[];
  reviews?: HostawayReview[];
}

interface HostawayReview {
  id?: number;
  rating: number;
  title?: string;
  content?: string;
  comment?: string;
  language?: string;
  stayDate?: string;
  checkoutDate?: string;
  createdAt?: string;
  submittedAt?: string;
  source?: string;
  platform?: string;
  guestName?: string;
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    console.log('🔄 Starting Hostaway sync process...');

    // Accept JSON data with Hostaway listings
    const syncData = await request.json();

    if (!syncData.listings || !Array.isArray(syncData.listings)) {
      return json(
        { status: 'error', message: 'Invalid sync data: listings array required' },
        { status: 400 }
      );
    }

    const syncResults = {
      listingsProcessed: 0,
      reviewsCreated: 0,
      errors: [] as string[]
    };

    // Process each Hostaway listing
    for (const listingData of syncData.listings) {
      try {
        // Create or update listing in our system
        const listingId = await upsertListingFromHostaway(listingData);
        syncResults.listingsProcessed++;

        // Process reviews for this listing if provided
        if (listingData.reviews && Array.isArray(listingData.reviews)) {
          for (const reviewData of listingData.reviews) {
            try {
              await createReviewFromHostaway(reviewData, listingId);
              syncResults.reviewsCreated++;
            } catch (reviewError) {
              console.warn('⚠️ Failed to create review:', reviewError);
              syncResults.errors.push(`Review error for listing ${listingData.id}: ${reviewError instanceof Error ? reviewError.message : 'Unknown'}`);
            }
          }
        }

      } catch (listingError) {
        console.warn('⚠️ Failed to process listing:', listingError);
        syncResults.errors.push(`Listing error: ${listingError instanceof Error ? listingError.message : 'Unknown'}`);
      }
    }

    console.log('✅ Hostaway sync completed:', syncResults);

    return json({
      status: 'ok',
      result: syncResults,
      message: `Sync completed: ${syncResults.listingsProcessed} listings, ${syncResults.reviewsCreated} reviews`
    });

  } catch (error) {
    console.error('❌ Hostaway sync error:', error);
    
    return json(
      {
        status: 'error',
        message: 'Hostaway sync failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Create or update listing from Hostaway data
async function upsertListingFromHostaway(listingData: HostawayListing): Promise<string> {
  // Check if listing already exists
  const existingListing = await ListingService.getListingById(listingData.id?.toString());

  if (existingListing) {
    // Update existing listing
    console.log(`📝 Updating existing listing: ${listingData.name}`);
    return existingListing.id;
  } else {
    // Create new listing
    console.log(`➕ Creating new listing: ${listingData.name}`);
    
    // Determine primary channel from Hostaway listing URLs
    let channel = 'website'; // default
    if (listingData.airbnbListingUrl) channel = 'airbnb';
    else if (listingData.vrboListingUrl) channel = 'vrbo';
    else if (listingData.bookingEngineUrls && listingData.bookingEngineUrls.length > 0) channel = 'booking';

    const listingId = await ListingService.createListing({
      title: listingData.name || 'Untitled Property',
      address: listingData.address || `${listingData.city || ''}, ${listingData.country || ''}`.trim(),
      channel,
      status: 'active'
    });

    return listingId;
  }
}

// Create review from Hostaway data with proper mapping to our internal format
async function createReviewFromHostaway(reviewData: HostawayReview, listingId: string): Promise<void> {
  // Create the review in our database using ReviewService
  await ReviewService.createReview({
    listingId,
    title: reviewData.title || extractTitleFromContent(reviewData.content || reviewData.comment || ''),
    content: reviewData.content || reviewData.comment || '',
    rating: Math.min(Math.max(reviewData.rating || 3, 1), 5), // Ensure rating is 1-5
    channel: determineChannelFromReview(reviewData),
    language: reviewData.language || 'en',
    stayDate: reviewData.stayDate || reviewData.checkoutDate || generateRecentDate(),
    createdAt: reviewData.createdAt || reviewData.submittedAt || new Date().toISOString(),
    categories: deriveCategories(reviewData.content || reviewData.comment || ''),
    sentiment: computeSentiment(reviewData.rating || 3, reviewData.content || reviewData.comment || ''),
    status: 'pending',
    featured: false,
    guestName: reviewData.guestName || 'Anonymous'
  });
}

// Extract title from content if not provided
function extractTitleFromContent(content: string): string {
  if (!content) return 'Guest Review';
  
  // Take first sentence or first 50 characters
  const firstSentence = content.split(/[.!?]/)[0].trim();
  if (firstSentence.length > 5 && firstSentence.length <= 100) {
    return firstSentence;
  }
  
  return content.substring(0, 50).trim() + (content.length > 50 ? '...' : '');
}

// Determine channel from review metadata
function determineChannelFromReview(reviewData: HostawayReview): string {
  if (reviewData.source) {
    const source = reviewData.source.toLowerCase();
    if (source.includes('airbnb')) return 'airbnb';
    if (source.includes('booking')) return 'booking';
    if (source.includes('vrbo')) return 'vrbo';
  }
  
  if (reviewData.platform) {
    const platform = reviewData.platform.toLowerCase();
    if (platform.includes('airbnb')) return 'airbnb';
    if (platform.includes('booking')) return 'booking';
    if (platform.includes('vrbo')) return 'vrbo';
  }

  return 'website'; // default
}

// Derive categories using keyword rules and NLP
function deriveCategories(content: string): string[] {
  if (!content) return ['General'];

  const categories: string[] = [];
  const lowerContent = content.toLowerCase();

  // Define comprehensive keyword rules for categories
  const categoryRules = {
    'Cleanliness': [
      'clean', 'dirty', 'spotless', 'messy', 'tidy', 'sanitized', 'hygiene', 
      'neat', 'pristine', 'immaculate', 'dusty', 'filthy', 'fresh', 'sterile'
    ],
    'Location': [
      'location', 'area', 'neighborhood', 'convenient', 'central', 'walkable', 
      'transport', 'metro', 'subway', 'bus', 'train', 'airport', 'downtown', 
      'nearby', 'close', 'distance', 'accessible', 'position'
    ],
    'Check-in': [
      'checkin', 'check-in', 'arrival', 'key', 'entry', 'access', 'instructions',
      'welcome', 'keypad', 'code', 'door', 'keys', 'smooth', 'easy', 'difficult'
    ],
    'Communication': [
      'communication', 'response', 'helpful', 'contact', 'available', 'quick',
      'responsive', 'friendly', 'polite', 'professional', 'prompt', 'clear',
      'host', 'owner', 'support', 'service'
    ],
    'Value': [
      'value', 'price', 'worth', 'expensive', 'cheap', 'reasonable', 'cost',
      'money', 'affordable', 'budget', 'pricing', 'deal', 'bargain', 'overpriced'
    ],
    'Amenities': [
      'amenities', 'wifi', 'internet', 'kitchen', 'bathroom', 'facilities',
      'air conditioning', 'heating', 'tv', 'parking', 'pool', 'gym', 'laundry',
      'appliances', 'equipment', 'towels', 'linens', 'coffee', 'shower'
    ],
    'Comfort': [
      'comfortable', 'cozy', 'spacious', 'cramped', 'bed', 'mattress', 'pillow',
      'room', 'space', 'size', 'layout', 'furniture', 'decor', 'atmosphere'
    ],
    'Noise': [
      'noise', 'noisy', 'loud', 'quiet', 'peaceful', 'sound', 'disturbing',
      'silent', 'calm', 'street', 'traffic', 'neighbors', 'music'
    ]
  };

  // Check each category for keyword matches
  Object.entries(categoryRules).forEach(([category, keywords]) => {
    const matches = keywords.filter(keyword => lowerContent.includes(keyword));
    if (matches.length > 0) {
      categories.push(category);
    }
  });

  return categories.length > 0 ? categories : ['General'];
}

// Compute sentiment from rating and content analysis
function computeSentiment(rating: number, content: string): string {
  // Primary sentiment based on rating
  let sentiment = 'neutral';
  if (rating >= 4) sentiment = 'positive';
  else if (rating <= 2) sentiment = 'negative';

  // Enhance with content analysis if available
  if (content) {
    const lowerContent = content.toLowerCase();
    
    const positiveWords = [
      'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'love', 'perfect',
      'beautiful', 'awesome', 'outstanding', 'superb', 'brilliant', 'incredible',
      'pleased', 'satisfied', 'happy', 'enjoyed', 'recommend', 'impressed'
    ];
    
    const negativeWords = [
      'terrible', 'awful', 'horrible', 'worst', 'disappointing', 'problem',
      'bad', 'poor', 'dirty', 'rude', 'unacceptable', 'disgusting', 'nightmare',
      'disaster', 'frustrating', 'annoying', 'uncomfortable', 'broken', 'issues'
    ];
    
    const positiveCount = positiveWords.filter(word => lowerContent.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerContent.includes(word)).length;
    
    // Adjust sentiment based on keyword analysis
    if (positiveCount > negativeCount && positiveCount > 1) {
      sentiment = 'positive';
    } else if (negativeCount > positiveCount && negativeCount > 1) {
      sentiment = 'negative';
    }
    
    // Strong indicators override rating-based sentiment
    if (positiveCount >= 3) sentiment = 'positive';
    if (negativeCount >= 3) sentiment = 'negative';
  }

  return sentiment;
}

// Generate a recent date for missing stay dates
function generateRecentDate(): string {
  const now = new Date();
  const daysAgo = Math.floor(Math.random() * 90); // Random date within last 90 days
  const date = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
  return date.toISOString().split('T')[0]; // YYYY-MM-DD format
}
