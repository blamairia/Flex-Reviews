<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  
  export let data: any;
  
  interface Review {
    id: string;
    guestName: string;
    rating: number;
    comment: string;
    date: string;
    channel: string;
    status: string;
    sentiment?: string;
    categories?: Record<string, number>;
  }

  let showAllReviews = false;
  let isLoading = false;
  
  // Reactive computations  
  $: property = data.property || {};
  $: reviews = data.reviews?.reviews || [];
  $: reviewStats = data.reviews?.stats || {};
  $: pagination = data.reviews?.pagination || { total: 0, limit: 25, offset: 0 };
  $: insights = data.insights || {};
  // Filter reviews by approval status for customer preview
  $: approvedReviews = reviews.filter(r => r.status === 'approved'); // Only show approved reviews on property page
  $: displayedReviews = showAllReviews ? approvedReviews : approvedReviews.slice(0, 6);
  
  // Calculate rating from approved reviews only (customer view)
  $: calculatedRating = approvedReviews.length > 0 
    ? approvedReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / approvedReviews.length 
    : property.summary?.avgRating || property.avgRating || 0;
  
  // Pagination calculations
  $: totalPages = Math.ceil(pagination.total / pagination.limit);
  $: currentPage = Math.floor(pagination.offset / pagination.limit) + 1;
  $: hasMore = pagination.offset + pagination.limit < pagination.total;
  
  // Load more reviews function
  async function loadMoreReviews() {
    if (isLoading || !hasMore) return;
    
    isLoading = true;
    try {
      const newOffset = pagination.offset + pagination.limit;
      const response = await fetch(`/api/reviews?listingId=${property.id}&limit=${pagination.limit}&offset=${newOffset}`);
      const result = await response.json();
      
      if (result.success && result.result?.reviews) {
        // Append new reviews to existing ones
        reviews = [...reviews, ...result.result.reviews];
        pagination = result.result.pagination;
      }
    } catch (error) {
      console.error('Failed to load more reviews:', error);
    } finally {
      isLoading = false;
    }
  }
  
  // Show all reviews function
  async function toggleShowAllReviews() {
    if (!showAllReviews) {
      // Load all reviews if not already loaded
      if (reviews.length < pagination.total) {
        isLoading = true;
        try {
          const response = await fetch(`/api/reviews?listingId=${property.id}&limit=${pagination.total}&offset=0`);
          const result = await response.json();
          
          if (result.success && result.result?.reviews) {
            reviews = result.result.reviews;
            pagination = result.result.pagination;
          }
        } catch (error) {
          console.error('Failed to load all reviews:', error);
        } finally {
          isLoading = false;
        }
      }
    }
    showAllReviews = !showAllReviews;
  }
  
  // Helper functions
  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  function formatPrice(price: number): string {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(price);
  }
  
  function getChannelBadge(channel: string): string {
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
  
  function getSentimentBadge(sentiment: string): string {
    const baseClass = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    
    switch(sentiment?.toLowerCase()) {
      case 'positive': return `${baseClass} bg-green-50 text-green-700`;
      case 'negative': return `${baseClass} bg-red-50 text-red-700`;
      case 'neutral': return `${baseClass} bg-yellow-50 text-yellow-700`;
      default: return `${baseClass} bg-slate-100 text-slate-700`;
    }
  }
  
  function getStatusBadge(status: string): string {
    const baseClass = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    
    switch(status?.toLowerCase()) {
      case 'approved': return `${baseClass} bg-green-50 text-green-700`;
      case 'pending': return `${baseClass} bg-yellow-50 text-yellow-700`;
      case 'rejected': return `${baseClass} bg-red-50 text-red-700`;
      default: return `${baseClass} bg-slate-100 text-slate-700`;
    }
  }
  
  function getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  }
</script>

