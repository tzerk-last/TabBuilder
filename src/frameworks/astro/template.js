// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const ASTRO = {
    id: 'astro',
    name: 'Astro',
    icon: '🌌',
    lang: 'js',
    description: 'Framework para sitios con contenido estático ultrarrápido',
    version: '5.x',
    port: 4321,
    enabled: false,
    templates: ['standard'],
    architectures: ['standard'],
    folders: ['src', 'src/pages', 'src/components', 'src/layouts', 'public'],
    files: {
      'src/pages/index.astro':
`---
import Layout from '../layouts/Layout.astro';
---
<Layout title="{PROJECT_NAME}">
  <h1>Welcome to {PROJECT_NAME}</h1>
  <p>Edit <code>src/pages/index.astro</code> to get started.</p>
</Layout>
`,
      'src/layouts/Layout.astro':
`---
const { title } = Astro.props;
---
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 2rem; }
    </style>
  </head>
  <body>
    <slot />
  </body>
</html>
`,
      'src/components/Card.astro':
`---
const { title, body } = Astro.props;
---
<div class="card">
  <h2>{title}</h2>
  <p>{body}</p>
</div>

<style>
  .card { border: 1px solid #eee; border-radius: 8px; padding: 1rem; }
</style>
`,
      'public/.gitkeep': '',
      'package.json':
`{
  "name": "{PROJECT_NAME}",
  "type": "module",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro"
  },
  "dependencies": {
    "astro": "^5.0.0"
  }
}
`,
      'astro.config.mjs':
`import { defineConfig } from 'astro/config';

export default defineConfig({});
`,
      '.env.example': `PUBLIC_APP_NAME={PROJECT_NAME}\nPUBLIC_API_URL=http://localhost:3000\n`,
    },
  };

module.exports = { ASTRO };
