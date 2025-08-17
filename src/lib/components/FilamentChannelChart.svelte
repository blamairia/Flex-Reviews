<script lang="ts">
  export let channels: Array<{name: string, count: number, percentage: number}> = [];
  export let loading = false;
  
  const channelColors = {
    'Airbnb': '#FF5A5F',
    'Booking.com': '#003580',
    'Google': '#4285F4',
    'Direct': '#059669'
  };
  
  // Generate sample data if empty
  $: chartData = channels.length > 0 ? channels : [
    { name: 'Airbnb', count: 45, percentage: 45 },
    { name: 'Booking.com', count: 30, percentage: 30 },
    { name: 'Google', count: 20, percentage: 20 },
    { name: 'Direct', count: 5, percentage: 5 }
  ];
  
  $: total = chartData.reduce((sum, c) => sum + (c.count || 0), 0);
  
  function getChannelBadgeClass(channelName: string) {
    const baseClass = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium";
    
    switch(channelName) {
      case 'Airbnb': return `${baseClass} bg-red-50 text-red-700`;
      case 'Booking.com': return `${baseClass} bg-blue-50 text-blue-700`;
      case 'Google': return `${baseClass} bg-blue-50 text-blue-600`;
      default: return `${baseClass} bg-brand-50 text-brand-700`;
    }
  }
  
  function createPieSlices() {
    let cumulativeAngle = 0;
    const radius = 60;
    const centerX = 100;
    const centerY = 100;
    
    return chartData.map(channel => {
      const percentage = channel.percentage || 0;
      const angle = (percentage / 100) * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      
      cumulativeAngle += angle;
      
      const startAngleRad = (startAngle * Math.PI) / 180;
      const endAngleRad = (endAngle * Math.PI) / 180;
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const x1 = centerX + radius * Math.cos(startAngleRad);
      const y1 = centerY + radius * Math.sin(startAngleRad);
      const x2 = centerX + radius * Math.cos(endAngleRad);
      const y2 = centerY + radius * Math.sin(endAngleRad);
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');
      
      return {
        path: pathData,
        color: channelColors[channel.name as keyof typeof channelColors] || '#64748b',
        ...channel
      };
    });
  }
  
  $: pieSlices = createPieSlices();
</script>

<div class="bg-white shadow-card rounded-2xl border border-slate-100">
  <div class="p-6 border-b border-slate-100">
    <h3 class="text-lg font-semibold text-slate-900">Channel Distribution</h3>
    <p class="text-sm text-slate-500 mt-1">Reviews breakdown by channel</p>
  </div>
  
  <div class="p-6">
    {#if loading}
      <div class="animate-pulse">
        <div class="h-64 bg-slate-200 rounded mb-4"></div>
        <div class="space-y-2">
          <div class="h-4 bg-slate-200 rounded"></div>
          <div class="h-4 bg-slate-200 rounded w-3/4"></div>
          <div class="h-4 bg-slate-200 rounded w-1/2"></div>
        </div>
      </div>
    {:else if channels.length === 0}
      <div class="h-64 flex items-center justify-center text-slate-500">
        <div class="text-center">
          <div class="text-lg mb-2">📊</div>
          <div class="text-sm">No channel data available</div>
        </div>
      </div>
    {:else}
      <div class="grid md:grid-cols-2 gap-6 items-center">
        <!-- SVG Donut Chart -->
        <div class="flex justify-center">
          <div class="relative">
            <svg width="200" height="200" viewBox="0 0 200 200">
              {#each pieSlices as slice}
                <path
                  d={slice.path}
                  fill={slice.color}
                  stroke="white"
                  stroke-width="2"
                />
              {/each}
              
              <!-- Center circle for donut effect -->
              <circle cx="100" cy="100" r="35" fill="white" />
              
              <!-- Center text -->
              <text x="100" y="95" text-anchor="middle" class="text-xs fill-slate-500 font-medium">
                Total Reviews
              </text>
              <text x="100" y="110" text-anchor="middle" class="text-lg fill-slate-900 font-bold">
                {total}
              </text>
            </svg>
          </div>
        </div>
        
        <div class="space-y-4">
          {#each chartData as channel}
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div 
                  class="w-3 h-3 rounded-full" 
                  style="background-color: {channelColors[channel.name as keyof typeof channelColors] || '#64748b'}"
                ></div>
                <span class="text-sm font-medium text-slate-900">{channel.name}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="text-sm text-slate-500">{channel.count || 0}</span>
                <span class={getChannelBadgeClass(channel.name)}>
                  {(channel.percentage || 0).toFixed(1)}%
                </span>
              </div>
            </div>
            <div class="ml-6">
              <div class="w-full bg-slate-100 rounded-full h-2">
                <div 
                  class="h-2 rounded-full transition-all duration-300" 
                  style="width: {channel.percentage || 0}%; background-color: {channelColors[channel.name as keyof typeof channelColors] || '#64748b'}"
                ></div>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>
