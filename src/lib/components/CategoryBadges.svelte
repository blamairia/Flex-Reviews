<script lang="ts">
  export let categories: { key: string; rating: number }[] = [];
</script>
<div class="flex flex-wrap gap-1">
  {#each categories as c}
    <span class="text-xs bg-gray-100 border rounded px-2 py-0.5">{c.key}: {c.rating}</span>
  {/each}
</div>
