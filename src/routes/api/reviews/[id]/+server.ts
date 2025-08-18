import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params }) => {
  try {
    const reviewId = params.id;
    
    // Generate mock review data for demo
    const mockReview = {
      id: reviewId,
      listingId: "155613",
      listingName: "The Bromley Collection",
      channel: "airbnb",
      type: "guest",
      status: "approved",
      overallRating: 5,
      categoriesJson: JSON.stringify(["cleanliness", "location", "communication"]),
      submittedAt: new Date().toISOString(),
      guestName: "Sarah M.",
      publicReview: "Amazing property! Very clean and well-located. The host was responsive and helpful.",
      selectedForWeb: true,
      note: null,
      tagsJson: null,
      createdAt: new Date().toISOString()
    };

    return json({
      success: true,
      review: mockReview
    });

  } catch (error) {
    console.error('❌ Error fetching review:', error);
    return json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};
