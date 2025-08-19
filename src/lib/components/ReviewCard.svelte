<script lang="ts">
  export let r: any;
  function guestAbbrev(name: string) {
    const parts = name.trim().split(/\s+/);
    if (!parts.length) return 'Guest';
    const first = parts[0];
    const last = parts[1] ? parts[1][0].toUpperCase()+'.' : '';
    return `${first} ${last}`.trim();
  }
</script>

<div class="border border-surface-divider rounded-card p-card bg-surface-card shadow-card">
  <div class="flex items-center justify-between">
    <div class="font-semibold text-text-primary">{guestAbbrev(r.guestName)}</div>
    <div class="text-body text-text-secondary">{new Date(r.submittedAt).toLocaleString(undefined,{month:'short', year:'numeric'})}</div>
  </div>
  <div class="text-display font-bold my-2 text-brand-700">{r.overallRating ?? Math.round((r.categories.reduce((a,c)=>a+c.rating,0)/Math.max(1,r.categories.length))*10)/10}</div>
  <div class="text-body text-text-secondary mb-2">{r.channel}</div>
  <div class="text-body text-text-primary">{r.publicReview}</div>
</div>
