<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { ListingService } from '$lib/db/listingService';
  import { ReviewService } from '$lib/db/reviewService';
  import type { ListingWithStats } from '$lib/db/listingService';
  import type { ReviewWithDetails } from '$lib/db/reviewService';
  
  let listing: ListingWithStats | null = null;
  let selectedReviews: ReviewWithDetails[] = [];
  let loading = true;

  $: slug = $page.params.slug;

  onMount(async () => {
    if (slug) {
      try {
        // Load listing data
        listing = await ListingService.getListingBySlug(slug);
        
        // Load selected reviews for this listing
        if (listing) {
          selectedReviews = await ReviewService.getSelectedReviewsForProperty(listing.id);
        }
      } catch (error) {
        console.error('Error loading property data:', error);
      } finally {
        loading = false;
      }
    }
  });

  // Mock data for missing property fields
  $: mockPropertyData = {
    imageGallery: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    bedrooms: 2,
    bathrooms: 2,
    guestCapacity: 4,
    pricePerNight: 185,
    cleaningFee: 75,
    serviceFee: 25,
    amenities: [
      'WiFi', 'Kitchen', 'Washer', 'Dryer', 'Air conditioning',
      'Heating', 'Workspace', 'TV', 'Hair dryer', 'Iron'
    ],
    description: 'Beautiful and modern apartment in the heart of the city. Perfect for business travelers and families alike.',
    location: listing?.address || 'Downtown Area'
  };
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  function getChannelBadge(channel: string) {
    const baseClass = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";
    
    switch(channel.toLowerCase()) {
      case 'airbnb': return `${baseClass} bg-red-50 text-red-700`;
      case 'booking.com': return `${baseClass} bg-blue-50 text-blue-700`;
      case 'google': return `${baseClass} bg-green-50 text-green-700`;
      default: return `${baseClass} bg-slate-100 text-slate-700`;
    }
  }
  
  function renderStars(rating: number) {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    
    for (let i = 0; i < fullStars; i++) {
      stars.push('full');
    }
    
    if (hasHalfStar) {
      stars.push('half');
    }
    
    while (stars.length < 5) {
      stars.push('empty');
    }
    
    return stars;
  }
</script>

<svelte:head>
  <title>{listing?.title || 'Property'} - Flex Living</title>
  <meta name="description" content="Luxury accommodation with exceptional guest reviews and premium amenities." />
</svelte:head>

