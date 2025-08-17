<script lang="ts">
  export let kpis: any = {};
  
  function formatDelta(delta: number): string {
    if (delta === 0) return '—';
    const sign = delta > 0 ? '+' : '';
    return `${sign}${delta.toFixed(1)}`;
  }
  
  function getDeltaColor(delta: number): string {
    if (delta > 0) return 'text-green-600';
    if (delta < 0) return 'text-red-600';
    return 'text-gray-500';
  }
</script>

<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-blue-600 uppercase tracking-wide">Avg Rating</p>
        <p class="text-3xl font-bold text-blue-900 mt-2">{kpis.avgRating?.toFixed(1) ?? '—'}</p>
        <p class="text-sm text-blue-700 mt-1">out of 10</p>
      </div>
      <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
        </svg>
      </div>
    </div>
  </div>
  
  <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-green-600 uppercase tracking-wide">Total Reviews</p>
        <p class="text-3xl font-bold text-green-900 mt-2">{kpis.reviewCount ?? 0}</p>
        <p class="text-sm {getDeltaColor(kpis.last30dDelta)} mt-1">
          {formatDelta(kpis.last30dDelta)} this month
        </p>
      </div>
      <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
      </div>
    </div>
  </div>
  
  <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-purple-600 uppercase tracking-wide">5-Star Rate</p>
        <p class="text-3xl font-bold text-purple-900 mt-2">{((kpis.fiveStarPct ?? 0) * 100).toFixed(0)}%</p>
        <p class="text-sm text-purple-700 mt-1">excellent reviews</p>
      </div>
      <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
      </div>
    </div>
  </div>
  
  <div class="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-sm">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium text-orange-600 uppercase tracking-wide">Growth</p>
        <p class="text-3xl font-bold text-orange-900 mt-2 {getDeltaColor(kpis.last30dDelta)}">
          {formatDelta(kpis.last30dDelta)}
        </p>
        <p class="text-sm text-orange-700 mt-1">last 30 days</p>
      </div>
      <div class="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
        </svg>
      </div>
    </div>
  </div>
</div>
