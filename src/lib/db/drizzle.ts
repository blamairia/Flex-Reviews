import Database from 'better-sqlite3';
import { drizzle as drizzleBetter } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzleLibsql } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import fs from 'node:fs';
import path from 'node:path';

const TURSO_URL = process.env.TURSO_DATABASE_URL;
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN;

let sqlite: any;
let db: ReturnType<typeof drizzleBetter> | ReturnType<typeof drizzleLibsql>;

if (TURSO_URL) {
  const client = createClient({ url: TURSO_URL, authToken: TURSO_TOKEN });
  db = drizzleLibsql(client, { schema });
  // Provide a minimal sqlite stub to avoid accidental usage when on Turso
  sqlite = {
    prepare() {
      throw new Error('sqlite (better-sqlite3) is not available when using Turso/libsql');
    },
    exec() {
      throw new Error('sqlite (better-sqlite3) is not available when using Turso/libsql');
    },
    pragma() {
      throw new Error('sqlite (better-sqlite3) is not available when using Turso/libsql');
    }
  };
} else {
  // Local file-backed SQLite via better-sqlite3
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
  const bundledDb = path.resolve('./data/app.db');
  const tmpDb = path.resolve('/tmp/app.db');

  let dbFile: string;

  if (isServerless) {
    try {
      if (fs.existsSync(bundledDb)) {
        if (!fs.existsSync(tmpDb)) {
          fs.copyFileSync(bundledDb, tmpDb);
        }
        dbFile = tmpDb;
      } else {
        dbFile = tmpDb;
      }
    } catch (err) {
      dbFile = tmpDb;
    }
  } else {
    dbFile = bundledDb;
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
  }

  sqlite = new Database(dbFile);
  db = drizzleBetter(sqlite, { schema });
}

export { sqlite, db };
export * as schemaModules from './schema';
