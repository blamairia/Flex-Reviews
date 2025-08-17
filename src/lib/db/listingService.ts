import { db } from './drizzle';
import { listings, reviews } from './schema';
import { eq, sql, desc, asc } from 'drizzle-orm';

export interface ListingWithStats {
  id: string;
  title: string;
  address: string | null;
  channel: string;
  status: string;
  avgRating: number | null;
  reviewCount: number;
  createdAt: string;
}

export interface CreateListingData {
  title: string;
  address?: string;
  channel: string;
  status?: string;
}

export class ListingService {
  
  // Get all listings with calculated stats
  static async getAllListings(): Promise<ListingWithStats[]> {
    try {
      const result = await db
        .select({
          id: listings.id,
          title: listings.name,
          address: listings.address,
          channel: listings.channel,
          status: listings.status,
          avgRating: listings.avgRating,
          reviewCount: listings.reviewCount,
          createdAt: listings.createdAt,
        })
        .from(listings)
        .orderBy(desc(listings.createdAt));

      return result;
    } catch (error) {
      console.error('Error fetching listings:', error);
      return [];
    }
  }

  // Get a single listing by slug
  static async getListingBySlug(slug: string): Promise<ListingWithStats | null> {
    try {
      const result = await db
        .select({
          id: listings.id,
          title: listings.name,
          address: listings.address,
          channel: listings.channel,
          status: listings.status,
          avgRating: listings.avgRating,
          reviewCount: listings.reviewCount,
          createdAt: listings.createdAt,
        })
        .from(listings)
        .where(eq(listings.slug, slug))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching listing by slug:', error);
      return null;
    }
  }

  // Get a single listing by ID
  static async getListingById(id: string): Promise<ListingWithStats | null> {
    try {
      const result = await db
        .select({
          id: listings.id,
          title: listings.name,
          address: listings.address,
          channel: listings.channel,
          status: listings.status,
          avgRating: listings.avgRating,
          reviewCount: listings.reviewCount,
          createdAt: listings.createdAt,
        })
        .from(listings)
        .where(eq(listings.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      console.error('Error fetching listing:', error);
      return null;
    }
  }

  // Create a new listing
  static async createListing(data: CreateListingData): Promise<string> {
    try {
      const id = crypto.randomUUID();
      const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      
      await db.insert(listings).values({
        id,
        name: data.title,
        slug: `${slug}-${Date.now()}`, // Ensure uniqueness
        address: data.address || null,
        channel: data.channel,
        status: data.status || 'active',
        avgRating: 0,
        reviewCount: 0,
      });

      return id;
    } catch (error) {
      console.error('Error creating listing:', error);
      throw new Error('Failed to create listing');
    }
  }

  // Update listing stats based on reviews
  static async updateListingStats(listingId: string): Promise<void> {
    try {
      // Calculate average rating and review count from reviews table
      const stats = await db
        .select({
          avgRating: sql<number>`AVG(${reviews.overallRating})`,
          reviewCount: sql<number>`COUNT(*)`,
        })
        .from(reviews)
        .where(eq(reviews.listingId, listingId));

      const { avgRating, reviewCount } = stats[0];

      // Update the listing with calculated stats
      await db
        .update(listings)
        .set({
          avgRating: avgRating || 0,
          reviewCount: reviewCount || 0,
          updatedAt: sql`CURRENT_TIMESTAMP`,
        })
        .where(eq(listings.id, listingId));

    } catch (error) {
      console.error('Error updating listing stats:', error);
    }
  }

  // Update all listing stats
  static async updateAllListingStats(): Promise<void> {
    try {
      const allListings = await db.select({ id: listings.id }).from(listings);
      
      for (const listing of allListings) {
        await this.updateListingStats(listing.id);
      }
    } catch (error) {
      console.error('Error updating all listing stats:', error);
    }
  }

  // Delete a listing
  static async deleteListing(id: string): Promise<boolean> {
    try {
      const result = await db.delete(listings).where(eq(listings.id, id));
      return result.changes > 0;
    } catch (error) {
      console.error('Error deleting listing:', error);
      return false;
    }
  }

  // Get listings by channel
  static async getListingsByChannel(channel: string): Promise<ListingWithStats[]> {
    try {
      const result = await db
        .select({
          id: listings.id,
          title: listings.name,
          address: listings.address,
          channel: listings.channel,
          status: listings.status,
          avgRating: listings.avgRating,
          reviewCount: listings.reviewCount,
          createdAt: listings.createdAt,
        })
        .from(listings)
        .where(eq(listings.channel, channel))
        .orderBy(desc(listings.createdAt));

      return result;
    } catch (error) {
      console.error('Error fetching listings by channel:', error);
      return [];
    }
  }
}
