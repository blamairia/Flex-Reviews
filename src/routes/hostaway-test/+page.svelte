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
  <div class="max-w-6xl mx-auto px-4">
    <!-- Header -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">
        🏠 API Integration Test Dashboard
      </h1>
      <p class="text-gray-600">
        Comprehensive testing for Hostaway API and Review Management System
      </p>
    </div>

    <!-- Navigation -->
    <div class="bg-white rounded-lg shadow-sm border mb-8">
      <nav class="flex overflow-x-auto">
        <button
          on:click={() => activeSection = 'hostaway'}
          class="px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 {activeSection === 'hostaway' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          🔌 Hostaway API
        </button>
        <button
          on:click={() => activeSection = 'dashboard'}
          class="px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 {activeSection === 'dashboard' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          📊 Dashboard
        </button>
        <button
          on:click={() => activeSection = 'properties'}
          class="px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 {activeSection === 'properties' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          🏘️ Properties
        </button>
        <button
          on:click={() => activeSection = 'reviews'}
          class="px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 {activeSection === 'reviews' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          📝 Reviews
        </button>
        <button
          on:click={() => activeSection = 'trends'}
          class="px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 {activeSection === 'trends' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          📈 Trends
        </button>
        <button
          on:click={() => activeSection = 'export'}
          class="px-6 py-4 text-sm font-medium whitespace-nowrap border-b-2 {activeSection === 'export' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}"
        >
          📤 Export
        </button>
      </nav>
    </div>

    <!-- Test Parameters -->
    <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
      <h2 class="text-xl font-semibold text-gray-900 mb-4">Test Parameters</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date From</label>
          <input
            type="date"
            bind:value={dateFrom}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Date To</label>
          <input
            type="date"
            bind:value={dateTo}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Property ID</label>
          <input
            type="text"
            bind:value={propertyId}
            placeholder="e.g., 101"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Channel</label>
          <select
            bind:value={channel}
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Channels</option>
            <option value="airbnb">Airbnb</option>
            <option value="booking">Booking.com</option>
            <option value="website">Direct Website</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Min Rating</label>
          <input
            type="number"
            bind:value={ratingMin}
            min="1"
            max="5"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Max Rating</label>
          <input
            type="number"
            bind:value={ratingMax}
            min="1"
            max="5"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Limit</label>
          <input
            type="number"
            bind:value={limit}
            min="1"
            max="100"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Offset</label>
          <input
            type="number"
            bind:value={offset}
            min="0"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>

    <!-- Error Display -->
    {#if error}
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
        <p class="text-red-800 font-medium">Error:</p>
        <p class="text-red-700">{error}</p>
      </div>
    {/if}

    <!-- Hostaway API Section -->
    {#if activeSection === 'hostaway'}
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Hostaway API Integration</h2>
        
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
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            on:click={testConnection}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 
                   hover:bg-blue-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">🔌</div>
            <div class="font-medium">Test Connection</div>
            <div class="text-sm text-gray-600">Basic connectivity</div>
          </button>

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
            <div class="text-sm text-gray-600">Quick test</div>
          </button>

          <button
            on:click={getAllListings}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 
                   hover:bg-orange-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">🏠</div>
            <div class="font-medium">Get All Listings</div>
            <div class="text-sm text-gray-600">Up to 100</div>
          </button>
        </div>
      </div>
    {/if}

    <!-- Dashboard API Section -->
    {#if activeSection === 'dashboard'}
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Dashboard API Endpoints</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            on:click={testDashboardKPIs}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 
                   hover:bg-blue-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">📊</div>
            <div class="font-medium">KPIs</div>
            <div class="text-sm text-gray-600">/api/dashboard/kpis</div>
          </button>

          <button
            on:click={testDashboardTrends}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 
                   hover:bg-green-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">📈</div>
            <div class="font-medium">Trends</div>
            <div class="text-sm text-gray-600">/api/dashboard/trends</div>
          </button>

          <button
            on:click={testTopBottomProperties}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 
                   hover:bg-purple-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">🏆</div>
            <div class="font-medium">Top/Bottom</div>
            <div class="text-sm text-gray-600">/api/dashboard/top-bottom</div>
          </button>

          <button
            on:click={testHeatmap}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 
                   hover:bg-red-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">🗺️</div>
            <div class="font-medium">Heatmap</div>
            <div class="text-sm text-gray-600">/api/dashboard/heatmap</div>
          </button>

          <button
            on:click={testSavedViews}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-400 
                   hover:bg-indigo-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">💾</div>
            <div class="font-medium">Saved Views</div>
            <div class="text-sm text-gray-600">/api/saved-views</div>
          </button>

          <button
            on:click={testCreateSavedView}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-400 
                   hover:bg-pink-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">➕</div>
            <div class="font-medium">Create View</div>
            <div class="text-sm text-gray-600">POST /api/saved-views</div>
          </button>
        </div>
      </div>
    {/if}

    <!-- Properties API Section -->
    {#if activeSection === 'properties'}
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Properties API Endpoints</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            on:click={testPropertiesList}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 
                   hover:bg-blue-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">🏘️</div>
            <div class="font-medium">Properties List</div>
            <div class="text-sm text-gray-600">/api/properties</div>
          </button>

          <button
            on:click={testPropertyDetails}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 
                   hover:bg-green-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">🏠</div>
            <div class="font-medium">Property Details</div>
            <div class="text-sm text-gray-600">/api/properties/:id</div>
          </button>

          <button
            on:click={testPropertyMetrics}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 
                   hover:bg-purple-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">📊</div>
            <div class="font-medium">Metrics Overview</div>
            <div class="text-sm text-gray-600">/api/properties/:id/metrics</div>
          </button>

          <button
            on:click={testPropertyInsights}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-yellow-400 
                   hover:bg-yellow-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">💡</div>
            <div class="font-medium">Insights</div>
            <div class="text-sm text-gray-600">/api/properties/:id/insights</div>
          </button>

          <button
            on:click={testPropertySettings}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 
                   hover:bg-gray-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">⚙️</div>
            <div class="font-medium">Settings</div>
            <div class="text-sm text-gray-600">/api/properties/:id/settings</div>
          </button>

          <button
            on:click={testPublicReviews}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-teal-400 
                   hover:bg-teal-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">🌐</div>
            <div class="font-medium">Public Reviews</div>
            <div class="text-sm text-gray-600">/api/public/properties/:slug</div>
          </button>
        </div>
      </div>
    {/if}

    <!-- Reviews API Section -->
    {#if activeSection === 'reviews'}
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Reviews API Endpoints</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            on:click={testReviewsList}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 
                   hover:bg-blue-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">📝</div>
            <div class="font-medium">Reviews List</div>
            <div class="text-sm text-gray-600">/api/reviews</div>
          </button>

          <button
            on:click={testReviewDetail}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 
                   hover:bg-green-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">🔍</div>
            <div class="font-medium">Review Detail</div>
            <div class="text-sm text-gray-600">/api/reviews/:id</div>
          </button>

          <button
            on:click={testReviewBatch}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 
                   hover:bg-purple-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">📦</div>
            <div class="font-medium">Batch Actions</div>
            <div class="text-sm text-gray-600">/api/reviews/batch</div>
          </button>
        </div>
      </div>
    {/if}

    <!-- Trends API Section -->
    {#if activeSection === 'trends'}
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Trends & Insights API</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            on:click={testCategoryTrends}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 
                   hover:bg-blue-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">📈</div>
            <div class="font-medium">Category Trends</div>
            <div class="text-sm text-gray-600">/api/trends/categories</div>
          </button>

          <button
            on:click={testAnomalies}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-red-400 
                   hover:bg-red-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">⚠️</div>
            <div class="font-medium">Anomalies</div>
            <div class="text-sm text-gray-600">/api/trends/anomalies</div>
          </button>

          <button
            on:click={testChannelImpact}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 
                   hover:bg-green-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">📊</div>
            <div class="font-medium">Channel Impact</div>
            <div class="text-sm text-gray-600">/api/trends/channels</div>
          </button>
        </div>
      </div>
    {/if}

    <!-- Export Section -->
    {#if activeSection === 'export'}
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Export & Integration</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            on:click={testExportCSV}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 
                   hover:bg-blue-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">📤</div>
            <div class="font-medium">Export CSV</div>
            <div class="text-sm text-gray-600">/api/export/reviews.csv</div>
          </button>

          <button
            on:click={() => testAPI('/api/hostaway/sync', { method: 'POST' })}
            disabled={loading}
            class="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 
                   hover:bg-green-50 transition-colors text-center disabled:opacity-50"
          >
            <div class="text-2xl mb-2">🔄</div>
            <div class="font-medium">Hostaway Sync</div>
            <div class="text-sm text-gray-600">/api/hostaway/sync</div>
          </button>
        </div>
      </div>
    {/if}

    <!-- Loading State -->
    {#if loading}
      <div class="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div class="flex items-center justify-center gap-3">
          <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span class="text-gray-600">Testing API endpoint...</span>
        </div>
      </div>
    {/if}

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
