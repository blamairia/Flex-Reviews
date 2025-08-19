import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ fetch }) => {
  try {
    // Load core dashboard data in parallel
    const [statsRes, heatmapRes] = await Promise.all([
      fetch('/api/reviews/stats'),
      fetch('/api/dashboard/heatmap')
    ]);
    
    const [stats, heatmapData] = await Promise.all([
      statsRes.json(),
      heatmapRes.json()
    ]);
    
    return { 
      stats,
      initialHeatmap: heatmapData.success ? heatmapData.heatmapData : []
    };
  } catch (error) {
    console.error('Dashboard load error:', error);
    return { 
      stats: { kpis: {}, channels: [], trend: [], categories: [], topListings: [] },
      initialHeatmap: []
    };
  }
};
