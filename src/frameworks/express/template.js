// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const EXPRESS = {
    id: 'express',
    name: 'Express',
    icon: '🚂',
    lang: 'js',
    description: 'Framework minimalista para APIs Node.js',
    version: '5.x',
    port: 3000,
    enabled: true,
    templates: ['api'],
    architectures: ['standard'],
    folders: ['src', 'src/routes', 'src/middleware', 'src/models', 'tests'],
    files: {
      'src/index.js':
`const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.json({ message: 'Hello from {PROJECT_NAME}!', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const server = app.listen(PORT, () => {
  console.log(\`{PROJECT_NAME} running on http://localhost:\${PORT}\`);
});

module.exports = { app, server };
`,
      'src/routes/index.js':
`const { Router } = require('express');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

module.exports = router;
`,
      'tests/app.test.js':
`const { app } = require('../src/index');

// Simple smoke test — run with: node tests/app.test.js
const http = require('http');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('✅', name);
    passed++;
  } catch (e) {
    console.log('❌', name, '-', e.message);
    failed++;
  }
}

async function runTests() {
  // Test that app module exports correctly
  test('app is defined', () => {
    if (!app) throw new Error('app not exported');
  });

  console.log(\`\\n\${passed} passed, \${failed} failed\`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
`,
      'package.json':
`{
  "name": "{PROJECT_NAME}",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "node tests/app.test.js"
  },
  "dependencies": {
    "express": "^5.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
`,
      '.env.example': `PORT=3000\nNODE_ENV=development\nDATABASE_URL=sqlite:./dev.db\n`,
    },
  };

module.exports = { EXPRESS };
