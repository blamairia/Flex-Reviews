import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { audits } from '$lib/db/schema';
import { desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const recentAudits = await db
      .select({
        id: audits.id,
        actor: audits.actor,
        action: audits.action,
        entityType: audits.entityType,
        entityId: audits.entityId,
        payloadJson: audits.payloadJson,
        createdAt: audits.createdAt
      })
      .from(audits)
      .orderBy(desc(audits.createdAt))
      .limit(Math.min(limit, 50));
    
    return json({
      audits: recentAudits
    });
  } catch (error) {
    return json({ 
      error: 'Failed to fetch audits',
      audits: []
    }, { status: 500 });
  }
};
