// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');

// ── Dockerfile templates ──────────────────────────────────────────────────────

/**
 * @param {'node'|'python'|'java'|'dotnet'|'php'} appType
 * @param {string} projectName
 * @param {number} port
 * @returns {string}
 */
function buildDockerfile(appType, projectName, port) {
  const templates = {
    node:
`FROM node:22-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci --only=production
COPY . .
EXPOSE ${port}
CMD ["node", "src/index.js"]
`,
    python:
`FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE ${port}
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "${port}"]
`,
    java:
`FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY target/*.jar app.jar
EXPOSE ${port}
ENTRYPOINT ["java", "-jar", "app.jar"]
`,
    dotnet:
`FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE ${port}

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY *.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "${projectName}.dll"]
`,
    php:
`FROM php:8.3-fpm-alpine
WORKDIR /var/www/html
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY composer*.json .
RUN composer install --no-dev --optimize-autoloader
COPY . .
EXPOSE ${port}
CMD ["php", "-S", "0.0.0.0:${port}", "-t", "public"]
`,
  };

  return templates[appType] || templates.node;
}

/**
 * @param {'node'|'python'|'java'|'dotnet'|'php'} appType
 * @param {string} projectName
 * @param {number} port
 * @returns {string}
 */
function buildDockerCompose(appType, projectName, port) {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const dbServices = {
    node: `
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${slug}
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
`,
    python: `
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${slug}
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
`,
    java: `
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${slug}
      POSTGRES_USER: dev
      POSTGRES_PASSWORD: dev
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
`,
    dotnet: `
  db:
    image: mcr.microsoft.com/mssql/server:2022-latest
    environment:
      ACCEPT_EULA: "Y"
      SA_PASSWORD: "Dev@123456"
    ports:
      - "1433:1433"
`,
    php: `
  db:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: ${slug}
      MYSQL_USER: dev
      MYSQL_PASSWORD: dev
      MYSQL_ROOT_PASSWORD: root
    ports:
      - "3306:3306"
    volumes:
      - mysqldata:/var/lib/mysql

volumes:
  mysqldata:
`,
  };

  const dbService = dbServices[appType] || dbServices.node;

  return `services:
  app:
    build: .
    ports:
      - "${port}:${port}"
    env_file:
      - .env
    depends_on:
      - db
    volumes:
      - .:/app
${dbService}`;
}

/**
 * @param {'node'|'python'|'java'|'dotnet'|'php'} appType
 * @returns {string}
 */
function buildDockerIgnore(appType) {
  const templates = {
    node: `node_modules\ndist\n.env\n.env.local\n*.log\n.git\n`,
    python: `__pycache__\n*.pyc\n.venv\nvenv\n.env\n*.egg-info\ndist\n.git\n`,
    java: `target\n.idea\n*.iml\n.mvn\n.git\n*.class\n`,
    dotnet: `bin\nobj\n.vs\n*.user\n.git\n`,
    php: `vendor\n.env\n.git\nstorage/logs\nbootstrap/cache\n`,
  };
  return templates[appType] || templates.node;
}

// ── Kubernetes templates ──────────────────────────────────────────────────────

/**
 * @param {string} projectName
 * @param {number} port
 * @returns {string}
 */
function buildK8sDeployment(projectName, port) {
  const name = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${name}
  labels:
    app: ${name}
spec:
  replicas: 2
  selector:
    matchLabels:
      app: ${name}
  template:
    metadata:
      labels:
        app: ${name}
    spec:
      containers:
        - name: ${name}
          image: ${name}:latest
          ports:
            - containerPort: ${port}
          envFrom:
            - configMapRef:
                name: ${name}-config
            - secretRef:
                name: ${name}-secrets
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          readinessProbe:
            httpGet:
              path: /health
              port: ${port}
            initialDelaySeconds: 10
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /health
              port: ${port}
            initialDelaySeconds: 30
            periodSeconds: 10
`;
}

/**
 * @param {string} projectName
 * @param {number} port
 * @returns {string}
 */
function buildK8sService(projectName, port) {
  const name = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `apiVersion: v1
kind: Service
metadata:
  name: ${name}
spec:
  selector:
    app: ${name}
  ports:
    - protocol: TCP
      port: 80
      targetPort: ${port}
  type: ClusterIP
`;
}

/**
 * @param {string} projectName
 * @returns {string}
 */
function buildK8sIngress(projectName) {
  const name = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: ${name}
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: ${name}.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: ${name}
                port:
                  number: 80
`;
}

/**
 * @param {string} projectName
 * @returns {string}
 */
function buildK8sConfigMap(projectName) {
  const name = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `apiVersion: v1
kind: ConfigMap
metadata:
  name: ${name}-config
data:
  APP_NAME: "${projectName}"
  NODE_ENV: "production"
`;
}

/**
 * @param {string} projectName
 * @returns {string}
 */
function buildK8sSecrets(projectName) {
  const name = projectName.toLowerCase().replace(/[^a-z0-9]/g, '-');
  return `apiVersion: v1
kind: Secret
metadata:
  name: ${name}-secrets
type: Opaque
stringData:
  DATABASE_URL: "postgres://user:password@db:5432/${name}"
  SECRET_KEY: "change-me-in-production"
`;
}

// ── CI/CD templates ───────────────────────────────────────────────────────────

/**
 * @param {'node'|'python'|'java'|'dotnet'|'php'} appType
 * @returns {string}
 */
