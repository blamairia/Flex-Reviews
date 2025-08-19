<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  import GoogleMap from '$lib/components/GoogleMap.svelte';
  import AmenitiesModal from '$lib/components/AmenitiesModal.svelte';
  import { categorizeAmenities } from '$lib/utils/amenities';
  
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
  let galleryOpen = false;
  let activeImageIndex = 0;
  let bookingSheetOpen = false;
  let showFullDescription = false;
  let activeSection = 'overview';
  let amenitiesModalOpen = false;
  let showAmenitiesModal = false;
  let sidebarCollapsed = false;
  
  // Reactive computations  
  $: property = data.property || {};
  $: reviews = data.reviews?.reviews || [];
  $: pagination = data.reviews?.pagination || { total: 0, limit: 25, offset: 0 };
  $: insights = data.insights || {};
  
  // New amenities categorization
  $: categorizedAmenities = categorizeAmenities(property.hostaway?.amenities || []);
  
  // Filter reviews by approval status for customer preview
  $: approvedReviews = reviews.filter(r => r.status === 'approved');
  $: displayedReviews = showAllReviews ? approvedReviews : approvedReviews.slice(0, 6);
  
  // Calculate rating from approved reviews only (customer view)
  $: calculatedRating = approvedReviews.length > 0 
    ? approvedReviews.reduce((sum: number, review: any) => sum + review.rating, 0) / approvedReviews.length 
    : property.summary?.avgRating || property.avgRating || 0;

  // Gallery images
  $: galleryImages = property.hostaway?.images || [];
  $: heroImages = galleryImages.slice(0, 5);
  
  // Highlights chips
  $: highlights = [
    property.hostaway?.personCapacity && `${property.hostaway.personCapacity} guests`,
    property.hostaway?.bedroomsNumber && `${property.hostaway.bedroomsNumber} bedrooms`,
    property.hostaway?.bathroomsNumber && `${property.hostaway.bathroomsNumber} bathrooms`,
    property.hostaway?.price && formatPrice(property.hostaway.price) + '/night',
    property.hostaway?.amenities?.find(a => a.name?.toLowerCase().includes('wifi')) && 'WiFi'
  ].filter(Boolean);

  // Amenities grouping
  function groupAmenities(amenities: any[]) {
    if (!amenities) return {};
    
    const groups: Record<string, any[]> = {
      'Essentials': [],
      'Kitchen': [],
      'Laundry': [],
      'Entertainment': [],
      'Safety': [],
      'Accessibility': []
    };
    
    amenities.forEach(amenity => {
      const name = amenity.name?.toLowerCase() || '';
      if (name.includes('wifi') || name.includes('internet') || name.includes('heating') || name.includes('air conditioning')) {
        groups.Essentials.push(amenity);
      } else if (name.includes('kitchen') || name.includes('refrigerator') || name.includes('microwave') || name.includes('dishwasher')) {
        groups.Kitchen.push(amenity);
      } else if (name.includes('washing') || name.includes('dryer') || name.includes('laundry')) {
        groups.Laundry.push(amenity);
      } else if (name.includes('tv') || name.includes('netflix') || name.includes('entertainment')) {
        groups.Entertainment.push(amenity);
      } else if (name.includes('smoke') || name.includes('detector') || name.includes('security') || name.includes('safe')) {
        groups.Safety.push(amenity);
      } else if (name.includes('accessible') || name.includes('wheelchair')) {
        groups.Accessibility.push(amenity);
      } else {
        groups.Essentials.push(amenity);
      }
    });
    
    // Remove empty groups
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });
    
    return groups;
  }
  
  $: amenityGroups = groupAmenities(property.hostaway?.amenities);

  // Gallery functions
  function openGallery(index: number) {
    activeImageIndex = index;
    galleryOpen = true;
    if (browser) {
      document.body.style.overflow = 'hidden';
    }
  }
  
  function closeGallery() {
    galleryOpen = false;
    if (browser) {
      document.body.style.overflow = '';
    }
  }
  
  function nextImage() {
    activeImageIndex = (activeImageIndex + 1) % galleryImages.length;
  }
  
  function prevImage() {
    activeImageIndex = (activeImageIndex - 1 + galleryImages.length) % galleryImages.length;
  }

  // Keyboard navigation
  function handleKeydown(event: KeyboardEvent) {
    if (galleryOpen) {
      switch (event.key) {
        case 'Escape':
          closeGallery();
          break;
        case 'ArrowLeft':
          prevImage();
          break;
        case 'ArrowRight':
          nextImage();
          break;
      }
    } else if (showAmenitiesModal && event.key === 'Escape') {
      showAmenitiesModal = false;
    } else if (event.key === 'b' && event.ctrlKey) {
      // Ctrl+B to toggle sidebar
      event.preventDefault();
      sidebarCollapsed = !sidebarCollapsed;
    }
  }

  // Scroll spy for anchor navigation
  function updateActiveSection() {
    if (!browser) return;
    
    const sections = ['overview', 'amenities', 'reviews', 'location', 'policies'];
    const scrollTop = window.scrollY + 100;
    
    for (let i = sections.length - 1; i >= 0; i--) {
      const element = document.getElementById(sections[i]);
      if (element && element.offsetTop <= scrollTop) {
        activeSection = sections[i];
        break;
      }
    }
  }
  
  function scrollToSection(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  onMount(() => {
    if (browser) {
      window.addEventListener('scroll', updateActiveSection);
      return () => window.removeEventListener('scroll', updateActiveSection);
    }
  });

  // Amenity icon mapping
  function amenityIcon(name: string): string {
    const n = name.toLowerCase();
    if (/(wifi|internet)/.test(n)) return 'wifi';
    if (/wash(ing)? machine|laundry/.test(n)) return 'washer';
    if (/(tv|smart tv|cable tv)/.test(n)) return 'tv';
    if (/kettle|microwave|oven|stove|toaster|refrigerator|fridge|dishwasher|kitchen/.test(n)) return 'kitchen';
    if (/shower|tub|bath|hot water|toilet/.test(n)) return 'bath';
    if (/smoke detector/.test(n)) return 'smoke';
    if (/carbon monoxide/.test(n)) return 'co';
    if (/heating|ac|air|hot water/.test(n)) return 'thermo';
    if (/hangers|iron|linens|towels|shampoo|essentials/.test(n)) return 'closet';
    if (/garden|backyard/.test(n)) return 'garden';
    return 'dot';
  }

  // Icon SVG generator
  function getIcon(id: string): string {
    const common = 'width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" class="text-slate-600" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    const circle = '<span class="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">';
    const end = '</span>';

    const paths: Record<string, string> = {
      wifi: `<svg ${common}><path d="M5 12a9 9 0 0 1 14 0"/><path d="M8.5 15.5a5 5 0 0 1 7 0"/><path d="M12 19h.01"/></svg>`,
      washer: `<svg ${common}><rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="13" r="5"/></svg>`,
      tv: `<svg ${common}><rect x="3" y="5" width="18" height="12" rx="2"/><path d="M7 21h10"/></svg>`,
      kitchen: `<svg ${common}><path d="M4 3h16v6H4z"/><path d="M9 9v12"/><path d="M15 9v12"/></svg>`,
      bath: `<svg ${common}><path d="M3 13h18"/><path d="M5 13V7a2 2 0 0 1 2-2h1"/><path d="M7 21h10"/><path d="M5 17h14"/></svg>`,
      smoke: `<svg ${common}><circle cx="12" cy="12" r="8"/><path d="M8 12h8"/></svg>`,
      co: `<svg ${common}><circle cx="12" cy="12" r="8"/><path d="M9.5 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"/><path d="M18 10h-3v4h3"/></svg>`,
      thermo: `<svg ${common}><path d="M14 14a4 4 0 1 1-6 3.46V5a2 2 0 1 1 4 0v12"/></svg>`,
      closet: `<svg ${common}><path d="M6 3v18"/><path d="M18 3v18"/><path d="M3 7h18"/></svg>`,
      garden: `<svg ${common}><path d="M12 22v-7"/><path d="M7 15c0-3 2-5 5-5s5 2 5 5"/><path d="M5 22h14"/></svg>`,
      dot: `<svg ${common}><circle cx="12" cy="12" r="5"/></svg>`
    };
    return circle + (paths[id] || paths.dot) + end;
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
  
  function getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + (hasHalfStar ? '☆' : '') + '☆'.repeat(emptyStars);
  }
</script>

<svelte:head>
  <title>{property.name || 'Property Details'} - Reviews Dashboard</title>
  {#if property.description}
    <meta name="description" content={property.description.replace(/\n/g, ' ').slice(0, 160)} />
  {/if}
</svelte:head>

<svelte:window on:keydown={handleKeydown} />

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
        </div>
        
        <div class="flex items-center gap-3">
          <button 
            class="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors hidden lg:flex"
            on:click={() => sidebarCollapsed = !sidebarCollapsed}
            title="Toggle booking sidebar (Ctrl+B)"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
            {sidebarCollapsed ? 'Show' : 'Hide'} Booking
          </button>
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

  <!-- Hero Mosaic Gallery -->
  <div class="relative">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {#if heroImages.length > 0}
        <div class="grid grid-cols-12 gap-2 md:gap-3 rounded-2xl overflow-hidden">
          <!-- Large image -->
          <button 
            class="col-span-12 md:col-span-8 aspect-[4/3] relative group cursor-pointer bg-transparent border-none p-0" 
            on:click={() => openGallery(0)}
            aria-label="Open photo gallery"
          >
            <img 
              src={heroImages[0].url} 
              alt={heroImages[0].caption || property.name}
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            
            <!-- Overlay info (desktop only) -->
            <div class="absolute bottom-4 left-4 text-white hidden md:block">
              <h1 class="text-2xl font-bold mb-1">{property.name}</h1>
              <div class="flex items-center gap-3 text-sm">
                <span>{property.hostaway?.location?.city}, {property.hostaway?.location?.country}</span>
                {#if calculatedRating > 0}
                  <span>•</span>
                  <div class="flex items-center gap-1">
                    <span class="text-yellow-400">★</span>
                    <span>{calculatedRating.toFixed(1)}</span>
                    <span>({approvedReviews.length} reviews)</span>
                  </div>
                {/if}
              </div>
            </div>
          </button>
          
          <!-- Small tiles -->
          {#if heroImages.length > 1}
            <div class="col-span-12 md:col-span-4 grid grid-cols-2 gap-2 md:gap-3">
              {#each heroImages.slice(1, 5) as image, index}
                <button 
                  class="aspect-[4/3] relative group cursor-pointer bg-transparent border-none p-0" 
                  on:click={() => openGallery(index + 1)}
                  aria-label="View photo {index + 2}"
                >
                  <img 
                    src={image.url} 
                    alt={image.caption || `Photo ${index + 2}`}
                    class="w-full h-full object-cover"
                  />
                  <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
                  {#if index === 3 && galleryImages.length > 5}
                    <div class="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span class="text-white font-medium">+{galleryImages.length - 5} more</span>
                    </div>
                  {/if}
                </button>
              {/each}
            </div>
          {/if}
        </div>
      {:else}
        <!-- No images placeholder -->
        <div class="aspect-[4/3] bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
          <div class="text-center">
            <svg class="w-16 h-16 text-slate-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
            </svg>
            <h1 class="text-2xl font-bold text-slate-900 mb-2">{property.name}</h1>
            <p class="text-slate-600">No photos available</p>
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Anchor Navigation -->
  <div class="sticky top-16 bg-white/90 backdrop-blur border-b border-slate-200 z-40">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <nav class="flex space-x-8 overflow-x-auto">
        {#each [
          { id: 'overview', label: 'Overview' },
          { id: 'amenities', label: 'Amenities' },
          { id: 'reviews', label: 'Reviews' },
          { id: 'location', label: 'Location' },
          { id: 'policies', label: 'Policies' }
        ] as section}
          <button
            class="flex-shrink-0 py-4 border-b-2 transition-colors {activeSection === section.id ? 'border-brand-500 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}"
            on:click={() => scrollToSection(section.id)}
          >
            {section.label}
          </button>
        {/each}
      </nav>
    </div>
  </div>

  <!-- Main Content -->
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
      <!-- Left Column -->
      <div class="lg:col-span-2 space-y-12 {sidebarCollapsed ? 'lg:col-span-3' : 'lg:col-span-2'} transition-all duration-300">
        
        <!-- Overview Section -->
        <section id="overview" class="scroll-mt-32">
          <div class="space-y-6">
            <!-- Mobile title (hidden on desktop since it's in hero overlay) -->
            <div class="md:hidden">
              <h1 class="text-2xl font-bold text-slate-900">{property.name}</h1>
              <div class="flex items-center gap-3 text-slate-600 mt-1">
                <span>{property.hostaway?.location?.city}, {property.hostaway?.location?.country}</span>
                {#if calculatedRating > 0}
                  <span>•</span>
                  <div class="flex items-center gap-1">
                    <span class="text-yellow-500">★</span>
                    <span>{calculatedRating.toFixed(1)}</span>
                    <span>({approvedReviews.length})</span>
                  </div>
                {/if}
              </div>
            </div>
            
            <!-- Highlights chips -->
            {#if highlights.length > 0}
              <div class="flex flex-wrap gap-2">
                {#each highlights as highlight}
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                    {highlight}
                  </span>
                {/each}
              </div>
            {/if}
            
            <!-- Description -->
            {#if property.description}
              <div class="prose prose-slate max-w-none">
                <div class="text-slate-700 leading-relaxed {showFullDescription ? '' : 'line-clamp-6'}">
                  {property.description}
                </div>
                {#if property.description.length > 400}
                  <button
                    class="text-brand-600 hover:text-brand-700 font-medium mt-2"
                    on:click={() => showFullDescription = !showFullDescription}
                  >
                    {showFullDescription ? 'Show less' : 'Show more'}
                  </button>
                {/if}
              </div>
            {/if}
          </div>
        </section>

        <!-- Amenities Section -->
        {#if property.hostaway?.amenities && property.hostaway.amenities.length > 0}
          <section id="amenities" class="scroll-mt-32">
            <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div class="p-8 border-b border-slate-200">
                <div class="flex items-center justify-between">
                  <div>
                    <h2 class="text-2xl font-bold text-slate-900">Amenities</h2>
                    <p class="text-slate-600 mt-1">{property.hostaway.amenities.length} amenities available</p>
                  </div>
                  {#if property.hostaway.amenities.length > 9}
                    <button
                      class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-medium transition-colors"
                      on:click={() => showAmenitiesModal = true}
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                      </svg>
                      Show All Amenities
                    </button>
                  {/if}
                </div>
              </div>
              
              <div class="p-8">
                <!-- 3×3 Preview Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {#each (property.hostaway?.amenities || []).slice(0, 9) as amenity}
                    <div class="flex items-center gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                      <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                        {@html getIcon(amenityIcon(amenity.name))}
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-slate-900 truncate">{amenity.name}</div>
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
            </div>
          </section>
        {/if}

        <!-- Reviews Section -->
        <section id="reviews" class="scroll-mt-32">
          <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <!-- Reviews Header -->
            <div class="p-8 border-b border-slate-200">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-2xl font-bold text-slate-900">Guest Reviews</h2>
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
                        
                        <div class="flex items-center gap-1">
                          <span class="text-lg">{getRatingStars(review.rating)}</span>
                          <span class="text-sm font-medium text-slate-900">{review.rating}</span>
                        </div>
                      </div>
                      
                      <!-- Review Content -->
                      <div class="text-slate-700 leading-relaxed mb-4">
                        {review.comment || 'No comment provided.'}
                      </div>
                      
                      <!-- Category Ratings -->
                      {#if review.categories && Object.keys(review.categories).length > 0}
                        <div class="border-t border-slate-200 pt-4">
                          <div class="flex flex-wrap gap-2">
                            {#each Object.entries(review.categories) as [category, rating]}
                              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                                {category} {rating}/5
                              </span>
                            {/each}
                          </div>
                        </div>
                      {/if}
                    </div>
                  {/each}
                  
                  <!-- View All/Show Less -->
                  {#if approvedReviews.length > 6}
                    <div class="flex items-center justify-center pt-6 border-t border-slate-200">
                      <button
                        class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl font-medium transition-colors"
                        on:click={() => showAllReviews = !showAllReviews}
                      >
                        {#if showAllReviews}
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                          </svg>
                          Show Less
                        {:else}
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                          </svg>
                          View All Reviews
                        {/if}
                      </button>
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
          </div>
        </section>

        <!-- Location Section -->
        {#if property.hostaway?.location}
          <section id="location" class="scroll-mt-32">
            <GoogleMap {property} />
          </section>
        {/if}

        <!-- Policies Section -->
        {#if property.hostaway?.policies}
          <section id="policies" class="scroll-mt-32">
            <h2 class="text-2xl font-bold text-slate-900 mb-6">Policies</h2>
            <div class="space-y-6">
              <!-- Check-in/Check-out -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 class="font-semibold text-slate-900 mb-3">Check-in</h3>
                  <p class="text-slate-600">{property.hostaway.policies.checkInTime || '3:00 PM - 9:00 PM'}</p>
                </div>
                <div class="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 class="font-semibold text-slate-900 mb-3">Check-out</h3>
                  <p class="text-slate-600">{property.hostaway.policies.checkOutTime || 'Before 11:00 AM'}</p>
                </div>
              </div>

              <!-- House Rules -->
              <div class="bg-white rounded-2xl border border-slate-200 p-6">
                <h3 class="font-semibold text-slate-900 mb-4">House Rules</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div class="text-center p-3 bg-slate-50 rounded-lg">
                    <div class="text-sm text-slate-600">Smoking</div>
                    <div class="font-medium text-slate-900">{property.hostaway.policies.smoking ? 'Allowed' : 'Not allowed'}</div>
                  </div>
                  <div class="text-center p-3 bg-slate-50 rounded-lg">
                    <div class="text-sm text-slate-600">Pets</div>
                    <div class="font-medium text-slate-900">{property.hostaway.policies.pets ? 'Allowed' : 'Not allowed'}</div>
                  </div>
                  <div class="text-center p-3 bg-slate-50 rounded-lg">
                    <div class="text-sm text-slate-600">Parties</div>
                    <div class="font-medium text-slate-900">{property.hostaway.policies.parties ? 'Allowed' : 'Not allowed'}</div>
                  </div>
                  <div class="text-center p-3 bg-slate-50 rounded-lg">
                    <div class="text-sm text-slate-600">Deposit</div>
                    <div class="font-medium text-slate-900">{property.hostaway.policies.securityDeposit || 'None'}</div>
                  </div>
                </div>
              </div>

              <!-- Cancellation Policy -->
              {#if property.hostaway.policies.cancellationPolicy}
                <div class="bg-white rounded-2xl border border-slate-200 p-6">
                  <h3 class="font-semibold text-slate-900 mb-3">Cancellation Policy</h3>
                  <div class="text-slate-600">
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
              {/if}
            </div>
          </section>
        {/if}
      </div>

      <!-- Right Column - Sticky Booking Card -->
      <div class="lg:col-span-1 {sidebarCollapsed ? 'hidden lg:hidden' : 'block'} transition-all duration-300">
        <div class="lg:sticky lg:top-24">
          <div class="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg relative">
            <!-- Collapse Toggle Button -->
            <button
              class="absolute -left-3 top-4 w-6 h-6 bg-white border border-slate-200 rounded-full shadow-md hover:shadow-lg transition-shadow flex items-center justify-center text-slate-600 hover:text-slate-900 hidden lg:flex"
              on:click={() => sidebarCollapsed = !sidebarCollapsed}
              aria-label="Collapse booking sidebar"
            >
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
            {#if property.hostaway?.price}
              <div class="text-2xl font-bold text-slate-900 mb-1">
                {formatPrice(property.hostaway.price)}
                <span class="text-base font-normal text-slate-600">/night</span>
              </div>
            {/if}
            
            <div class="space-y-4 mt-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="border border-slate-200 rounded-lg p-3">
                  <div class="text-xs font-medium text-slate-500 uppercase tracking-wide">Check-in</div>
                  <div class="text-sm text-slate-900 mt-1">Add dates</div>
                </div>
                <div class="border border-slate-200 rounded-lg p-3">
                  <div class="text-xs font-medium text-slate-500 uppercase tracking-wide">Check-out</div>
                  <div class="text-sm text-slate-900 mt-1">Add dates</div>
                </div>
              </div>
              
              <div class="border border-slate-200 rounded-lg p-3">
                <div class="text-xs font-medium text-slate-500 uppercase tracking-wide">Guests</div>
                <div class="text-sm text-slate-900 mt-1">
                  {property.hostaway?.personCapacity ? `Up to ${property.hostaway.personCapacity} guests` : '1 guest'}
                </div>
              </div>
              
              <button class="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-medium py-3 px-4 rounded-xl transition-colors">
                Check availability
              </button>
              
              <p class="text-xs text-slate-500 text-center">You won't be charged yet</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Collapsed Sidebar Toggle (Floating Button) -->
  {#if sidebarCollapsed}
    <div class="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:block">
      <button
        class="bg-white border border-slate-200 rounded-2xl p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex flex-col items-center gap-2 text-slate-600 hover:text-slate-900"
        on:click={() => sidebarCollapsed = false}
        aria-label="Expand booking sidebar"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5l-7 7 7 7"/>
        </svg>
        <div class="text-xs font-medium text-center">
          <div>Book</div>
          <div>Now</div>
        </div>
        {#if property.hostaway?.price}
          <div class="text-xs font-bold text-brand-600">
            {formatPrice(property.hostaway.price)}
          </div>
        {/if}
      </button>
    </div>
  {/if}

  <!-- Mobile Booking Bottom Sheet -->
  <div class="lg:hidden">
    <!-- Trigger Button -->
    <div class="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 z-50">
      <button
        class="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-between"
        on:click={() => bookingSheetOpen = true}
      >
        <div class="text-left">
          {#if property.hostaway?.price}
            <div class="font-bold">{formatPrice(property.hostaway.price)}/night</div>
          {:else}
            <div class="font-bold">Check availability</div>
          {/if}
        </div>
        <span>Book now</span>
      </button>
    </div>

    <!-- Bottom Sheet -->
    {#if bookingSheetOpen}
      <div class="fixed inset-0 z-50 lg:hidden">
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-black/50" 
          role="button"
          tabindex="0"
          on:click={() => bookingSheetOpen = false}
          on:keydown={(e) => e.key === 'Enter' && (bookingSheetOpen = false)}
          aria-label="Close booking form"
        ></div>
        
        <!-- Sheet -->
        <div 
          role="dialog" 
          aria-modal="true" 
          aria-labelledby="booking-title"
          class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto"
        >
          <div class="flex items-center justify-between mb-6">
            <h3 id="booking-title" class="text-xl font-bold text-slate-900">Book your stay</h3>
            <button 
              class="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              on:click={() => bookingSheetOpen = false}
              aria-label="Close booking form"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          {#if property.hostaway?.price}
            <div class="text-2xl font-bold text-slate-900 mb-6">
              {formatPrice(property.hostaway.price)}
              <span class="text-base font-normal text-slate-600">/night</span>
            </div>
          {/if}
          
          <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="border border-slate-200 rounded-lg p-3">
                <div class="text-xs font-medium text-slate-500 uppercase tracking-wide">Check-in</div>
                <div class="text-sm text-slate-900 mt-1">Add dates</div>
              </div>
              <div class="border border-slate-200 rounded-lg p-3">
                <div class="text-xs font-medium text-slate-500 uppercase tracking-wide">Check-out</div>
                <div class="text-sm text-slate-900 mt-1">Add dates</div>
              </div>
            </div>
            
            <div class="border border-slate-200 rounded-lg p-3">
              <div class="text-xs font-medium text-slate-500 uppercase tracking-wide">Guests</div>
              <div class="text-sm text-slate-900 mt-1">
                {property.hostaway?.personCapacity ? `Up to ${property.hostaway.personCapacity} guests` : '1 guest'}
              </div>
            </div>
            
            <button class="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-medium py-3 px-4 rounded-xl transition-colors">
              Check availability
            </button>
            
            <p class="text-xs text-slate-500 text-center">You won't be charged yet</p>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- New Amenities Modal -->
<AmenitiesModal 
  bind:isOpen={showAmenitiesModal} 
  {categorizedAmenities}
  on:close={() => showAmenitiesModal = false}
/>

<!-- Gallery Modal -->
{#if galleryOpen}
  <div class="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
    <!-- Close button -->
    <button 
      class="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
      on:click={closeGallery}
      aria-label="Close gallery"
    >
      <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
      </svg>
    </button>
    
    <!-- Previous button -->
    {#if galleryImages.length > 1}
      <button 
        class="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10"
        on:click={prevImage}
        aria-label="Previous image"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
    {/if}
    
    <!-- Next button -->
    {#if galleryImages.length > 1}
      <button 
        class="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 z-10"
        on:click={nextImage}
        aria-label="Next image"
      >
        <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    {/if}
    
    <!-- Image -->
    <div class="max-w-7xl max-h-full mx-auto px-4">
      <img 
        src={galleryImages[activeImageIndex]?.url} 
        alt={galleryImages[activeImageIndex]?.caption || `Photo ${activeImageIndex + 1}`}
        class="max-w-full max-h-full object-contain"
      />
      
      <!-- Caption -->
      {#if galleryImages[activeImageIndex]?.caption}
        <div class="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-center">
          {galleryImages[activeImageIndex].caption}
        </div>
      {/if}
      
      <!-- Image counter -->
      <div class="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm">
        {activeImageIndex + 1} / {galleryImages.length}
      </div>
    </div>
  </div>
{/if}

<!-- Amenities Modal -->
<AmenitiesModal 
  bind:isOpen={showAmenitiesModal} 
  {categorizedAmenities}
  on:close={() => showAmenitiesModal = false}
/>

<style>
  :root {
    /* Primary brand gradient used across CTAs */
    --brand-500: #0ea5e9;  /* sky-500 */
    --brand-600: #0284c7;  /* sky-600 */
    --brand-700: #0369a1;  /* sky-700 */

    /* Neutrals (Slate) */
    --fg: #0f172a;         /* slate-900 headings */
    --muted: #64748b;      /* slate-500 body */
    --line: #e2e8f0;       /* slate-200 borders */
    --bg: #ffffff;         /* cards */
    --bg-alt: #f8fafc;     /* page */

    /* Semantic accents */
    --red-50: #fef2f2;   --red-600: #dc2626;
    --green-50: #f0fdf4; --green-600: #16a34a;
    --blue-50: #eff6ff;  --blue-700: #1d4ed8;
    --amber-50: #fffbeb; --amber-500: #f59e0b;
    --orange-600: #ea580c;
  }

  .line-clamp-6 {
    display: -webkit-box;
    -webkit-line-clamp: 6;
    line-clamp: 6;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
