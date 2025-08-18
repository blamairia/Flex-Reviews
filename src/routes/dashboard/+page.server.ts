import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ fetch }) => {
  try {
    const res = await fetch('/api/reviews/stats');
    const stats = await res.json();
    return { stats };
  } catch {
    return { stats: { kpis: {}, channels: [], trend: [], categories: [], topListings: [] } };
  }
};
