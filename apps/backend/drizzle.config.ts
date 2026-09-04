import process from 'node:process';

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  out: './migrations',
  schema: './src/infrastructure/database/schema.ts',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
});
