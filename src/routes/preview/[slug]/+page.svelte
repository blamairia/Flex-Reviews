<script lang="ts">
  import { onMount } from 'svelte';
  import ReviewCard from '$lib/components/ReviewCard.svelte';
  import { page } from '$app/stores';
  let payload: any = null;
  $: slug = $page.params.slug;
  async function load() {
    // use direct by-slug endpoint
    try {
      const listingRes = await fetch(`/api/listings/by-slug/${slug}`);
      if (listingRes.ok) {
        const listing = await listingRes.json();
        const sel = await fetch(`/api/listings/${listing.id}/selected-reviews`);
        payload = await sel.json();
      } else {
        payload = { listing: { name: slug }, reviews: [] };
      }
    } catch {
      payload = { listing: { name: slug }, reviews: [] };
    }
  }
  onMount(load);
</script>

<svelte:head>
  <title>Preview</title>
</svelte:head>

<div class="container mx-auto p-6">
  {#if !payload}
    <p>Loading…</p>
  {:else}
    <header class="mb-6">
      <div class="h-40 bg-gray-200 rounded-md mb-4"></div>
      <h1 class="text-3xl font-bold">{payload.listing.name}</h1>
    </header>
    {#if payload.reviews.length === 0}
      <div class="p-6 text-gray-600">No selected reviews yet.</div>
    {:else}
      <div class="grid md:grid-cols-2 gap-4">
        {#each payload.reviews as r}
          <ReviewCard {r} />
        {/each}
      </div>
    {/if}
  {/if}
</div>
