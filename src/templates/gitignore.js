// @ts-check
'use strict';

/** @type {Record<string, string>} */
const GITIGNORES = {
  java: `# Java
target/
*.class
*.jar
*.war
.idea/
*.iml
.mvn/
!**/src/main/**/target/
!**/src/test/**/target/

# OS
.DS_Store
Thumbs.db
`,
  python: `# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.venv/
venv/
env/
*.egg-info/
dist/
build/
.pytest_cache/

# Environment
.env
.env.*
!.env.example

# Database
db.sqlite3
*.db

# OS
.DS_Store
Thumbs.db
`,
  csharp: `# .NET
bin/
obj/
*.user
.vs/
.vscode/
*.suo
*.ncrunchproject
[Pp]ackages/
*.nupkg

# OS
.DS_Store
Thumbs.db
`,
  php: `# PHP
vendor/
.env
!.env.example

# Laravel/Symfony specific
storage/logs/
storage/framework/cache/
storage/framework/sessions/
storage/framework/views/
bootstrap/cache/
public/storage

# OS
.DS_Store
Thumbs.db
`,
  js: `# Node.js
node_modules/
dist/
.output/
.nuxt/
.next/
build/
out/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
!.env.example

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# OS
.DS_Store
Thumbs.db
`,
};

/**
 * Returns the .gitignore content for the given language.
 * @param {'java'|'python'|'csharp'|'php'|'js'} lang
 * @returns {string}
 */
function getGitignore(lang) {
  return GITIGNORES[lang] || GITIGNORES.js;
}

module.exports = { getGitignore };
