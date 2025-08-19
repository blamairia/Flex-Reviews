import type { ServerLoad } from '@sveltejs/kit';

export const load: ServerLoad = async ({ fetch }) => {
  try {
    // Load core dashboard data in parallel - no date filters to get ALL data
    const [statsRes, heatmapRes] = await Promise.all([
      fetch('/api/reviews/stats'), // No date parameters = all data
      fetch('/api/dashboard/heatmap') // No date parameters = all data
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
