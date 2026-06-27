// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const NUXT3 = {
    id: 'nuxt3',
    name: 'Nuxt 3',
    icon: '💚',
    lang: 'js',
    description: 'Framework fullstack Vue con SSR y generación estática',
    version: '3.x',
    port: 3000,
    enabled: false,
    templates: ['standard'],
    architectures: ['standard'],
    folders: ['pages', 'components', 'composables', 'assets', 'public', 'server/api'],
    files: {
      'pages/index.vue':
`<template>
  <div>
    <h1>{{ title }}</h1>
    <p>Edit <code>pages/index.vue</code> to get started.</p>
    <NuxtLink to="/about">About</NuxtLink>
  </div>
</template>

<script setup>
const title = ref('{PROJECT_NAME}')
</script>
`,
      'pages/about.vue':
`<template>
  <div>
    <h1>About {PROJECT_NAME}</h1>
    <NuxtLink to="/">Home</NuxtLink>
  </div>
</template>
`,
      'app.vue':
`<template>
  <div>
    <NuxtPage />
  </div>
</template>
`,
      'server/api/hello.get.ts':
`export default defineEventHandler(() => {
  return {
    message: 'Hello from {PROJECT_NAME}!',
    timestamp: new Date().toISOString(),
  }
})
`,
      'nuxt.config.ts':
`// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  ssr: true,
  runtimeConfig: {
    public: {
      appName: '{PROJECT_NAME}',
    },
  },
  compatibilityDate: '2025-01-01',
})
`,
      'package.json':
`{
  "name": "{PROJECT_NAME}",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "nuxt": "^3.14.0",
    "vue": "^3.5.33"
  }
}
`,
      '.env.example': `NUXT_APP_NAME={PROJECT_NAME}\nNUXT_PUBLIC_API_BASE=http://localhost:3000\n`,
    },
  };

module.exports = { NUXT3 };
