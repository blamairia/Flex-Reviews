import type { RequestHandler } from '@sveltejs/kit';
import { db, sqlite } from '$lib/db/drizzle';
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
      
      // Update review
      const info = sqlite.prepare('UPDATE reviews SET selected_for_web = ?, note = ? WHERE id = ?').run(selected ? 1 : 0, note, reviewId);
      totalChanges += info.changes;
      
      // Write audit
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      const action = selected ? 'select' : 'unselect';
      const payloadJson = note ? JSON.stringify({ note }) : null;
    
      sqlite.prepare(`
        INSERT INTO audits (id, actor, action, entity_type, entity_id, payload_json, created_at) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        auditId, 'admin@demo', action, 'review', reviewId, payloadJson, Date.now()
      );
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