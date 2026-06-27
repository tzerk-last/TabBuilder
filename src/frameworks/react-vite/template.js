// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const REACT_VITE = {
    id: 'react-vite',
    name: 'React + Vite',
    icon: '⚛️',
    lang: 'js',
    description: 'React 19 con Vite para desarrollo ultrarrápido',
    version: '19.x',
    port: 5173,
    enabled: true,
    templates: ['standard'],
    architectures: ['standard'],
    folders: ['src', 'src/components', 'src/hooks', 'public'],
    files: {
      'src/App.jsx':
`import { useState } from 'react';
import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <h1>{PROJECT_NAME}</h1>
      <p>Edit <code>src/App.jsx</code> to get started.</p>
      <button onClick={() => setCount(c => c + 1)}>
        Count: {count}
      </button>
    </div>
  );
}

export default App;
`,
      'src/App.css':
`* {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background: #f9f9f9;
}

.App {
  text-align: center;
  padding: 2rem;
}

.App h1 {
  color: #333;
}

button {
  padding: 0.5rem 1.25rem;
  background: #646cff;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
}

button:hover {
  background: #535bf2;
}
`,
      'src/main.jsx':
`import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`,
      'index.html':
`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{PROJECT_NAME}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`,
      'vite.config.js':
`import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`,
      'package.json':
`{
  "name": "{PROJECT_NAME}",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "devDependencies": {
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0"
  }
}
`,
      '.env.example': `VITE_APP_NAME={PROJECT_NAME}\nVITE_API_URL=http://localhost:3000\n`,
    },
  };

module.exports = { REACT_VITE };
