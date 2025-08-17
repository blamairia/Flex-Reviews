<script lang="ts">
  export let data: Array<{week: string, value: number}> = [];
  export let loading = false;
  
  // Generate sample data if empty
  $: chartData = data.length > 0 ? data : [
    { week: 'Week 1', value: 4.2 },
    { week: 'Week 2', value: 4.5 },
    { week: 'Week 3', value: 4.3 },
    { week: 'Week 4', value: 4.7 },
    { week: 'Week 5', value: 4.6 },
    { week: 'Week 6', value: 4.8 }
  ];
  
  $: maxValue = Math.max(...chartData.map(d => d.value || 0));
  $: minValue = Math.min(...chartData.map(d => d.value || 0));
  $: range = maxValue - minValue || 1;
  
  function getY(value: number) {
    const safeValue = value || 0;
    return 40 + ((maxValue - safeValue) / range) * 120;
  }
  
  function getPath() {
    if (chartData.length === 0) return '';
    
    const points = chartData.map((d, i) => {
      const x = 40 + (i * (320 / (chartData.length - 1)));
      const y = getY(d.value || 0);
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  }
</script>

<div class="bg-white shadow-card rounded-2xl border border-slate-100">
  <div class="p-6 border-b border-slate-100">
    <h3 class="text-lg font-semibold text-slate-900">Rating Trend</h3>
    <p class="text-sm text-slate-500 mt-1">Weekly average ratings over time</p>
  </div>
  
  <div class="p-6">
    {#if loading}
      <div class="animate-pulse">
        <div class="h-48 bg-slate-200 rounded"></div>
      </div>
    {:else if chartData.length === 0}
      <div class="h-48 flex items-center justify-center text-slate-500">
        <div class="text-center">
          <div class="text-lg mb-2">📈</div>
          <div class="text-sm">No trend data available</div>
        </div>
      </div>
    {:else}
      <div class="h-48">
        <svg viewBox="0 0 400 200" class="w-full h-full">
          <!-- Grid lines -->
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          <!-- Area fill -->
          <defs>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:#10b981;stop-opacity:0.05" />
            </linearGradient>
          </defs>
          
          <path 
            d="{getPath()} L {40 + ((chartData.length - 1) * (320 / (chartData.length - 1)))},160 L 40,160 Z"
            fill="url(#areaGradient)"
          />
          
          <!-- Line -->
          <path 
            d="{getPath()}"
            fill="none" 
            stroke="#059669" 
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          
          <!-- Data points -->
          {#each chartData as point, i}
            <circle 
              cx={40 + (i * (320 / (chartData.length - 1)))}
              cy={getY(point.value)}
              r="4"
              fill="#059669"
              stroke="white"
              stroke-width="2"
            />
          {/each}
          
          <!-- Labels -->
          {#each chartData as point, i}
            <text 
              x={40 + (i * (320 / (chartData.length - 1)))}
              y="190"
              text-anchor="middle"
              class="text-xs fill-slate-500"
            >
              {point.week}
            </text>
          {/each}
        </svg>
      </div>
    {/if}
  </div>
</div>
