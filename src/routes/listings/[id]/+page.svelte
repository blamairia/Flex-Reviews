<script lang="ts">
  import { goto } from '$app/navigation';
  
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
  
  // Reactive computations  
  $: property = data.property || {};
  $: reviews = data.reviews?.reviews || [];
  $: reviewStats = data.reviews?.stats || {};
  $: insights = data.insights || {};
  $: displayedReviews = showAllReviews ? reviews : reviews.slice(0, 6);
  
  // Calculate live rating from actual reviews
  $: calculatedRating = reviews.length > 0 
    ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length 
    : property.summary?.avgRating || property.avgRating || 0;
  
  $: approvedReviews = reviews.filter(r => r.status === 'approved');
  $: approvalRate = reviews.length > 0 ? (approvedReviews.length / reviews.length) * 100 : 0;
  
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
            on:click={() => window.open(`/preview/${property.slug}?key=DEMO_KEY`, '_blank')}
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
                  <div class="text-2xl font-bold text-slate-900">{reviews.length}</div>
                  <div class="text-xs text-slate-500">{Math.round(approvalRate)}% approved ({approvedReviews.length} of {reviews.length})</div>
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

        <!-- Reviews Section -->
        <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <!-- Reviews Header -->
          <div class="p-8 border-b border-slate-200">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-xl font-semibold text-slate-900">Guest Reviews</h3>
                <p class="text-slate-600 mt-1">
                  {reviews.length || 0} total reviews 
                  {#if reviewStats.averageRating}
                    • {reviewStats.averageRating.toFixed(1)} average rating
                  {/if}
                </p>
              </div>
              
              {#if reviewStats && reviewStats.sentimentBreakdown}
                <div class="flex items-center gap-6">
                  <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">{reviewStats.sentimentBreakdown.positive || 0}</div>
                    <div class="text-xs text-slate-500">Positive</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-yellow-600">{reviewStats.sentimentBreakdown.neutral || 0}</div>
                    <div class="text-xs text-slate-500">Neutral</div>
                  </div>
                  <div class="text-center">
                    <div class="text-2xl font-bold text-red-600">{reviewStats.sentimentBreakdown.negative || 0}</div>
                    <div class="text-xs text-slate-500">Negative</div>
                  </div>
                </div>
              {/if}
            </div>
          </div>
          
          <!-- Review Statistics -->
          {#if reviewStats.categoryBreakdown && Object.keys(reviewStats.categoryBreakdown).length > 0}
            <div class="p-8 border-b border-slate-200 bg-slate-50">
              <h4 class="font-semibold text-slate-900 mb-4">Category Ratings</h4>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                {#each Object.entries(reviewStats.categoryBreakdown) as [category, rating]}
                  <div class="text-center p-3 bg-white rounded-xl border border-slate-200">
                    <div class="text-sm font-medium text-slate-900 capitalize mb-1">{category}</div>
                    <div class="text-lg font-bold text-slate-900">{rating.toFixed(1)}</div>
                    <div class="text-xs text-slate-500">{getRatingStars(rating)}</div>
                  </div>
                {/each}
              </div>
            </div>
          {/if}
          
          <!-- Reviews List -->
          <div class="p-8">
            {#if reviews.length === 0}
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
                        {#if review.sentiment}
                          <span class={getSentimentBadge(review.sentiment)}>{review.sentiment}</span>
                        {/if}
                        {#if review.status}
                          <span class={getStatusBadge(review.status)}>{review.status}</span>
                        {/if}
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
                
                <!-- Show More Button -->
                {#if reviews.length > 6 && !showAllReviews}
                  <div class="text-center pt-4">
                    <button
                      on:click={() => showAllReviews = true}
                      class="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                      </svg>
                      Show {reviews.length - 6} More Reviews
                    </button>
                  </div>
                {:else if showAllReviews && reviews.length > 6}
                  <div class="text-center pt-4">
                    <button
                      on:click={() => showAllReviews = false}
                      class="inline-flex items-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                      </svg>
                      Show Less
                    </button>
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
