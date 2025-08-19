<script lang="ts">
  import { page } from '$app/stores';
  import { browser } from '$app/environment';
  import { onMount } from 'svelte';
  
  export let title = "Dashboard";
  
  let sidebarCollapsed = false;
  let mobileMenuOpen = false;
  
  // Force reactivity by using a derived value
  $: currentPath = $page.url?.pathname || '';
  
  // Make these reactive so they update when currentPath changes
  $: isDashboardActive = currentPath === '/' || currentPath === '/dashboard';
  $: isReviewsActive = currentPath === '/reviews' || currentPath.startsWith('/reviews/');
  $: isListingsActive = currentPath === '/listings' || currentPath.startsWith('/listings/') || currentPath.startsWith('/property/');
  $: isGoogleTestActive = currentPath === '/google-test' || currentPath.startsWith('/google-test/');
  $: isHostawayTestActive = currentPath === '/hostaway-test' || currentPath.startsWith('/hostaway-test/');
  $: isSettingsActive = currentPath === '/settings' || currentPath.startsWith('/settings/');
  
  function toggleSidebar() {
    sidebarCollapsed = !sidebarCollapsed;
    if (browser) {
      localStorage.setItem('sidebarCollapsed', sidebarCollapsed.toString());
    }
  }
  
  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }
  
  // Handle keyboard shortcuts
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 's' && event.ctrlKey) {
      event.preventDefault();
      toggleSidebar();
    }
    if (event.key === 'Escape' && mobileMenuOpen) {
      mobileMenuOpen = false;
    }
  }
  
  onMount(() => {
    if (browser) {
      // Restore sidebar state from localStorage
      const saved = localStorage.getItem('sidebarCollapsed');
      if (saved) {
        sidebarCollapsed = saved === 'true';
      }
    }
  });
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="min-h-screen bg-slate-50 text-slate-900">
  <!-- Sidebar -->
  <aside class="fixed inset-y-0 left-0 {sidebarCollapsed ? 'w-16' : 'w-64'} bg-white shadow-soft z-40 hidden md:flex md:flex-col transition-all duration-300">
    <!-- Header -->
    <div class="h-16 px-5 flex items-center justify-between font-semibold">
      {#if !sidebarCollapsed}
        <span class="text-brand-600 text-xl">Flex Reviews</span>
      {/if}
      <button
        on:click={toggleSidebar}
        class="p-1.5 rounded-lg hover:bg-slate-100 transition-colors {sidebarCollapsed ? 'mx-auto' : ''}"
        title="Toggle sidebar (Ctrl+S)"
        aria-label="Toggle sidebar"
      >
        <svg class="w-4 h-4 {sidebarCollapsed ? 'rotate-180' : ''} transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/>
        </svg>
      </button>
    </div>
    
    <!-- Navigation -->
    <nav class="px-3 py-2 space-y-1 flex-1">
      <a 
        href="/dashboard" 
        class="flex items-center {sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg transition-colors {isDashboardActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'}"
        title={sidebarCollapsed ? 'Dashboard' : ''}
      >
        <svg class="w-[18px] h-[18px] {sidebarCollapsed ? '' : 'shrink-0'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        {#if !sidebarCollapsed}
          <span>Dashboard</span>
        {/if}
      </a>
      <a 
        href="/reviews" 
        class="flex items-center {sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg transition-colors {isReviewsActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'}"
        title={sidebarCollapsed ? 'Reviews' : ''}
      >
        <svg class="w-[18px] h-[18px] {sidebarCollapsed ? '' : 'shrink-0'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        {#if !sidebarCollapsed}
          <span>Reviews</span>
        {/if}
      </a>
      <a 
        href="/listings" 
        class="flex items-center {sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg transition-colors {isListingsActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'}"
        title={sidebarCollapsed ? 'Listings' : ''}
      >
        <svg class="w-[18px] h-[18px] {sidebarCollapsed ? '' : 'shrink-0'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
        {#if !sidebarCollapsed}
          <span>Listings</span>
        {/if}
      </a>
      <a 
        href="/google-test" 
        class="flex items-center {sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg transition-colors {isGoogleTestActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'}"
        title={sidebarCollapsed ? 'Google APIs Test' : ''}
      >
        <svg class="w-[18px] h-[18px] {sidebarCollapsed ? '' : 'shrink-0'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
        </svg>
        {#if !sidebarCollapsed}
          <span>Google APIs Test</span>
        {/if}
      </a>
      <a 
        href="/hostaway-test" 
        class="flex items-center {sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg transition-colors {isHostawayTestActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'}"
        title={sidebarCollapsed ? 'Hostaway Test' : ''}
      >
        <svg class="w-[18px] h-[18px] {sidebarCollapsed ? '' : 'shrink-0'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
        </svg>
        {#if !sidebarCollapsed}
          <span>Hostaway Test</span>
        {/if}
      </a>
      <a 
        href="/settings" 
        class="flex items-center {sidebarCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg transition-colors {isSettingsActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'}"
        title={sidebarCollapsed ? 'Settings' : ''}
      >
        <svg class="w-[18px] h-[18px] {sidebarCollapsed ? '' : 'shrink-0'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 616 0z"/>
        </svg>
        {#if !sidebarCollapsed}
          <span>Settings</span>
        {/if}
      </a>
    </nav>
  </aside>

  <!-- Mobile sidebar overlay -->
  {#if mobileMenuOpen}
    <div class="fixed inset-0 z-50 md:hidden">
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-black/50" 
        role="button"
        tabindex="0"
        on:click={toggleMobileMenu}
        on:keydown={(e) => e.key === 'Enter' && toggleMobileMenu()}
        aria-label="Close menu"
      ></div>
      
      <!-- Mobile sidebar -->
      <aside class="absolute left-0 top-0 h-full w-64 bg-white shadow-xl">
        <div class="h-16 px-5 flex items-center justify-between font-semibold border-b border-slate-200">
          <span class="text-brand-600 text-xl">Flex Reviews</span>
          <button
            on:click={toggleMobileMenu}
            class="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Close menu"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <nav class="px-3 py-2 space-y-1">
          <a 
            href="/dashboard"
            on:click={toggleMobileMenu}
            class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors {isDashboardActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'}"
          >
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Dashboard
          </a>
          <a 
            href="/reviews"
            on:click={toggleMobileMenu}
            class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors {isReviewsActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'}"
          >
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Reviews
          </a>
          <a 
            href="/listings"
            on:click={toggleMobileMenu}
            class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors {isListingsActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'}"
          >
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            Listings
          </a>
          <a 
            href="/google-test"
            on:click={toggleMobileMenu}
            class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors {isGoogleTestActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'}"
          >
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
            </svg>
            Google APIs Test
          </a>
          <a 
            href="/hostaway-test"
            on:click={toggleMobileMenu}
            class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors {isHostawayTestActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'}"
          >
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
            </svg>
            Hostaway Test
          </a>
          <a 
            href="/settings"
            on:click={toggleMobileMenu}
            class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors {isSettingsActive ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-100'}"
          >
            <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            Settings
          </a>
        </nav>
      </aside>
    </div>
  {/if}

  <!-- Topbar + content -->
  <div class="{sidebarCollapsed ? 'md:pl-16' : 'md:pl-64'} transition-all duration-300">
    <header class="h-16 bg-white shadow-soft flex items-center px-4 gap-3 sticky top-0 z-30">
      <button 
        class="md:hidden p-2 rounded-lg hover:bg-slate-100" 
        on:click={toggleMobileMenu}
        aria-label="Toggle menu"
      >
        <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
      
      <!-- Sidebar toggle for desktop (shown when collapsed) -->
      {#if sidebarCollapsed}
        <button 
          class="hidden md:flex p-2 rounded-lg hover:bg-slate-100 transition-colors" 
          on:click={toggleSidebar}
          title="Expand sidebar (Ctrl+S)"
          aria-label="Expand sidebar"
        >
          <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/>
          </svg>
        </button>
      {/if}
      
      <h1 class="text-lg font-semibold">{title}</h1>
      <div class="ml-auto flex items-center gap-2">
        <div class="hidden sm:flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1.5">
          <svg class="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            placeholder="Search…" 
            class="bg-transparent focus:outline-none text-sm w-32"
          />
        </div>
        <a 
          href="/settings" 
          class="p-2 rounded-lg hover:bg-slate-100 transition-colors" 
          aria-label="Settings"
        >
          <svg class="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </a>
        <div class="w-8 h-8 rounded-full bg-brand-500 text-white grid place-items-center text-sm font-medium">
          BL
        </div>
      </div>
    </header>

    <main class="p-4 sm:p-6">
      <slot />
    </main>
  </div>
</div>
