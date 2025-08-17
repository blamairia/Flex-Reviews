<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import FiltersBar from '$lib/components/FiltersBar.svelte';
  import ReviewsTable from '$lib/components/ReviewsTable.svelte';
  let stats: any = { total: 0, selected: 0, avgRating: null };
  import { page } from '$app/stores';
  let data = { reviews: [], listings: [], meta: { page: 1, limit: 20, total: 0 } } as any;
  let params = new URLSearchParams();
  async function load() {
    if (typeof window !== 'undefined') {
      params = new URLSearchParams(window.location.search);
    }
    const res = await fetch('/api/reviews/hostaway?' + params.toString());
    data = await res.json();
  const s = await fetch('/api/reviews/stats');
  stats = await s.json();
  }
  function handleChange(newParams: Record<string, any>) {
    for (const [k, v] of Object.entries(newParams)) {
      if (v === undefined || v === '' || v === null) params.delete(k);
      else params.set(k, String(v));
    }
    if (typeof window !== 'undefined') history.replaceState(null, '', '/reviews?' + params.toString());
    load();
  }
  onMount(load);
</script>

<div class="container mx-auto p-4 space-y-4">
  <!-- Navigation Header -->
  <div class="flex items-center justify-between">
    <h1 class="text-3xl font-bold text-gray-900">Reviews Management</h1>
    <div class="flex gap-3">
      <button 
        class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        on:click={() => goto('/dashboard')}
      >
        Dashboard
      </button>
      <button 
        class="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        on:click={() => goto('/settings')}
      >
        Settings
      </button>
    </div>
  </div>

  <!-- Stats Cards -->
  <div class="grid md:grid-cols-3 gap-4">
    <div class="p-4 border rounded-lg bg-white shadow-sm">
      <div class="text-sm text-gray-500 font-medium">Total Reviews</div>
      <div class="text-2xl font-bold text-gray-900">{stats.total}</div>
    </div>
    <div class="p-4 border rounded-lg bg-white shadow-sm">
      <div class="text-sm text-gray-500 font-medium">Selected for Web</div>
      <div class="text-2xl font-bold text-green-600">{stats.selected}</div>
    </div>
    <div class="p-4 border rounded-lg bg-white shadow-sm">
      <div class="text-sm text-gray-500 font-medium">Average Rating</div>
      <div class="text-2xl font-bold text-blue-600">{stats.avgRating ?? '—'}</div>
    </div>
  </div>

  <!-- Filters and Table -->
  <div class="grid grid-cols-12 gap-6">
    <aside class="col-span-12 md:col-span-3">
      <FiltersBar {data} on:change={(e)=>handleChange(e.detail)} />
    </aside>
    <main class="col-span-12 md:col-span-9">
      <ReviewsTable {data} on:pageChange={(e)=>handleChange({ page: e.detail })} />
    </main>
  </div>
</div>
