<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getAmenityIcon } from '$lib/utils/amenities';
  
  export let isOpen = false;
  export let categorizedAmenities: any[] = [];
  
  const dispatch = createEventDispatcher();
  
  function closeModal() {
    isOpen = false;
    dispatch('close');
  }
  
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closeModal();
    }
  }
  
  function handleBackdropClick(event: MouseEvent) {
    if (event.target === event.currentTarget) {
      closeModal();
    }
  }
  
  $: totalAmenities = categorizedAmenities.reduce((total, group) => total + group.amenities.length, 0);
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isOpen}
  <!-- Modal Backdrop -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    on:click={handleBackdropClick}
    role="button"
    tabindex="-1"
  >
    <!-- Modal Content -->
    <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
      <!-- Modal Header -->
      <div class="p-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 class="text-2xl font-bold text-slate-900">All Amenities & Features</h3>
          <p class="text-slate-600 mt-1">{totalAmenities} amenities organized by category</p>
        </div>
        <button
          on:click={closeModal}
          class="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          aria-label="Close modal"
        >
          <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <!-- Modal Body -->
      <div class="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        <div class="space-y-8">
          {#each categorizedAmenities as group}
            <div>
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl">{group.icon}</span>
                <h4 class="text-xl font-semibold text-slate-900">{group.name}</h4>
                <span class="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                  {group.amenities.length} items
                </span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {#each group.amenities as amenity}
                  <div class="flex items-center gap-3 p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                    <span class="text-lg flex-shrink-0">{amenity.icon}</span>
                    <span class="text-slate-700 text-sm font-medium">{amenity.name}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Modal Footer -->
      <div class="p-6 border-t border-slate-200 bg-slate-50">
        <div class="flex items-center justify-between">
          <div class="text-sm text-slate-600">
            Total: {totalAmenities} amenities across {categorizedAmenities.length} categories
          </div>
          <button
            on:click={closeModal}
            class="px-4 py-2 bg-slate-600 text-white rounded-xl hover:bg-slate-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