<svelte:head>
  <title>{property.name || 'Property Details'} - Reviews Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
  <!-- Preview Warning Banner -->
  <div class="bg-gradient-to-r from-amber-500 to-orange-600 text-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-center py-3">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          <span class="font-medium">Customer Preview Mode</span>
          <span class="text-amber-100">•</span>
          <span class="text-sm">Showing only approved reviews as customers would see them</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Navigation Header -->
  <div class="bg-white border-b border-slate-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex items-center justify-between h-16">
        <div class="flex items-center gap-4">
          <button 
            class="inline-flex items-center gap-2 text-slate-600 hover:text-brand-600 font-medium transition-colors"
            on:click={() => goto('/listings')}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Back to Properties
          </button>
          <div class="w-px h-6 bg-slate-300"></div>
          <div>
            <h1 class="text-xl font-semibold text-slate-900">{property.name || 'Property Details'}</h1>
            <p class="text-sm text-slate-500">ID: {property.id}</p>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <button 
            class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            on:click={() => goto('/reviews')}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
            </svg>
            Manage Reviews
          </button>
          <button
            class="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl text-sm font-medium hover:from-brand-600 hover:to-brand-700 transition-colors shadow-sm"
            on:click={() => window.open(`/property/${property.slug}?key=DEMO_KEY`, '_blank')}
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            Preview
          </button>
        </div>
      </div>
    </div>
  </div>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {#if data.error}
      <!-- Error State -->
      <div class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-red-900 mb-2">Error Loading Property</h3>
        <p class="text-red-700 mb-4">{data.error}</p>
        <button 
          on:click={() => window.location.reload()}
          class="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Retry
        </button>
      </div>
    {:else}
      <!-- Main Content -->
      <div class="space-y-8">
        <!-- Property Hero Section -->
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div class="grid lg:grid-cols-2 gap-8 p-8">
            <!-- Property Image -->
            <div class="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl overflow-hidden">
              {#if property.photo}
                <img 
                  src={property.photo} 
                  alt={property.name}
                  class="w-full h-full object-cover"
                />
              {:else}
                <div class="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
                  <svg class="w-16 h-16 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
              {/if}
            </div>
            
            <!-- Property Details -->
            <div class="space-y-6">
              <div>
                <h2 class="text-2xl font-bold text-slate-900 mb-2">{property.name}</h2>
                <p class="text-slate-600 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  {property.address}
                </p>
              </div>
              
              <!-- Key Metrics -->
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-slate-50 rounded-xl p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                    <span class="text-sm font-medium text-slate-600">Rating</span>
                  </div>
                  <div class="text-2xl font-bold text-slate-900">{calculatedRating.toFixed(1)}</div>
                  <div class="text-xs text-slate-500">{getRatingStars(calculatedRating)}</div>
                </div>
                
                <div class="bg-slate-50 rounded-xl p-4">
                  <div class="flex items-center gap-2 mb-2">
                    <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                    </svg>
                    <span class="text-sm font-medium text-slate-600">Reviews</span>
                  </div>
                  <div class="text-2xl font-bold text-slate-900">{approvedReviews.length}</div>
                  <div class="text-xs text-slate-500">Guest reviews</div>
                </div>
              </div>
              
              <!-- Property Features -->
              {#if property.hostaway}
                <div class="space-y-3">
                  <h3 class="font-semibold text-slate-900">Property Features</h3>
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    {#if property.hostaway.bedroomsNumber !== undefined}
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 21v-4a2 2 0 012-2h4a2 2 0 012 2v4"/>
                        </svg>
                        <span>{property.hostaway.bedroomsNumber} Bedrooms</span>
                      </div>
                    {/if}
                    {#if property.hostaway.bathroomsNumber !== undefined}
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11"/>
                        </svg>
                        <span>{property.hostaway.bathroomsNumber} Bathrooms</span>
                      </div>
                    {/if}
                    {#if property.hostaway.personCapacity}
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                        </svg>
                        <span>{property.hostaway.personCapacity} Guests</span>
                      </div>
                    {/if}
                    {#if property.hostaway.price}
                      <div class="flex items-center gap-2">
                        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                        </svg>
                        <span>{formatPrice(property.hostaway.price)}/night</span>
                      </div>
                    {/if}
                  </div>
                </div>
              {/if}
              
              <!-- Channels -->
              {#if property.channel}
                <div class="space-y-3">
                  <h3 class="font-semibold text-slate-900">Available on</h3>
                  <div class="flex flex-wrap gap-2">
                    <span class={getChannelBadge(property.channel)}>
                      {property.channel.charAt(0).toUpperCase() + property.channel.slice(1)}
                    </span>
                  </div>
                </div>
              {/if}
            </div>
          </div>
          
          <!-- Property Description -->
          {#if property.description}
            <div class="border-t border-slate-200 p-8">
              <h3 class="font-semibold text-slate-900 mb-3">Description</h3>
              <p class="text-slate-600 leading-relaxed">{property.description}</p>
            </div>
          {/if}
        </div>

        <!-- Comprehensive Property Information -->
        {#if property.hostaway}
          <!-- Image Gallery -->
          {#if property.hostaway.images && property.hostaway.images.length > 0}
            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div class="p-8 border-b border-slate-200">
                <h3 class="text-xl font-semibold text-slate-900">Photo Gallery</h3>
                <p class="text-slate-600 mt-1">{property.hostaway.images.length} photos</p>
              </div>
              <div class="p-8">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {#each property.hostaway.images as image, index}
                    <div class="aspect-[4/3] bg-slate-100 rounded-xl overflow-hidden group">
                      <img 
                        src={image.url} 
                        alt={image.caption || `Photo ${index + 1}`}
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          <!-- Amenities & Features -->
          {#if property.hostaway.amenities && property.hostaway.amenities.length > 0}
            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div class="p-8 border-b border-slate-200">
                <h3 class="text-xl font-semibold text-slate-900">Amenities & Features</h3>
                <p class="text-slate-600 mt-1">{property.hostaway.amenities.length} amenities available</p>
              </div>
              <div class="p-8">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {#each property.hostaway.amenities as amenity}
                    <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span class="text-slate-700 text-sm">{amenity.name}</span>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          {/if}

          <!-- Policies & House Rules -->
          {#if property.hostaway.policies}
            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div class="p-8 border-b border-slate-200">
                <h3 class="text-xl font-semibold text-slate-900">Stay Policies & House Rules</h3>
                <p class="text-slate-600 mt-1">Important information for your stay</p>
              </div>
              <div class="p-8 space-y-8">
                <!-- Check-in & Check-out -->
                <div>
                  <h4 class="font-semibold text-slate-900 mb-4">Check-in & Check-out</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                      <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                      </svg>
                      <div>
                        <div class="font-medium text-slate-900">Check-in time</div>
                        <div class="text-slate-600">{property.hostaway.policies.checkInTime}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                      <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                      </svg>
                      <div>
                        <div class="font-medium text-slate-900">Check-out time</div>
                        <div class="text-slate-600">{property.hostaway.policies.checkOutTime}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- House Rules -->
                <div>
                  <h4 class="font-semibold text-slate-900 mb-4">House Rules</h4>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex items-center gap-3">
                      <div class="w-6 h-6 rounded-full {property.hostaway.policies.smokingAllowed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} flex items-center justify-center">
                        {#if property.hostaway.policies.smokingAllowed}
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                          </svg>
                        {:else}
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                          </svg>
                        {/if}
                      </div>
                      <span class="text-slate-700">{property.hostaway.policies.smokingAllowed ? 'Smoking allowed' : 'No smoking'}</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="w-6 h-6 rounded-full {property.hostaway.policies.petsAllowed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} flex items-center justify-center">
                        {#if property.hostaway.policies.petsAllowed}
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                          </svg>
                        {:else}
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                          </svg>
                        {/if}
                      </div>
                      <span class="text-slate-700">{property.hostaway.policies.petsAllowed ? 'Pets allowed' : 'No pets'}</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="w-6 h-6 rounded-full {property.hostaway.policies.partiesEventsAllowed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} flex items-center justify-center">
                        {#if property.hostaway.policies.partiesEventsAllowed}
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                          </svg>
                        {:else}
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                          </svg>
                        {/if}
                      </div>
                      <span class="text-slate-700">{property.hostaway.policies.partiesEventsAllowed ? 'Parties/events allowed' : 'No parties or events'}</span>
                    </div>
                    <div class="flex items-center gap-3">
                      <div class="w-6 h-6 rounded-full {property.hostaway.policies.securityDepositRequired ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'} flex items-center justify-center">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                        </svg>
                      </div>
                      <span class="text-slate-700">{property.hostaway.policies.securityDepositRequired ? 'Security deposit required' : 'No security deposit required'}</span>
                    </div>
                  </div>
                  {#if property.hostaway.policies.houseRules}
                    <div class="mt-4 p-4 bg-blue-50 rounded-xl">
                      <div class="font-medium text-blue-900 mb-2">Additional House Rules</div>
                      <p class="text-blue-800 text-sm">{property.hostaway.policies.houseRules}</p>
                    </div>
                  {/if}
                </div>

                <!-- Cancellation Policy -->
                {#if property.hostaway.policies.cancellationPolicy}
                  <div>
                    <h4 class="font-semibold text-slate-900 mb-4">Cancellation Policy</h4>
                    <div class="p-4 bg-slate-50 rounded-xl">
                      <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                        </svg>
                        <div>
                          <div class="font-medium text-slate-900 capitalize">{property.hostaway.policies.cancellationPolicy} cancellation policy</div>
                          <div class="text-slate-600 text-sm">
                            {#if property.hostaway.policies.cancellationPolicy === 'flexible'}
                              Full refund up to 14 days before check-in
                            {:else if property.hostaway.policies.cancellationPolicy === 'moderate'}
                              Full refund up to 7 days before check-in
                            {:else if property.hostaway.policies.cancellationPolicy === 'strict'}
                              Full refund up to 48 hours before check-in
                            {:else}
                              Check the full terms for details
                            {/if}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          {/if}

          <!-- Location & Maps -->
          {#if property.hostaway.location}
            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div class="p-8 border-b border-slate-200">
                <h3 class="text-xl font-semibold text-slate-900">Location</h3>
                <p class="text-slate-600 mt-1">Exact location for maps integration</p>
              </div>
              <div class="p-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <!-- Address Details -->
                  <div class="space-y-4">
                    <div class="flex items-start gap-3">
                      <svg class="w-5 h-5 text-slate-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <div>
                        <div class="font-medium text-slate-900">Full Address</div>
                        <div class="text-slate-600 text-sm">{property.hostaway.location.address}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <div>
                        <div class="font-medium text-slate-900">Location Details</div>
                        <div class="text-slate-600 text-sm">{property.hostaway.location.city}, {property.hostaway.location.state}, {property.hostaway.location.country}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-3">
                      <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                      </svg>
                      <div>
                        <div class="font-medium text-slate-900">Coordinates</div>
                        <div class="text-slate-600 text-sm font-mono">{property.hostaway.location.lat}, {property.hostaway.location.lng}</div>
                      </div>
                    </div>
                    {#if property.hostaway.location.zipcode}
                      <div class="flex items-center gap-3">
                        <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                        </svg>
                        <div>
                          <div class="font-medium text-slate-900">Postal Code</div>
                          <div class="text-slate-600 text-sm">{property.hostaway.location.zipcode}</div>
                        </div>
                      </div>
                    {/if}
                  </div>

                  <!-- Map Placeholder -->
                  <div class="bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl h-64 flex items-center justify-center">
                    <div class="text-center">
                      <svg class="w-12 h-12 text-slate-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                      </svg>
                      <div class="text-slate-600 font-medium">Interactive Map</div>
                      <div class="text-slate-500 text-sm">Ready for maps integration</div>
                      <div class="text-xs text-slate-400 mt-2">Lat: {property.hostaway.location.lat}<br/>Lng: {property.hostaway.location.lng}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          {/if}
        {/if}

        <!-- Reviews Section -->
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <!-- Reviews Header -->
          <div class="p-8 border-b border-slate-200">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xl font-semibold text-slate-900">Guest Reviews</h3>
                <p class="text-slate-600 mt-1">
                  {approvedReviews.length} reviews
                  {#if calculatedRating > 0}
                    • {calculatedRating.toFixed(1)} average rating
                  {/if}
                </p>
              </div>
              
              {#if approvedReviews.length > 0}
                <div class="flex items-center gap-6">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">{approvedReviews.filter(r => r.rating >= 4).length}</div>
                    <div class="text-xs text-slate-500">Excellent</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-yellow-600">{approvedReviews.filter(r => r.rating === 3).length}</div>
                    <div class="text-xs text-slate-500">Good</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-slate-600">{approvedReviews.filter(r => r.rating <= 2).length}</div>
                    <div class="text-xs text-slate-500">Fair</div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
          
          <!-- Review Statistics -->
          {#if approvedReviews.length > 0}
            <div class="p-8 border-b border-slate-200 bg-slate-50">
              <h4 class="font-semibold text-slate-900 mb-4">Average Ratings</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center p-3 bg-white rounded-xl border border-slate-200">
                  <div class="text-sm font-medium text-slate-900 mb-1">Overall</div>
                  <div class="text-lg font-bold text-slate-900">{calculatedRating.toFixed(1)}</div>
                  <div class="text-xs text-slate-500">{getRatingStars(calculatedRating)}</div>
                </div>
                <div class="text-center p-3 bg-white rounded-xl border border-slate-200">
                  <div class="text-sm font-medium text-slate-900 mb-1">Value</div>
                  <div class="text-lg font-bold text-slate-900">{calculatedRating.toFixed(1)}</div>
                  <div class="text-xs text-slate-500">{getRatingStars(calculatedRating)}</div>
                </div>
                <div class="text-center p-3 bg-white rounded-xl border border-slate-200">
                  <div class="text-sm font-medium text-slate-900 mb-1">Location</div>
                  <div class="text-lg font-bold text-slate-900">{calculatedRating.toFixed(1)}</div>
                  <div class="text-xs text-slate-500">{getRatingStars(calculatedRating)}</div>
                </div>
                <div class="text-center p-3 bg-white rounded-xl border border-slate-200">
                  <div class="text-sm font-medium text-slate-900 mb-1">Cleanliness</div>
                  <div class="text-lg font-bold text-slate-900">{calculatedRating.toFixed(1)}</div>
                  <div class="text-xs text-slate-500">{getRatingStars(calculatedRating)}</div>
                </div>
              </div>
            </div>
          {/if}
          
          <!-- Reviews List -->
          <div class="p-8">
            {#if approvedReviews.length === 0}
              <div class="text-center py-12">
                <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </div>
                <h3 class="text-lg font-medium text-slate-900 mb-2">No Reviews Yet</h3>
                <p class="text-slate-500">This property hasn't received any reviews yet.</p>
              </div>
            {:else}
              <div class="space-y-6">
                {#each displayedReviews as review}
                  <div class="border border-slate-200 rounded-xl p-6">
                    <!-- Review Header -->
                    <div class="flex items-start justify-between mb-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center">
                          <span class="text-white font-medium text-sm">
                            {review.guestName ? review.guestName.charAt(0).toUpperCase() : 'G'}
                          </span>
                        </div>
                        <div>
                          <div class="font-medium text-slate-900">{review.guestName || 'Anonymous Guest'}</div>
                          <div class="flex items-center gap-2 text-sm text-slate-500">
                            <span>{formatDate(review.date)}</span>
                            <span>•</span>
                            <span class={getChannelBadge(review.channel)}>{review.channel}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div class="flex items-center gap-2">
                        <div class="flex items-center gap-1">
                          <span class="text-lg">{getRatingStars(review.rating)}</span>
                          <span class="text-sm font-medium text-slate-900">{review.rating}</span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- Review Content -->
                    <div class="text-slate-700 leading-relaxed mb-4">
                      {review.comment || 'No comment provided.'}
                    </div>
                    
                    <!-- Category Ratings -->
                    {#if review.categories && Object.keys(review.categories).length > 0}
                      <div class="border-t border-slate-200 pt-4">
                        <h5 class="text-sm font-medium text-slate-900 mb-2">Category Ratings</h5>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {#each Object.entries(review.categories) as [category, rating]}
                            <div class="text-center p-2 bg-slate-50 rounded-lg">
                              <div class="text-xs text-slate-600 capitalize">{category}</div>
                              <div class="text-sm font-medium text-slate-900">{rating}/5</div>
                            </div>
                          {/each}
                        </div>
                      </div>
                    {/if}
                  </div>
                {/each}
                
                <!-- Simple Pagination for Customer View -->
                {#if approvedReviews.length > 6}
                  <div class="flex items-center justify-center pt-6 border-t border-slate-200">
                    <div class="flex items-center gap-3">
                      {#if !showAllReviews}
                        <button
                          on:click={() => showAllReviews = true}
                          class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl font-medium transition-colors"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                          </svg>
                          View All Reviews
                        </button>
                      {:else}
                        <button
                          on:click={() => showAllReviews = false}
                          class="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                          </svg>
                          Show Less
                        </button>
                      {/if}
                    </div>
                  </div>
                {/if}
              </div>
            {/if}
          </div>
        </div>
        
        <!-- Insights Section -->
        {#if insights && Object.keys(insights).length > 0}
          <div class="bg-white rounded-2xl border border-slate-200 p-8">
            <h3 class="text-xl font-semibold text-slate-900 mb-6">Property Insights</h3>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {#each Object.entries(insights) as [key, value]}
                <div class="bg-slate-50 rounded-xl p-4">
                  <div class="text-sm font-medium text-slate-600 capitalize mb-1">
                    {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                  </div>
                  <div class="text-lg font-semibold text-slate-900">
                    {typeof value === 'number' ? value.toFixed(1) : value}
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>
