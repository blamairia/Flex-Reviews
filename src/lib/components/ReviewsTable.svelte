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

<div class="border border-surface-divider rounded-card shadow-card">
  <table class="w-full text-body">
    <thead class="bg-surface-tint">
      <tr>
        <th class="p-2 text-left text-text-primary font-semibold">Date</th>
        <th class="p-2 text-left text-text-primary font-semibold">Listing</th>
        <th class="p-2 text-left text-text-primary font-semibold">Channel</th>
        <th class="p-2 text-left text-text-primary font-semibold">Type</th>
        <th class="p-2 text-left text-text-primary font-semibold">Overall</th>
        <th class="p-2 text-left text-text-primary font-semibold">Categories</th>
        <th class="p-2 text-left text-text-primary font-semibold">Snippet</th>
        <th class="p-2 text-text-primary font-semibold">Selected</th>
      </tr>
    </thead>
    <tbody class="bg-surface-card">
      {#each data.reviews as r}
        <tr class="border-t border-surface-divider hover:bg-surface-tint transition-colors">
          <td class="p-2 text-text-primary">{new Date(r.submittedAt).toISOString().slice(0,10)}</td>
          <td class="p-2 text-text-primary">{r.listingName}</td>
          <td class="p-2"><ChannelPill channel={r.channel} /></td>
          <td class="p-2 text-text-secondary">{r.type}</td>
          <td class="p-2 text-brand-700 font-semibold">{r.overallRating ?? Math.round((r.categories.reduce((a,c)=>a+c.rating,0)/Math.max(1,r.categories.length))*10)/10} {r.overallRating==null ? '(avg)' : ''}</td>
          <td class="p-2"><CategoryBadges categories={r.categories} /></td>
          <td class="p-2 text-text-secondary">{r.publicReview.slice(0,140)}</td>
          <td class="p-2 text-center">
            <input type="checkbox" checked={r.selectedForWeb} on:change={(e)=>toggleSelected(r.id, e.currentTarget.checked)} class="accent-brand-600" />
          </td>
        </tr>
      {/each}
      {#if data.reviews.length === 0}
        <tr><td colspan="8" class="p-4 text-center text-text-secondary">No data</td></tr>
      {/if}
    </tbody>
  </table>
  <div class="flex justify-between items-center p-2 border-t border-surface-divider bg-surface-tint">
    <div class="text-text-secondary">Total: {data.meta.total}</div>
    <div class="space-x-2">
      <button class="px-3 py-1 border border-surface-divider rounded-control bg-surface-card hover:bg-surface-tint transition-colors text-text-primary" on:click={()=>dispatch('pageChange', Math.max(1, data.meta.page-1))}>Prev</button>
      <span class="text-text-primary">Page {data.meta.page}</span>
      <button class="px-3 py-1 border border-surface-divider rounded-control bg-surface-card hover:bg-surface-tint transition-colors text-text-primary" on:click={()=>dispatch('pageChange', data.meta.page+1)}>Next</button>
    </div>
  </div>
</div>
