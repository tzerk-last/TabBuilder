// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const VUE_VITE = {
    id: 'vue-vite',
    name: 'Vue 3 + Vite',
    icon: '💚',
    lang: 'js',
    description: 'Vue 3 con Composition API y Vite',
    version: '3.x',
    port: 5173,
    enabled: true,
    templates: ['standard'],
    architectures: ['standard'],
    folders: ['src', 'src/components', 'src/views', 'public'],
    files: {
      'index.html':
`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{PROJECT_NAME}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
`,
      'src/App.vue':
`<template>
  <div id="app">
    <h1>{{ title }}</h1>
    <p>Edit <code>src/App.vue</code> to get started.</p>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const title = ref('{PROJECT_NAME}');
</script>

<style>
#app {
  font-family: system-ui, -apple-system, sans-serif;
  text-align: center;
  padding: 2rem;
}
</style>
`,
      'src/main.js':
`import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');
`,
      'src/components/HelloWorld.vue':
`<template>
  <div class="hello">
    <h2>{{ msg }}</h2>
  </div>
</template>

<script setup>
defineProps({
  msg: String,
});
</script>
`,
      'vite.config.js':
`import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
});
`,
      'package.json':
`{
  "name": "{PROJECT_NAME}",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.5.33"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^5.0.0",
    "vite": "^5.0.0"
  }
}
`,
      '.env.example': `VITE_APP_NAME={PROJECT_NAME}\nVITE_API_BASE_URL=http://localhost:3000\n`,
    },
  };

module.exports = { VUE_VITE };
