import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ReviewService } from '$lib/db/reviewService';
import { ListingService } from '$lib/db/listingService';

export const GET: RequestHandler = async ({ params, url }) => {
  try {
    const { slug } = params;
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const ratingMin = parseFloat(url.searchParams.get('ratingMin') || '1');
    const categories = url.searchParams.getAll('category[]');
    const sort = url.searchParams.get('sort') || 'newest';

    if (!slug) {
      return json(
        { status: 'error', message: 'Property slug is required' },
        { status: 400 }
      );
    }

    console.log(`🌐 Fetching public reviews for property ${slug}:`, {
      limit, offset, ratingMin, categories, sort
    });

    // Get property by slug
    const property = await ListingService.getListingBySlug(slug);
    
    if (!property) {
      return json(
        { status: 'error', message: 'Property not found' },
        { status: 404 }
      );
    }

    // Get all approved reviews for this property
    const allReviews = await ReviewService.getReviewsByListingId(property.id);
    
    // Filter to only approved reviews
    let approvedReviews = allReviews.filter(review => review.status === 'approved');

    // Apply rating filter
    if (ratingMin > 1) {
      approvedReviews = approvedReviews.filter(review => (review.rating || 0) >= ratingMin);
    }

    // Apply category filter (mock implementation)
    if (categories.length > 0) {
      // In real implementation, reviews would have categories field
      // For now, we'll mock some reviews having certain categories
      approvedReviews = approvedReviews.filter(review => {
        // Mock: assume reviews with certain keywords relate to categories
        const content = (review.content || '').toLowerCase();
        return categories.some(category => {
          switch (category.toLowerCase()) {
            case 'cleanliness':
              return content.includes('clean') || content.includes('tidy');
            case 'location':
              return content.includes('location') || content.includes('area');
            case 'communication':
              return content.includes('communication') || content.includes('response');
            default:
              return true;
          }
        });
      });
    }

    // Apply sorting
    switch (sort) {
      case 'top':
        approvedReviews.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'featuredFirst':
        approvedReviews.sort((a, b) => {
          // Featured reviews first, then by date
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;
      case 'newest':
      default:
        approvedReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    // Calculate aggregates
    const totalReviews = approvedReviews.length;
    const avgRating = totalReviews > 0 
      ? approvedReviews.reduce((sum, review) => sum + (review.rating || 0), 0) / totalReviews
      : 0;

    // Apply pagination
    const paginatedReviews = approvedReviews.slice(offset, offset + limit);

    // Transform reviews for public display
    const publicReviews = paginatedReviews.map(review => {
      // Mock categories based on content analysis
      const categories = extractMockCategories(review.content || review.title || '');
      
      return {
        id: review.id,
        rating: review.rating,
        title: review.title,
        body: review.content,
        date: review.createdAt.split('T')[0], // YYYY-MM-DD format
        channel: review.channel || 'website',
        categories,
        featured: review.featured || false,
        reviewerName: generateAnonymousName(review.id), // Generate consistent anonymous name
        verified: Math.random() > 0.3 // Mock verified status
      };
    });

    const response = {
      status: 'ok',
      result: {
        aggregate: {
          avgRating: Math.round(avgRating * 100) / 100,
          count: totalReviews
        },
        items: publicReviews
      },
      limit,
      offset,
      count: publicReviews.length,
      total: totalReviews
    };

    return json(response);

  } catch (error) {
    console.error('❌ Public reviews API error:', error);
    
    return json(
      {
        status: 'error',
        message: 'Failed to fetch public reviews',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

// Extract mock categories based on content
function extractMockCategories(content: string): string[] {
  const categories: string[] = [];
  const lowerContent = content.toLowerCase();

  if (lowerContent.includes('clean') || lowerContent.includes('tidy') || lowerContent.includes('spotless')) {
    categories.push('Cleanliness');
  }
  if (lowerContent.includes('location') || lowerContent.includes('area') || lowerContent.includes('neighborhood')) {
    categories.push('Location');
  }
  if (lowerContent.includes('checkin') || lowerContent.includes('check-in') || lowerContent.includes('arrival')) {
    categories.push('Check-in');
  }
  if (lowerContent.includes('communication') || lowerContent.includes('response') || lowerContent.includes('helpful')) {
    categories.push('Communication');
  }
  if (lowerContent.includes('value') || lowerContent.includes('price') || lowerContent.includes('worth')) {
    categories.push('Value');
  }
  if (lowerContent.includes('amenities') || lowerContent.includes('facilities') || lowerContent.includes('wifi')) {
    categories.push('Amenities');
  }

  return categories.length > 0 ? categories : ['General'];
}

// Generate consistent anonymous name based on review ID
function generateAnonymousName(reviewId: string): string {
  const firstNames = ['Alex', 'Jordan', 'Casey', 'Taylor', 'Morgan', 'Riley', 'Avery', 'Cameron'];
  const lastInitials = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M'];
  
  // Use review ID hash to consistently generate same name
  const hash = reviewId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const firstNameIndex = Math.abs(hash) % firstNames.length;
  const lastInitialIndex = Math.abs(hash >> 8) % lastInitials.length;
  
  return `${firstNames[firstNameIndex]} ${lastInitials[lastInitialIndex]}.`;
}
