import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Vercel adapter options
			runtime: 'nodejs22.x',
			regions: ['iad1'], // US East region for better performance
			split: false // Keep all routes in single function for simplicity
		}),
		alias: { $lib: 'src/lib' }
	}
};

export default config;
