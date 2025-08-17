import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  try {
    const res = await fetch('/api/reviews/stats');
    const stats = await res.json();
    return { stats };
  } catch {
    return { stats: { kpis: {}, channels: [], trend: [], categories: [], topListings: [] } };
  }
};
