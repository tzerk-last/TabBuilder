// @ts-check
'use strict';

/**
 * Framework-specific README data.
 * @type {Record<string, {tech: string[], runCmd: string, buildCmd: string, testCmd: string, notes?: string}>}
 */
const README_DATA = {
  'spring-boot': {
    tech: ['Java 21', 'Spring Boot 4', 'Maven', 'Spring Web'],
    runCmd: 'mvn spring-boot:run',
    buildCmd: 'mvn clean package',
    testCmd: 'mvn test',
    notes: 'La aplicación arranca en http://localhost:8080. Swagger UI disponible en http://localhost:8080/swagger-ui.html (si está configurado).',
  },
  'quarkus': {
    tech: ['Java 21', 'Quarkus 3', 'Maven', 'RESTEasy'],
    runCmd: 'mvn quarkus:dev',
    buildCmd: 'mvn package',
    testCmd: 'mvn test',
    notes: 'Dev UI disponible en http://localhost:8080/q/dev/ en modo desarrollo.',
  },
  'micronaut': {
    tech: ['Java 21', 'Micronaut 4', 'Maven', 'Netty'],
    runCmd: 'mvn mn:run',
    buildCmd: 'mvn package',
    testCmd: 'mvn test',
  },
  'django': {
    tech: ['Python 3.12', 'Django 5', 'Gunicorn', 'SQLite'],
    runCmd: 'python manage.py runserver',
    buildCmd: 'python manage.py collectstatic --noinput',
    testCmd: 'python manage.py test',
    notes: `Antes de la primera ejecución:\n\`\`\`bash\npython -m venv venv\nsource venv/bin/activate  # Windows: venv\\Scripts\\activate\npip install -r requirements.txt\npython manage.py migrate\n\`\`\``,
  },
  'fastapi': {
    tech: ['Python 3.12', 'FastAPI', 'Uvicorn', 'Pydantic'],
    runCmd: 'uvicorn app.main:app --reload',
    buildCmd: 'pip install -r requirements.txt',
    testCmd: 'pytest',
    notes: `Antes de la primera ejecución:\n\`\`\`bash\npython -m venv venv\nsource venv/bin/activate  # Windows: venv\\Scripts\\activate\npip install -r requirements.txt\n\`\`\`\n\nDocs interactivas: http://localhost:8000/docs`,
  },
  'flask': {
    tech: ['Python 3.12', 'Flask 3', 'Gunicorn', 'SQLite'],
    runCmd: 'flask run',
    buildCmd: 'pip install -r requirements.txt',
    testCmd: 'pytest',
    notes: `Antes de la primera ejecución:\n\`\`\`bash\npython -m venv venv\nsource venv/bin/activate  # Windows: venv\\Scripts\\activate\npip install -r requirements.txt\n\`\`\``,
  },
  'litestar': {
    tech: ['Python 3.12', 'Litestar 2', 'Uvicorn', 'Pydantic'],
    runCmd: 'uvicorn app.main:app --reload',
    buildCmd: 'pip install -r requirements.txt',
    testCmd: 'pytest',
    notes: `Antes de la primera ejecución:\n\`\`\`bash\npython -m venv venv\nsource venv/bin/activate  # Windows: venv\\Scripts\\activate\npip install -r requirements.txt\n\`\`\`\n\nDocs interactivas: http://localhost:8000/schema/swagger`,
  },
  'aspnet': {
    tech: ['.NET 8', 'ASP.NET Core MVC', 'Razor Views', 'C#'],
    runCmd: 'dotnet run',
    buildCmd: 'dotnet build',
    testCmd: 'dotnet test',
    notes: 'La aplicación arranca en http://localhost:5000 y sirve la vista Home/Index mediante el patrón MVC.',
  },
  'blazor': {
    tech: ['.NET 8', 'Blazor Server', 'C#', 'Razor Components'],
    runCmd: 'dotnet run',
    buildCmd: 'dotnet build',
    testCmd: 'dotnet test',
  },
  'laravel': {
    tech: ['PHP 8.2', 'Laravel 12', 'Composer', 'MySQL'],
    runCmd: 'php artisan serve',
    buildCmd: 'composer install',
    testCmd: 'php artisan test',
    notes: `Antes de la primera ejecución:\n\`\`\`bash\ncomposer install\ncp .env.example .env\nphp artisan key:generate\nphp artisan migrate\n\`\`\``,
  },
  'symfony': {
    tech: ['PHP 8.2', 'Symfony 7', 'Composer', 'Doctrine'],
    runCmd: 'symfony server:start',
    buildCmd: 'composer install',
    testCmd: 'php bin/phpunit',
    notes: 'Requiere el [Symfony CLI](https://symfony.com/download) instalado.',
  },
  'nextjs': {
    tech: ['Node.js 22', 'Next.js 15', 'React 19', 'TypeScript'],
    runCmd: 'npm run dev',
    buildCmd: 'npm run build',
    testCmd: 'npm test',
  },
  'react-vite': {
    tech: ['Node.js 22', 'React 19', 'Vite 5', 'JavaScript'],
    runCmd: 'npm run dev',
    buildCmd: 'npm run build',
    testCmd: 'npm test',
  },
  'nestjs': {
    tech: ['Node.js 22', 'NestJS 10', 'TypeScript', 'Express'],
    runCmd: 'npm run start:dev',
    buildCmd: 'npm run build',
    testCmd: 'npm test',
  },
  'express': {
    tech: ['Node.js 22', 'Express 5', 'JavaScript', 'Nodemon'],
    runCmd: 'npm run dev',
    buildCmd: 'npm install',
    testCmd: 'npm test',
  },
  'vue-vite': {
    tech: ['Node.js 22', 'Vue 3', 'Vite 5', 'Composition API'],
    runCmd: 'npm run dev',
    buildCmd: 'npm run build',
    testCmd: 'npm test',
  },
  'sveltekit': {
    tech: ['Node.js 22', 'SvelteKit 2', 'Svelte 5', 'Vite 5'],
    runCmd: 'npm run dev',
    buildCmd: 'npm run build',
    testCmd: 'npm test',
  },
  'astro': {
    tech: ['Node.js 22', 'Astro 5', 'TypeScript', 'Vite'],
    runCmd: 'npm run dev',
    buildCmd: 'npm run build',
    testCmd: 'npm test',
  },
  'nuxt3': {
    tech: ['Node.js 22', 'Nuxt 3', 'Vue 3', 'TypeScript'],
    runCmd: 'npm run dev',
    buildCmd: 'npm run build',
    testCmd: 'npm test',
  },
  'hono': {
    tech: ['Node.js 22', 'Hono 4', 'TypeScript', 'TSX'],
    runCmd: 'npm run dev',
    buildCmd: 'npm run build',
    testCmd: 'npm test',
  },
  'angular': {
    tech: ['Node.js 22', 'Angular 19', 'TypeScript', 'RxJS'],
    runCmd: 'npm start',
    buildCmd: 'npm run build',
    testCmd: 'npm test',
  },
};

