<script lang="ts">
  import { goto } from '$app/navigation';
  
  export let topListings: Array<{
    id: number;
    title: string;
    avgRating?: number;
    reviewCount?: number;
    channel: string;
  }> = [];
  export let loading = false;
  
  function handleRowClick(listingId: number) {
    goto(`/listings/${listingId}`);
  }
  
  function getChannelBadge(channel: string) {
    const baseClass = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    
    switch(channel) {
      case 'Airbnb': return `${baseClass} bg-red-50 text-red-700`;
      case 'Booking.com': return `${baseClass} bg-blue-50 text-blue-700`;
      case 'Google': return `${baseClass} bg-blue-50 text-blue-600`;
      default: return `${baseClass} bg-slate-100 text-slate-700`;
    }
  }
  
  function getRankBadge(index: number) {
    const rank = index + 1;
    if (rank === 1) return "bg-gradient-to-r from-yellow-400 to-yellow-500 text-white";
    if (rank === 2) return "bg-gradient-to-r from-gray-300 to-gray-400 text-white";
    if (rank === 3) return "bg-gradient-to-r from-orange-400 to-orange-500 text-white";
    return "bg-slate-100 text-slate-700";
  }
</script>

<div class="bg-white shadow-card rounded-2xl border border-slate-100 overflow-hidden">
  <div class="p-6 border-b border-slate-100">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-lg font-semibold text-slate-900">Top Performing Listings</h3>
        <p class="text-sm text-slate-500 mt-1">Highest rated properties with most reviews</p>
      </div>
      <button 
        on:click={() => goto('/listings')}
        class="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 font-medium transition-colors"
      >
        View all
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  </div>
  
  {#if loading}
    <div class="p-6">
      <div class="animate-pulse space-y-4">
        {#each Array(5) as _}
          <div class="flex items-center gap-4">
            <div class="w-8 h-8 bg-slate-200 rounded-full"></div>
            <div class="flex-1">
              <div class="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div class="h-3 bg-slate-200 rounded w-1/2"></div>
            </div>
            <div class="w-16 h-6 bg-slate-200 rounded"></div>
          </div>
        {/each}
      </div>
    </div>
  {:else if topListings.length === 0}
    <div class="p-12 text-center text-slate-500">
      <div class="text-lg mb-2">🏠</div>
      <div class="text-sm">No listings data available</div>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full">
        <thead class="bg-slate-50 border-b border-slate-200">
          <tr class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
            <th class="px-6 py-3">Rank</th>
            <th class="px-6 py-3">Property</th>
            <th class="px-6 py-3">Rating</th>
            <th class="px-6 py-3">Reviews</th>
            <th class="px-6 py-3">Channel</th>
            <th class="px-6 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-200">
          {#each topListings as listing, index}
            <tr 
              class="hover:bg-slate-50 cursor-pointer transition-colors group"
              on:click={() => handleRowClick(listing.id)}
              role="button"
              tabindex="0"
              on:keydown={(e) => e.key === 'Enter' && handleRowClick(listing.id)}
            >
              <td class="px-6 py-4">
                <div class="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold {getRankBadge(index)}">
                  {index + 1}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="font-medium text-slate-900 group-hover:text-brand-600 transition-colors">
                  {listing.title}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1">
                  <svg class="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                  <span class="text-sm font-medium text-slate-900">
                    {(listing.avgRating || 0).toFixed(1)}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-1 text-sm text-slate-600">
                  <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                  </svg>
                  {listing.reviewCount || 0}
                </div>
              </td>
              <td class="px-6 py-4">
                <span class={getChannelBadge(listing.channel)}>
                  {listing.channel}
                </span>
              </td>
              <td class="px-6 py-4">
                <svg class="w-4 h-4 text-slate-400 group-hover:text-brand-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>
