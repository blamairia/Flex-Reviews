<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  let formData = {
    title: '',
    address: '',
    channel: 'Airbnb',
    status: 'active',
    description: ''
  };
  
  let saving = false;
  
  async function handleSubmit() {
    if (!formData.title.trim()) {
      alert('Please enter a property title');
      return;
    }
    
    saving = true;
    
    try {
      // Submit to API
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create listing');
      }
      
      // Navigate back to listings
      goto('/listings');
    } catch (error) {
      console.error('Failed to save listing:', error);
      alert(error instanceof Error ? error.message : 'Failed to save listing. Please try again.');
    } finally {
      saving = false;
    }
  }
  
  function handleCancel() {
    goto('/listings');
  }
</script>

<svelte:head>
  <title>Add New Listing - Reviews Dashboard</title>
</svelte:head>

<div class="max-w-2xl">
  <!-- Page Header -->
  <div class="mb-8">
    <div class="flex items-center gap-3 mb-4">
      <button 
        on:click={handleCancel}
        class="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
        aria-label="Go back to listings"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <div>
        <h1 class="text-2xl font-bold text-slate-900">Add New Listing</h1>
        <p class="text-slate-600">Create a new property listing to start collecting reviews</p>
      </div>
    </div>
  </div>

  <!-- Form -->
  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    <div class="bg-white shadow-card rounded-2xl border border-slate-100 p-6">
      <h2 class="text-lg font-semibold text-slate-900 mb-6">Property Information</h2>
      
      <div class="space-y-6">
        <!-- Title -->
        <div>
          <label for="title" class="block text-sm font-medium text-slate-700 mb-2">
            Property Title *
          </label>
          <input
            id="title"
            type="text"
            bind:value={formData.title}
            placeholder="e.g., Modern Downtown Apartment"
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            required
          />
        </div>

        <!-- Address -->
        <div>
          <label for="address" class="block text-sm font-medium text-slate-700 mb-2">
            Address
          </label>
          <input
            id="address"
            type="text"
            bind:value={formData.address}
            placeholder="e.g., 123 Main St, Downtown"
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <!-- Channel -->
        <div>
          <label for="channel" class="block text-sm font-medium text-slate-700 mb-2">
            Channel *
          </label>
          <select
            id="channel"
            bind:value={formData.channel}
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            required
          >
            <option value="Airbnb">Airbnb</option>
            <option value="Booking.com">Booking.com</option>
            <option value="Google">Google</option>
          </select>
        </div>

        <!-- Status -->
        <div>
          <label for="status" class="block text-sm font-medium text-slate-700 mb-2">
            Status
          </label>
          <select
            id="status"
            bind:value={formData.status}
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-slate-700 mb-2">
            Description
          </label>
          <textarea
            id="description"
            bind:value={formData.description}
            placeholder="Brief description of the property..."
            rows="4"
            class="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-end gap-3">
      <button
        type="button"
        on:click={handleCancel}
        disabled={saving}
        class="px-6 py-3 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving || !formData.title.trim()}
        class="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl text-sm font-medium hover:from-brand-600 hover:to-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {#if saving}
          <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          Saving...
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Listing
        {/if}
      </button>
    </div>
  </form>
</div>
