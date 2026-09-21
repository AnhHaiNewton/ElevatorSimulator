import { existsSync } from 'node:fs';

import type { StatePayload } from '@elevator/shared';
import express, { type Express } from 'express';

export function createHttpApp(getState: () => StatePayload, webDist?: string): Express {
  const app = express();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/state', (_req, res) => {
    res.json(getState());
  });

  if (webDist && existsSync(webDist)) {
    app.use(express.static(webDist));
    // SPA fallback for non-API GET requests. A wildcard route (`app.get('*', ...)`) is not valid
    // path syntax under Express 5's path-to-regexp, so this is done with plain middleware instead.
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile('index.html', { root: webDist });
    });
  }

  return app;
}