/**
 * Generates a framework-specific README for the project.
 * @param {string} projectName
 * @param {string} frameworkId
 * @param {string} architectureId
 * @param {string} database
 * @param {string} devops
 * @returns {string}
 */
function generateReadme(projectName, frameworkId, architectureId = 'mvc', database = 'none', devops = 'none') {
  const data = README_DATA[frameworkId];

  if (!data) {
    return `# ${projectName}\n\nGenerated with **${frameworkId}** via TabBuilder.\n\n## License\n\nMIT\n`;
  }

  const techList = data.tech.map(t => `- ${t}`).join('\n');
  const archLabel = architectureId !== 'mvc' && architectureId !== 'none'
    ? `\n- Arquitectura: **${architectureId.toUpperCase()}**` : '';
  const dbLabel = database !== 'none' ? `\n- Base de datos: **${database}**` : '';
  const devopsLabel = devops !== 'none' ? `\n- DevOps: **${devops}**` : '';

  const setup = data.notes
    ? `## ⚙️ Configuración inicial\n\n${data.notes}\n\n`
    : '';

  const devopsSection = buildDevOpsDocs(devops, projectName);

  return `# ${projectName}

Generated with **TabBuilder** by [Meikuto](https://meikuto.dev).

## 🛠 Tecnologías

${techList}${archLabel}${dbLabel}${devopsLabel}

${setup}## 🚀 Cómo ejecutar

\`\`\`bash
cd ${projectName}
${data.runCmd}
\`\`\`

## 📦 Comandos principales

| Comando | Descripción |
|---------|-------------|
| \`${data.runCmd}\` | Inicia en modo desarrollo |
| \`${data.buildCmd}\` | Compila para producción |
| \`${data.testCmd}\` | Ejecuta pruebas |

${devopsSection}## 📄 Licencia

MIT
`;
}

/**
 * Builds the DevOps documentation section.
 * @param {string} devops
 * @param {string} projectName
 * @returns {string}
 */
function buildDevOpsDocs(devops, projectName) {
  if (devops === 'none') return '';

  const sections = {
    docker:
`## 🐳 Docker

\`\`\`bash
# Construir imagen
docker build -t ${projectName.toLowerCase()} .

# Ejecutar con docker-compose
docker-compose up -d
\`\`\`

`,
    kubernetes:
`## ☸️ Kubernetes

\`\`\`bash
# Aplicar manifiestos
kubectl apply -f k8s/

# Verificar estado
kubectl get pods
kubectl get services
\`\`\`

`,
    'github-actions':
`## 🔁 GitHub Actions

El pipeline CI/CD en \`.github/workflows/ci.yml\` ejecuta automáticamente pruebas y publica la imagen Docker al hacer push a \`main\`.

`,
    'azure-pipelines':
`## 🔁 Azure Pipelines

El pipeline en \`azure-pipelines.yml\` ejecuta automáticamente pruebas y publica la imagen Docker al hacer push a \`main\`.

`,
  };

  return sections[devops] || '';
}

module.exports = { generateReadme };
