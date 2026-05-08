import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { meclisRoute } from './routes/meclis.js';
import { env } from './env.js';

const app = new Hono();

app.use(
  '/api/*',
  cors({
    origin: env.WEB_ORIGIN,
    allowMethods: ['GET', 'POST'],
    allowHeaders: ['Content-Type'],
  }),
);

app.get('/health', (c) =>
  c.json({
    ok: true,
    name: 'meclis server',
    version: '0.0.0',
    advisorDir: env.ADVISOR_DIR,
    claudeProjectsDir: env.CLAUDE_PROJECTS_DIR,
  }),
);

app.route('/api/meclis', meclisRoute);

const port = env.PORT;
serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`[meclis] server listening on http://localhost:${info.port}`);
  console.log(`[meclis] watching advisor packs in ${env.ADVISOR_DIR}`);
  console.log(`[meclis] open the viewer at ${env.WEB_ORIGIN}`);
});
