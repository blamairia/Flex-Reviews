<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let data: any;
  const dispatch = createEventDispatcher();
  let listingId = '';
  let type = '';
  let channel = '';
  let minRating = 0;
  let selectedOnly = false;
  let from = '';
  let to = '';
  function apply() {
    dispatch('change', { listingId, type, channel, minRating, selectedOnly: selectedOnly ? 1 : undefined, from, to, page: 1 });
  }
</script>

<div class="space-y-4">
  <div>
    <label class="block text-sm mb-1" for="listing">Listing</label>
    <select id="listing" bind:value={listingId} class="w-full border rounded p-2">
      <option value="">All</option>
      {#each data.listings as l}
        <option value={l.id}>{l.name}</option>
      {/each}
    </select>
  </div>
  <div class="grid grid-cols-2 gap-2">
    <div>
      <label class="block text-sm mb-1" for="from">From</label>
      <input id="from" type="date" bind:value={from} class="w-full border rounded p-2" />
    </div>
    <div>
      <label class="block text-sm mb-1" for="to">To</label>
      <input id="to" type="date" bind:value={to} class="w-full border rounded p-2" />
    </div>
  </div>
  <div>
    <label class="block text-sm mb-1" for="channel">Channel</label>
    <select id="channel" bind:value={channel} class="w-full border rounded p-2">
      <option value="">All</option>
      <option value="hostaway">Hostaway</option>
      <option value="google">Google</option>
      <option value="airbnb">Airbnb</option>
      <option value="booking">Booking</option>
      <option value="direct">Direct</option>
    </select>
  </div>
  <div>
    <label class="block text-sm mb-1" for="type">Type</label>
    <select id="type" bind:value={type} class="w-full border rounded p-2">
      <option value="">All</option>
      <option value="guest-to-host">Guest to Host</option>
      <option value="host-to-guest">Host to Guest</option>
    </select>
  </div>
  <div>
    <label class="block text-sm mb-1" for="minrating">Min Rating: {minRating}</label>
    <input id="minrating" type="range" min="0" max="10" step="1" bind:value={minRating} class="w-full" />
  </div>
  <div class="flex items-center gap-2">
    <input id="sel" type="checkbox" bind:checked={selectedOnly} />
    <label for="sel">Selected only</label>
  </div>
  <button class="w-full bg-black text-white py-2 rounded" on:click={apply}>Apply</button>
</div>