function buildGithubActions(appType) {
  const setupSteps = {
    node:
`      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm test --if-present
      - run: npm run build --if-present`,
    python:
`      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt
      - run: pytest --tb=short`,
    java:
`      - uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'temurin'
          cache: 'maven'
      - run: mvn -B verify`,
    dotnet:
`      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: '8.0.x'
      - run: dotnet restore
      - run: dotnet build --no-restore
      - run: dotnet test --no-build`,
    php:
`      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.3'
      - run: composer install
      - run: vendor/bin/phpunit`,
  };

  const setup = setupSteps[appType] || setupSteps.node;

  return `name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: \${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
${setup}

  docker:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}:latest
`;
}

/**
 * @param {'node'|'python'|'java'|'dotnet'|'php'} appType
 * @returns {string}
 */
function buildAzurePipelines(appType) {
  const buildSteps = {
    node:
`    - task: NodeTool@0
      inputs:
        versionSpec: '22.x'
    - script: npm ci
      displayName: 'Install dependencies'
    - script: npm test --if-present
      displayName: 'Run tests'
    - script: npm run build --if-present
      displayName: 'Build'`,
    python:
`    - task: UsePythonVersion@0
      inputs:
        versionSpec: '3.12'
    - script: pip install -r requirements.txt
      displayName: 'Install dependencies'
    - script: pytest --tb=short
      displayName: 'Run tests'`,
    java:
`    - task: JavaToolInstaller@0
      inputs:
        versionSpec: '21'
        jdkArchitectureOption: 'x64'
        jdkSourceOption: 'PreInstalled'
    - script: mvn -B verify
      displayName: 'Build and test'`,
    dotnet:
`    - task: UseDotNet@2
      inputs:
        version: '8.0.x'
    - script: dotnet restore
      displayName: 'Restore'
    - script: dotnet build --no-restore
      displayName: 'Build'
    - script: dotnet test --no-build
      displayName: 'Test'`,
    php:
`    - task: UsePhpVersion@0
      inputs:
        versionSpec: '8.3'
    - script: composer install
      displayName: 'Install dependencies'
    - script: vendor/bin/phpunit
      displayName: 'Run tests'`,
  };

  const steps = buildSteps[appType] || buildSteps.node;

  return `trigger:
  branches:
    include:
      - main
      - develop

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Test
    displayName: 'Test'
    jobs:
      - job: RunTests
        steps:
${steps}

  - stage: Docker
    displayName: 'Build & Push Docker'
    dependsOn: Test
    condition: and(succeeded(), eq(variables['Build.SourceBranch'], 'refs/heads/main'))
    jobs:
      - job: DockerBuildPush
        steps:
          - task: Docker@2
            displayName: 'Build and push image'
            inputs:
              containerRegistry: 'your-registry-connection'
              repository: 'your-repo/your-image'
              command: 'buildAndPush'
              tags: |
                latest
                \$(Build.BuildId)
`;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Maps a language to a DevOps appType.
 * @param {'java'|'python'|'csharp'|'php'|'js'} lang
 * @returns {'node'|'python'|'java'|'dotnet'|'php'}
 */
function langToAppType(lang) {
  const map = { java: 'java', python: 'python', csharp: 'dotnet', php: 'php', js: 'node' };
  return map[lang] || 'node';
}

/**
 * Generates all DevOps files for the given configuration.
 * @param {{
 *   projectName: string,
 *   lang: 'java'|'python'|'csharp'|'php'|'js',
 *   port: number,
 *   devops: import('../types').DevOpsOption
 * }} config
 * @returns {Record<string, string>} Map of relative file path → content
 */
function generateDevOpsFiles({ projectName, lang, port, devops }) {
  const appType = langToAppType(lang);
  /** @type {Record<string, string>} */
  const files = {};

  if (devops === 'docker') {
    files['Dockerfile'] = buildDockerfile(appType, projectName, port);
    files['docker-compose.yml'] = buildDockerCompose(appType, projectName, port);
    files['.dockerignore'] = buildDockerIgnore(appType);
  }

  if (devops === 'kubernetes') {
    files['Dockerfile'] = buildDockerfile(appType, projectName, port);
    files['.dockerignore'] = buildDockerIgnore(appType);
    files['k8s/deployment.yaml'] = buildK8sDeployment(projectName, port);
    files['k8s/service.yaml'] = buildK8sService(projectName, port);
    files['k8s/ingress.yaml'] = buildK8sIngress(projectName);
    files['k8s/configmap.yaml'] = buildK8sConfigMap(projectName);
    files['k8s/secrets.yaml'] = buildK8sSecrets(projectName);
  }

  if (devops === 'github-actions') {
    files['.github/workflows/ci.yml'] = buildGithubActions(appType);
  }

  if (devops === 'azure-pipelines') {
    files['azure-pipelines.yml'] = buildAzurePipelines(appType);
  }

  return files;
}

/**
 * Writes DevOps files to disk, skipping existing ones.
 * @param {Record<string, string>} files
 * @param {string} targetPath
 * @returns {{ written: string[], skipped: string[] }}
 */
function writeDevOpsFiles(files, targetPath) {
  const written = [];
  const skipped = [];

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(targetPath, filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(fullPath)) {
      skipped.push(filePath);
    } else {
      fs.writeFileSync(fullPath, content, 'utf-8');
      written.push(filePath);
    }
  }

  return { written, skipped };
}

module.exports = {
  generateDevOpsFiles,
  writeDevOpsFiles,
  langToAppType,
};
