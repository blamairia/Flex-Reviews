import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { reviews, listings } from '$lib/db/schema';
import { parseCategories, computeRatingWithFallback } from '$lib/services/reviews';

function parseDateBoundary(s?: string, isEnd?: boolean): string | undefined {
  if (!s) return undefined;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return isEnd ? new Date(s + 'T23:59:59Z').toISOString() : new Date(s + 'T00:00:00Z').toISOString();
  }
  return new Date(s).toISOString();
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const listingId = url.searchParams.get('listingId') || undefined;
    const from = parseDateBoundary(url.searchParams.get('from') || undefined);
    const to = parseDateBoundary(url.searchParams.get('to') || undefined, true);
    
    // @ts-ignore
    let allReviews = db.select().from(reviews).all();
    
    // Filter by params
    if (listingId) allReviews = allReviews.filter((r: any) => r.listing_id === listingId);
    if (from) allReviews = allReviews.filter((r: any) => r.submitted_at >= from);
    if (to) allReviews = allReviews.filter((r: any) => r.submitted_at <= to);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    // Compute KPIs
    let totalRating = 0;
    let ratingCount = 0;
    let fiveStarCount = 0;
    let last30Sum = 0, last30Count = 0;
    let prev30Sum = 0, prev30Count = 0;
    
    const channels: Record<string, number> = {};
    const categoryTotals: Record<string, { sum: number; count: number }> = {};
    const weeklyBuckets: Record<string, { sum: number; count: number }> = {};
    const listingStats: Record<string, { sum: number; count: number; name: string }> = {};
    
    for (const r of allReviews as any[]) {
      const rating = computeRatingWithFallback(r);
      const submittedDate = new Date(r.submitted_at);
      
      // Overall stats
      if (rating != null) {
        totalRating += rating;
        ratingCount++;
        if (rating >= 9.0) fiveStarCount++;
        
        // Last 30 days delta
        if (submittedDate >= thirtyDaysAgo) {
          last30Sum += rating;
          last30Count++;
        } else if (submittedDate >= sixtyDaysAgo) {
          prev30Sum += rating;
          prev30Count++;
        }
      }
      
      // Channel mix
      channels[r.channel] = (channels[r.channel] || 0) + 1;
      
      // Categories
      const cats = parseCategories(r.categories_json);
      for (const cat of cats) {
        if (!categoryTotals[cat.key]) categoryTotals[cat.key] = { sum: 0, count: 0 };
        categoryTotals[cat.key].sum += cat.rating;
        categoryTotals[cat.key].count++;
      }
      
      // Weekly trend
      const week = getWeekBucket(submittedDate);
      if (!weeklyBuckets[week]) weeklyBuckets[week] = { sum: 0, count: 0 };
      if (rating != null) {
        weeklyBuckets[week].sum += rating;
        weeklyBuckets[week].count++;
      }
      
      // Top listings (only if not scoped to one listing)
      if (!listingId) {
        const lid = r.listing_id;
        if (!listingStats[lid]) listingStats[lid] = { sum: 0, count: 0, name: r.listing_name };
        if (rating != null) {
          listingStats[lid].sum += rating;
          listingStats[lid].count++;
        }
      }
    }
    
    const avgRating = ratingCount ? Math.round((totalRating / ratingCount) * 10) / 10 : null;
    const fiveStarPct = ratingCount ? Math.round((fiveStarCount / ratingCount) * 100) / 100 : 0;
    const last30Avg = last30Count ? last30Sum / last30Count : null;
    const prev30Avg = prev30Count ? prev30Sum / prev30Count : null;
    const last30dDelta = (last30Avg != null && prev30Avg != null) ? Math.round((last30Avg - prev30Avg) * 100) / 100 : 0;
    
    const kpis = {
      avgRating,
      reviewCount: allReviews.length,
      fiveStarPct,
      last30dDelta
    };
    
    const channelsArray = Object.entries(channels).map(([channel, count]) => ({ channel, count }));
    
    const trend = Object.entries(weeklyBuckets)
      .map(([bucket, data]) => ({ bucket, avg: data.count ? Math.round((data.sum / data.count) * 10) / 10 : 0 }))
      .sort((a, b) => a.bucket.localeCompare(b.bucket));
    
    const categoriesArray = Object.entries(categoryTotals)
      .map(([key, data]) => ({ key, avg: data.count ? Math.round((data.sum / data.count) * 10) / 10 : 0 }));
    
    const topListings = listingId ? undefined : Object.entries(listingStats)
      .map(([listingId, data]) => ({
        listingId,
        name: data.name,
        avg: data.count ? Math.round((data.sum / data.count) * 10) / 10 : 0,
        count: data.count
      }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
    
    const result: any = { kpis, channels: channelsArray, trend, categories: categoriesArray };
    if (topListings) result.topListings = topListings;
    
    return new Response(JSON.stringify(result), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message }), { status: 500 });
  }
};

function getWeekBucket(date: Date): string {
  const year = date.getFullYear();
  const week = getWeekNumber(date);
  return `${year}-${week.toString().padStart(2, '0')}`;
}

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
