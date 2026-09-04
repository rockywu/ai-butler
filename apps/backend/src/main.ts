import process from 'node:process';

import { createApp } from './app/create-app';

const app = await createApp({ logger: true });
await app.listen({
  host: '0.0.0.0',
  port: Number.parseInt(process.env.PORT ?? '3000', 10),
});
