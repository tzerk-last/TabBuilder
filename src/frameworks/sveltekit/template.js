// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const SVELTEKIT = {
    id: 'sveltekit',
    name: 'SvelteKit',
    icon: '🔴',
    lang: 'js',
    description: 'Framework fullstack con compilación reactiva',
    version: '2.x',
    port: 5173,
    enabled: false,
    templates: ['standard'],
    architectures: ['standard'],
    folders: ['src', 'src/routes', 'src/lib', 'static'],
    files: {
      'src/routes/+page.svelte':
`<script>
  let count = $state(0);
</script>

<svelte:head>
  <title>{PROJECT_NAME}</title>
</svelte:head>

<main>
  <h1>Welcome to {PROJECT_NAME}</h1>
  <p>Edit <code>src/routes/+page.svelte</code> to get started.</p>
  <button onclick={() => count++}>Clicks: {count}</button>
</main>

<style>
  main {
    font-family: system-ui, sans-serif;
    text-align: center;
    padding: 2rem;
  }
</style>
`,
      'src/routes/+layout.svelte':
`<slot />
`,
      'src/lib/index.js':
`export const appName = '{PROJECT_NAME}';
`,
      'static/.gitkeep': '',
      'package.json':
`{
  "name": "{PROJECT_NAME}",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "@sveltejs/adapter-auto": "^3.0.0",
    "@sveltejs/kit": "^2.0.0",
    "svelte": "^5.0.0",
    "vite": "^5.0.0"
  }
}
`,
      'svelte.config.js':
`import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  kit: {
    adapter: adapter(),
  },
};

export default config;
`,
      'vite.config.js':
`import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],
});
`,
      '.env.example': `PUBLIC_APP_NAME={PROJECT_NAME}\nPRIVATE_DATABASE_URL=sqlite:./dev.db\n`,
    },
  };

module.exports = { SVELTEKIT };
