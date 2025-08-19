<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import KpiCards from '$lib/components/KpiCards.svelte';

  export let data: any;

  type ReviewRow = {
    id: string;
    listingId: string;
    listingName: string;
    channel: 'airbnb' | 'booking' | 'vrbo' | 'website' | string;
    type: 'guest' | string;
    status: 'pending' | 'approved' | 'rejected';
    overallRating: number | null;
    categoriesJson: string | null;
    submittedAt: string;
    guestName: string | null;
    publicReview: string | null;
    selectedForWeb: boolean;
    createdAt: string;
  };

  let reviews: ReviewRow[] = [];
  let totalCount = 0; // Store total count from API
  let loading = false;
  let error: string | null = null;
  let selectedReviews = new Set<string>();
  let showDrawer = false;
  let selectedReview: ReviewRow | null = null;
  let showBatchToolbar = false;
  let statsData: any = null;
  let statsLoading = false;

  // Filters - synced with URL
  let searchQuery = '';
  let filterStatus: string[] = [];
  let filterChannel: string[] = [];
  let filterListingId = '';
  let ratingMin = 0;
  let ratingMax = 5;
  let selectedForWeb: boolean | null = null;
  let dateFrom = '';
  let dateTo = '';
  let sortBy = 'submittedAt:desc';
  let currentPage = 0;
  let pageSize = 25;
  let showAll = false; // Toggle for showing all reviews
  let hasMore = false; // Whether there are more pages
  let totalPages = 0; // Total number of pages

  // Search debounce
  let searchTimeout: ReturnType<typeof setTimeout>;

  // Utility functions
  function parseCategories(json: string | null): string[] {
    if (!json) return [];
    try { 
      return JSON.parse(json); 
    } catch { 
      return []; 
    }
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function formatRelativeDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    
    return formatDate(dateString);
  }

  function getChannelBadge(channel: string): string {
    const badgeStyles = {
      airbnb: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800',
      booking: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800',
      vrbo: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800',
      website: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
    };
    return badgeStyles[channel] || 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800';
  }

  function getStatusBadge(status: string): string {
    const badgeStyles = {
      approved: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800',
      pending: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800',
      rejected: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'
    };
    return badgeStyles[status] || 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800';
  }

  function getRatingStars(rating: number | null): string {
    if (!rating) return '☆☆☆☆☆';
    const fullStars = Math.floor(rating);
    const emptyStars = 5 - fullStars;
    return '★'.repeat(fullStars) + '☆'.repeat(emptyStars);
  }

  function truncateText(text: string | null, maxLength: number = 100): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }

  // URL and filter management
  function buildQueryFromFilters() {
    const params = new URLSearchParams();
    
    if (searchQuery) params.set('q', searchQuery);
    if (filterStatus.length > 0) params.set('status', filterStatus.join(','));
    if (filterChannel.length > 0) params.set('channel', filterChannel.join(','));
    if (filterListingId) params.set('listingId', filterListingId);
    if (ratingMin > 0) params.set('ratingMin', ratingMin.toString());
    if (ratingMax < 5) params.set('ratingMax', ratingMax.toString());
    if (selectedForWeb !== null) params.set('selectedForWeb', selectedForWeb.toString());
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (sortBy !== 'submittedAt:desc') params.set('sort', sortBy);
    if (currentPage > 0) params.set('offset', (currentPage * pageSize).toString());
    if (showAll) {
      params.set('limit', totalCount.toString()); // Show all reviews
      params.delete('offset'); // Remove pagination when showing all
    } else {
      params.set('limit', pageSize.toString());
    }
    
    return params.toString();
  }

  function updateURL() {
    if (!browser) return;
    const query = buildQueryFromFilters();
    const newUrl = query ? `/reviews?${query}` : '/reviews';
    goto(newUrl, { replaceState: true, keepFocus: true });
  }

  function parseFiltersFromURL() {
    if (!browser) return;
    
    const params = $page.url.searchParams;
    searchQuery = params.get('q') || '';
    filterStatus = params.get('status')?.split(',').filter(Boolean) || [];
    filterChannel = params.get('channel')?.split(',').filter(Boolean) || [];
    filterListingId = params.get('listingId') || '';
    ratingMin = parseInt(params.get('ratingMin') || '0');
    ratingMax = parseInt(params.get('ratingMax') || '5');
    const webParam = params.get('selectedForWeb');
    selectedForWeb = webParam ? webParam === 'true' : null;
    dateFrom = params.get('dateFrom') || '';
    dateTo = params.get('dateTo') || '';
    sortBy = params.get('sort') || 'submittedAt:desc';
    currentPage = Math.floor(parseInt(params.get('offset') || '0') / pageSize);
    pageSize = parseInt(params.get('limit') || '25');
  }

  function resetFilters() {
    searchQuery = '';
    filterStatus = [];
    filterChannel = [];
    filterListingId = '';
    ratingMin = 0;
    ratingMax = 5;
    selectedForWeb = null;
    dateFrom = '';
    dateTo = '';
    sortBy = 'submittedAt:desc';
    currentPage = 0;
    pageSize = 25;
    updateURL();
  }

  // Data loading
  async function loadReviews() {
    loading = true;
    error = null;
    
    try {
      const query = buildQueryFromFilters();
      const url = query ? `/api/reviews?${query}` : '/api/reviews';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to load reviews');
      }
      
      reviews = data.reviews;
      totalCount = data.pagination?.total || data.reviews.length; // Store total count from API
      hasMore = data.pagination?.hasMore || false;
      totalPages = Math.ceil(totalCount / pageSize);
      // Clear selection when data changes
      selectedReviews.clear();
      selectedReviews = selectedReviews;
      
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
      reviews = [];
    } finally {
      loading = false;
    }
  }

  // Load statistics data
  async function loadStats() {
    statsLoading = true;
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      
      const query = params.toString();
      const url = query ? `/api/reviews/stats?${query}` : '/api/reviews/stats';
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      statsData = await response.json();
    } catch (err) {
      console.error('Failed to load stats:', err);
      statsData = null;
    } finally {
      statsLoading = false;
    }
  }

  // Search with debounce
  function handleSearchInput() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentPage = 0; // Reset to first page
      updateURL();
    }, 300);
  }

  // Selection management
  function toggleReviewSelection(reviewId: string) {
    if (selectedReviews.has(reviewId)) {
      selectedReviews.delete(reviewId);
    } else {
      selectedReviews.add(reviewId);
    }
    selectedReviews = selectedReviews;
    showBatchToolbar = selectedReviews.size > 0;
  }

  function toggleSelectAll() {
    if (selectedReviews.size === reviews.length && reviews.length > 0) {
      selectedReviews.clear();
    } else {
      reviews.forEach(review => selectedReviews.add(review.id));
    }
    selectedReviews = selectedReviews;
    showBatchToolbar = selectedReviews.size > 0;
  }

  // Batch actions
  async function performBatchAction(action: 'approve' | 'reject' | 'feature') {
    if (selectedReviews.size === 0) return;
    
    try {
      const response = await fetch('/api/reviews/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: Array.from(selectedReviews),
          action
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || 'Batch action failed');
      }
      
      // Optimistically update local state
      reviews = reviews.map(review => {
        if (selectedReviews.has(review.id)) {
          switch (action) {
            case 'approve':
              return { ...review, status: 'approved' as const };
            case 'reject':
              return { ...review, status: 'rejected' as const };
            case 'feature':
              return { ...review, selectedForWeb: true };
            default:
              return review;
          }
        }
        return review;
      });
      
      // Clear selection and hide toolbar
      selectedReviews.clear();
      selectedReviews = selectedReviews;
      showBatchToolbar = false;
      
      // Show success toast
      const actionName = action === 'feature' ? 'featured' : `${action}d`;
      showToast(`Successfully ${actionName} ${Array.from(selectedReviews).length} review(s)`, 'success');
      
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Batch action failed', 'error');
    }
  }

  // Drawer management
  function openDrawer(review: ReviewRow) {
    selectedReview = review;
    showDrawer = true;
  }

  function closeDrawer() {
    showDrawer = false;
    selectedReview = null;
  }

  // Pagination functions
  function goToPage(page: number) {
    if (page >= 0 && page < totalPages) {
      currentPage = page;
      updateURL();
      loadReviews();
    }
  }

  function nextPage() {
    if (hasMore) {
      goToPage(currentPage + 1);
    }
  }

  function prevPage() {
    if (currentPage > 0) {
      goToPage(currentPage - 1);
    }
  }

  function toggleShowAll() {
    showAll = !showAll;
    currentPage = 0; // Reset to first page when toggling
    updateURL();
    loadReviews();
  }

  // Toast notifications
  let toastMessage = '';
  let toastType: 'success' | 'error' | 'info' = 'info';
  let showToastNotification = false;

  function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    toastMessage = message;
    toastType = type;
    showToastNotification = true;
    setTimeout(() => showToastNotification = false, 3000);
  }

  // Derived KPIs - Total from API, percentages from current page sample
  $: totalReviews = totalCount; // Use total from API
  $: approvedCount = reviews.filter(r => r.status === 'approved').length;
  $: approvedPercentage = reviews.length > 0 ? Math.round((approvedCount / reviews.length) * 100) : 0; // Current page sample
  $: selectedCount = reviews.filter(r => r.selectedForWeb).length;
  $: selectedPercentage = reviews.length > 0 ? Math.round((selectedCount / reviews.length) * 100) : 0; // Current page sample
  $: avgRating = reviews.length > 0 
    ? reviews.filter(r => r.overallRating !== null)
        .reduce((sum, r) => sum + (r.overallRating || 0), 0) / reviews.filter(r => r.overallRating !== null).length
    : 0;

  // Initialize from URL and load data
  onMount(() => {
    parseFiltersFromURL();
    loadStats(); // Load statistics on page load
    if (data.reviews && data.reviews.length > 0) {
      reviews = data.reviews;
      console.log('✅ Using server-side data:', data.reviews.length, 'reviews');
    } else if (data.error) {
      error = data.error;
    } else {
      loadReviews();
    }
  });

  // React to URL changes and reload stats when date filters change
  $: if (browser && $page.url.search) {
    parseFiltersFromURL();
    loadReviews();
    loadStats();
  }
