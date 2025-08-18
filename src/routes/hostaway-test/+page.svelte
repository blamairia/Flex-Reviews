<script lang="ts">
  import { onMount } from 'svelte';
  
  let connectionStatus: 'idle' | 'testing' | 'success' | 'error' = 'idle';
  let testResult: any = null;
  let error: string = '';
  let loading = false;
  let activeSection = 'hostaway';
  
  // Test parameters
  let dateFrom = '2025-06-01';
  let dateTo = '2025-08-18';
  let limit = 25;
  let offset = 0;
  let propertyId = '';
  let channel = '';
  let ratingMin = 1;
  let ratingMax = 5;

  async function testConnection() {
    connectionStatus = 'testing';
    loading = true;
    error = '';
    testResult = null;

    try {
      const response = await fetch('/api/hostaway/test');
      const data = await response.json();
      
      if (data.success) {
        connectionStatus = 'success';
        testResult = data;
      } else {
        connectionStatus = 'error';
        error = data.message || 'Connection failed';
      }
    } catch (err) {
      connectionStatus = 'error';
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  async function authenticate() {
    loading = true;
    error = '';

    try {
      const response = await fetch('/api/hostaway/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'authenticate' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Authentication successful!');
      } else {
        error = data.message || 'Authentication failed';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  async function syncListings(limit = 10) {
    loading = true;
    error = '';

    try {
      const response = await fetch('/api/hostaway/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'sync',
          limit,
          city: 'London',
          country: 'GB'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        testResult = data;
        alert(`Synced ${data.data.totalSynced} listings successfully!`);
      } else {
        error = data.message || 'Sync failed';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  // Generic API test function
  async function testAPI(endpoint: string, options: any = {}) {
    loading = true;
    error = '';
    testResult = null;

    try {
      const url = new URL(endpoint, window.location.origin);
      
      // Add query parameters
      Object.entries(options.params || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          url.searchParams.append(key, value.toString());
        }
      });

      const response = await fetch(url.toString(), {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': options.token ? `Bearer ${options.token}` : undefined,
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const data = await response.json();
      testResult = { endpoint, status: response.status, data };
      
      if (!response.ok) {
        error = data.message || `HTTP ${response.status}`;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }

  // Dashboard API Tests
  async function testDashboardKPIs() {
    await testAPI('/api/dashboard/kpis', {
      params: {
        dateFrom,
        dateTo,
        'channel[]': channel || undefined,
        'propertyIds[]': propertyId || undefined
      }
    });
  }

  async function testDashboardTrends() {
    await testAPI('/api/dashboard/trends', {
      params: {
        dateFrom,
        dateTo,
        groupBy: 'week',
        by: 'channel',
        'channel[]': channel || undefined,
        'propertyIds[]': propertyId || undefined
      }
    });
  }

  async function testTopBottomProperties() {
    await testAPI('/api/dashboard/top-bottom', {
      params: {
        dateFrom,
        dateTo,
        metric: 'avgRating',
        limit: 5
      }
    });
  }

  async function testHeatmap() {
    await testAPI('/api/dashboard/heatmap', {
      params: {
        dateFrom,
        dateTo,
        metric: 'avgCategoryScore',
        'propertyIds[]': propertyId || undefined
      }
    });
  }

  // Properties API Tests
  async function testPropertiesList() {
    await testAPI('/api/properties', {
      params: {
        limit,
        offset,
        search: '',
        city: '',
        'channel[]': channel || undefined,
        ratingMin,
        ratingMax,
        sort: 'name:asc'
      }
    });
  }

  async function testPropertyDetails() {
    const id = propertyId || '101';
    await testAPI(`/api/properties/${id}`);
  }

  async function testPropertyMetrics() {
    const id = propertyId || '101';
    await testAPI(`/api/properties/${id}/metrics/overview`, {
      params: {
        dateFrom,
        dateTo,
        groupBy: 'week'
      }
    });
  }

  async function testPropertyInsights() {
    const id = propertyId || '101';
    await testAPI(`/api/properties/${id}/insights`, {
      params: {
        dateFrom,
        dateTo,
        topN: 20
      }
    });
  }

  async function testPropertySettings() {
    const id = propertyId || '101';
    await testAPI(`/api/properties/${id}/settings`);
  }

  // Reviews API Tests
  async function testReviewsList() {
    await testAPI('/api/reviews', {
      params: {
        status: 'pending',
        ratingMin,
        ratingMax,
        'category[]': '',
        'channel[]': channel || undefined,
        'language[]': '',
        hasText: true,
        hasPhotos: false,
        dateFrom,
        dateTo,
        limit,
        offset,
        sort: 'createdAt:desc'
      }
    });
  }

  async function testReviewDetail() {
    await testAPI('/api/reviews/rv_88');
  }

  async function testReviewBatch() {
    await testAPI('/api/reviews/batch', {
      method: 'POST',
      body: {
        ids: ['rv_88', 'rv_91', 'rv_104'],
        action: 'approve',
        payload: {}
      }
    });
  }

  // Trends API Tests
  async function testCategoryTrends() {
    await testAPI('/api/trends/categories', {
      params: {
        dateFrom,
        dateTo,
        groupBy: 'week',
        'category[]': 'Cleanliness,Communication',
        'propertyIds[]': propertyId || undefined
      }
    });
  }

  async function testAnomalies() {
    await testAPI('/api/trends/anomalies', {
      params: {
        dateFrom,
        dateTo,
        window: '4w',
        zscore: 2.0,
        'propertyIds[]': propertyId || undefined,
        'category[]': ''
      }
    });
  }

  async function testChannelImpact() {
    await testAPI('/api/trends/channels', {
      params: {
        dateFrom,
        dateTo,
        groupBy: 'month',
        'propertyIds[]': propertyId || undefined
      }
    });
  }

  // Saved Views Tests
  async function testSavedViews() {
    await testAPI('/api/saved-views', {
      params: { scope: 'dashboard' }
    });
  }

  async function testCreateSavedView() {
    await testAPI('/api/saved-views', {
      method: 'POST',
      body: {
        name: 'Test View',
        scope: 'dashboard',
        filters: {
          dateFrom,
          dateTo,
          status: 'pending',
          channel: ['airbnb', 'booking']
        }
      }
    });
  }

  // Export Tests
  async function testExportCSV() {
    await testAPI('/api/export/reviews.csv', {
      params: {
        dateFrom,
        dateTo,
        'propertyIds[]': propertyId || undefined,
        'channel[]': channel || undefined,
        status: 'approved'
      }
    });
  }

  // Public API Tests
  async function testPublicReviews() {
    const slug = 'marina-loft';
    await testAPI(`/api/public/properties/${slug}/reviews`, {
      params: {
        limit: 10,
        offset: 0,
        ratingMin,
        'category[]': '',
        sort: 'newest'
      }
    });
  }

  async function getAllListings() {
    loading = true;
    error = '';

    try {
      const response = await fetch('/api/hostaway/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'sync',
          limit: 100  // Fetch up to 100 listings
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        testResult = data;
        alert(`Retrieved ${data.data.totalSynced} listings successfully!`);
      } else {
        error = data.message || 'Failed to get all listings';
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Hostaway API Test Dashboard</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 py-8">
  <div class="max-w-4xl mx-auto px-4">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        🏠 Hostaway API Test Dashboard
      </h1>
      <p class="text-gray-600">
        Test the integration with Hostaway API using Account ID: 61148
      </p>
    </div>

    <!-- Connection Status -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Connection Status</h2>
      
      <div class="flex items-center gap-4 mb-6">
        <div class="flex items-center gap-2">
          {#if connectionStatus === 'idle'}
            <div class="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span class="text-gray-600">Not tested</span>
          {:else if connectionStatus === 'testing'}
            <div class="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
            <span class="text-yellow-600">Testing...</span>
          {:else if connectionStatus === 'success'}
            <div class="w-3 h-3 bg-green-400 rounded-full"></div>
            <span class="text-green-600">Connected</span>
          {:else if connectionStatus === 'error'}
            <div class="w-3 h-3 bg-red-400 rounded-full"></div>
            <span class="text-red-600">Failed</span>
          {/if}
        </div>
        
        <button
          on:click={testConnection}
          disabled={loading}
          class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {#if loading}
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          {/if}
          Test Connection
        </button>
      </div>

      {#if error}
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p class="text-red-800 font-medium">Error:</p>
          <p class="text-red-700">{error}</p>
        </div>
      {/if}
    </div>

    <!-- API Actions -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">API Actions</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          on:click={authenticate}
          disabled={loading}
          class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 
                 hover:bg-blue-50 transition-colors text-center disabled:opacity-50"
        >
          <div class="text-2xl mb-2">🔑</div>
          <div class="font-medium">Authenticate</div>
          <div class="text-sm text-gray-600">Test OAuth2 flow</div>
        </button>

        <button
          on:click={() => syncListings(5)}
          disabled={loading}
          class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 
                 hover:bg-green-50 transition-colors text-center disabled:opacity-50"
        >
          <div class="text-2xl mb-2">🔄</div>
          <div class="font-medium">Sync 5 Listings</div>
          <div class="text-sm text-gray-600">Fetch from London</div>
        </button>

        <button
          on:click={() => syncListings(20)}
          disabled={loading}
          class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 
                 hover:bg-purple-50 transition-colors text-center disabled:opacity-50"
        >
          <div class="text-2xl mb-2">📊</div>
          <div class="font-medium">Sync 20 Listings</div>
          <div class="text-sm text-gray-600">Bulk import</div>
        </button>

        <button
          on:click={getAllListings}
          disabled={loading}
          class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 
                 hover:bg-orange-50 transition-colors text-center disabled:opacity-50"
        >
          <div class="text-2xl mb-2">🏠</div>
          <div class="font-medium">Get All Listings</div>
          <div class="text-sm text-gray-600">Fetch up to 100</div>
        </button>
      </div>
    </div>

    <!-- Results -->
    {#if testResult}
      <div class="bg-white rounded-lg shadow-sm border p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Latest Results</h2>
        
        {#if testResult.data?.sampleListings}
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-3">
              Found {testResult.data.totalListings} listings ({testResult.data.totalPages} pages)
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {#each testResult.data.sampleListings as listing}
                <div class="border rounded-lg p-4">
                  <h4 class="font-medium text-gray-900 mb-2">{listing.name}</h4>
                  <div class="text-sm text-gray-600 space-y-1">
                    <p>📍 {listing.city}, {listing.country}</p>
                    <p>🛏️ {listing.bedrooms} bedrooms</p>
                    <p>💰 ${listing.price}/night</p>
                    <p>⭐ {listing.rating || 'No rating'}</p>
                    <p>🖼️ {listing.images} images</p>
                    <p>🏨 {listing.amenities} amenities</p>
                  </div>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        {#if testResult.data?.listings}
          <div class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-3">
              Synced {testResult.data.totalSynced} listings
            </h3>
            
            <div class="space-y-2">
              {#each testResult.data.listings as listing}
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span class="font-medium">{listing.name}</span>
                  <span class="text-gray-600">({listing.city}, {listing.country})</span>
                  <span class="text-xs bg-gray-200 px-2 py-1 rounded">ID: {listing.id}</span>
                </div>
              {/each}
            </div>
          </div>
        {/if}

        <details class="mt-4">
          <summary class="cursor-pointer text-gray-600 hover:text-gray-900">
            View Raw Response
          </summary>
          <pre class="mt-2 p-4 bg-gray-100 rounded-lg text-xs overflow-auto">
{JSON.stringify(testResult, null, 2)}
          </pre>
        </details>
      </div>
    {/if}
  </div>
</div>
