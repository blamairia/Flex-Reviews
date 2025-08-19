import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { ReviewService } from '$lib/db/reviewService';
import { db } from '$lib/db/drizzle';
import { reviews } from '$lib/db/schema';
import { eq, sql } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { ids, action, payload } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return json(
        { success: false, message: 'Review IDs are required' },
        { status: 400 }
      );
    }

    if (!action || !['approve', 'reject', 'feature'].includes(action)) {
      return json(
        { success: false, message: 'Valid action is required (approve, reject, feature)' },
        { status: 400 }
      );
    }

    console.log(`🔄 Performing batch action "${action}" on reviews:`, ids);

    let updatedCount = 0;
    const updatedReviews = [];

    // Process each review
    for (const reviewId of ids) {
      try {
        let updateData: any = {
          updatedAt: new Date().toISOString()
        };

        switch (action) {
          case 'approve':
            updateData.status = 'approved';
            break;
          case 'reject':
            updateData.status = 'rejected';
            break;
          case 'feature':
            updateData.selectedForWeb = 1;
            break;
        }

        // Update the review in database
        const result = await db
          .update(reviews)
          .set(updateData)
          .where(eq(reviews.id, reviewId));

        if (result.changes > 0) {
          updatedCount++;
          updatedReviews.push({
            id: reviewId,
            action,
            status: updateData.status || 'updated',
            updatedAt: updateData.updatedAt
          });
        }
      } catch (reviewError) {
        console.error(`❌ Error updating review ${reviewId}:`, reviewError);
      }
    }

    console.log(`✅ Successfully processed ${action} action for ${updatedCount}/${ids.length} review(s)`);

    return json({
      success: true,
      message: `Successfully ${action}${action.endsWith('e') ? 'd' : 'ed'} ${updatedCount} review(s)`,
      updatedReviews,
      action,
      affectedIds: ids,
      processedCount: updatedCount,
      totalRequested: ids.length
    });

  } catch (error) {
    console.error('❌ Error in batch review action:', error);
    return json(
      {
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
};
