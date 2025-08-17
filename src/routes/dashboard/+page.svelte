<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import FilamentKpiCard from '$lib/components/FilamentKpiCard.svelte';
  import FilamentTrendChart from '$lib/components/FilamentTrendChart.svelte';
  import FilamentChannelChart from '$lib/components/FilamentChannelChart.svelte';
  import FilamentTopListings from '$lib/components/FilamentTopListings.svelte';
  
  export let data: any;
  
  let stats = data.stats;
  let loading = false;
  
  async function refreshStats() {
    loading = true;
    try {
      const res = await fetch('/api/reviews/stats');
      const newStats = await res.json();
      stats = newStats;
    } catch (e) {
      console.error('Failed to refresh stats:', e);
    }
    loading = false;
  }
  
  onMount(() => {
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  });
  
  // Transform stats data for components
  $: kpiData = {
    avgRating: stats?.kpis?.avgRating || 0,
    totalReviews: stats?.kpis?.totalReviews || 0,
    fiveStarRate: stats?.kpis?.fiveStarRate || 0,
    thirtyDayGrowth: stats?.kpis?.thirtyDayGrowth || 0
  };
  
  $: trendData = stats?.trend || [];
  $: channelData = stats?.channels || [];
  $: topListingsData = stats?.topListings || [];
</script>

<svelte:head><title>Dashboard - Flex Reviews</title></svelte:head>

<!-- Breadcrumbs -->
<div class="text-sm text-slate-500 mb-6">
  <span>Dashboard</span>
</div>

<!-- Header -->
<div class="flex items-center justify-between mb-8">
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
    <p class="text-slate-600 mt-1">Overview of your review performance and insights</p>
  </div>
  <div class="flex items-center gap-3">
    <button 
      class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors shadow-sm"
      on:click={refreshStats} 
      disabled={loading}
    >
      <svg class="w-4 h-4 {loading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0V9a8 8 0 1115.356 2m-15.356-2L4 12"/>
      </svg>
      {loading ? 'Refreshing...' : 'Refresh'}
    </button>
    <button 
      class="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors shadow-sm font-medium"
      on:click={() => goto('/reviews')}
    >
      View Reviews
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
      </svg>
    </button>
  </div>
</div>

<!-- KPI Cards -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  <FilamentKpiCard 
    label="Average Rating" 
    value={kpiData.avgRating.toFixed(1)} 
    delta={kpiData.thirtyDayGrowth}
    icon="rating"
    {loading}
  />
  <FilamentKpiCard 
    label="Total Reviews" 
    value={kpiData.totalReviews.toLocaleString()} 
    icon="reviews"
    {loading}
  />
  <FilamentKpiCard 
    label="5-Star Rate" 
    value="{kpiData.fiveStarRate.toFixed(1)}%" 
    icon="stars"
    {loading}
  />
  <FilamentKpiCard 
    label="30-Day Growth" 
    value="{Math.abs(kpiData.thirtyDayGrowth).toFixed(1)}%" 
    delta={kpiData.thirtyDayGrowth}
    icon="growth"
    {loading}
  />
</div>

<!-- Charts Row -->
<div class="grid lg:grid-cols-2 gap-6 mb-8">
  <FilamentTrendChart data={trendData} {loading} />
  <FilamentChannelChart channels={channelData} {loading} />
</div>

<!-- Top Listings -->
<FilamentTopListings topListings={topListingsData} {loading} />
