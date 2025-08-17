<script lang="ts">
  export let trend: any[] = [];
  
  $: chartData = trend.length > 0 ? trend : [
    { bucket: 'Week 1', avg: 8.5 },
    { bucket: 'Week 2', avg: 9.0 },
    { bucket: 'Week 3', avg: 9.2 },
    { bucket: 'Week 4', avg: 9.1 }
  ];
  
  $: maxRating = Math.max(...chartData.map(d => d.avg || 0), 10);
  $: minRating = Math.min(...chartData.map(d => d.avg || 0), 0);
  
  function getPointY(value: number): number {
    const range = maxRating - minRating;
    const normalized = range > 0 ? (value - minRating) / range : 0.5;
    return 140 - (normalized * 120); // SVG height 140, chart area 120
  }
  
  function getPointX(index: number): number {
    const width = 320; // SVG width
    const padding = 40;
    const chartWidth = width - (padding * 2);
    return padding + (index * chartWidth / Math.max(chartData.length - 1, 1));
  }
  
  $: pathD = chartData.map((point, i) => {
    const x = getPointX(i);
    const y = getPointY(point.avg || 0);
    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
  }).join(' ');
</script>

<div class="w-full">
  {#if chartData.length > 0}
    <div class="relative">
      <svg viewBox="0 0 320 160" class="w-full h-40">
        <!-- Grid lines -->
        {#each Array(5) as _, i}
          <line 
            x1="40" 
            y1={20 + i * 30} 
            x2="280" 
            y2={20 + i * 30} 
            stroke="#f3f4f6" 
            stroke-width="1"
          />
        {/each}
        
        <!-- Trend line -->
        <path 
          d={pathD} 
          fill="none" 
          stroke="#3b82f6" 
          stroke-width="3" 
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        
        <!-- Data points -->
        {#each chartData as point, i}
          <circle 
            cx={getPointX(i)} 
            cy={getPointY(point.avg || 0)} 
            r="4" 
            fill="#3b82f6"
            class="drop-shadow-sm"
          />
          
          <!-- Value labels -->
          <text 
            x={getPointX(i)} 
            y={getPointY(point.avg || 0) - 10} 
            text-anchor="middle" 
            class="text-xs fill-gray-600 font-medium"
          >
            {(point.avg || 0).toFixed(1)}
          </text>
        {/each}
        
        <!-- X-axis labels -->
        {#each chartData as point, i}
          <text 
            x={getPointX(i)} 
            y="155" 
            text-anchor="middle" 
            class="text-xs fill-gray-500"
          >
            {point.bucket.replace('Week ', 'W')}
          </text>
        {/each}
      </svg>
    </div>
    
    <div class="mt-4 text-sm text-gray-600 text-center">
      {#if trend.length > 0}
        <p>Average rating trend over the last {chartData.length} weeks</p>
      {:else}
        <p class="text-gray-400 italic">Sample trend data (no weekly data available)</p>
      {/if}
    </div>
  {:else}
    <div class="h-40 flex items-center justify-center text-gray-400">
      <p>No trend data available</p>
    </div>
  {/if}
</div>
