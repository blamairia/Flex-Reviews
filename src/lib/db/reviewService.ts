import { db } from './drizzle';
import { reviews, listings } from './schema';
import { eq, sql, desc, asc, and } from 'drizzle-orm';

export interface ReviewWithDetails {
  id: string;
  listingId: string;
  listingName: string;
  channel: string;
  type: string;
  status: string;
  overallRating: number | null;
  categoriesJson: string | null;
  submittedAt: string;
  guestName: string;
  publicReview: string;
  selectedForWeb: boolean;
  note: string | null;
  tagsJson: string | null;
  createdAt: string;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  selectedReviews: number;
  byChannel: Record<string, number>;
  byRating: Record<string, number>;
}

export class ReviewService {
  
  // Get all reviews for a property
  static async getReviewsForProperty(listingId: string): Promise<ReviewWithDetails[]> {
    try {
      const result = await db
        .select({
          id: reviews.id,
          listingId: reviews.listingId,
          listingName: reviews.listingName,
          channel: reviews.channel,
          type: reviews.type,
          status: reviews.status,
          overallRating: reviews.overallRating,
          categoriesJson: reviews.categoriesJson,
          submittedAt: reviews.submittedAt,
          guestName: reviews.guestName,
          publicReview: reviews.publicReview,
          selectedForWeb: sql<boolean>`CASE WHEN ${reviews.selectedForWeb} = 1 THEN true ELSE false END`,
          note: reviews.note,
          tagsJson: reviews.tagsJson,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .where(eq(reviews.listingId, listingId))
        .orderBy(desc(reviews.submittedAt));

      return result;
    } catch (error) {
      console.error('Error fetching reviews for property:', error);
      return [];
    }
  }

  // Get only selected/approved reviews for public display
  static async getSelectedReviewsForProperty(listingId: string): Promise<ReviewWithDetails[]> {
    try {
      const result = await db
        .select({
          id: reviews.id,
          listingId: reviews.listingId,
          listingName: reviews.listingName,
          channel: reviews.channel,
          type: reviews.type,
          status: reviews.status,
          overallRating: reviews.overallRating,
          categoriesJson: reviews.categoriesJson,
          submittedAt: reviews.submittedAt,
          guestName: reviews.guestName,
          publicReview: reviews.publicReview,
          selectedForWeb: sql<boolean>`CASE WHEN ${reviews.selectedForWeb} = 1 THEN true ELSE false END`,
          note: reviews.note,
          tagsJson: reviews.tagsJson,
          createdAt: reviews.createdAt,
        })
        .from(reviews)
        .where(
          and(
            eq(reviews.listingId, listingId),
            eq(reviews.selectedForWeb, 1)
          )
        )
        .orderBy(desc(reviews.submittedAt));

      return result;
    } catch (error) {
      console.error('Error fetching selected reviews:', error);
      return [];
    }
  }

  // Get all reviews with filtering and sorting
  static async getAllReviews(options: {
    listingId?: string;
    channel?: string;
    status?: string;
    minRating?: number;
    maxRating?: number;
    sortBy?: 'submittedAt' | 'overallRating' | 'guestName';
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {}): Promise<ReviewWithDetails[]> {
    try {
      // Build conditions
      const conditions = [];
      if (options.listingId) {
        conditions.push(eq(reviews.listingId, options.listingId));
      }
      if (options.channel) {
        conditions.push(eq(reviews.channel, options.channel));
      }
      if (options.status) {
        conditions.push(eq(reviews.status, options.status));
      }

      // Execute query based on conditions and sorting
      let result;
      
      if (conditions.length === 0) {
        // No filters
        result = await db
          .select({
            id: reviews.id,
            listingId: reviews.listingId,
            listingName: reviews.listingName,
            channel: reviews.channel,
            type: reviews.type,
            status: reviews.status,
            overallRating: reviews.overallRating,
            categoriesJson: reviews.categoriesJson,
            submittedAt: reviews.submittedAt,
            guestName: reviews.guestName,
            publicReview: reviews.publicReview,
            selectedForWeb: sql<boolean>`CASE WHEN ${reviews.selectedForWeb} = 1 THEN true ELSE false END`,
            note: reviews.note,
            tagsJson: reviews.tagsJson,
            createdAt: reviews.createdAt,
          })
          .from(reviews)
          .orderBy(desc(reviews.submittedAt));
      } else {
        // With filters
        result = await db
          .select({
            id: reviews.id,
            listingId: reviews.listingId,
            listingName: reviews.listingName,
            channel: reviews.channel,
            type: reviews.type,
            status: reviews.status,
            overallRating: reviews.overallRating,
            categoriesJson: reviews.categoriesJson,
            submittedAt: reviews.submittedAt,
            guestName: reviews.guestName,
            publicReview: reviews.publicReview,
            selectedForWeb: sql<boolean>`CASE WHEN ${reviews.selectedForWeb} = 1 THEN true ELSE false END`,
            note: reviews.note,
            tagsJson: reviews.tagsJson,
            createdAt: reviews.createdAt,
          })
          .from(reviews)
          .where(and(...conditions))
          .orderBy(desc(reviews.submittedAt));
      }

      return result;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }

  // Toggle review selection for web display
  static async toggleReviewSelection(reviewId: string): Promise<boolean> {
    try {
      // First get current state
      const currentReview = await db
        .select({ selectedForWeb: reviews.selectedForWeb })
        .from(reviews)
        .where(eq(reviews.id, reviewId))
        .limit(1);

      if (currentReview.length === 0) {
        return false;
      }

      const newState = currentReview[0].selectedForWeb === 1 ? 0 : 1;

      await db
        .update(reviews)
        .set({ 
          selectedForWeb: newState,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(reviews.id, reviewId));

      return true;
    } catch (error) {
      console.error('Error toggling review selection:', error);
      return false;
    }
  }

  // Bulk update review selections
  static async bulkUpdateReviewSelections(reviewIds: string[], selected: boolean): Promise<number> {
    try {
      const result = await db
        .update(reviews)
        .set({ 
          selectedForWeb: selected ? 1 : 0,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(sql`${reviews.id} IN (${sql.join(reviewIds.map(id => sql`${id}`), sql`, `)})`);

      return result.changes;
    } catch (error) {
      console.error('Error bulk updating review selections:', error);
      return 0;
    }
  }

  // Get review statistics for a property
  static async getReviewStats(listingId: string): Promise<ReviewStats> {
    try {
      const allReviews = await this.getReviewsForProperty(listingId);
      
      const stats: ReviewStats = {
        totalReviews: allReviews.length,
        averageRating: 0,
        selectedReviews: allReviews.filter(r => r.selectedForWeb).length,
        byChannel: {},
        byRating: {}
      };

      if (allReviews.length > 0) {
        const ratingsSum = allReviews
          .filter(r => r.overallRating !== null)
          .reduce((sum, r) => sum + (r.overallRating || 0), 0);
        
        const ratingsCount = allReviews.filter(r => r.overallRating !== null).length;
        stats.averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

        // Group by channel
        allReviews.forEach(review => {
          stats.byChannel[review.channel] = (stats.byChannel[review.channel] || 0) + 1;
        });

        // Group by rating ranges
        allReviews.forEach(review => {
          if (review.overallRating !== null) {
            const ratingRange = Math.floor(review.overallRating / 2) * 2; // 0-2, 2-4, 4-6, 6-8, 8-10
            const rangeKey = `${ratingRange}-${ratingRange + 2}`;
            stats.byRating[rangeKey] = (stats.byRating[rangeKey] || 0) + 1;
          }
        });
      }

      return stats;
    } catch (error) {
      console.error('Error calculating review stats:', error);
      return {
        totalReviews: 0,
        averageRating: 0,
        selectedReviews: 0,
        byChannel: {},
        byRating: {}
      };
    }
  }

  // Add note to review
  static async addNoteToReview(reviewId: string, note: string): Promise<boolean> {
    try {
      await db
        .update(reviews)
        .set({ 
          note,
          updatedAt: sql`CURRENT_TIMESTAMP`
        })
        .where(eq(reviews.id, reviewId));

      return true;
    } catch (error) {
      console.error('Error adding note to review:', error);
      return false;
    }
  }
}
