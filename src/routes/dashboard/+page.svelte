<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import FilamentKpiCard from '$lib/components/FilamentKpiCard.svelte';
  import FilamentTrendChart from '$lib/components/FilamentTrendChart.svelte';
  import FilamentChannelChart from '$lib/components/FilamentChannelChart.svelte';
  import FilamentTopListings from '$lib/components/FilamentTopListings.svelte';
  
  export let data: any;
  
  let stats = data.stats;
  let heatmapData: any[] = data.initialHeatmap || [];
  let anomalies: any[] = [];
  let channelTrends: any[] = [];
  let loading = false;
  let selectedTimeRange = '30d';
  let selectedAnalysisType = 'performance';
  
  // Enhanced data structures for trend analysis
  let trendInsights = {
    rating_decline: [],
    volume_spike: [],
    channel_issues: [],
    recurring_problems: []
  };
  
  async function refreshStats() {
    loading = true;
    try {
      // Fetch core stats
      const [statsRes, heatmapRes, anomaliesRes, channelRes] = await Promise.all([
        fetch('/api/reviews/stats'),
        fetch('/api/dashboard/heatmap'),
        fetch(`/api/trends/anomalies?dateFrom=${getDateRange(selectedTimeRange).from}&dateTo=${getDateRange(selectedTimeRange).to}`),
        fetch(`/api/trends/channels?dateFrom=${getDateRange(selectedTimeRange).from}&dateTo=${getDateRange(selectedTimeRange).to}&groupBy=week`)
      ]);
      
      const [newStats, newHeatmap, newAnomalies, newChannelTrends] = await Promise.all([
        statsRes.json(),
        heatmapRes.json(),
        anomaliesRes.json(),
        channelRes.json()
      ]);
      
      stats = newStats;
      heatmapData = newHeatmap.success ? newHeatmap.heatmapData : [];
      anomalies = newAnomalies.success ? newAnomalies.anomalies : [];
      channelTrends = newChannelTrends.success ? newChannelTrends.channelImpact : [];
      
      // Process insights for trend analysis
      processTrendInsights();
      
    } catch (e) {
      console.error('Failed to refresh dashboard data:', e);
    }
    loading = false;
  }
  
  function getDateRange(range: string) {
    const now = new Date();
    const to = now.toISOString().split('T')[0];
    let from: string;
    
    switch(range) {
      case '7d': from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; break;
      case '30d': from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; break;
      case '90d': from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; break;
      default: from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    }
    
    return { from, to };
  }
  
  function processTrendInsights() {
    // Analyze heatmap for performance issues
    const lowPerformers = heatmapData.filter(item => item.avgScore < 3.5);
    const highVolume = heatmapData.filter(item => item.reviewCount > 30);
    
    // Analyze anomalies for trends
    const ratingDeclines = anomalies.filter(a => a.type === 'rating_drop');
    const volumeSpikes = anomalies.filter(a => a.type === 'volume_spike');
    
    // Channel performance issues
    const channelProblems = channelTrends.filter(trend => 
      trend.avgRating < 4.0 || trend.reviewDecline > 10
    );
    
    trendInsights = {
      rating_decline: ratingDeclines,
      volume_spike: volumeSpikes,
      channel_issues: channelProblems,
      recurring_problems: lowPerformers
    };
  }
  
  onMount(() => {
    refreshStats();
    // Auto-refresh every 2 minutes for real-time insights
    const interval = setInterval(refreshStats, 120000);
    return () => clearInterval(interval);
  });
  
  // Enhanced reactive data transformations
  $: kpiData = {
    avgRating: stats?.kpis?.avgRating || 0,
    totalReviews: stats?.kpis?.totalReviews || 0,
    fiveStarRate: stats?.kpis?.fiveStarRate || 0,
    thirtyDayGrowth: stats?.kpis?.thirtyDayGrowth || 0
  };
  
  $: trendData = stats?.trend || [];
  $: channelData = stats?.channels || [];
  $: topListingsData = enhanceTopListingsData(stats?.topListings || []);
  
  // Enhance top listings with heatmap and trend data
  function enhanceTopListingsData(listings: any[]) {
    return listings.map(listing => {
      const heatmapEntry = heatmapData.find(h => h.propertyId == listing.id);
      const hasAnomalies = anomalies.some(a => a.propertyId == listing.id);
      
      return {
        ...listing,
        categoryScores: heatmapEntry?.categoryScores || {},
        avgScore: heatmapEntry?.avgScore || listing.avgRating,
        hasIssues: hasAnomalies,
        trendDirection: getTrendDirection(listing.id)
      };
    });
  }
  
  function getTrendDirection(listingId: any) {
    // Simple trend calculation based on recent anomalies
    const recentAnomalies = anomalies.filter(a => 
      a.propertyId == listingId && 
      new Date(a.detectedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    
    if (recentAnomalies.some(a => a.type === 'rating_improvement')) return 'up';
    if (recentAnomalies.some(a => a.type === 'rating_drop')) return 'down';
    return 'stable';
  }
</script>

<svelte:head><title>Dashboard - Flex Reviews</title></svelte:head>

<!-- Breadcrumbs -->
<div class="text-sm text-slate-500 mb-6">
  <span>Dashboard</span>
</div>

<!-- Header -->
<div class="flex items-center justify-between mb-8">
  <div>
    <h1 class="text-2xl font-bold text-slate-900">Management Dashboard</h1>
    <p class="text-slate-600 mt-1">Real-time insights, trends, and performance analytics</p>
  </div>
  <div class="flex items-center gap-3">
    <!-- Time Range Selector -->
    <select 
      bind:value={selectedTimeRange} 
      on:change={refreshStats}
      class="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm"
    >
      <option value="7d">Last 7 days</option>
      <option value="30d">Last 30 days</option>
      <option value="90d">Last 90 days</option>
    </select>
    
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

<!-- Alert Section for Critical Issues -->
{#if trendInsights.rating_decline.length > 0 || trendInsights.recurring_problems.length > 0}
<div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
  <div class="flex items-start">
    <div class="flex-shrink-0">
      <svg class="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
      </svg>
    </div>
    <div class="ml-3">
      <h3 class="text-sm font-medium text-red-800">Issues Detected</h3>
      <div class="mt-2 text-sm text-red-700">
        <ul class="list-disc list-inside space-y-1">
          {#each trendInsights.rating_decline.slice(0, 3) as decline}
            <li>Rating decline detected at {decline.propertyName} - {decline.severity}</li>
          {/each}
          {#each trendInsights.recurring_problems.slice(0, 2) as problem}
            <li>Low performance: {problem.propertyName} (Score: {problem.avgScore?.toFixed(1)})</li>
          {/each}
        </ul>
      </div>
    </div>
  </div>
</div>
{/if}

<!-- Enhanced KPI Cards -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
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
    label="Issues Detected" 
    value={anomalies.length.toString()} 
    delta={anomalies.filter(a => a.severity === 'high').length > 0 ? -1 : 1}
    icon="growth"
    {loading}
  />
  <FilamentKpiCard 
    label="Properties Monitored" 
    value={heatmapData.length.toString()} 
    icon="reviews"
    {loading}
  />
</div>

<!-- Performance Heatmap Section -->
<div class="bg-white shadow-card rounded-2xl border border-slate-100 mb-8 overflow-hidden">
  <div class="p-6 border-b border-slate-100">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-slate-900">Property Performance Heatmap</h3>
        <p class="text-sm text-slate-500 mt-1">Category-wise performance analysis across all properties</p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-slate-500">Score:</span>
        <div class="flex items-center gap-1">
          <div class="w-3 h-3 bg-red-500 rounded"></div>
          <span class="text-xs text-slate-600">Low</span>
          <div class="w-3 h-3 bg-yellow-500 rounded ml-2"></div>
          <span class="text-xs text-slate-600">Medium</span>
          <div class="w-3 h-3 bg-green-500 rounded ml-2"></div>
          <span class="text-xs text-slate-600">High</span>
        </div>
      </div>
    </div>
  </div>
  
  <div class="p-6">
    {#if loading}
      <div class="animate-pulse">
        <div class="grid grid-cols-6 gap-2">
          {#each Array(24) as _}
            <div class="h-12 bg-slate-200 rounded"></div>
          {/each}
        </div>
      </div>
    {:else if heatmapData.length > 0}
      <div class="overflow-x-auto">
        <div class="min-w-full">
          <!-- Headers -->
          <div class="grid grid-cols-7 gap-2 mb-2 text-xs font-medium text-slate-600">
            <div class="p-2">Property</div>
            <div class="p-2 text-center">Cleanliness</div>
            <div class="p-2 text-center">Location</div>
            <div class="p-2 text-center">Communication</div>
            <div class="p-2 text-center">Check-in</div>
            <div class="p-2 text-center">Value</div>
            <div class="p-2 text-center">Overall</div>
          </div>
          
          <!-- Heatmap Grid -->
          <div class="space-y-1">
            {#each heatmapData.slice(0, 8) as property}
              {@const avgScore = property.avgScore || 0}
              {@const overallClass = avgScore >= 4.5 ? 'bg-green-600' : avgScore >= 4.0 ? 'bg-yellow-600' : avgScore >= 3.5 ? 'bg-orange-600' : 'bg-red-600'}
              <div class="grid grid-cols-7 gap-2 text-sm">
                <div class="p-2 font-medium text-slate-900 truncate">{property.propertyName}</div>
                {#each ['Cleanliness', 'Location', 'Communication', 'Check-in', 'Value'] as category}
                  {@const score = property.categoryScores[category] || 0}
                  {@const colorClass = score >= 4.5 ? 'bg-green-500' : score >= 4.0 ? 'bg-yellow-500' : score >= 3.5 ? 'bg-orange-500' : 'bg-red-500'}
                  <div class="p-2 text-center">
                    <div class="w-full h-8 {colorClass} rounded flex items-center justify-center text-white text-xs font-medium">
                      {score.toFixed(1)}
                    </div>
                  </div>
                {/each}
                <div class="p-2 text-center">
                  <div class="w-full h-8 {overallClass} rounded flex items-center justify-center text-white text-sm font-bold">
                    {avgScore.toFixed(1)}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        </div>
      </div>
    {:else}
      <div class="text-center py-8 text-slate-500">
        <svg class="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        <p>No heatmap data available</p>
      </div>
    {/if}
  </div>
</div>

<!-- Charts Row -->
<div class="grid lg:grid-cols-2 gap-6 mb-8">
  <FilamentTrendChart data={trendData} {loading} />
  <FilamentChannelChart channels={channelData} {loading} />
</div>

<!-- Trend Analysis & Issue Detection -->
<div class="grid lg:grid-cols-3 gap-6 mb-8">
  <!-- Recent Anomalies -->
  <div class="bg-white shadow-card rounded-2xl border border-slate-100 overflow-hidden">
    <div class="p-6 border-b border-slate-100">
      <h3 class="text-lg font-semibold text-slate-900">Recent Anomalies</h3>
      <p class="text-sm text-slate-500 mt-1">Unusual patterns in review data</p>
    </div>
    <div class="p-6">
      {#if loading}
        <div class="animate-pulse space-y-3">
          {#each Array(3) as _}
            <div class="h-16 bg-slate-200 rounded"></div>
          {/each}
        </div>
      {:else if anomalies.length > 0}
        <div class="space-y-3">
          {#each anomalies.slice(0, 5) as anomaly}
            <div class="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
              <div class="flex-shrink-0">
                {#if anomaly.type === 'rating_drop'}
                  <div class="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                {:else if anomaly.type === 'volume_spike'}
                  <div class="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                {:else}
                  <div class="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                {/if}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-900 truncate">
                  {anomaly.propertyName || `Property ${anomaly.propertyId}`}
                </p>
                <p class="text-xs text-slate-500 mt-1">
                  {anomaly.type.replace('_', ' ').toUpperCase()} - {anomaly.severity}
                </p>
                <p class="text-xs text-slate-400 mt-1">
                  {new Date(anomaly.detectedAt || Date.now()).toLocaleDateString()}
                </p>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-6 text-slate-500">
          <svg class="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm">No anomalies detected</p>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Channel Performance -->
  <div class="bg-white shadow-card rounded-2xl border border-slate-100 overflow-hidden">
    <div class="p-6 border-b border-slate-100">
      <h3 class="text-lg font-semibold text-slate-900">Channel Insights</h3>
      <p class="text-sm text-slate-500 mt-1">Performance trends by platform</p>
    </div>
    <div class="p-6">
      {#if loading}
        <div class="animate-pulse space-y-3">
          {#each Array(3) as _}
            <div class="h-12 bg-slate-200 rounded"></div>
          {/each}
        </div>
      {:else if channelTrends.length > 0}
        <div class="space-y-4">
          {#each channelTrends.slice(0, 4) as trend}
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full" class:bg-red-500={trend.channel === 'Airbnb'} 
                     class:bg-blue-500={trend.channel === 'Booking.com'} 
                     class:bg-green-500={trend.channel === 'Google'}
                     class:bg-slate-400={!['Airbnb', 'Booking.com', 'Google'].includes(trend.channel)}></div>
                <span class="text-sm font-medium text-slate-900">{trend.channel}</span>
              </div>
              <div class="text-right">
                <div class="text-sm font-semibold text-slate-900">
                  {trend.avgRating?.toFixed(1) || 'N/A'}
                </div>
                <div class="text-xs text-slate-500">
                  {trend.totalReviews || 0} reviews
                </div>
              </div>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-6 text-slate-500">
          <p class="text-sm">No channel data available</p>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Recurring Issues -->
  <div class="bg-white shadow-card rounded-2xl border border-slate-100 overflow-hidden">
    <div class="p-6 border-b border-slate-100">
      <h3 class="text-lg font-semibold text-slate-900">Recurring Issues</h3>
      <p class="text-sm text-slate-500 mt-1">Properties needing attention</p>
    </div>
    <div class="p-6">
      {#if loading}
        <div class="animate-pulse space-y-3">
          {#each Array(3) as _}
            <div class="h-12 bg-slate-200 rounded"></div>
          {/each}
        </div>
      {:else if trendInsights.recurring_problems.length > 0}
        <div class="space-y-3">
          {#each trendInsights.recurring_problems.slice(0, 4) as problem}
            <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-slate-900 truncate">
                  {problem.propertyName}
                </p>
                <p class="text-xs text-red-600 mt-1">
                  Score: {problem.avgScore?.toFixed(1)} - {problem.reviewCount} reviews
                </p>
              </div>
              <button 
                on:click={() => goto(`/listings/${problem.propertyId}`)}
                class="text-xs text-red-700 hover:text-red-900 font-medium"
              >
                View →
              </button>
            </div>
          {/each}
        </div>
      {:else}
        <div class="text-center py-6 text-slate-500">
          <svg class="w-8 h-8 mx-auto mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-sm">No recurring issues detected</p>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Enhanced Top Listings with Trend Analysis -->
<div class="bg-white shadow-card rounded-2xl border border-slate-100 overflow-hidden">
  <div class="p-6 border-b border-slate-100">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-slate-900">Property Performance Overview</h3>
        <p class="text-sm text-slate-500 mt-1">Comprehensive performance analysis with trend indicators</p>
      </div>
      <button 
        on:click={() => goto('/listings')}
        class="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
      >
        Manage All Properties
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </div>
  
  <div class="overflow-x-auto">
    {#if loading}
      <div class="animate-pulse p-6">
        <div class="space-y-3">
          {#each Array(5) as _}
            <div class="h-16 bg-slate-200 rounded"></div>
          {/each}
        </div>
      </div>
    {:else if topListingsData.length > 0}
      <table class="min-w-full divide-y divide-slate-200">
        <thead class="bg-slate-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Property</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Rating</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Reviews</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Channel</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Performance</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Trend</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Action</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-slate-200">
          {#each topListingsData.slice(0, 10) as listing, index}
            {@const score = listing.avgScore || listing.avgRating || 0}
            <tr class="hover:bg-slate-50 cursor-pointer" on:click={() => goto(`/listings/${listing.id}`)}>
              <!-- Property Name with Rank -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                                {index < 3 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-white' : 'bg-slate-100 text-slate-600'}">
                      {index + 1}
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-slate-900 max-w-xs truncate">
                      {listing.title || listing.name}
                    </div>
                    {#if listing.hasIssues}
                      <div class="text-xs text-red-600 font-medium">⚠️ Has Issues</div>
                    {/if}
                  </div>
                </div>
              </td>
              
              <!-- Rating -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="text-sm font-semibold text-slate-900">
                    {score.toFixed(1)}
                  </div>
                  <svg class="w-4 h-4 text-yellow-400 ml-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                </div>
              </td>
              
              <!-- Review Count -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                {(listing.reviewCount || 0).toLocaleString()}
              </td>
              
              <!-- Channel -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                           {listing.channel === 'Airbnb' ? 'bg-red-50 text-red-700' : 
                            listing.channel === 'Booking.com' ? 'bg-blue-50 text-blue-700' : 
                            listing.channel === 'Google' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-700'}">
                  {listing.channel}
                </span>
              </td>
              
              <!-- Performance Score -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div class="h-full transition-all duration-300
                               {score >= 4.5 ? 'bg-green-500' : score >= 4.0 ? 'bg-yellow-500' : score >= 3.5 ? 'bg-orange-500' : 'bg-red-500'}" 
                         style="width: {(score / 5) * 100}%"></div>
                  </div>
                  <span class="ml-2 text-xs text-slate-600">{score.toFixed(1)}/5.0</span>
                </div>
              </td>
              
              <!-- Trend Direction -->
              <td class="px-6 py-4 whitespace-nowrap">
                {#if listing.trendDirection === 'up'}
                  <div class="flex items-center text-green-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/>
                    </svg>
                    <span class="text-xs ml-1">Improving</span>
                  </div>
                {:else if listing.trendDirection === 'down'}
                  <div class="flex items-center text-red-600">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 13l-5 5m0 0l-5-5m5 5V6"/>
                    </svg>
                    <span class="text-xs ml-1">Declining</span>
                  </div>
                {:else}
                  <div class="flex items-center text-slate-500">
                    <div class="w-4 h-0.5 bg-slate-400"></div>
                    <span class="text-xs ml-1">Stable</span>
                  </div>
                {/if}
              </td>
              
              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                {#if listing.hasIssues}
                  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-50 text-red-700">
                    Needs Attention
                  </span>
                {:else if (listing.avgScore || listing.avgRating || 0) >= 4.5}
                  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-700">
                    Excellent
                  </span>
                {:else if (listing.avgScore || listing.avgRating || 0) >= 4.0}
                  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-700">
                    Good
                  </span>
                {:else}
                  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-orange-50 text-orange-700">
                    Monitoring
                  </span>
                {/if}
              </td>
              
              <!-- Action -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  on:click|stopPropagation={() => goto(`/listings/${listing.id}`)}
                  class="text-brand-600 hover:text-brand-900 font-medium"
                >
                  View Details
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    {:else}
      <div class="text-center py-12 text-slate-500">
        <svg class="w-12 h-12 mx-auto mb-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
        </svg>
        <p>No property data available</p>
        <button 
          on:click={() => goto('/listings')}
          class="mt-2 text-brand-600 hover:text-brand-700 font-medium text-sm"
        >
          Add Properties →
        </button>
      </div>
    {/if}
  </div>
</div>
