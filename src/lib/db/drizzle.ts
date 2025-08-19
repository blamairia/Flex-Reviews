import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import fs from 'node:fs';
import path from 'node:path';

// Use /tmp for serverless environments (like Vercel), otherwise use local data directory
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
const dbFile = isServerless 
  ? path.resolve('/tmp/app.db')
  : path.resolve('./data/app.db');

// Only create directory if not in serverless environment
if (!isServerless) {
  fs.mkdirSync(path.dirname(dbFile), { recursive: true });
}

export const sqlite = new Database(dbFile);
export const db = drizzle(sqlite, { schema });
export * as schemaModules from './schema';
