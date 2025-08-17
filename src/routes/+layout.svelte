<script lang="ts">
  import "../app.css";
  import AppShell from '$lib/components/AppShell.svelte';
  import { page } from '$app/stores';
  
  // Map routes to titles
  $: title = getTitleFromPath($page.url.pathname);
  
  function getTitleFromPath(path: string): string {
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/reviews') return 'Reviews';
    if (path.startsWith('/listings')) return 'Listings';
    if (path.startsWith('/preview')) return 'Preview';
    if (path === '/settings') return 'Settings';
    return 'Dashboard';
  }
</script>

<AppShell {title}>
  <slot />
</AppShell>
