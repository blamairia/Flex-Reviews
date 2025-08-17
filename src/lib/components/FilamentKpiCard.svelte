<script lang="ts">
  export let label = "Average Rating";
  export let value: string | number = "9.2";
  export let delta: number | undefined = undefined;
  export let icon: 'rating' | 'reviews' | 'stars' | 'growth' = 'rating';
  export let loading = false;
  
  function getIcon(iconType: string) {
    switch(iconType) {
      case 'rating':
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>`;
      case 'reviews':
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>`;
      case 'stars':
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>`;
      case 'growth':
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>`;
      default:
        return `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>`;
    }
  }
</script>

<div class="bg-white shadow-card rounded-2xl p-6 border border-slate-100">
  {#if loading}
    <div class="animate-pulse">
      <div class="h-4 w-24 bg-slate-200 rounded mb-3"></div>
      <div class="h-8 w-20 bg-slate-200 rounded mb-2"></div>
      <div class="h-3 w-16 bg-slate-200 rounded"></div>
    </div>
  {:else}
    <div class="flex items-start justify-between">
      <div class="flex-1">
        <div class="flex items-center gap-2 text-sm font-medium text-slate-500 mb-1">
          <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {@html getIcon(icon)}
          </svg>
          {label}
        </div>
        <div class="text-3xl font-bold text-slate-900 mb-1">{value}</div>
        {#if delta !== undefined}
          <div class="flex items-center gap-1 text-xs">
            {#if delta >= 0}
              <svg class="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
              </svg>
              <span class="text-emerald-600 font-medium">+{delta.toFixed(1)}%</span>
            {:else}
              <svg class="w-3 h-3 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/>
              </svg>
              <span class="text-rose-600 font-medium">{delta.toFixed(1)}%</span>
            {/if}
            <span class="text-slate-500">vs last 30d</span>
          </div>
        {/if}
      </div>
      <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center">
        <svg class="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {@html getIcon(icon)}
        </svg>
      </div>
    </div>
  {/if}
</div>