</script>

<svelte:head>
  <title>Reviews - Flex Reviews Dashboard</title>
</svelte:head>

<!-- Main Container -->
<div class="min-h-screen bg-surface-cream">
  <!-- Header -->
  <div class="bg-surface-card border-b border-surface-divider">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-6">
          <h1 class="text-heading font-bold text-text-primary">Reviews Management</h1>
        </div>
        
        <div class="flex items-center gap-3">
          <button
            class="inline-flex items-center gap-2 px-4 py-2 bg-surface-card border border-surface-divider rounded-control text-body font-medium text-text-primary hover:bg-surface-tint transition-colors"
            on:click={() => goto('/listings')}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            Properties
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- KPI Cards Section -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if statsLoading}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gallery">
        {#each Array(4) as _}
          <div class="bg-surface-card p-card rounded-card border border-surface-divider shadow-card animate-pulse">
            <div class="flex items-center justify-between">
              <div class="space-y-3">
                <div class="h-4 bg-surface-tint rounded w-24"></div>
                <div class="h-8 bg-surface-tint rounded w-16"></div>
                <div class="h-3 bg-surface-tint rounded w-20"></div>
              </div>
              <div class="w-12 h-12 bg-surface-tint rounded-full"></div>
            </div>
          </div>
        {/each}
      </div>
    {:else if statsData}
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-gallery">
        <!-- Total Reviews -->
        <div class="bg-gradient-to-br from-brand-50 to-brand-100 p-card rounded-card border border-brand-200 shadow-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-body font-medium text-brand-600 uppercase tracking-wide">Total Reviews</p>
              <p class="text-display font-bold text-brand-800 mt-2">{statsData.kpis.totalReviews}</p>
              <p class="text-body text-brand-700 mt-1">
                {statsData.kpis.thirtyDayGrowth > 0 ? '+' : ''}{statsData.kpis.thirtyDayGrowth}% this month
              </p>
            </div>
            <div class="w-12 h-12 bg-brand-600 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Average Rating -->
        <div class="bg-gradient-to-br from-success-50 to-success-100 p-card rounded-card border border-success-200 shadow-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-body font-medium text-success-600 uppercase tracking-wide">Avg Rating</p>
              <p class="text-display font-bold text-success-800 mt-2">{statsData.kpis.avgRating}</p>
              <p class="text-body text-success-700 mt-1">out of 5.0</p>
            </div>
            <div class="w-12 h-12 bg-success-600 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Five Star Rate -->
        <div class="bg-gradient-to-br from-warning-50 to-warning-100 p-card rounded-card border border-warning-200 shadow-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-body font-medium text-warning-600 uppercase tracking-wide">5-Star Rate</p>
              <p class="text-display font-bold text-warning-800 mt-2">{statsData.kpis.fiveStarRate}%</p>
              <p class="text-body text-warning-700 mt-1">excellence rate</p>
            </div>
            <div class="w-12 h-12 bg-warning-600 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
          </div>
        </div>

        <!-- Top Channels -->
        <div class="bg-gradient-to-br from-accent-50 to-accent-100 p-card rounded-card border border-accent-200 shadow-card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-body font-medium text-accent-600 uppercase tracking-wide">Top Channel</p>
              <p class="text-display font-bold text-accent-800 mt-2">
                {statsData.channels.length > 0 ? statsData.channels[0].name : 'N/A'}
              </p>
              <p class="text-body text-accent-700 mt-1">
                {statsData.channels.length > 0 ? `${statsData.channels[0].percentage}%` : '0%'} of reviews
              </p>
            </div>
            <div class="w-12 h-12 bg-accent-600 rounded-full flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <!-- Enhanced Filter Section -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
    <div class="bg-surface-card rounded-card border border-surface-divider shadow-card p-card">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-title font-semibold text-text-primary">Filters & Search</h2>
        <button
          on:click={resetFilters}
          class="text-body font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          Reset all filters
        </button>
      </div>

      <div class="space-y-6">
        <!-- Search Bar -->
        <div>
          <label for="search" class="block text-body font-medium text-text-primary mb-2">Search Reviews</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
            <input
              id="search"
              type="text"
              placeholder="Search reviews, guests, properties..."
              bind:value={searchQuery}
              on:input={handleSearchInput}
              class="w-full pl-10 pr-4 py-3 border border-surface-divider rounded-control text-body placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors"
            />
          </div>
        </div>

        <!-- Filter Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <!-- Status Filter -->
          <div>
            <label class="block text-body font-medium text-text-primary mb-2">Status</label>
            <div class="space-y-2">
              {#each ['pending', 'approved', 'rejected'] as status}
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    bind:group={filterStatus}
                    value={status}
                    on:change={updateURL}
                    class="rounded border-surface-divider text-brand-600 focus:ring-brand-500"
                  />
                  <span class="ml-2 text-body text-text-primary capitalize">{status}</span>
                </label>
              {/each}
            </div>
          </div>

          <!-- Channel Filter -->
          <div>
            <label class="block text-body font-medium text-text-primary mb-2">Channels</label>
            <div class="space-y-2">
              {#each ['airbnb', 'booking', 'vrbo', 'website'] as channel}
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    bind:group={filterChannel}
                    value={channel}
                    on:change={updateURL}
                    class="rounded border-surface-divider text-brand-600 focus:ring-brand-500"
                  />
                  <span class="ml-2 text-body text-text-primary capitalize">{channel}</span>
                </label>
              {/each}
            </div>
          </div>

          <!-- Rating Range -->
          <div>
            <label class="block text-body font-medium text-text-primary mb-2">Rating Range</label>
            <div class="space-y-3">
              <div>
                <label for="rating-min" class="block text-caption text-text-secondary">Minimum: {ratingMin}</label>
                <input
                  id="rating-min"
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  bind:value={ratingMin}
                  on:change={updateURL}
                  class="w-full h-2 bg-surface-tint rounded-full appearance-none cursor-pointer slider-brand"
                />
              </div>
              <div>
                <label for="rating-max" class="block text-caption text-text-secondary">Maximum: {ratingMax}</label>
                <input
                  id="rating-max"
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  bind:value={ratingMax}
                  on:change={updateURL}
                  class="w-full h-2 bg-surface-tint rounded-full appearance-none cursor-pointer slider-brand"
                />
              </div>
            </div>
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-body font-medium text-text-primary mb-2">Date Range</label>
            <div class="space-y-3">
              <div>
                <label for="date-from" class="block text-caption text-text-secondary">From</label>
                <input
                  id="date-from"
                  type="date"
                  bind:value={dateFrom}
                  on:change={updateURL}
                  class="w-full px-3 py-2 border border-surface-divider rounded-control text-body focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
              <div>
                <label for="date-to" class="block text-caption text-text-secondary">To</label>
                <input
                  id="date-to"
                  type="date"
                  bind:value={dateTo}
                  on:change={updateURL}
                  class="w-full px-3 py-2 border border-surface-divider rounded-control text-body focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Active Filters Display -->
        {#if filterStatus.length > 0 || filterChannel.length > 0 || searchQuery || dateFrom || dateTo}
          <div class="border-t border-surface-divider pt-4">
            <p class="text-body font-medium text-text-primary mb-3">Active Filters:</p>
            <div class="flex flex-wrap gap-2">
              {#if searchQuery}
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-caption">
                  Search: "{searchQuery}"
                  <button on:click={() => { searchQuery = ''; updateURL(); }} class="ml-1 hover:text-brand-900">×</button>
                </span>
              {/if}
              {#each filterStatus as status}
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-success-100 text-success-700 rounded-full text-caption">
                  Status: {status}
                  <button on:click={() => { filterStatus = filterStatus.filter(s => s !== status); updateURL(); }} class="ml-1 hover:text-success-900">×</button>
                </span>
              {/each}
              {#each filterChannel as channel}
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-accent-100 text-accent-700 rounded-full text-caption">
                  Channel: {channel}
                  <button on:click={() => { filterChannel = filterChannel.filter(c => c !== channel); updateURL(); }} class="ml-1 hover:text-accent-900">×</button>
                </span>
              {/each}
              {#if dateFrom}
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-warning-100 text-warning-700 rounded-full text-caption">
                  From: {dateFrom}
                  <button on:click={() => { dateFrom = ''; updateURL(); }} class="ml-1 hover:text-warning-900">×</button>
                </span>
              {/if}
              {#if dateTo}
                <span class="inline-flex items-center gap-1 px-3 py-1 bg-warning-100 text-warning-700 rounded-full text-caption">
                  To: {dateTo}
                  <button on:click={() => { dateTo = ''; updateURL(); }} class="ml-1 hover:text-warning-900">×</button>
                </span>
              {/if}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if error}
      <!-- Error State -->
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-red-900 mb-2">Error Loading Reviews</h3>
        <p class="text-red-700 mb-4">{error}</p>
        <button 
          on:click={loadReviews}
          class="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Retry
        </button>
      </div>
    {:else if loading}
      <!-- Loading State -->
      <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div class="animate-pulse">
          <div class="h-14 bg-slate-100 border-b border-slate-200"></div>
          {#each Array(10) as _}
            <div class="h-16 border-b border-slate-200 bg-slate-50"></div>
          {/each}
        </div>
      </div>
    {:else if reviews.length === 0}
      <!-- Empty State -->
      <div class="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-slate-900 mb-2">No reviews match your filters</h3>
        <p class="text-slate-600 mb-6">Try adjusting your search criteria or reset filters to see all reviews.</p>
        <button
          on:click={resetFilters}
          class="inline-flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 transition-colors"
        >
          Reset filters
        </button>
      </div>
    {:else}
      <!-- Reviews Table -->
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div class="bg-surface-card rounded-card border border-surface-divider overflow-hidden shadow-card">
          <!-- Table Header -->
          <div class="px-card py-4 border-b border-surface-divider bg-surface-tint">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <label class="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedReviews.size === reviews.length && reviews.length > 0}
                    on:change={toggleSelectAll}
                    class="w-4 h-4 text-brand-600 focus:ring-brand-500 border-surface-divider rounded"
                  />
                  <span class="ml-2 text-body text-text-secondary">
                    {selectedReviews.size > 0 ? `${selectedReviews.size} selected` : 'Select all'}
                  </span>
                </label>
              </div>
              <div class="text-body text-text-secondary">
                {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-surface-tint border-b border-surface-divider">
                <tr>
                  <th scope="col" class="px-card py-3 text-left text-caption font-medium text-text-secondary uppercase tracking-wider">
                    <span class="sr-only">Select</span>
                  </th>
                  <th scope="col" class="px-card py-3 text-left text-caption font-medium text-text-secondary uppercase tracking-wider">
                    Submitted
                  </th>
                  <th scope="col" class="px-card py-3 text-left text-caption font-medium text-text-secondary uppercase tracking-wider">
                    Property
                  </th>
                  <th scope="col" class="px-card py-3 text-left text-caption font-medium text-text-secondary uppercase tracking-wider">
                    Rating
                  </th>
                  <th scope="col" class="px-card py-3 text-left text-caption font-medium text-text-secondary uppercase tracking-wider">
                    Channel
                  </th>
                  <th scope="col" class="px-card py-3 text-left text-caption font-medium text-text-secondary uppercase tracking-wider">
                    Status
                </th>
                <th scope="col" class="px-card py-3 text-left text-caption font-medium text-text-secondary uppercase tracking-wider">
                  Featured
                </th>
                <th scope="col" class="px-card py-3 text-left text-caption font-medium text-text-secondary uppercase tracking-wider">
                  Review
                </th>
                <th scope="col" class="px-card py-3 text-left text-caption font-medium text-text-secondary uppercase tracking-wider">
                  <span class="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-surface-card divide-y divide-surface-divider">
              {#each reviews as review}
                <tr 
                  class="hover:bg-surface-tint cursor-pointer transition-colors"
                  on:click={() => openDrawer(review)}
                >
                  <td class="px-card py-4 whitespace-nowrap" on:click|stopPropagation>
                    <input
                      type="checkbox"
                      checked={selectedReviews.has(review.id)}
                      on:change={() => toggleReviewSelection(review.id)}
                      class="w-4 h-4 text-brand-600 focus:ring-brand-500 border-surface-divider rounded"
                    />
                  </td>
                  <td class="px-card py-4 whitespace-nowrap">
                    <div class="text-body text-text-primary" title={formatDate(review.submittedAt)}>
                      {formatRelativeDate(review.submittedAt)}
                    </div>
                    <div class="text-caption text-text-secondary">{review.guestName || 'Anonymous'}</div>
                  </td>
                  <td class="px-card py-4 whitespace-nowrap">
                    <button
                      on:click|stopPropagation={() => window.open(`/listings/${review.listingId}`, '_blank')}
                      class="text-body font-medium text-brand-600 hover:text-brand-700 hover:underline transition-colors"
                    >
                      {review.listingName}
                    </button>
                  </td>
                  <td class="px-card py-4 whitespace-nowrap">
                    {#if review.overallRating}
                      <div class="flex items-center gap-1">
                        <span class="text-warning-500 text-body">{getRatingStars(review.overallRating)}</span>
                        <span class="text-body text-text-secondary">{review.overallRating}/5</span>
                      </div>
                    {:else}
                      <span class="text-body text-text-secondary">No rating</span>
                    {/if}
                  </td>
                  <td class="px-card py-4 whitespace-nowrap">
                    <span class={getChannelBadge(review.channel)}>
                      {review.channel.charAt(0).toUpperCase() + review.channel.slice(1)}
                    </span>
                  </td>
                  <td class="px-card py-4 whitespace-nowrap">
                    <span class={getStatusBadge(review.status)}>
                      {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                    </span>
                  </td>
                  <td class="px-card py-4 whitespace-nowrap">
                    {#if review.selectedForWeb}
                      <svg class="w-5 h-5 text-warning-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      </svg>
                    {:else}
                      <svg class="w-5 h-5 text-text-secondary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                      </svg>
                    {/if}
                  </td>
                  <td class="px-card py-4">
                    <div class="text-body text-text-primary max-w-xs truncate">
                      {truncateText(review.publicReview)}
                    </div>
                  </td>
                  <td class="px-card py-4 whitespace-nowrap text-right text-body font-medium" on:click|stopPropagation>
                    <button
                      on:click={() => openDrawer(review)}
                      class="text-text-secondary hover:text-text-primary transition-colors"
                      aria-label="View review details"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
                      </svg>
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        {#if !showAll && totalPages > 1}
          <div class="px-card py-4 border-t border-surface-divider">
            <div class="flex items-center justify-between">
              <div class="text-body text-text-secondary">
                Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, totalCount)} of {totalCount} reviews
              </div>
              
              <div class="flex items-center gap-2">
                <button
                  on:click={prevPage}
                  disabled={currentPage === 0}
                  class="px-3 py-1 text-sm border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <!-- Page Numbers -->
                <div class="flex gap-1">
                  {#each Array(Math.min(5, totalPages)) as _, i}
                    {@const pageNum = currentPage < 3 ? i : currentPage - 2 + i}
                    {#if pageNum >= 0 && pageNum < totalPages}
                      <button
                        on:click={() => goToPage(pageNum)}
                        class="px-3 py-1 text-sm border rounded-md {pageNum === currentPage ? 'bg-blue-500 text-white border-blue-500' : 'border-slate-200 hover:bg-slate-50'}"
                      >
                        {pageNum + 1}
                      </button>
                    {/if}
                  {/each}
                </div>
                
                <button
                  on:click={nextPage}
                  disabled={!hasMore}
                  class="px-3 py-1 text-sm border border-slate-200 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        {/if}
      </div>
    </div>
{/if}
</div>

<!-- Batch Toolbar -->
{#if showBatchToolbar}
  <div class="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40">
    <div class="bg-white border border-slate-200 rounded-xl shadow-lg px-6 py-3">
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium text-slate-700">
          {selectedReviews.size} review{selectedReviews.size !== 1 ? 's' : ''} selected
        </span>
        <div class="flex gap-2">
          <button
            on:click={() => performBatchAction('approve')}
            class="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
            aria-label="Approve selected reviews"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Approve
          </button>
          <button
            on:click={() => performBatchAction('reject')}
            class="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            aria-label="Reject selected reviews"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Reject
          </button>
          <button
            on:click={() => performBatchAction('feature')}
            class="inline-flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-sm font-medium hover:bg-yellow-700 transition-colors"
            aria-label="Feature selected reviews"
          >
            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
            Feature
          </button>
        </div>
        <button
          on:click={() => { selectedReviews.clear(); selectedReviews = selectedReviews; showBatchToolbar = false; }}
          class="text-slate-400 hover:text-slate-600"
          aria-label="Clear selection"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Review Detail Drawer -->
{#if showDrawer && selectedReview}
  <div class="fixed inset-0 z-50 overflow-hidden">
    <div 
      class="absolute inset-0 bg-black bg-opacity-50" 
      on:click={closeDrawer}
      on:keydown={(e) => e.key === 'Escape' && closeDrawer()}
      role="button"
      tabindex="0"
      aria-label="Close drawer"
    ></div>
    <div class="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
      <div class="flex flex-col h-full">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h3 class="text-lg font-medium text-slate-900">Review Details</h3>
            <p class="text-sm text-slate-500">by {selectedReview.guestName || 'Anonymous'}</p>
          </div>
          <button
            on:click={closeDrawer}
            class="text-slate-400 hover:text-slate-600"
            aria-label="Close drawer"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-6">
          <!-- Basic Info -->
          <div class="flex items-center gap-4">
            <span class={getChannelBadge(selectedReview.channel)}>
              {selectedReview.channel.charAt(0).toUpperCase() + selectedReview.channel.slice(1)}
            </span>
            <span class={getStatusBadge(selectedReview.status)}>
              {selectedReview.status.charAt(0).toUpperCase() + selectedReview.status.slice(1)}
            </span>
            <div class="text-sm text-slate-500">
              {formatDate(selectedReview.submittedAt)}
            </div>
          </div>

          <!-- Property Link -->
          <div>
            <div class="block text-sm font-medium text-slate-700 mb-1">Property</div>
            <button
              on:click={() => window.open(`/listings/${selectedReview.listingId}`, '_blank')}
              class="text-brand-600 hover:text-brand-700 hover:underline font-medium"
            >
              {selectedReview.listingName}
            </button>
          </div>

          <!-- Rating -->
          {#if selectedReview.overallRating}
            <div>
              <div class="block text-sm font-medium text-slate-700 mb-1">Rating</div>
              <div class="flex items-center gap-2">
                <span class="text-yellow-400">{getRatingStars(selectedReview.overallRating)}</span>
                <span class="text-sm text-slate-600">{selectedReview.overallRating}/5</span>
              </div>
            </div>
          {/if}

          <!-- Review Text -->
          {#if selectedReview.publicReview}
            <div>
              <div class="block text-sm font-medium text-slate-700 mb-2">Review</div>
              <div class="bg-slate-50 rounded-lg p-4">
                <p class="text-slate-700 leading-relaxed">{selectedReview.publicReview}</p>
              </div>
            </div>
          {/if}

          <!-- Categories -->
          {#if selectedReview.categoriesJson}
            <div>
              <div class="block text-sm font-medium text-slate-700 mb-2">Categories</div>
              <div class="flex flex-wrap gap-2">
                {#each parseCategories(selectedReview.categoriesJson) as category}
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {category}
                  </span>
                {/each}
              </div>
            </div>
          {/if}

          <!-- Featured Toggle -->
          <div>
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                bind:checked={selectedReview.selectedForWeb}
                class="w-4 h-4 text-brand-600 focus:ring-brand-500 border-slate-300 rounded"
              />
              <span class="text-sm font-medium text-slate-700">Featured for web</span>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="border-t border-slate-200 p-6">
          <div class="flex gap-3">
            <button
              on:click={() => performBatchAction('approve')}
              class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Approve
            </button>
            <button
              on:click={() => performBatchAction('reject')}
              class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<!-- Toast Notifications -->
{#if showToastNotification}
  <div class="fixed top-4 right-4 z-50">
    <div class="bg-white border border-slate-200 rounded-xl shadow-lg p-4 max-w-sm">
      <div class="flex items-center gap-3">
        {#if toastType === 'success'}
          <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
        {:else if toastType === 'error'}
          <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        {:else}
          <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        {/if}
        <span class="text-sm text-slate-700">{toastMessage}</span>
        <button
          on:click={() => showToastNotification = false}
          class="text-slate-400 hover:text-slate-600"
          aria-label="Close notification"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
{/if}

</div>

<style>
  /* Custom scrollbar for drawer */
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }

  /* Custom slider styling */
  .slider-brand {
    -webkit-appearance: none;
    background: transparent;
    cursor: pointer;
  }

  .slider-brand::-webkit-slider-track {
    background: #f1f5f9;
    height: 6px;
    border-radius: 3px;
  }

  .slider-brand::-webkit-slider-thumb {
    -webkit-appearance: none;
    background: #0ea5e9;
    height: 18px;
    width: 18px;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;
  }

  .slider-brand::-webkit-slider-thumb:hover {
    background: #0284c7;
    transform: scale(1.1);
  }

  .slider-brand::-moz-range-track {
    background: #f1f5f9;
    height: 6px;
    border-radius: 3px;
    border: none;
  }

  .slider-brand::-moz-range-thumb {
    background: #0ea5e9;
    height: 18px;
    width: 18px;
    border-radius: 50%;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>
