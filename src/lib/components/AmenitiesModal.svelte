<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getAmenityIcon, getIcon, amenityIcon } from '$lib/utils/amenities';
  
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
    class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
    on:click={handleBackdropClick}
    role="button"
    tabindex="-1"
  >
    <!-- Modal Content -->
    <div class="bg-surface-card rounded-card max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-floating border border-surface-divider">
      <!-- Modal Header -->
      <div class="p-card border-b border-surface-divider flex items-center justify-between bg-surface-card">
        <div>
          <h3 class="text-heading font-bold text-text-primary">All Amenities & Features</h3>
          <p class="text-text-secondary mt-1">{totalAmenities} amenities organized by category</p>
        </div>
        <button
          on:click={closeModal}
          class="p-2 hover:bg-surface-tint rounded-control transition-colors"
          aria-label="Close modal"
        >
          <svg class="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      
      <!-- Modal Body -->
      <div class="p-card overflow-y-auto max-h-[calc(90vh-140px)]">
        <div class="space-y-8">
          {#each categorizedAmenities as group}
            <div>
              <div class="flex items-center gap-3 mb-4">
                <span class="text-3xl">{group.icon}</span>
                <h4 class="text-title font-semibold text-text-primary">{group.name}</h4>
                <span class="text-caption text-text-secondary bg-surface-tint px-2 py-1 rounded-full">
                  {group.amenities.length} items
                </span>
              </div>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {#each group.amenities as amenity}
                  <div class="flex items-center gap-3 p-3 bg-surface-tint rounded-control hover:bg-surface-divider transition-colors">
                    <div class="w-8 h-8 flex items-center justify-center flex-shrink-0">
                      {@html getIcon(amenityIcon(amenity.name))}
                    </div>
                    <span class="text-text-primary text-body font-medium">{amenity.name}</span>
                  </div>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </div>
      
      <!-- Modal Footer -->
      <div class="p-card border-t border-surface-divider bg-surface-tint">
        <div class="flex items-center justify-between">
          <div class="text-caption text-text-secondary">
            Total: {totalAmenities} amenities across {categorizedAmenities.length} categories
          </div>
          <button
            on:click={closeModal}
            class="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-control transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}
