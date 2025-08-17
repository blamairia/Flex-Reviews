<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  
  let fileInput: HTMLInputElement;
  let uploadStatus = '';
  let placeId = '';
  let googleResult: any = null;
  let audits: any[] = [];
  
  async function handleUpload() {
    if (!fileInput.files?.[0]) return;
    
    try {
      const file = fileInput.files[0];
      const text = await file.text();
      const data = JSON.parse(text);
      
      const res = await fetch('/settings', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'upload', data })
      });
      
      const result = await res.json();
      if (result.ok) {
        uploadStatus = `Imported ${result.reviewCount} reviews across ${result.listingCount} listings at ${new Date().toLocaleString()}`;
      } else {
        uploadStatus = 'Upload failed: ' + result.error;
      }
    } catch (e) {
      uploadStatus = 'Upload failed: ' + String(e);
    }
  }
  
  async function testGoogle() {
    if (!placeId.trim()) return;
    
    try {
      const res = await fetch(`/api/google/test?placeId=${encodeURIComponent(placeId)}`);
      googleResult = await res.json();
    } catch (e) {
      googleResult = { ok: false, reason: 'Network error' };
    }
  }
  
  async function loadAudits() {
    try {
      const res = await fetch('/api/audits?limit=10');
      const data = await res.json();
      audits = data.audits || [];
    } catch {
      audits = [];
    }
  }
  
  onMount(loadAudits);
</script>

<svelte:head><title>Settings</title></svelte:head>

<div class="container mx-auto p-6 space-y-8">
  <!-- Navigation Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-4">
      <button 
        class="text-blue-600 hover:text-blue-800 font-medium"
        on:click={() => goto('/dashboard')}
      >
        ← Back to Dashboard
      </button>
      <div class="text-gray-300">|</div>
      <h1 class="text-3xl font-bold text-gray-900">Settings</h1>
    </div>
    <div class="flex gap-3">
      <button 
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        on:click={() => goto('/reviews')}
      >
        Manage Reviews
      </button>
    </div>
  </div>
  
  <!-- Mock Data Section -->
  <div class="p-6 border rounded bg-white">
    <h2 class="text-xl font-semibold mb-4">Mock Data</h2>
    <div class="space-y-4">
      <div>
        <label for="mockFile" class="block text-sm font-medium mb-2">Upload JSON File</label>
        <input 
          id="mockFile" 
          type="file" 
          accept=".json" 
          bind:this={fileInput}
          class="w-full border rounded p-2"
        />
      </div>
      <button 
        on:click={handleUpload}
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Import & Reseed
      </button>
      {#if uploadStatus}
        <div class="p-3 bg-green-100 text-green-800 rounded">{uploadStatus}</div>
      {/if}
    </div>
  </div>
  
  <!-- Google Reviews Section -->
  <div class="p-6 border rounded bg-white">
    <h2 class="text-xl font-semibold mb-4">Google Reviews (Exploration)</h2>
    <div class="space-y-4">
      <div>
        <label for="placeId" class="block text-sm font-medium mb-2">Place ID</label>
        <input 
          id="placeId" 
          type="text" 
          bind:value={placeId}
          placeholder="ChIJ..."
          class="w-full border rounded p-2"
        />
      </div>
      <button 
        on:click={testGoogle}
        class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      >
        Test Fetch
      </button>
      {#if googleResult}
        <div class="p-3 rounded {googleResult.ok ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
          {#if googleResult.ok}
            <div class="font-medium">Success: Found {googleResult.count} reviews</div>
            {#if googleResult.samples}
              <div class="mt-2 space-y-2">
                {#each googleResult.samples as sample}
                  <div class="text-sm bg-white p-2 rounded border">
                    <div class="font-medium">{sample.guestName} - {sample.overallRating}/10</div>
                    <div class="text-gray-600">{sample.publicReview.slice(0, 100)}...</div>
                  </div>
                {/each}
              </div>
            {/if}
          {:else}
            <div>Error: {googleResult.reason}</div>
          {/if}
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Recent Activity Section -->
  <div class="p-6 border rounded bg-white">
    <h2 class="text-xl font-semibold mb-4">Recent Activity</h2>
    {#if audits.length > 0}
      <div class="space-y-2">
        {#each audits as audit}
          <div class="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
            <div>
              <span class="font-medium">{audit.action}</span> review {audit.entityId}
            </div>
            <div class="text-gray-600">
              {new Date(audit.createdAt).toLocaleString()}
            </div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="text-gray-500 text-center py-4">No recent activity</div>
    {/if}
  </div>
</div>
