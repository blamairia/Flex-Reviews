<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  interface Property {
    id: string;
    slug: string;
    name: string;
    address: string;
    avgRating: number;
    reviewCount: number;
    channel: string;
    photo: string;
    status: string;
    // Enhanced properties from Hostaway integration
    city?: string;
    country?: string;
    price?: number;
    personCapacity?: number;
    bedroomsNumber?: number;
    bathroomsNumber?: number;
    description?: string;
    amenitiesCount?: number;
    imagesCount?: number;
    createdAt?: string;
  }

  interface PropertyResponse {
    status: string;
    result: {
      properties: Property[];
      pagination: {
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
      };
      sources: {
        local: number;
        hostaway: number;
      };
    };
  }

  let properties: Property[] = [];
  let filteredProperties: Property[] = [];
  let loading = true;
  let error: string | null = null;
  let sources = { local: 0, hostaway: 0 };
  
  // Filters
  let searchQuery = '';
  let filterChannel = 'all';
  let filterBedrooms = 'all';
  let filterPriceRange = 'all';
  let filterCity = 'all';
  
  // Sorting
  let sortBy = 'avgRating';
  let sortOrder: 'asc' | 'desc' = 'desc';

  // Derived data for filter options
  $: cities = [...new Set(properties.map(p => p.city || p.address.split(',')[0]).filter(Boolean))].sort();
  $: channels = [...new Set(properties.map(p => p.channel))].sort();
  $: bedroomOptions = [...new Set(properties.map(p => p.bedroomsNumber).filter(b => b !== undefined))].sort((a, b) => (a || 0) - (b || 0));

  // Load properties on mount
  onMount(() => {
    loadProperties();
  });

  // Reactive filtering and sorting
  $: {
    let filtered = properties.filter(property => {
      const matchesSearch = !searchQuery || 
        property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (property.description && property.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesChannel = filterChannel === 'all' || property.channel === filterChannel;
      
      const matchesBedrooms = filterBedrooms === 'all' || 
        (property.bedroomsNumber !== undefined && property.bedroomsNumber.toString() === filterBedrooms);
      
      const matchesCity = filterCity === 'all' || 
        (property.city && property.city === filterCity) ||
        property.address.toLowerCase().includes(filterCity.toLowerCase());
      
      const matchesPriceRange = filterPriceRange === 'all' || (() => {
        const price = property.price || 0;
        switch (filterPriceRange) {
          case 'budget': return price < 100;
          case 'mid': return price >= 100 && price < 200;
          case 'luxury': return price >= 200;
          default: return true;
        }
      })();
      
      return matchesSearch && matchesChannel && matchesBedrooms && matchesCity && matchesPriceRange;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aVal: any = a[sortBy as keyof Property];
      let bVal: any = b[sortBy as keyof Property];
      
      // Handle undefined values
      if (aVal === undefined) aVal = 0;
      if (bVal === undefined) bVal = 0;
      
      // For string comparison
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
      }
      
      // For number comparison
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

    filteredProperties = filtered;
  }

  async function loadProperties() {
    try {
      loading = true;
      error = null;
      
      // Include Hostaway data to get comprehensive property information
      const response = await fetch('/api/properties?includeHostaway=true&limit=100');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data: PropertyResponse = await response.json();
      
      if (data.status === 'ok') {
        properties = data.result.properties || [];
        sources = data.result.sources || { local: 0, hostaway: 0 };
      } else {
        throw new Error(data.message || 'Failed to load properties');
      }
    } catch (err) {
      console.error('Failed to load properties:', err);
      error = err instanceof Error ? err.message : 'Unknown error occurred';
      properties = [];
    } finally {
      loading = false;
    }
  }

  function handleListingClick(propertyId: string) {
    goto(`/listings/${propertyId}`);
  }
  
  function getChannelBadge(channel: string) {
    const baseClass = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    
    switch(channel.toLowerCase()) {
      case 'airbnb': return `${baseClass} bg-red-50 text-red-700`;
      case 'booking': 
      case 'booking.com': return `${baseClass} bg-blue-50 text-blue-700`;
      case 'vrbo': return `${baseClass} bg-orange-50 text-orange-700`;
      case 'google': return `${baseClass} bg-green-50 text-green-700`;
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

  function formatPrice(price: number) {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  }

  async function refreshListings() {
    await loadProperties();
  }
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

  <!-- Enhanced Filters and Search -->
  <div class="bg-white shadow-card rounded-2xl border border-slate-100 p-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      <!-- Search -->
      <div class="lg:col-span-2">
        <div class="relative">
          <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input
            type="text"
            placeholder="Search properties by name, location, description..."
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
        {#each channels as channel}
          <option value={channel}>{channel.charAt(0).toUpperCase() + channel.slice(1)}</option>
        {/each}
      </select>

      <!-- City Filter -->
      <select 
        bind:value={filterCity}
        class="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      >
        <option value="all">All Cities</option>
        {#each cities as city}
          <option value={city}>{city}</option>
        {/each}
      </select>

      <!-- Bedrooms Filter -->
      <select 
        bind:value={filterBedrooms}
        class="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      >
        <option value="all">Any Bedrooms</option>
        {#each bedroomOptions as bedrooms}
          <option value={bedrooms.toString()}>{bedrooms} {bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}</option>
        {/each}
      </select>

      <!-- Price Range Filter -->
      <select 
        bind:value={filterPriceRange}
        class="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      >
        <option value="all">All Prices</option>
        <option value="budget">Budget (&lt; £100)</option>
        <option value="mid">Mid-range (£100-£200)</option>
        <option value="luxury">Luxury (£200+)</option>
      </select>
      
      <!-- Sort By -->
      <select 
        bind:value={sortBy}
        class="px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
      >
        <option value="avgRating">Rating</option>
        <option value="reviewCount">Reviews</option>
        <option value="name">Name</option>
        <option value="price">Price</option>
        <option value="bedroomsNumber">Bedrooms</option>
        <option value="createdAt">Date Added</option>
      </select>
    </div>

    <!-- Sort Order Toggle -->
    <div class="mt-4 flex items-center justify-between">
      <div class="flex items-center gap-2 text-sm text-slate-600">
        <span>Data Sources:</span>
        <span class="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
          Local: {sources.local}
        </span>
        <span class="px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-medium">
          Hostaway: {sources.hostaway}
        </span>
      </div>
      
      <button
        on:click={() => sortOrder = sortOrder === 'desc' ? 'asc' : 'desc'}
        class="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors"
        title="Toggle sort order"
        aria-label="Toggle sort order"
      >
        <span>Sort {sortOrder === 'desc' ? 'Descending' : 'Ascending'}</span>
        <svg class="w-4 h-4 {sortOrder === 'desc' ? 'rotate-180' : ''} transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 11l5-5m0 0l5 5m-5-5v12"/>
        </svg>
      </button>
    </div>
  </div>

  <!-- Enhanced Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
    <div class="bg-white shadow-card rounded-2xl border border-slate-100 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600">Total Properties</p>
          <p class="text-2xl font-bold text-slate-900 mt-1">{properties.length}</p>
          <p class="text-xs text-slate-500 mt-1">
            {sources.local} local + {sources.hostaway} Hostaway
          </p>
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
          <p class="text-sm font-medium text-slate-600">Active Properties</p>
          <p class="text-2xl font-bold text-slate-900 mt-1">{properties.filter(p => p.status === 'active').length}</p>
          <p class="text-xs text-slate-500 mt-1">
            {Math.round((properties.filter(p => p.status === 'active').length / properties.length) * 100) || 0}% of total
          </p>
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
            {properties.length > 0 ? (properties.reduce((sum, p) => sum + (p.avgRating || 0), 0) / properties.length).toFixed(1) : '0.0'}
          </p>
          <p class="text-xs text-slate-500 mt-1">
            Across {properties.filter(p => p.avgRating > 0).length} rated properties
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
            {properties.reduce((sum, p) => sum + (p.reviewCount || 0), 0).toLocaleString()}
          </p>
          <p class="text-xs text-slate-500 mt-1">
            Avg {Math.round(properties.reduce((sum, p) => sum + (p.reviewCount || 0), 0) / properties.length) || 0} per property
          </p>
        </div>
        <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
      </div>
    </div>

    <div class="bg-white shadow-card rounded-2xl border border-slate-100 p-6">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-slate-600">Avg Price</p>
          <p class="text-2xl font-bold text-slate-900 mt-1">
            {properties.filter(p => p.price).length > 0 
              ? formatPrice(properties.filter(p => p.price).reduce((sum, p) => sum + (p.price || 0), 0) / properties.filter(p => p.price).length)
              : '—'
            }
          </p>
          <p class="text-xs text-slate-500 mt-1">
            {properties.filter(p => p.price).length} properties with pricing
          </p>
        </div>
        <div class="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
          </svg>
        </div>
      </div>
    </div>
  </div>

  <!-- Enhanced Properties Table -->
  <div class="bg-white shadow-card rounded-2xl border border-slate-100 overflow-hidden">
    <div class="p-6 border-b border-slate-100">
      <div class="flex items-center justify-between">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Property Portfolio</h3>
          <p class="text-sm text-slate-500 mt-1">
            {filteredProperties.length} of {properties.length} properties
            {#if sources.hostaway > 0}
              • {sources.hostaway} from Hostaway API
            {/if}
          </p>
        </div>
        <div class="flex items-center gap-2 text-sm text-slate-600">
          <span>Showing {filteredProperties.length} results</span>
        </div>
      </div>
    </div>

    {#if loading}
      <div class="p-12 text-center">
        <div class="inline-flex items-center gap-2 text-slate-500">
          <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Loading properties...
        </div>
      </div>
    {:else if error}
      <div class="p-12 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-slate-900 mb-2">Error Loading Properties</h3>
        <p class="text-slate-500 mb-6">{error}</p>
        <button 
          on:click={loadProperties}
          class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl text-sm font-medium hover:from-brand-600 hover:to-brand-700 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Retry
        </button>
      </div>
    {:else if filteredProperties.length === 0}
      <div class="p-12 text-center">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-slate-900 mb-2">No properties found</h3>
        <p class="text-slate-500 mb-6">
          {searchQuery || filterChannel !== 'all' || filterCity !== 'all' ? 'Try adjusting your search or filters' : 'Get started by adding your first property listing'}
        </p>
        {#if !searchQuery && filterChannel === 'all' && filterCity === 'all'}
          <button 
            on:click={() => goto('/listings/new')}
            class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl text-sm font-medium hover:from-brand-600 hover:to-brand-700 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Your First Property
          </button>
        {/if}
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-slate-50/50">
            <tr class="text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
              <th class="px-6 py-4">Property</th>
              <th class="px-6 py-4">Details</th>
              <th class="px-6 py-4">Channel</th>
              <th class="px-6 py-4">Status</th>
              <th class="px-6 py-4">Rating</th>
              <th class="px-6 py-4">Reviews</th>
              <th class="px-6 py-4">Price</th>
              <th class="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            {#each filteredProperties as property}
              <tr 
                class="hover:bg-slate-50 cursor-pointer transition-colors group"
                on:click={() => handleListingClick(property.id)}
                role="button"
                tabindex="0"
                on:keydown={(e) => e.key === 'Enter' && handleListingClick(property.id)}
              >
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-14 h-14 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden flex-shrink-0">
                      {#if property.photo}
                        <img 
                          src={property.photo} 
                          alt={property.name}
                          class="w-full h-full object-cover"
                          on:error={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling.style.display = 'flex';
                          }}
                        />
                        <div class="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center" style="display: none;">
                          <svg class="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                          </svg>
                        </div>
                      {:else}
                        <div class="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                          <svg class="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                          </svg>
                        </div>
                      {/if}
                    </div>
                    <div>
                      <div class="font-medium text-slate-900 group-hover:text-brand-600 transition-colors">
                        {property.name}
                      </div>
                      <div class="text-sm text-slate-500 mt-0.5">{property.address}</div>
                      {#if property.description}
                        <div class="text-xs text-slate-400 mt-1 max-w-xs truncate">
                          {property.description}
                        </div>
                      {/if}
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm space-y-1">
                    {#if property.bedroomsNumber !== undefined || property.bathroomsNumber !== undefined}
                      <div class="flex items-center gap-3 text-slate-600">
                        {#if property.bedroomsNumber !== undefined}
                          <span class="flex items-center gap-1">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4"/>
                            </svg>
                            {property.bedroomsNumber} bed
                          </span>
                        {/if}
                        {#if property.bathroomsNumber !== undefined}
                          <span class="flex items-center gap-1">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11"/>
                            </svg>
                            {property.bathroomsNumber} bath
                          </span>
                        {/if}
                      </div>
                    {/if}
                    {#if property.personCapacity}
                      <div class="flex items-center gap-1 text-slate-600">
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                        {property.personCapacity} guests
                      </div>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class={getChannelBadge(property.channel)}>
                    {property.channel}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <span class={getStatusBadge(property.status || 'active')}>
                    {property.status || 'active'}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                    <span class="text-sm font-medium text-slate-900">
                      {(property.avgRating || 0).toFixed(1)}
                    </span>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-1 text-sm text-slate-600">
                    <svg class="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    {(property.reviewCount || 0).toLocaleString()}
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm font-medium text-slate-900">
                    {#if property.price}
                      {formatPrice(property.price)}
                      <div class="text-xs text-slate-500">per night</div>
                    {:else}
                      <span class="text-slate-400">—</span>
                    {/if}
                  </div>
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
