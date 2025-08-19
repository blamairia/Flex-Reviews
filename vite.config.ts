import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
  define: {
    // Make environment variables available in the client if needed
    // Only expose non-sensitive variables here
  },
  // Ensure .env.local is loaded
  envPrefix: 'VITE_'
});
