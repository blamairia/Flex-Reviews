import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { audits } from '$lib/db/schema';

export const GET: RequestHandler = async ({ url }) => {
  try {
    const limit = Math.min(100, Number(url.searchParams.get('limit') || '10'));
    // @ts-ignore
    const rows = db.select().from(audits).orderBy('created_at DESC').limit(limit).all();
    
    const auditsList = rows.map((row: any) => ({
      id: row.id,
      actor: row.actor,
      action: row.action,
      entityType: row.entity_type || row.entityType,
      entityId: row.entity_id || row.entityId,
      createdAt: row.created_at || row.createdAt
    }));
    
    return new Response(JSON.stringify({ audits: auditsList }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message }), { status: 500 });
  }
};
