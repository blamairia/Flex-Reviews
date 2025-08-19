import 'dotenv/config';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  // Load API keys from environment variables
  const googleApiKey = process.env.GOOGLE_PLACES_API_KEY || '';
  
  console.log('🔑 Loading Google API key from environment...');
  console.log('🔑 Google API key found:', !!googleApiKey);
  
  // Return configuration with API keys from environment
  return json({
    googleApiKey: googleApiKey,
    hasGoogleKey: !!googleApiKey,
    message: googleApiKey ? 'API key loaded from environment' : 'No API key found in environment'
  });
};