{#if loading}
  <div class="min-h-screen bg-slate-50 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-slate-600">Loading property details...</p>
    </div>
  </div>
{:else if !listing}
  <div class="min-h-screen bg-slate-50 flex items-center justify-center">
    <div class="text-center">
      <h1 class="text-2xl font-bold text-slate-900 mb-4">Property Not Found</h1>
      <p class="text-slate-600 mb-6">The property you're looking for doesn't exist.</p>
      <a href="/listings" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
        View All Properties
      </a>
    </div>
  </div>
{:else}
  <div class="min-h-screen bg-slate-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b border-slate-100">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-8">
            <a href="/" class="text-2xl font-bold text-slate-900">Flex Living</a>
            <div class="hidden md:flex items-center space-x-6">
              <a href="#overview" class="text-slate-600 hover:text-slate-900 transition-colors">Overview</a>
              <a href="#amenities" class="text-slate-600 hover:text-slate-900 transition-colors">Amenities</a>
              <a href="#reviews" class="text-slate-600 hover:text-slate-900 transition-colors">Reviews</a>
              <a href="#location" class="text-slate-600 hover:text-slate-900 transition-colors">Location</a>
            </div>
          </div>
          <button class="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-xl hover:from-blue-600 hover:to-blue-700 transition-colors">
            Book Now
          </button>
        </div>
      </div>
    </nav>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Property Header -->
      <div class="mb-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 class="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{listing.title}</h1>
            <div class="flex items-center gap-4 text-slate-600">
              <div class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>{mockPropertyData.location}</span>
              </div>
              <span class={getChannelBadge(listing.channel)}>{listing.channel}</span>
            </div>
          </div>
          <div class="flex items-center gap-4">
            <div class="text-right">
              <div class="flex items-center gap-1 justify-end">
                {#each renderStars(listing.avgRating || 0) as star}
                  <svg class="w-4 h-4 {star === 'full' ? 'text-yellow-400 fill-current' : star === 'half' ? 'text-yellow-400' : 'text-slate-300'}" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                {/each}
              </div>
              <div class="text-sm text-slate-600 mt-1">
                {(listing.avgRating || 0).toFixed(1)} • {listing.reviewCount} reviews
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Property Images -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-12" id="overview">
        <div class="relative aspect-[4/3] rounded-2xl overflow-hidden">
          <img 
            src={mockPropertyData.imageGallery[0]} 
            alt="Main property view"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="grid grid-cols-2 gap-4">
          {#each mockPropertyData.imageGallery.slice(1) as image, index}
            <div class="aspect-[4/3] rounded-2xl overflow-hidden">
              <img 
                src={image} 
                alt={`Property view ${index + 2}`}
                class="w-full h-full object-cover"
              />
            </div>
          {/each}
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-12">
          <!-- Property Details -->
          <section>
            <div class="border-b border-slate-200 pb-6 mb-6">
              <h2 class="text-2xl font-semibold text-slate-900 mb-4">About this place</h2>
              <div class="flex items-center gap-8 text-slate-600 mb-4">
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                  </svg>
                  <span>{mockPropertyData.bedrooms} bedrooms</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11M20 10v11"/>
                  </svg>
                  <span>{mockPropertyData.bathrooms} bathrooms</span>
                </div>
                <div class="flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span>{mockPropertyData.guestCapacity} guests</span>
                </div>
              </div>
              <p class="text-slate-700 leading-relaxed">{mockPropertyData.description}</p>
            </div>
          </section>

          <!-- Amenities -->
          <section id="amenities">
            <h2 class="text-2xl font-semibold text-slate-900 mb-6">What this place offers</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              {#each mockPropertyData.amenities as amenity}
                <div class="flex items-center gap-3 p-3 rounded-lg border border-slate-100">
                  <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  <span class="text-slate-700">{amenity}</span>
                </div>
              {/each}
            </div>
          </section>

          <!-- Guest Reviews -->
          <section id="reviews">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-2xl font-semibold text-slate-900">Guest Reviews</h2>
              <div class="flex items-center gap-2">
                <div class="flex items-center gap-1">
                  {#each renderStars(listing.avgRating || 0) as star}
                    <svg class="w-4 h-4 {star === 'full' ? 'text-yellow-400 fill-current' : star === 'half' ? 'text-yellow-400' : 'text-slate-300'}" viewBox="0 0 24 24">
                      <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                    </svg>
                  {/each}
                </div>
                <span class="text-lg font-semibold text-slate-900">{(listing.avgRating || 0).toFixed(1)}</span>
                <span class="text-slate-600">({listing.reviewCount} reviews)</span>
              </div>
            </div>

            {#if selectedReviews.length > 0}
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {#each selectedReviews as review}
                  <div class="bg-white rounded-xl p-6 border border-slate-100">
                    <div class="flex items-start justify-between mb-4">
                      <div>
                        <h4 class="font-semibold text-slate-900">{review.guestName}</h4>
                        <div class="flex items-center gap-2 mt-1">
                          <span class={getChannelBadge(review.channel)}>{review.channel}</span>
                          <span class="text-sm text-slate-500">{formatDate(review.submittedAt)}</span>
                        </div>
                      </div>
                      <div class="flex items-center gap-1">
                        {#each renderStars(review.overallRating || 0) as star}
                          <svg class="w-4 h-4 {star === 'full' ? 'text-yellow-400 fill-current' : star === 'half' ? 'text-yellow-400' : 'text-slate-300'}" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                          </svg>
                        {/each}
                      </div>
                    </div>
                    <p class="text-slate-700 leading-relaxed">{review.publicReview}</p>
                  </div>
                {/each}
              </div>
            {:else}
              <div class="text-center py-8">
                <div class="text-slate-400 mb-2">
                  <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </div>
                <p class="text-slate-600">No reviews selected for display yet.</p>
              </div>
            {/if}
          </section>
        </div>

        <!-- Sidebar -->
        <div class="space-y-6">
          <!-- Booking Card -->
          <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-6 sticky top-6">
            <div class="text-center mb-6">
              <div class="text-3xl font-bold text-slate-900 mb-1">${mockPropertyData.pricePerNight}<span class="text-lg font-normal text-slate-600">/night</span></div>
              <div class="text-sm text-slate-500">Minimum 2 nights</div>
            </div>
            
            <div class="space-y-4 mb-6">
              <div class="grid grid-cols-2 gap-2">
                <div class="border border-slate-200 rounded-xl p-3">
                  <div class="text-xs font-medium text-slate-600 mb-1">CHECK-IN</div>
                  <div class="text-sm text-slate-900">Add date</div>
                </div>
                <div class="border border-slate-200 rounded-xl p-3">
                  <div class="text-xs font-medium text-slate-600 mb-1">CHECK-OUT</div>
                  <div class="text-sm text-slate-900">Add date</div>
                </div>
              </div>
              <div class="border border-slate-200 rounded-xl p-3">
                <div class="text-xs font-medium text-slate-600 mb-1">GUESTS</div>
                <div class="text-sm text-slate-900">1 guest</div>
              </div>
            </div>
            
            <button class="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-colors mb-4">
              Reserve
            </button>
            
            <div class="text-center text-sm text-slate-500 mb-4">You won't be charged yet</div>
            
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-slate-600">${mockPropertyData.pricePerNight} × 5 nights</span>
                <span class="text-slate-900">${mockPropertyData.pricePerNight * 5}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Cleaning fee</span>
                <span class="text-slate-900">${mockPropertyData.cleaningFee}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Service fee</span>
                <span class="text-slate-900">${mockPropertyData.serviceFee}</span>
              </div>
              <hr class="my-3">
              <div class="flex justify-between font-semibold">
                <span class="text-slate-900">Total</span>
                <span class="text-slate-900">${mockPropertyData.pricePerNight * 5 + mockPropertyData.cleaningFee + mockPropertyData.serviceFee}</span>
              </div>
            </div>
          </div>

          <!-- Host Information -->
          <div class="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">Hosted by Sarah</h3>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                S
              </div>
              <div>
                <div class="font-medium text-slate-900">Sarah Johnson</div>
                <div class="text-sm text-slate-500">Superhost • 2 years hosting</div>
              </div>
            </div>
            <div class="space-y-2 text-sm text-slate-600">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                Response rate: 100%
              </div>
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Response time: within an hour
              </div>
            </div>
            <button class="w-full mt-4 border border-slate-200 text-slate-700 py-2 rounded-xl hover:bg-slate-50 transition-colors">
              Contact Host
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
{/if} 
            src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&h=300" 
            alt="Bedroom view"
            class="w-full h-full object-cover"
          />
        </div>
        <div class="aspect-[4/3] rounded-2xl overflow-hidden relative">
          <img 
            src="https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=400&h=300" 
            alt="Bathroom view"
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span class="text-white font-medium">+12 more</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Property Details Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
      <!-- Main Content -->
      <div class="lg:col-span-2 space-y-8">
        <!-- Property Description -->
        <section class="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
          <h2 class="text-2xl font-semibold text-slate-900 mb-4">About this space</h2>
          <div class="prose prose-slate max-w-none">
            <p class="text-slate-600 leading-relaxed">
              Experience luxury living in this beautifully designed space that combines modern amenities with comfort and style. 
              Perfect for both business and leisure travelers, this property offers a serene retreat while keeping you connected 
              to the vibrant city life.
            </p>
            <p class="text-slate-600 leading-relaxed">
              The space features thoughtfully curated interiors, premium furnishings, and all the amenities you need for a 
              comfortable stay. Whether you're here for a few days or an extended period, you'll find everything you need to 
              feel at home.
            </p>
          </div>
        </section>

        <!-- Amenities -->
        <section class="bg-white rounded-2xl shadow-card border border-slate-100 p-6" id="amenities">
          <h2 class="text-2xl font-semibold text-slate-900 mb-6">Amenities</h2>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            {#each [
              { name: 'WiFi', icon: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0' },
              { name: 'Kitchen', icon: 'M3 6h18M3 6v14a2 2 0 002 2h14a2 2 0 002-2V6M3 6V4a2 2 0 012-2h14a2 2 0 012 2v2' },
              { name: 'Parking', icon: 'M9 17a2 2 0 11-4 0 2 2 0 014 0zM21 17a2 2 0 11-4 0 2 2 0 014 0zM6 12V4a2 2 0 012-2h8a2 2 0 012 2v8' },
              { name: 'Air Conditioning', icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' },
              { name: 'TV', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
              { name: 'Washer', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' }
            ] as amenity}
              <div class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                <svg class="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={amenity.icon}/>
                </svg>
                <span class="text-sm font-medium text-slate-700">{amenity.name}</span>
              </div>
            {/each}
          </div>
        </section>

        <!-- Guest Reviews Section -->
        <section class="bg-white rounded-2xl shadow-card border border-slate-100 p-6" id="reviews">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-2xl font-semibold text-slate-900">Guest Reviews</h2>
            <div class="flex items-center gap-2">
              <div class="flex items-center gap-1">
                {#each renderStars(property?.avgRating || 4.8) as star}
                  <svg class="w-4 h-4 {star === 'full' ? 'text-yellow-400 fill-current' : star === 'half' ? 'text-yellow-400' : 'text-slate-300'}" viewBox="0 0 24 24">
                    <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                  </svg>
                {/each}
              </div>
              <span class="text-lg font-semibold text-slate-900">{(property?.avgRating || 4.8).toFixed(1)}</span>
              <span class="text-slate-500">({selectedReviews.length} reviews)</span>
            </div>
          </div>

          {#if selectedReviews.length > 0}
            <div class="space-y-6">
              {#each selectedReviews as review}
                <div class="border-b border-slate-100 last:border-b-0 pb-6 last:pb-0">
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {review.guestName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div class="font-medium text-slate-900">{review.guestName}</div>
                        <div class="text-sm text-slate-500">{formatDate(review.submittedAt)}</div>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class={getChannelBadge(review.channel)}>{review.channel}</span>
                      {#if review.overallRating}
                        <div class="flex items-center gap-1">
                          <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 24 24">
                            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                          </svg>
                          <span class="text-sm font-medium text-slate-700">{review.overallRating}/10</span>
                        </div>
                      {/if}
                    </div>
                  </div>
                  <p class="text-slate-600 leading-relaxed">{review.publicReview}</p>
                  
                  {#if review.categoriesJson}
                    {@const categories = JSON.parse(review.categoriesJson)}
                    {#if categories.length > 0}
                      <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                        {#each categories as category}
                          <div class="text-center p-2 bg-slate-50 rounded-lg">
                            <div class="text-xs font-medium text-slate-600 mb-1">{category.category}</div>
                            <div class="text-sm font-semibold text-slate-900">{category.rating}/10</div>
                          </div>
                        {/each}
                      </div>
                    {/if}
                  {/if}
                </div>
              {/each}
            </div>
          {:else}
            <div class="text-center py-8">
              <div class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                </svg>
              </div>
              <h3 class="text-lg font-medium text-slate-900 mb-2">No reviews yet</h3>
              <p class="text-slate-500">Be the first to leave a review for this property.</p>
            </div>
          {/if}
        </section>
      </div>

      <!-- Sidebar -->
      <div class="space-y-6">
        <!-- Booking Card -->
        <div class="bg-white rounded-2xl shadow-card border border-slate-100 p-6 sticky top-6">
          <div class="text-center mb-6">
            <div class="text-3xl font-bold text-slate-900 mb-1">$120<span class="text-lg font-normal text-slate-600">/night</span></div>
            <div class="text-sm text-slate-500">Minimum 2 nights</div>
          </div>
          
          <div class="space-y-4 mb-6">
            <div class="grid grid-cols-2 gap-2">
              <div class="border border-slate-200 rounded-xl p-3">
                <div class="text-xs font-medium text-slate-600 mb-1">CHECK-IN</div>
                <div class="text-sm text-slate-900">Add date</div>
              </div>
              <div class="border border-slate-200 rounded-xl p-3">
                <div class="text-xs font-medium text-slate-600 mb-1">CHECK-OUT</div>
                <div class="text-sm text-slate-900">Add date</div>
              </div>
            </div>
            <div class="border border-slate-200 rounded-xl p-3">
              <div class="text-xs font-medium text-slate-600 mb-1">GUESTS</div>
              <div class="text-sm text-slate-900">1 guest</div>
            </div>
          </div>
          
          <button class="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white py-3 rounded-xl font-medium hover:from-brand-600 hover:to-brand-700 transition-colors mb-4">
            Reserve
          </button>
          
          <div class="text-center text-sm text-slate-500 mb-4">You won't be charged yet</div>
          
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-slate-600">$120 × 5 nights</span>
              <span class="text-slate-900">$600</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Cleaning fee</span>
              <span class="text-slate-900">$50</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-600">Service fee</span>
              <span class="text-slate-900">$87</span>
            </div>
            <hr class="my-3">
            <div class="flex justify-between font-semibold">
              <span class="text-slate-900">Total</span>
              <span class="text-slate-900">$737</span>
            </div>
          </div>
        </div>

        <!-- Host Information -->
        <div class="bg-white rounded-2xl shadow-card border border-slate-100 p-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">Hosted by Sarah</h3>
          <div class="flex items-center gap-3 mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white font-semibold">
              S
            </div>
            <div>
              <div class="font-medium text-slate-900">Sarah Johnson</div>
              <div class="text-sm text-slate-500">Superhost • 2 years hosting</div>
            </div>
          </div>
          <div class="space-y-2 text-sm text-slate-600">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Response rate: 100%
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Response time: within an hour
            </div>
          </div>
          <button class="w-full mt-4 border border-slate-200 text-slate-700 py-2 rounded-xl hover:bg-slate-50 transition-colors">
            Contact Host
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
