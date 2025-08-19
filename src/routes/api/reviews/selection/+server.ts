import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db/drizzle';
import { reviews, audits } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const reviewIds = (body as any).reviewIds || [(body as any).reviewId];
    const selected = Boolean((body as any).selected ?? (body as any).selectedForWeb);
    const note = (body as any).note ?? null;
    
    let totalChanges = 0;

    for (const reviewId of reviewIds) {
      if (!reviewId) continue;

      // Update review (works with both better-sqlite3 and libsql drivers)
      const updateResult: any = await (db
        .update(reviews)
        .set({ selectedForWeb: selected ? 1 : 0, note })
        .where(eq(reviews.id, reviewId)) as any).run?.() ?? {};

      if (typeof updateResult.changes === 'number') {
        totalChanges += updateResult.changes;
      } else {
        totalChanges += 1; // assume one row updated
      }

      // Write audit
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const action = selected ? 'select' : 'unselect';
      const payloadJson = note ? JSON.stringify({ note }) : null;

      await (db
        .insert(audits)
        .values({
          id: auditId,
          actor: 'admin@demo',
          action,
          entityType: 'review',
          entityId: reviewId,
          payloadJson,
          createdAt: Date.now()
        }) as any).run?.();
    }
    
    return new Response(JSON.stringify({ 
      ok: true, 
      reviewIds, 
      selectedForWeb: selected, 
      changes: totalChanges 
    }), {
      headers: { 'content-type': 'application/json' }
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: e?.message || String(e) }), { status: 500 });
  }
};