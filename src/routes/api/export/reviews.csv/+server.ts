import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url, fetch }) => {
  try {
    const searchParams = url.searchParams;
    const dateFrom = searchParams.get('dateFrom') || '2025-06-01';
    const dateTo = searchParams.get('dateTo') || '2025-08-18';
    const status = searchParams.get('status') || 'approved';
    const format = 'csv'; // Force CSV format

    // Get reviews data
    const reviewsRes = await fetch(`http://localhost:5173/api/reviews?dateFrom=${dateFrom}&dateTo=${dateTo}&status=${status}&limit=1000`);
    const reviewsData = await reviewsRes.json();

    if (!reviewsData.success) {
      return json({ success: false, error: 'Failed to fetch reviews data' }, { status: 500 });
    }

    // Convert to CSV
    const csvData = convertReviewsToCSV(reviewsData.reviews || []);
    
    return new Response(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="reviews_${dateFrom}_to_${dateTo}.csv"`
      }
    });

  } catch (error) {
    console.error('❌ Error exporting reviews CSV:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};

function convertReviewsToCSV(reviews: any[]): string {
  if (reviews.length === 0) {
    return 'No reviews found for the specified criteria';
  }

  // CSV headers
  const headers = [
    'Review ID',
    'Property ID',
    'Property Name',
    'Guest Name',
    'Channel',
    'Rating',
    'Review Text',
    'Categories',
    'Submitted Date',
    'Status',
    'Selected for Web',
    'Note'
  ];

  // Convert reviews to CSV rows
  const rows = reviews.map(review => [
    review.id || '',
    review.listingId || '',
    review.listingName || '',
    review.guestName || '',
    review.channel || '',
    review.overallRating || '',
    `"${(review.publicReview || '').replace(/"/g, '""')}"`, // Escape quotes
    review.categoriesJson || '',
    review.submittedAt || '',
    review.status || '',
    review.selectedForWeb ? 'Yes' : 'No',
    `"${(review.note || '').replace(/"/g, '""')}"` // Escape quotes
  ]);

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  
  return csvContent;
}
