import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import fs from 'node:fs';
import path from 'node:path';

const dbFile = path.resolve('./data/app.db');
fs.mkdirSync(path.dirname(dbFile), { recursive: true });

export const sqlite = new Database(dbFile);
export const db = drizzle(sqlite, { schema });
export * as schemaModules from './schema';
