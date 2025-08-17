<script lang="ts">
  import { goto } from '$app/navigation';
  export let data: any;
  import KpiCards from '$lib/components/KpiCards.svelte';
  import TrendLineChart from '$lib/components/TrendLineChart.svelte';
  import ChannelPie from '$lib/components/ChannelPie.svelte';
  import ReviewsTable from '$lib/components/ReviewsTable.svelte';
</script>

<svelte:head><title>{data.listing.name}</title></svelte:head>

<div class="container mx-auto p-6 space-y-6">
  <!-- Navigation Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <button 
        class="text-blue-600 hover:text-blue-800 font-medium"
        on:click={() => goto('/dashboard')}
      >
        ← Back to Dashboard
      </button>
      <div class="text-gray-300">|</div>
      <div>
        <h1 class="text-3xl font-bold text-gray-900">{data.listing.name}</h1>
        <div class="text-gray-600">Listing ID: {data.listing.id}</div>
      </div>
    </div>
    <div class="flex gap-3">
      <button 
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        on:click={() => goto('/reviews')}
      >
        Manage Reviews
      </button>
      <a href="/preview/{data.listing.slug}?key=DEMO_KEY" 
         class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
        Preview Public Page
      </a>
    </div>
  </div>
  
  <KpiCards kpis={data.stats.kpis} />
  
  <div class="grid md:grid-cols-2 gap-6">
    <div class="p-4 border rounded bg-white">
      <h2 class="text-lg font-semibold mb-4">Trend</h2>
      <TrendLineChart trend={data.stats.trend} />
    </div>
    
    <div class="p-4 border rounded bg-white">
      <h2 class="text-lg font-semibold mb-4">Channels</h2>
      <ChannelPie channels={data.stats.channels} />
    </div>
  </div>
  
  {#if data.stats.categories?.length > 0}
    <div class="p-4 border rounded bg-white">
      <h2 class="text-lg font-semibold mb-4">Category Breakdown</h2>
      <div class="grid md:grid-cols-3 gap-4">
        {#each data.stats.categories as cat}
          <div class="text-center p-3 bg-gray-50 rounded">
            <div class="text-sm text-gray-600 capitalize">{cat.key}</div>
            <div class="text-xl font-bold">{cat.avg}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  
  <div class="p-4 border rounded bg-white">
    <h2 class="text-lg font-semibold mb-4">Reviews ({data.reviews.meta.total})</h2>
    <ReviewsTable data={data.reviews} />
  </div>
</div>
