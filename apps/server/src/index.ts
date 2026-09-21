import path from 'node:path';

import { startServer } from './server';

const PORT = Number(process.env.PORT ?? 3001);
const webDist = path.resolve(import.meta.dirname, '../../web/dist');

const started = await startServer({ port: PORT, webDist });
console.log(`server listening on port ${started.port}`);

const shutdown = (): void => {
  void started.close().then(() => process.exit(0));
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
