<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  export let data: any;
  
  let listings = data.listings || [];
  let loading = false;
  let searchQuery = '';
  let sortBy = 'avgRating';
  let sortOrder = 'desc';
  let filterChannel = 'all';
  
  // Reactive filtered and sorted listings
  $: filteredListings = listings
    .filter(listing => {
      const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesChannel = filterChannel === 'all' || listing.channel === filterChannel;
      return matchesSearch && matchesChannel;
    })
    .sort((a, b) => {
      const aValue = a[sortBy] || 0;
      const bValue = b[sortBy] || 0;
      return sortOrder === 'desc' ? bValue - aValue : aValue - bValue;
    });
  
  function handleListingClick(listingId: number) {
    goto(`/listings/${listingId}`);
  }
  
  function getChannelBadge(channel: string) {
    const baseClass = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    
    switch(channel) {
      case 'Airbnb': return `${baseClass} bg-red-50 text-red-700`;
      case 'Booking.com': return `${baseClass} bg-blue-50 text-blue-700`;
      case 'Google': return `${baseClass} bg-green-50 text-green-700`;
      default: return `${baseClass} bg-slate-100 text-slate-700`;
    }
  }
  
  function getStatusBadge(status: string) {
    const baseClass = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    
    switch(status) {
      case 'active': return `${baseClass} bg-emerald-50 text-emerald-700`;
      case 'inactive': return `${baseClass} bg-red-50 text-red-700`;
      case 'pending': return `${baseClass} bg-yellow-50 text-yellow-700`;
      default: return `${baseClass} bg-slate-100 text-slate-700`;
    }
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  async function refreshListings() {
    loading = true;
    try {
      const res = await fetch('/api/listings');
      const newData = await res.json();
      listings = newData.listings || [];
    } catch (e) {
      console.error('Failed to refresh listings:', e);
    }
    loading = false;
  }
  
  onMount(() => {
    // Auto-refresh every 60 seconds
    const interval = setInterval(refreshListings, 60000);
    return () => clearInterval(interval);
  });
</script>

<svelte:head>
  <title>Listings - Reviews Dashboard</title>
</svelte:head>

<div class="space-y-6">
  <!-- Page Header -->
  <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
    <div>
      <h1 class="text-2xl font-bold text-slate-900">Property Listings</h1>
      <p class="text-slate-600 mt-1">Manage and monitor all your rental properties</p>
    </div>
    <div class="flex items-center gap-3">
      <button 
        on:click={refreshListings}
        disabled={loading}
        class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        <svg class="w-4 h-4 {loading ? 'animate-spin' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
        </svg>
        Refresh
      </button>
      <button 
        on:click={() => goto('/listings/new')}
        class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl text-sm font-medium hover:from-brand-600 hover:to-brand-700 transition-colors shadow-sm"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Add Listing
      </button>
    </div>
  </div>

  <!-- Filters and Search -->
  <div class="bg-white shadow-card rounded-2xl border border-slate-100 p-6">
    <div class="flex flex-col sm:flex-row gap-4">
      <!-- Search -->
      <div class="flex-1">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search listings..."
            bind:value={searchQuery}
            class="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
      </div>
      
      <!-- Channel Filter -->
      <select 
        bind:value={filterChannel}
        class="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      >
        <option value="all">All Channels</option>
        <option value="Airbnb">Airbnb</option>
        <option value="Booking.com">Booking.com</option>
        <option value="Google">Google</option>
      </select>
      
      <!-- Sort By -->
      <select 
        bind:value={sortBy}
        class="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      >
        <option value="avgRating">Rating</option>
        <option value="reviewCount">Reviews</option>
        <option value="title">Name</option>
        <option value="createdAt">Date Added</option>
      </select>
      
      <!-- Sort Order -->
      <button
        on:click={() => sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'}
        class="px-3 py-2.5 border border-slate-200 rounded-xl text-sm hover:bg-slate-50 transition-colors"
        title="Toggle sort order"
        aria-label="Toggle sort order"
      >
        <svg class="w-4 h-4 {sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div class="bg-white shadow-card rounded-2xl border border-slate-100 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600">Total Listings</p>
          <p class="text-2xl font-bold text-slate-900 mt-1">{listings.length}</p>
        </div>
        <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
        </div>
      </div>
    </div>
    
    <div class="bg-white shadow-card rounded-2xl border border-slate-100 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600">Active Listings</p>
          <p class="text-2xl font-bold text-slate-900 mt-1">{listings.filter(l => l.status === 'active').length}</p>
        </div>
        <div class="w-12 h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      </div>
    </div>
    
    <div class="bg-white shadow-card rounded-2xl border border-slate-100 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600">Avg Rating</p>
          <p class="text-2xl font-bold text-slate-900 mt-1">
            {listings.length > 0 ? (listings.reduce((sum, l) => sum + (l.avgRating || 0), 0) / listings.length).toFixed(1) : '0.0'}
          </p>
        </div>
        <div class="w-12 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
          </svg>
        </div>
      </div>
    </div>
    
    <div class="bg-white shadow-card rounded-2xl border border-slate-100 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600">Total Reviews</p>
          <p class="text-2xl font-bold text-slate-900 mt-1">
            {listings.reduce((sum, l) => sum + (l.reviewCount || 0), 0).toLocaleString()}
          </p>
        </div>
        <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
      </div>
    </div>
  </div>

  <!-- Listings Table -->
  <div class="bg-white shadow-card rounded-2xl border border-slate-100 overflow-hidden">
    <div class="p-6 border-b border-slate-100">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Property Listings</h3>
          <p class="text-sm text-slate-500 mt-1">
            {filteredListings.length} of {listings.length} properties
          </p>
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-600">
          <span>Showing {filteredListings.length} results</span>
        </div>
      </div>
    </div>

    {#if loading}
      <div class="p-12 text-center">
        <div class="inline-flex items-center gap-2 text-slate-500">
          <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Loading listings...
        </div>
      </div>
    {:else if filteredListings.length === 0}
      <div class="p-12 text-center">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-slate-900 mb-2">No listings found</h3>
        <p class="text-slate-500 mb-6">
          {searchQuery || filterChannel !== 'all' ? 'Try adjusting your search or filters' : 'Get started by adding your first property listing'}
        </p>
        {#if !searchQuery && filterChannel === 'all'}
          <button 
            on:click={() => goto('/listings/new')}
            class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl text-sm font-medium hover:from-brand-600 hover:to-brand-700 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Your First Listing
          </button>
        {/if}
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50/50">
            <tr class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <th class="px-6 py-4">Property</th>
              <th class="px-6 py-4">Channel</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Rating</th>
              <th class="px-6 py-4">Reviews</th>
              <th class="px-6 py-4">Added</th>
              <th class="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            {#each filteredListings as listing}
              <tr 
                class="hover:bg-slate-50 cursor-pointer transition-colors group"
                on:click={() => handleListingClick(listing.id)}
                role="button"
                tabindex="0"
                on:keydown={(e) => e.key === 'Enter' && handleListingClick(listing.id)}
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center">
                      <svg class="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                      </svg>
                    </div>
                    <div>
                      <div class="font-medium text-slate-900 group-hover:text-brand-600 transition-colors">
                        {listing.title}
                      </div>
                      {#if listing.address}
                        <div class="text-sm text-slate-500">{listing.address}</div>
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class={getChannelBadge(listing.channel)}>
                    {listing.channel}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class={getStatusBadge(listing.status || 'active')}>
                    {listing.status || 'active'}
                  </span>
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
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    {(listing.reviewCount || 0).toLocaleString()}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-slate-600">
                    {listing.createdAt ? formatDate(listing.createdAt) : 'Unknown'}
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
</div>
