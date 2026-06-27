// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const HONO = {
    id: 'hono',
    name: 'Hono',
    icon: '🔥',
    lang: 'js',
    description: 'Framework web ultrarrápido para edge y Node.js',
    version: '4.x',
    port: 3000,
    enabled: false,
    templates: ['api'],
    architectures: ['standard'],
    folders: ['src', 'src/routes', 'src/middleware', 'test'],
    files: {
      'src/index.ts':
`import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import items from './routes/items';

const app = new Hono();

app.use('*', logger());
app.use('/api/*', cors());

app.get('/', (c) => c.json({ message: 'Hello from {PROJECT_NAME}!', version: '1.0.0' }));
app.get('/health', (c) => c.json({ status: 'ok', uptime: process.uptime() }));
app.route('/api/items', items);

const port = Number(process.env.PORT) || 3000;
console.log(\`{PROJECT_NAME} running on http://localhost:\${port}\`);

serve({ fetch: app.fetch, port });

export default app;
`,
      'src/routes/items.ts':
`import { Hono } from 'hono';

const items = new Hono();

const db = [
  { id: 1, name: 'Item One' },
  { id: 2, name: 'Item Two' },
];

items.get('/', (c) => c.json(db));

items.get('/:id', (c) => {
  const id = parseInt(c.req.param('id'));
  const item = db.find((i) => i.id === id);
  if (!item) return c.json({ error: 'Not found' }, 404);
  return c.json(item);
});

export default items;
`,
      'package.json':
`{
  "name": "{PROJECT_NAME}",
  "type": "module",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc"
  },
  "dependencies": {
    "@hono/node-server": "^1.0.0",
    "hono": "^4.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}
`,
      'tsconfig.json':
`{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "outDir": "dist",
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
`,
      '.env.example': `PORT=3000\nNODE_ENV=development\n`,
    },
  };

module.exports = { HONO };
