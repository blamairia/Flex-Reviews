<script lang="ts">
  export let channels: any[] = [];
  
  $: total = channels.reduce((sum, ch) => sum + ch.count, 0);
  $: channelsWithPercent = channels.map(ch => ({
    ...ch,
    percent: total > 0 ? (ch.count / total) * 100 : 0
  }));
  
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', 
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ];
</script>

<div class="space-y-4">
  {#if channelsWithPercent.length > 0}
    <!-- Visual bars -->
    <div class="space-y-3">
      {#each channelsWithPercent as channel, i}
        <div class="relative">
          <div class="flex justify-between items-center mb-1">
            <span class="text-sm font-medium text-gray-700 capitalize">{channel.channel}</span>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600">{channel.count}</span>
              <span class="text-xs text-gray-500">({channel.percent.toFixed(1)}%)</span>
            </div>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div 
              class="h-2 rounded-full transition-all duration-500 ease-out"
              style="width: {channel.percent}%; background-color: {colors[i % colors.length]}"
            ></div>
          </div>
        </div>
      {/each}
    </div>
    
    <!-- Legend -->
    <div class="grid grid-cols-2 gap-2 pt-4 border-t">
      {#each channelsWithPercent as channel, i}
        <div class="flex items-center gap-2">
          <div 
            class="w-3 h-3 rounded-full"
            style="background-color: {colors[i % colors.length]}"
          ></div>
          <span class="text-xs text-gray-600 capitalize">{channel.channel}</span>
        </div>
      {/each}
    </div>
    
    <!-- Summary -->
    <div class="text-center pt-2">
      <p class="text-sm text-gray-600">
        <span class="font-medium">{total}</span> reviews across 
        <span class="font-medium">{channels.length}</span> channel{channels.length !== 1 ? 's' : ''}
      </p>
    </div>
  {:else}
    <div class="h-32 flex items-center justify-center text-gray-400">
      <div class="text-center">
        <div class="text-2xl mb-2">📊</div>
        <p>No channel data available</p>
      </div>
    </div>
  {/if}
</div>
