<script lang="ts">
  import { goto } from '$app/navigation';
  export let topListings: any[] = [];
  export let listings: any[] = []; // backward compatibility
  
  $: displayListings = topListings.length > 0 ? topListings : listings;
  
  function navigateToListing(listingId: string) {
    goto(`/listings/${listingId}`);
  }
  
  function getRatingColor(rating: number): string {
    if (rating >= 9) return 'text-green-600 bg-green-50';
    if (rating >= 8) return 'text-blue-600 bg-blue-50';
    if (rating >= 7) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  }
</script>

{#if displayListings.length > 0}
  <div class="overflow-x-auto">
    <table class="w-full">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Listing
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Avg Rating
          </th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Reviews
          </th>
          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
            Actions
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        {#each displayListings as listing, i}
          <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4">
              <div class="flex items-center">
                <div class="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span class="text-white text-sm font-bold">#{i + 1}</span>
                </div>
                <div class="ml-4">
                  <div class="text-sm font-medium text-gray-900">
                    {listing.name || listing.listingName || `Listing ${listing.listingId}`}
                  </div>
                  <div class="text-sm text-gray-500">
                    ID: {listing.listingId}
                  </div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getRatingColor(listing.avg)}">
                {listing.avg?.toFixed(1) ?? '—'}/10
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">
              <div class="flex items-center">
                <span class="font-medium">{listing.count}</span>
                <span class="ml-1 text-gray-500">review{listing.count !== 1 ? 's' : ''}</span>
              </div>
            </td>
            <td class="px-6 py-4 text-right text-sm font-medium">
              <button
                class="text-blue-600 hover:text-blue-900 hover:underline"
                on:click={() => navigateToListing(listing.listingId)}
              >
                View Details
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  
  <div class="px-6 py-3 bg-gray-50 text-center">
    <p class="text-sm text-gray-600">
      Showing top {displayListings.length} performing listing{displayListings.length !== 1 ? 's' : ''}
    </p>
  </div>
{:else}
  <div class="p-8 text-center text-gray-400">
    <div class="text-2xl mb-2">🏠</div>
    <p>No listings data available</p>
  </div>
{/if}
