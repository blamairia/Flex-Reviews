<script lang="ts">
  import "../app.css";
  import AppShell from '$lib/components/AppShell.svelte';
  import { page } from '$app/stores';
  
  // Map routes to titles
  $: title = getTitleFromPath($page.url.pathname);
  
  function getTitleFromPath(path: string): string {
    if (path === '/' || path === '/dashboard') return 'Dashboard';
    if (path === '/reviews' || path.startsWith('/reviews/')) return 'Reviews';
    if (path === '/listings' || path.startsWith('/listings/')) return 'Listings';
    if (path.startsWith('/property/')) return 'Property Details';
    if (path.startsWith('/preview/')) return 'Preview';
    if (path.startsWith('/google-test')) return 'Google APIs Test';
    if (path.startsWith('/hostaway-test')) return 'Hostaway Test';
    if (path === '/settings' || path.startsWith('/settings/')) return 'Settings';
    return 'Dashboard';
  }
</script>

<AppShell {title}>
  <slot />
</AppShell>
