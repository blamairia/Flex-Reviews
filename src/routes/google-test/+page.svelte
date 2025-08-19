<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { browser } from '$app/environment';
  
  let loading = false;
  let activeSection = 'places';
  let results: any = {};
  let apiKey = '';
  let placeId = '';
  let locationQuery = '';
  let latitude = '';
  let longitude = '';
  let radius = '1500';
  
  // Test results storage
  let placesResults = '';
  let reviewsResults = '';
  let mapsResults = '';
  let geocodingResults = '';
  
  // Sidebar state management
  let sidebarCollapsed = false;
  
  onMount(() => {
    if (browser) {
      // Get sidebar state from localStorage to match AppShell
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved) {
        sidebarCollapsed = saved === 'true';
      }
      
      // Listen for storage changes to sync with AppShell
      const handleStorageChange = () => {
        const saved = localStorage.getItem('sidebarCollapsed');
        if (saved) {
          sidebarCollapsed = saved === 'true';
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      // Also listen for custom events from AppShell
      const handleSidebarToggle = (event: CustomEvent) => {
        sidebarCollapsed = event.detail.collapsed;
      };
      
      window.addEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
      
      // Load API configuration from server
      loadApiConfig();
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('sidebar-toggle', handleSidebarToggle as EventListener);
      };
    }
  });
  
  // Load API configuration from server
  async function loadApiConfig() {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        if (config.googleApiKey) {
          apiKey = config.googleApiKey;
          console.log('✅ Google API key loaded from environment');
        } else {
          console.warn('⚠️ No Google API key found in environment variables');
        }
      }
    } catch (error) {
      console.error('❌ Could not load API config from server:', error);
    }
  }
  
  // Google Places API Tests
  async function testPlacesSearch() {
    if (!apiKey || !locationQuery) {
      alert('Please provide API key and location query');
      return;
    }
    
    loading = true;
    try {
      const response = await fetch('/api/google/places/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          query: locationQuery,
          location: latitude && longitude ? `${latitude},${longitude}` : undefined,
          radius: parseInt(radius)
        })
      });
      
      const data = await response.json();
      placesResults = JSON.stringify(data, null, 2);
      results.placesSearch = data;
    } catch (error) {
      placesResults = `Error: ${error}`;
    }
    loading = false;
  }
  
  async function testPlaceDetails() {
    if (!apiKey || !placeId) {
      alert('Please provide API key and place ID');
      return;
    }
    
    loading = true;
    try {
      const response = await fetch('/api/google/places/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          placeId,
          fields: 'name,rating,reviews,formatted_address,geometry,photos,types,business_status'
        })
      });
      
      const data = await response.json();
      placesResults = JSON.stringify(data, null, 2);
      results.placeDetails = data;
    } catch (error) {
      placesResults = `Error: ${error}`;
    }
    loading = false;
  }
  
  async function testNearbySearch() {
    if (!apiKey || !latitude || !longitude) {
      alert('Please provide API key, latitude, and longitude');
      return;
    }
    
    loading = true;
    try {
      const response = await fetch('/api/google/places/nearby', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          location: `${latitude},${longitude}`,
          radius: parseInt(radius),
          type: 'lodging'
        })
      });
      
      const data = await response.json();
      placesResults = JSON.stringify(data, null, 2);
      results.nearbySearch = data;
    } catch (error) {
      placesResults = `Error: ${error}`;
    }
    loading = false;
  }
  
  // Google Reviews Tests
  async function testPlaceReviews() {
    if (!apiKey || !placeId) {
      alert('Please provide API key and place ID');
      return;
    }
    
    loading = true;
    try {
      const response = await fetch('/api/google/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          placeId
        })
      });
      
      const data = await response.json();
      reviewsResults = JSON.stringify(data, null, 2);
      results.reviews = data;
    } catch (error) {
      reviewsResults = `Error: ${error}`;
    }
    loading = false;
  }
  
  // Google Geocoding Tests
  async function testGeocoding() {
    if (!apiKey || !locationQuery) {
      alert('Please provide API key and address');
      return;
    }
    
    loading = true;
    try {
      const response = await fetch('/api/google/geocoding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          address: locationQuery
        })
      });
      
      const data = await response.json();
      geocodingResults = JSON.stringify(data, null, 2);
      results.geocoding = data;
    } catch (error) {
      geocodingResults = `Error: ${error}`;
    }
    loading = false;
  }
  
  async function testReverseGeocoding() {
    if (!apiKey || !latitude || !longitude) {
      alert('Please provide API key, latitude, and longitude');
      return;
    }
    
    loading = true;
    try {
      const response = await fetch('/api/google/geocoding/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          latlng: `${latitude},${longitude}`
        })
      });
      
      const data = await response.json();
      geocodingResults = JSON.stringify(data, null, 2);
      results.reverseGeocoding = data;
    } catch (error) {
      geocodingResults = `Error: ${error}`;
    }
    loading = false;
  }
  
  // Google Maps Tests
  async function testStaticMap() {
    if (!apiKey || !latitude || !longitude) {
      alert('Please provide API key, latitude, and longitude');
      return;
    }
    
    loading = true;
    try {
      const response = await fetch('/api/google/maps/static', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          center: `${latitude},${longitude}`,
          zoom: 15,
          size: '600x400',
          markers: `color:red|${latitude},${longitude}`
        })
      });
      
      const data = await response.json();
      mapsResults = JSON.stringify(data, null, 2);
      results.staticMap = data;
    } catch (error) {
      mapsResults = `Error: ${error}`;
    }
    loading = false;
  }
  
  // Test to fetch Place ID from location query
  async function testPlaceIdFromCoords() {
    if (!apiKey || !locationQuery) {
      alert('Please provide API key and location query');
      return;
    }
    
    loading = true;
    try {
      const response = await fetch('/api/google/places/find-place', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          input: locationQuery,
          inputtype: 'textquery',
          fields: 'place_id,name,geometry,formatted_address'
        })
      });
      
      const data = await response.json();
      placesResults = JSON.stringify(data, null, 2);
      results.findPlace = data;
      
      // Auto-populate place ID and coordinates if found
      if (data.candidates && data.candidates.length > 0) {
        const place = data.candidates[0];
        placeId = place.place_id;
        if (place.geometry && place.geometry.location) {
          latitude = place.geometry.location.lat.toString();
          longitude = place.geometry.location.lng.toString();
        }
      }
    } catch (error) {
      placesResults = `Error: ${error}`;
    }
    loading = false;
  }

  // Auto-populate test data
  function loadSampleData() {
    // API key should already be loaded from environment on page mount
    // If not loaded yet, try to load it now
    if (!apiKey) {
      loadApiConfig();
    }
    
    placeId = 'ChIJ16_OfOIOdkgRHFC5Adwvp1U';
    locationQuery = '4 Hawkesbury Rd';
    latitude = '51.4102168';
    longitude = '0.0238711';
    radius = '1500';
  }
  
  function clearResults() {
    placesResults = '';
    reviewsResults = '';
    mapsResults = '';
    geocodingResults = '';
    results = {};
  }
  
  // Google Maps Integration
  let mapLoaded = false;
  let map: any = null;
  let autocomplete: any = null;
  
  function initializeMap() {
    if (!apiKey) {
      alert('Please enter your Google API key first');
      return;
    }
    
    if (mapLoaded) {
      return;
    }
    
    // Load Google Maps API
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMap`;
    script.async = true;
    script.defer = true;
    
    // Define the callback function globally
    (window as any).initGoogleMap = () => {
      initMap();
      mapLoaded = true;
    };
    
    document.head.appendChild(script);
  }
  
  function initMap() {
    const mapElement = document.getElementById('google-map');
    if (!mapElement) return;
    
    // Initialize map centered on London (where your sample data is)
    map = new (window as any).google.maps.Map(mapElement, {
      center: { lat: 51.4102168, lng: 0.0238711 },
      zoom: 13,
    });
    
    const input = document.getElementById('maps-autocomplete') as HTMLInputElement;
    
    // Initialize autocomplete
    autocomplete = new (window as any).google.maps.places.Autocomplete(input, {
      fields: ['place_id', 'geometry', 'formatted_address', 'name'],
    });
    
    autocomplete.bindTo('bounds', map);
    
    const infoWindow = new (window as any).google.maps.InfoWindow();
    const marker = new (window as any).google.maps.Marker({ map: map });
    
    marker.addListener('click', () => {
      infoWindow.open(map, marker);
    });
    
    autocomplete.addListener('place_changed', () => {
      infoWindow.close();
      
      const place = autocomplete.getPlace();
      
      if (!place.geometry || !place.geometry.location) {
        alert('No details available for the selected place');
        return;
      }
      
      // Update map view
      if (place.geometry.viewport) {
        map.fitBounds(place.geometry.viewport);
      } else {
        map.setCenter(place.geometry.location);
        map.setZoom(17);
      }
      
      // Update marker
      marker.setPlace({
        placeId: place.place_id,
        location: place.geometry.location,
      });
      marker.setVisible(true);
      
      // Update place info display
      const placeInfo = document.getElementById('place-info');
      const infoName = document.getElementById('info-name');
      const infoPlaceId = document.getElementById('info-place-id');
      const infoAddress = document.getElementById('info-address');
      const infoCoordinates = document.getElementById('info-coordinates');
      
      if (placeInfo && infoName && infoPlaceId && infoAddress && infoCoordinates) {
        infoName.textContent = place.name || '';
        infoPlaceId.textContent = place.place_id || '';
        infoAddress.textContent = place.formatted_address || '';
        infoCoordinates.textContent = `${place.geometry.location.lat()}, ${place.geometry.location.lng()}`;
        placeInfo.classList.remove('hidden');
        
        // Auto-populate form fields
        placeId = place.place_id || '';
        locationQuery = place.name || '';
        latitude = place.geometry.location.lat().toString();
        longitude = place.geometry.location.lng().toString();
      }
      
      // Show info window
      infoWindow.setContent(`
        <div class="p-2">
          <h3 class="font-bold">${place.name}</h3>
          <p class="text-sm text-gray-600">${place.formatted_address}</p>
          <p class="text-xs text-gray-500 mt-1">Place ID: ${place.place_id}</p>
        </div>
      `);
      infoWindow.open(map, marker);
    });
  }
</script>

<svelte:head>
  <title>Google APIs Integration Test - Flex Reviews</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
  <!-- Header -->
  <div class="bg-white shadow-sm border-b">
    <div class="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300">
      <div class="flex items-center justify-between">
        <button 
          class="text-blue-600 hover:text-blue-800 font-medium"
          on:click={() => goto('/dashboard')}
        >
          ← Back to Dashboard
        </button>
        <div class="flex gap-3">
          <button 
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            on:click={loadSampleData}
          >
            Load Sample Data
          </button>
          <button 
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            on:click={clearResults}
          >
            Clear Results
          </button>
        </div>
      </div>
      
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        🗺️ Google APIs Integration Test Dashboard
      </h1>
      <p class="text-gray-600">
        Comprehensive testing for Google Places API, Reviews, Maps, and Geocoding services
      </p>
    </div>

    <!-- Navigation -->
    <div class="bg-white rounded-lg shadow-sm border mb-8 mx-4 sm:mx-6 lg:mx-8">
      <nav class="flex overflow-x-auto">
        <button
          on:click={() => activeSection = 'places'}
          class="px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 {activeSection === 'places' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          🗺️ Places API
        </button>
        <button
          on:click={() => activeSection = 'reviews'}
          class="px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 {activeSection === 'reviews' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          ⭐ Reviews API
        </button>
        <button
          on:click={() => activeSection = 'maps'}
          class="px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 {activeSection === 'maps' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          🗺️ Maps API
        </button>
        <button
          on:click={() => activeSection = 'geocoding'}
          class="px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 {activeSection === 'geocoding' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          📍 Geocoding API
        </button>
        <button
          on:click={() => activeSection = 'integration'}
          class="px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 {activeSection === 'integration' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          🔗 Integration Tests
        </button>
      </nav>
    </div>
  </div>

  <!-- Main content area that responds to sidebar -->
  <div class="max-w-none mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300">
    <!-- API Configuration -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">API Configuration</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <div>
          <label for="api-key" class="block text-sm font-medium text-gray-700 mb-1">
            Google API Key
            {#if apiKey}
              <span class="text-green-600 text-xs ml-2">✓ Loaded from environment</span>
            {/if}
          </label>
          <input 
            id="api-key"
            type="password" 
            bind:value={apiKey}
            placeholder={apiKey ? "••••••••••••••••••••" : "Enter Google API Key"}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 {apiKey ? 'bg-green-50 border-green-300' : ''}"
          />
        </div>
        <div>
          <label for="place-id" class="block text-sm font-medium text-gray-700 mb-1">Place ID</label>
          <input 
            id="place-id"
            type="text" 
            bind:value={placeId}
            placeholder="e.g., ChIJ16_OfOIOdkgRHFC5Adwvp1U"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="location-query" class="block text-sm font-medium text-gray-700 mb-1">Location Query</label>
          <input 
            id="location-query"
            type="text" 
            bind:value={locationQuery}
            placeholder="e.g., 4 Hawkesbury Rd"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="latitude" class="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
          <input 
            id="latitude"
            type="text" 
            bind:value={latitude}
            placeholder="e.g., 51.4102168"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="longitude" class="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
          <input 
            id="longitude"
            type="text" 
            bind:value={longitude}
            placeholder="e.g., 0.0238711"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label for="radius" class="block text-sm font-medium text-gray-700 mb-1">Radius (meters)</label>
          <input 
            id="radius"
            type="number" 
            bind:value={radius}
            placeholder="1500"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>

    <!-- Places API Section -->
    {#if activeSection === 'places'}
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Google Places API Endpoints</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            on:click={testPlacesSearch}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 
                   hover:bg-blue-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">🔍</div>
            <div class="font-medium">Text Search</div>
            <div class="text-sm text-gray-600">Search places by text query</div>
          </button>

          <button
            on:click={testPlaceDetails}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 
                   hover:bg-green-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">📍</div>
            <div class="font-medium">Place Details</div>
            <div class="text-sm text-gray-600">Get detailed place information</div>
          </button>

          <button
            on:click={testNearbySearch}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 
                   hover:bg-purple-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">📍</div>
            <div class="font-medium">Nearby Search</div>
            <div class="text-sm text-gray-600">Find places near location</div>
          </button>

          <button
            on:click={testPlaceIdFromCoords}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 
                   hover:bg-orange-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">🎯</div>
            <div class="font-medium">Find Place ID</div>
            <div class="text-sm text-gray-600">Get Place ID from location query</div>
          </button>
        </div>
      </div>
    {/if}

    <!-- Reviews API Section -->
    {#if activeSection === 'reviews'}
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Google Reviews API</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            on:click={testPlaceReviews}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 
                   hover:bg-yellow-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">⭐</div>
            <div class="font-medium">Place Reviews</div>
            <div class="text-sm text-gray-600">Get reviews for a place</div>
          </button>
        </div>
      </div>
    {/if}

    <!-- Maps API Section -->
    {#if activeSection === 'maps'}
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Google Maps API</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            on:click={testStaticMap}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 
                   hover:bg-red-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">🗺️</div>
            <div class="font-medium">Static Map</div>
            <div class="text-sm text-gray-600">Generate static map image</div>
          </button>
        </div>
      </div>
    {/if}

    <!-- Geocoding API Section -->
    {#if activeSection === 'geocoding'}
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Google Geocoding API</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            on:click={testGeocoding}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 
                   hover:bg-indigo-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">📍</div>
            <div class="font-medium">Geocoding</div>
            <div class="text-sm text-gray-600">Address to coordinates</div>
          </button>

          <button
            on:click={testReverseGeocoding}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-400 
                   hover:bg-pink-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">🔄</div>
            <div class="font-medium">Reverse Geocoding</div>
            <div class="text-sm text-gray-600">Coordinates to address</div>
          </button>
        </div>
      </div>
    {/if}

    <!-- Integration Tests Section -->
    {#if activeSection === 'integration'}
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Integration Test Scenarios</h2>
        
        <div class="space-y-4">
          <!-- Google Maps Interactive Demo -->
          <div class="p-4 border border-gray-200 rounded-lg">
            <h3 class="font-medium text-gray-900 mb-2">🗺️ Interactive Maps with Place Autocomplete</h3>
            <p class="text-sm text-gray-600 mb-3">Search for places with autocomplete and view on interactive map</p>
            <div class="space-y-4">
              <div class="flex gap-2">
                <input 
                  id="maps-autocomplete"
                  type="text" 
                  placeholder="Enter a location to search..."
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button 
                  class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  on:click={initializeMap}
                  disabled={!apiKey || mapLoaded}
                >
                  {mapLoaded ? 'Map Loaded' : 'Load Map'}
                </button>
              </div>
              
              <!-- Map Container -->
              <div id="google-map" class="w-full h-96 bg-gray-100 rounded-lg border border-gray-300">
                <div class="flex items-center justify-center h-full text-gray-500">
                  Click "Load Map" to initialize Google Maps with Places Autocomplete
                </div>
              </div>
              
              <!-- Place Info Display -->
              <div id="place-info" class="hidden p-4 bg-blue-50 rounded-lg">
                <h4 class="font-medium text-blue-900 mb-2">Selected Place Information:</h4>
                <div class="space-y-1 text-sm">
                  <div><strong>Name:</strong> <span id="info-name"></span></div>
                  <div><strong>Place ID:</strong> <span id="info-place-id" class="font-mono text-xs"></span></div>
                  <div><strong>Address:</strong> <span id="info-address"></span></div>
                  <div><strong>Coordinates:</strong> <span id="info-coordinates"></span></div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="p-4 border border-gray-200 rounded-lg">
            <h3 class="font-medium text-gray-900 mb-2">🏨 Hotel Review Integration</h3>
            <p class="text-sm text-gray-600 mb-3">Search for hotels, get details, and fetch reviews</p>
            <button class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50" disabled={loading}>
              Run Hotel Test
            </button>
          </div>
          
          <div class="p-4 border border-gray-200 rounded-lg">
            <h3 class="font-medium text-gray-900 mb-2">📍 Location & Map Integration</h3>
            <p class="text-sm text-gray-600 mb-3">Geocode address, find nearby places, generate map</p>
            <button class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50" disabled={loading}>
              Run Location Test
            </button>
          </div>
          
          <div class="p-4 border border-gray-200 rounded-lg">
            <h3 class="font-medium text-gray-900 mb-2">⭐ Review Sync Integration</h3>
            <p class="text-sm text-gray-600 mb-3">Sync Google reviews with local database</p>
            <button class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50" disabled={loading}>
              Run Sync Test
            </button>
          </div>
        </div>
      </div>
    {/if}

    <!-- Results Section -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- API Response -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">API Response</h3>
        <div class="bg-gray-50 rounded-lg p-4 h-96 overflow-auto">
          <pre class="text-sm text-gray-800 whitespace-pre-wrap">{
            activeSection === 'places' ? placesResults :
            activeSection === 'reviews' ? reviewsResults :
            activeSection === 'maps' ? mapsResults :
            activeSection === 'geocoding' ? geocodingResults :
            'Select a test to see results...'
          }</pre>
        </div>
      </div>

      <!-- Status & Metrics -->
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Test Status & Metrics</h3>
        <div class="space-y-4">
          
          {#if loading}
            <div class="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <div class="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
              <span class="text-blue-700 font-medium">Running API test...</span>
            </div>
          {/if}

          <!-- API Endpoints Status -->
          <div class="space-y-2">
            <h4 class="font-medium text-gray-900">API Endpoints</h4>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="flex justify-between">
                <span>Places Search:</span>
                <span class={results.placesSearch ? 'text-green-600' : 'text-gray-400'}>
                  {results.placesSearch ? '✓' : '○'}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Place Details:</span>
                <span class={results.placeDetails ? 'text-green-600' : 'text-gray-400'}>
                  {results.placeDetails ? '✓' : '○'}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Nearby Search:</span>
                <span class={results.nearbySearch ? 'text-green-600' : 'text-gray-400'}>
                  {results.nearbySearch ? '✓' : '○'}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Find Place ID:</span>
                <span class={results.findPlace ? 'text-green-600' : 'text-gray-400'}>
                  {results.findPlace ? '✓' : '○'}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Reviews:</span>
                <span class={results.reviews ? 'text-green-600' : 'text-gray-400'}>
                  {results.reviews ? '✓' : '○'}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Static Map:</span>
                <span class={results.staticMap ? 'text-green-600' : 'text-gray-400'}>
                  {results.staticMap ? '✓' : '○'}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Geocoding:</span>
                <span class={results.geocoding ? 'text-green-600' : 'text-gray-400'}>
                  {results.geocoding ? '✓' : '○'}
                </span>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="border-t pt-4">
            <h4 class="font-medium text-gray-900 mb-2">Quick Stats</h4>
            <div class="text-sm text-gray-600 space-y-1">
              <div>Tests completed: {Object.keys(results).length}</div>
              <div>Active section: {activeSection}</div>
              <div>API key: {apiKey ? '✓ Configured' : '○ Not set'}</div>
            </div>
          </div>

          <!-- Documentation Links -->
          <div class="border-t pt-4">
            <h4 class="font-medium text-gray-900 mb-2">Documentation</h4>
            <div class="space-y-1 text-sm">
              <a href="https://developers.google.com/maps/documentation/places/web-service" 
                 target="_blank" 
                 class="text-blue-600 hover:underline block">
                📚 Places API Docs
              </a>
              <a href="https://developers.google.com/maps/documentation/geocoding" 
                 target="_blank" 
                 class="text-blue-600 hover:underline block">
                📚 Geocoding API Docs
              </a>
              <a href="https://developers.google.com/maps/documentation/maps-static" 
                 target="_blank" 
                 class="text-blue-600 hover:underline block">
                📚 Static Maps API Docs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
