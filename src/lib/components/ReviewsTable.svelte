<script lang="ts">
  import CategoryBadges from './CategoryBadges.svelte';
  import ChannelPill from './ChannelPill.svelte';
  import { createEventDispatcher } from 'svelte';
  export let data: any;
  const dispatch = createEventDispatcher();
  async function toggleSelected(id: string, selected: boolean) {
    const res = await fetch('/api/reviews/selection', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reviewId: id, selectedForWeb: selected })
    });
    if (res.ok) {
      const row = data.reviews.find((r: any) => r.id === id);
      if (row) row.selectedForWeb = selected;
    }
  }
</script>

<div class="border rounded">
  <table class="w-full text-sm">
    <thead class="bg-gray-50">
      <tr>
        <th class="p-2 text-left">Date</th>
        <th class="p-2 text-left">Listing</th>
        <th class="p-2 text-left">Channel</th>
        <th class="p-2 text-left">Type</th>
        <th class="p-2 text-left">Overall</th>
        <th class="p-2 text-left">Categories</th>
        <th class="p-2 text-left">Snippet</th>
        <th class="p-2">Selected</th>
      </tr>
    </thead>
    <tbody>
      {#each data.reviews as r}
        <tr class="border-t">
          <td class="p-2">{new Date(r.submittedAt).toISOString().slice(0,10)}</td>
          <td class="p-2">{r.listingName}</td>
          <td class="p-2"><ChannelPill channel={r.channel} /></td>
          <td class="p-2">{r.type}</td>
          <td class="p-2">{r.overallRating ?? Math.round((r.categories.reduce((a,c)=>a+c.rating,0)/Math.max(1,r.categories.length))*10)/10} {r.overallRating==null ? '(avg)' : ''}</td>
          <td class="p-2"><CategoryBadges categories={r.categories} /></td>
          <td class="p-2">{r.publicReview.slice(0,140)}</td>
          <td class="p-2 text-center">
            <input type="checkbox" checked={r.selectedForWeb} on:change={(e)=>toggleSelected(r.id, e.currentTarget.checked)} />
          </td>
        </tr>
      {/each}
      {#if data.reviews.length === 0}
        <tr><td colspan="8" class="p-4 text-center text-gray-500">No data</td></tr>
      {/if}
    </tbody>
  </table>
  <div class="flex justify-between items-center p-2 border-t">
    <div>Total: {data.meta.total}</div>
    <div class="space-x-2">
      <button class="px-2 py-1 border rounded" on:click={()=>dispatch('pageChange', Math.max(1, data.meta.page-1))}>Prev</button>
      <span>Page {data.meta.page}</span>
      <button class="px-2 py-1 border rounded" on:click={()=>dispatch('pageChange', data.meta.page+1)}>Next</button>
    </div>
  </div>
</div>
