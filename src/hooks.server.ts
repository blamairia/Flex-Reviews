import 'dotenv/config';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Environment variables are already loaded by dotenv/config import
  // Just ensure they're available to the server-side code
  
  const response = await resolve(event);
  return response;
};
