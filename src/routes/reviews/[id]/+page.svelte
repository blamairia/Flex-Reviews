<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  let review: any = null;
  let id = '';
  $: id = $page.params.id;
  let note = '';
  let selected = false;
  async function load() {
    const res = await fetch(`/api/reviews/hostaway?limit=1`);
    const data = await res.json();
    const found = data.reviews.find((r: any) => r.id === id);
    review = found || null;
    if (review) { selected = review.selectedForWeb; note = review.note || ''; }
  }
  async function saveSelection() {
    await fetch('/api/reviews/selection', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ reviewId: id, selectedForWeb: selected, note })
    });
  }
  onMount(load);
</script>

<svelte:head><title>Review {id}</title></svelte:head>

<div class="container mx-auto p-6">
  {#if !review}
    <div>Loading…</div>
  {:else}
    <div class="max-w-3xl space-y-4">
      <div class="text-2xl font-bold">{review.listingName}</div>
      <div class="text-sm text-gray-600">{new Date(review.submittedAt).toLocaleString()}</div>
      <div class="p-4 border rounded bg-white">{review.publicReview}</div>
      <div class="flex items-center gap-2">
        <input id="sel" type="checkbox" bind:checked={selected}>
        <label for="sel">Selected for Web</label>
      </div>
      <div>
        <label for="note" class="block text-sm mb-1">Note</label>
        <textarea id="note" bind:value={note} rows="4" class="w-full border rounded p-2"></textarea>
      </div>
      <button class="px-3 py-2 bg-black text-white rounded" on:click={saveSelection}>Save</button>
    </div>
  {/if}
</div>
