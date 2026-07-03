// @ts-check
'use strict';

/**
 * Generates docker-compose database service configuration based on selected database type.
 * @param {string} database - 'postgresql', 'mysql', 'sqlite', 'mongodb', or 'none'
 * @param {string} projectName
 * @returns {string} Docker compose service YAML
 */
function buildDatabaseService(database, projectName) {
  const slug = projectName.toLowerCase().replace(/[^a-z0-9]/g, '_');

  const templates = {
    postgresql: `
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
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U dev"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  pgdata:
`,
    mysql: `
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
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mysqldata:
`,
    sqlite: `
  # SQLite is embedded - no separate database service needed.
  # Uncomment if you need to initialize or manage the database separately.
  # db:
  #   image: alpine:latest
  #   volumes:
  #     - ./data:/data
`,
    mongodb: `
  db:
    image: mongo:7.0-alpine
    environment:
      MONGO_INITDB_ROOT_USERNAME: dev
      MONGO_INITDB_ROOT_PASSWORD: dev
      MONGO_INITDB_DATABASE: ${slug}
    ports:
      - "27017:27017"
    volumes:
      - mongodata:/data/db
    healthcheck:
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mongodata:
`,
    none: `
  # No database configured.
`,
  };

  return templates[database] || templates.none;
}

/**
 * Generates DATABASE_URL for .env.example based on database type and framework language.
 * @param {string} database - 'postgresql', 'mysql', 'sqlite', 'mongodb', or 'none'
 * @param {string} projectName
 * @param {'node'|'python'|'java'|'dotnet'|'php'} appType
 * @returns {string} DATABASE_URL line for .env (empty string if none)
 */
function buildEnvDatabaseUrl(database, projectName, appType) {
  const dbUrlTemplates = {
    postgresql: {
      node: 'DATABASE_URL=postgres://dev:dev@localhost:5432/{PROJECT_NAME}',
      python: 'DATABASE_URL=postgresql://dev:dev@localhost:5432/{PROJECT_NAME}',
      java: 'DATABASE_URL=postgresql://dev:dev@localhost:5432/{PROJECT_NAME}',
      dotnet: 'DATABASE_URL=Server=localhost;Database={PROJECT_NAME};User Id=dev;Password=dev;',
      php: 'DATABASE_URL=postgresql://dev:dev@localhost/5432/{PROJECT_NAME}',
    },
    mysql: {
      node: 'DATABASE_URL=mysql://dev:dev@localhost:3306/{PROJECT_NAME}',
      python: 'DATABASE_URL=mysql+pymysql://dev:dev@localhost:3306/{PROJECT_NAME}',
      java: 'DATABASE_URL=mysql://dev:dev@localhost:3306/{PROJECT_NAME}',
      dotnet: 'DATABASE_URL=Server=localhost;Database={PROJECT_NAME};User Id=dev;Password=dev;',
      php: 'DATABASE_URL=mysql://dev:dev@localhost:3306/{PROJECT_NAME}',
    },
    sqlite: {
      node: 'DATABASE_URL=sqlite:./dev.db',
      python: 'DATABASE_URL=sqlite:///db.sqlite3',
      java: 'DATABASE_URL=jdbc:sqlite:./dev.db',
      dotnet: 'DATABASE_URL=Data Source=dev.db',
      php: 'DATABASE_URL=sqlite:dev.db',
    },
    mongodb: {
      node: 'DATABASE_URL=mongodb://dev:dev@localhost:27017/{PROJECT_NAME}',
      python: 'DATABASE_URL=mongodb://dev:dev@localhost:27017/{PROJECT_NAME}',
      java: 'DATABASE_URL=mongodb://dev:dev@localhost:27017/{PROJECT_NAME}',
      dotnet: 'DATABASE_URL=mongodb://dev:dev@localhost:27017/{PROJECT_NAME}',
      php: 'DATABASE_URL=mongodb://dev:dev@localhost:27017/{PROJECT_NAME}',
    },
    none: {},
  };

  const urlTemplate = dbUrlTemplates[database]?.[appType];
  if (!urlTemplate) return '';

  return urlTemplate.replace('{PROJECT_NAME}', projectName);
}

/**
 * Generates K8s secrets database connection string based on database type.
 * @param {string} database - 'postgresql', 'mysql', 'sqlite', 'mongodb', or 'none'
 * @param {string} projectName
 * @returns {string} K8s-ready DATABASE_URL value
 */
function buildK8sDatabaseUrl(database, projectName) {
  const k8sTemplates = {
    postgresql: `postgresql://dev:dev@db:5432/${projectName}`,
    mysql: `mysql://dev:dev@db:3306/${projectName}`,
    sqlite: `sqlite:///data/${projectName}.db`,
    mongodb: `mongodb://dev:dev@db:27017/${projectName}`,
    none: '',
  };

  return k8sTemplates[database] || '';
}

/**
 * Generates Laravel-specific DB connection configuration.
 * @param {string} database - 'postgresql', 'mysql', 'sqlite', 'mongodb', or 'none'
 * @param {string} projectName
 * @returns {string} Laravel .env.example database config
 */
function buildLaravelDbConfig(database, projectName) {
  const templates = {
    postgresql: `
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=${projectName}
DB_USERNAME=dev
DB_PASSWORD=dev
`,
    mysql: `
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=${projectName}
DB_USERNAME=root
DB_PASSWORD=
`,
    sqlite: `
DB_CONNECTION=sqlite
DB_DATABASE=database.sqlite
`,
    mongodb: `
# MongoDB configuration via URL
DATABASE_URL=mongodb://dev:dev@localhost:27017/${projectName}
`,
    none: `
# No database configured.
`,
  };

  return templates[database] || templates.none;
}

/**
 * Generates Django-specific database configuration in settings.py format.
 * @param {string} database - 'postgresql', 'mysql', 'sqlite', 'mongodb', or 'none'
 * @param {string} projectName
 * @returns {string} Django DATABASES dict Python code
 */
function buildDjangoDatabaseConfig(database, projectName) {
  const templates = {
    postgresql: `DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': '${projectName}',
        'USER': 'dev',
        'PASSWORD': 'dev',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}`,
    mysql: `DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': '${projectName}',
        'USER': 'root',
        'PASSWORD': '',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}`,
    sqlite: `DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}`,
    mongodb: `# Using Djongo for MongoDB support
# Install: pip install djongo
DATABASES = {
    'default': {
        'ENGINE': 'djongo',
        'NAME': '${projectName}',
        'CLIENT': {
            'host': 'localhost',
            'port': 27017,
            'username': 'dev',
            'password': 'dev',
        }
    }
}`,
    none: `DATABASES = {}`,
  };

  return templates[database] || templates.sqlite;
}

module.exports = {
  buildDatabaseService,
  buildEnvDatabaseUrl,
  buildK8sDatabaseUrl,
  buildLaravelDbConfig,
  buildDjangoDatabaseConfig,
};
