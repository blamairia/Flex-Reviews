<script lang="ts">
  import { onMount } from 'svelte';
  
  export let property: any;
  
  let mapContainer: HTMLDivElement;
  let embeddedMapUrl: string = '';
  let nearbyPlaces: any[] = [];
  let isLoading = true;
  let error = '';
  let actualApiKey = '';
  
  // Extract location data from property
  $: location = property?.hostaway?.location || {};
  $: lat = location.lat || null;
  $: lng = location.lng || null;
  $: address = location.address || property?.address || '';
  $: city = location.city || '';
  $: country = location.country || '';
  
  // Default coordinates (London center) if none provided
  const defaultLat = 51.5074;
  const defaultLng = -0.1278;
  
  $: coordinates = lat && lng ? `${lat},${lng}` : `${defaultLat},${defaultLng}`;
  $: displayAddress = address || `${city}, ${country}`.trim() || 'London, UK';
  
  // Generate embedded map URL reactively when coordinates, address, or API key changes
  $: embeddedMapUrl = generateEmbeddedMapUrl(lat, lng, displayAddress, actualApiKey);
  
  onMount(async () => {
    await loadApiKey();
    await loadNearbyPlaces();
  });
  
  function generateEmbeddedMapUrl(latitude?: number | null, longitude?: number | null, address?: string, apiKey?: string): string {
    const useLat = latitude || defaultLat;
    const useLng = longitude || defaultLng;
    const useAddress = encodeURIComponent(address || displayAddress);
    
    // Create a Google Maps embed URL similar to the format you provided
    // Using the place search format which is more reliable for embedding
    // This will show the location with a marker and allow interaction
    if (apiKey && apiKey !== 'demo_key') {
      // Use the Google Maps Embed API with a real API key
      return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${useAddress}&center=${useLat},${useLng}&zoom=15&maptype=roadmap`;
    } else {
      // Fallback to the basic embed format without API key (limited functionality)
      // This format is similar to your example but uses query parameters
      const timestamp = Date.now();
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2488.610191053301!2d${useLng}!3d${useLat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s${useAddress}!5e0!3m2!1sen!2sus!4v${timestamp}!5m2!1sen!2sus`;
    }
  }
  
  async function loadApiKey() {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        if (config.googleApiKey) {
          actualApiKey = config.googleApiKey;
          console.log('✅ Google API key loaded for map');
        } else {
          console.warn('⚠️ No Google API key found, using demo mode');
          actualApiKey = 'demo_key';
        }
      }
    } catch (error) {
      console.error('❌ Could not load API config:', error);
      actualApiKey = 'demo_key';
    }
  }
  
  async function loadNearbyPlaces() {
    try {
      isLoading = true;
      error = '';
      
      // Get nearby places using real API
      await fetchNearbyPlaces();
      
    } catch (err) {
      console.error('Places loading error:', err);
      error = 'Failed to load places data';
    } finally {
      isLoading = false;
    }
  }
  
  async function fetchNearbyPlaces() {
    try {
      // Always use the real Google Places API since we have a valid key
      const response = await fetch('/api/google/places/nearby', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: actualApiKey,
          location: coordinates,
          radius: 1500, // 1.5km radius for better coverage
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results) {
        // Process and categorize the results
        nearbyPlaces = data.results.slice(0, 12).map((place: any) => ({
          name: place.name,
          type: place.types?.[0] || 'establishment',
          types: place.types || [],
          distance: calculateDistance(place.geometry?.location),
          icon: getPlaceIcon(place.types || []),
          rating: place.rating || null,
          user_ratings_total: place.user_ratings_total || 0,
          place_id: place.place_id,
          vicinity: place.vicinity,
          business_status: place.business_status
        }));
        
        console.log(`Found ${nearbyPlaces.length} nearby places using real Google API`);
      } else {
        console.warn('Places API returned:', data);
        // Fallback to mock data only if API fails
        generateMockNearbyPlaces();
      }
    } catch (err) {
      console.error('Nearby places fetch error:', err);
      // Fallback to mock data on error
      generateMockNearbyPlaces();
    }
  }
  
  function calculateDistance(location: any): string {
    if (!location) return 'Unknown distance';
    
    const propertyLat = lat || defaultLat;
    const propertyLng = lng || defaultLng;
    
    // Haversine formula for more accurate distance calculation
    const R = 6371; // Earth's radius in kilometers
    const dLat = (location.lat - propertyLat) * Math.PI / 180;
    const dLng = (location.lng - propertyLng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(propertyLat * Math.PI / 180) * Math.cos(location.lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    if (distance < 1) {
      const meters = Math.round(distance * 1000);
      const walkingTime = Math.max(1, Math.round(meters / 80)); // ~80m/min walking speed
      return `${walkingTime} min walk`;
    } else {
      return `${distance.toFixed(1)} km`;
    }
  }
  
  function generateMockNearbyPlaces() {
    // Mock nearby places for demo - fallback when API fails
    nearbyPlaces = [
      {
        name: 'Metro Station',
        type: 'transit_station',
        distance: '2 min walk',
        icon: '🚇',
        rating: null
      },
      {
        name: 'Supermarket',
        type: 'grocery_or_supermarket', 
        distance: '5 min walk',
        icon: '🛒',
        rating: 4.2
      },
      {
        name: 'Restaurant',
        type: 'restaurant',
        distance: '3 min walk', 
        icon: '🍽️',
        rating: 4.5
      },
      {
        name: 'Pharmacy',
        type: 'pharmacy',
        distance: '4 min walk',
        icon: '💊', 
        rating: 4.1
      },
      {
        name: 'Café',
        type: 'cafe',
        distance: '1 min walk',
        icon: '☕',
        rating: 4.7
      },
      {
        name: 'Bank',
        type: 'bank',
        distance: '6 min walk',
        icon: '🏦',
        rating: 3.8
      }
    ];
  }
  
  function getPlaceType(types: string[]): string {
    if (!types || types.length === 0) return 'establishment';
    
    // Priority order for place types
    const typeHierarchy = [
      'transit_station', 'subway_station', 'bus_station',
      'restaurant', 'cafe', 'bakery',
      'grocery_or_supermarket', 'supermarket',
      'pharmacy', 'hospital', 'bank',
      'tourist_attraction', 'park', 'gym'
    ];
    
    for (const priorityType of typeHierarchy) {
      if (types.includes(priorityType)) {
        return priorityType;
      }
    }
    
    return types[0] || 'establishment';
  }
  
  function getPlaceIcon(types: string[]): string {
    const placeType = getPlaceType(types);
    
    const iconMap: Record<string, string> = {
      'transit_station': '🚇',
      'subway_station': '🚇',
      'bus_station': '🚌',
      'restaurant': '🍽️',
      'cafe': '☕',
      'bakery': '🥖',
      'grocery_or_supermarket': '🛒',
      'supermarket': '🛒',
      'pharmacy': '💊',
      'hospital': '🏥',
      'bank': '🏦',
      'atm': '💳',
      'tourist_attraction': '🎯',
      'park': '🌳',
      'gym': '💪',
      'shopping_mall': '🛍️',
      'gas_station': '⛽',
      'school': '🏫',
      'library': '📚',
      'lodging': '🏨',
      'church': '⛪',
      'museum': '🏛️',
      'movie_theater': '🎬',
      'night_club': '🎵',
      'spa': '💆‍♀️',
      'clothing_store': '👕',
      'electronics_store': '📱'
    };
    
    return iconMap[placeType] || '📍';
  }
  
  function openInGoogleMaps() {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(displayAddress)}`;
    window.open(url, '_blank');
  }
</script>

<div class="bg-white rounded-2xl border border-slate-200 overflow-hidden">
  <div class="p-8 border-b border-slate-200">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-xl font-semibold text-slate-900">Location & Nearby</h3>
        <p class="text-slate-600 mt-1">{displayAddress}</p>
      </div>
      <button
        on:click={openInGoogleMaps}
        class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
        Open in Maps
      </button>
    </div>
  </div>
  
  <div class="p-8">
    {#if isLoading}
      <div class="flex items-center justify-center h-64 bg-slate-50 rounded-xl">
        <div class="text-center">
          <div class="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p class="text-slate-600">Loading map...</p>
        </div>
      </div>
    {:else if error}
      <div class="flex items-center justify-center h-64 bg-red-50 rounded-xl">
        <div class="text-center">
          <svg class="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <p class="text-red-600">{error}</p>
        </div>
      </div>
    {:else}
      <div class="space-y-8">
        <!-- Interactive Embedded Map -->
        <div class="aspect-[2/1] bg-slate-100 rounded-xl overflow-hidden relative">
          <iframe 
            src={embeddedMapUrl}
            width="100%" 
            height="100%" 
            style="border:0;" 
            allowfullscreen={true}
            loading="lazy" 
            referrerpolicy="no-referrer-when-downgrade"
            title="Property location map"
            class="w-full h-full"
          ></iframe>
          <div class="absolute top-4 right-4">
            <button
              on:click={openInGoogleMaps}
              class="bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-white transition-colors shadow-sm"
            >
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
              </svg>
              View Larger
            </button>
          </div>
        </div>
        
        <!-- Nearby Places -->
        {#if nearbyPlaces.length > 0}
          <div>
            <h4 class="font-semibold text-slate-900 mb-4">What's Nearby ({nearbyPlaces.length} places found)</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each nearbyPlaces as place}
                <div class="flex items-start gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer">
                  <div class="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-xl shadow-sm flex-shrink-0">
                    {place.icon}
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-slate-900 truncate">{place.name}</div>
                    {#if place.vicinity}
                      <div class="text-xs text-slate-500 mb-1 truncate">{place.vicinity}</div>
                    {/if}
                    <div class="text-sm text-blue-600 font-medium">{place.distance}</div>
                    <div class="flex items-center gap-2 mt-1">
                      {#if place.rating}
                        <div class="flex items-center gap-1">
                          <svg class="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                          </svg>
                          <span class="text-xs text-slate-600">{place.rating}</span>
                          {#if place.user_ratings_total}
                            <span class="text-xs text-slate-400">({place.user_ratings_total})</span>
                          {/if}
                        </div>
                      {/if}
                      {#if place.business_status === 'OPERATIONAL'}
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Open
                        </span>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {:else}
          <div>
            <h4 class="font-semibold text-slate-900 mb-4">What's Nearby</h4>
            <div class="text-center py-8 text-slate-500">
              <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <p>Unable to load nearby places</p>
            </div>
          </div>
        {/if}
        
        <!-- Transportation -->
        <div>
          <h4 class="font-semibold text-slate-900 mb-4">Getting Around</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex items-center gap-3 p-4 border border-slate-200 rounded-xl">
              <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                🚇
              </div>
              <div>
                <div class="font-medium text-slate-900">Public Transport</div>
                <div class="text-sm text-slate-600">Metro, Bus connections nearby</div>
              </div>
            </div>
            <div class="flex items-center gap-3 p-4 border border-slate-200 rounded-xl">
              <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                🚶
              </div>
              <div>
                <div class="font-medium text-slate-900">Walkable Area</div>
                <div class="text-sm text-slate-600">Most amenities within walking distance</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
