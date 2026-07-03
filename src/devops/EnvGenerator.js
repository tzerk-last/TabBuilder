// @ts-check
'use strict';

/**
 * Generates framework-specific .env.example content based on selected database.
 *
 * This module provides database-aware .env generation for various frameworks.
 * Each framework has its own conventions for environment variables.
 */

const { buildEnvDatabaseUrl, buildLaravelDbConfig, buildDjangoDatabaseConfig } = require('./DatabaseConfigBuilder');

/**
 * Generates .env.example content for Express.js
 * @param {string} projectName
 * @param {string} database
 * @returns {string}
 */
function generateExpressEnv(projectName, database) {
  const dbUrl = buildEnvDatabaseUrl(database, projectName, 'node') || '';
  const lines = [
    'PORT=3000',
    'NODE_ENV=development',
  ];
  if (dbUrl) lines.push(dbUrl);
  return lines.join('\n') + '\n';
}

/**
 * Generates .env.example content for NestJS
 * @param {string} projectName
 * @param {string} database
 * @returns {string}
 */
function generateNestJsEnv(projectName, database) {
  const dbUrl = buildEnvDatabaseUrl(database, projectName, 'node') || '';
  const lines = [
    'PORT=3000',
    'NODE_ENV=development',
  ];
  if (dbUrl) lines.push(dbUrl);
  return lines.join('\n') + '\n';
}

/**
 * Generates .env.example content for Django
 * @param {string} projectName
 * @param {string} database
 * @returns {string}
 */
function generateDjangoEnv(projectName, database) {
  const lines = [
    'SECRET_KEY=your-secret-key-here-replace-before-production',
    'DEBUG=True',
    'ALLOWED_HOSTS=localhost,127.0.0.1',
  ];

  if (database === 'sqlite') {
    lines.push('DATABASE_URL=sqlite:///db.sqlite3');
  } else if (database === 'postgresql') {
    lines.push('DATABASE_URL=postgresql://dev:dev@localhost:5432/' + projectName);
  } else if (database === 'mysql') {
    lines.push('DATABASE_URL=mysql+pymysql://dev:dev@localhost:3306/' + projectName);
  } else if (database === 'mongodb') {
    lines.push('DATABASE_URL=mongodb://dev:dev@localhost:27017/' + projectName);
  }

  return lines.join('\n') + '\n';
}

/**
 * Generates .env.example content for FastAPI
 * @param {string} projectName
 * @param {string} database
 * @returns {string}
 */
function generateFastApiEnv(projectName, database) {
  const dbUrl = buildEnvDatabaseUrl(database, projectName, 'python') || 'DATABASE_URL=sqlite:///./db.sqlite3';
  const lines = [
    `APP_NAME=${projectName}`,
    'DEBUG=true',
    'PORT=8000',
    dbUrl,
  ];
  return lines.join('\n') + '\n';
}

/**
 * Generates .env.example content for Flask
 * @param {string} projectName
 * @param {string} database
 * @returns {string}
 */
function generateFlaskEnv(projectName, database) {
  const dbUrl = buildEnvDatabaseUrl(database, projectName, 'python') || 'DATABASE_URL=sqlite:///app.db';
  const lines = [
    'FLASK_APP=run.py',
    'FLASK_ENV=development',
    'FLASK_DEBUG=1',
    'SECRET_KEY=your-secret-key-here',
    dbUrl,
  ];
  return lines.join('\n') + '\n';
}

/**
 * Generates .env.example content for Litestar
 * @param {string} projectName
 * @param {string} database
 * @returns {string}
 */
function generateLitestarEnv(projectName, database) {
  const dbUrl = buildEnvDatabaseUrl(database, projectName, 'python') || 'DATABASE_URL=sqlite+aiosqlite:///./db.sqlite3';
  const lines = [
    `APP_NAME=${projectName}`,
    'DEBUG=true',
    'PORT=8000',
    dbUrl,
  ];
  return lines.join('\n') + '\n';
}

/**
 * Generates .env.example content for Symfony
 * @param {string} projectName
 * @param {string} database
 * @returns {string}
 */
function generateSymfonyEnv(projectName, database) {
  const dbUrl = buildEnvDatabaseUrl(database, projectName, 'php') || 'DATABASE_URL=sqlite:///%kernel.project_dir%/var/data.db';
  const lines = [
    'APP_ENV=dev',
    'APP_SECRET=change-me-in-production',
    dbUrl,
  ];
  return lines.join('\n') + '\n';
}

/**
 * Generates .env.example content for Laravel
 * @param {string} projectName
 * @param {string} database
 * @returns {string}
 */
function generateLaravelEnv(projectName, database) {
  const lines = [
    `APP_NAME=${projectName}`,
    'APP_ENV=local',
    'APP_DEBUG=true',
    'APP_URL=http://localhost',
    '',
  ];

  const dbConfig = buildLaravelDbConfig(database, projectName).trim();
  if (dbConfig) {
    lines.push(...dbConfig.split('\n'));
  }

  return lines.join('\n') + '\n';
}

/**
 * Generates .env.example content for SvelteKit
 * @param {string} projectName
 * @param {string} database
 * @returns {string}
 */
function generateSvelteKitEnv(projectName, database) {
  const dbUrl = buildEnvDatabaseUrl(database, projectName, 'node') || 'PRIVATE_DATABASE_URL=sqlite:./dev.db';
  const lines = [
    `PUBLIC_APP_NAME=${projectName}`,
  ];

  if (database !== 'none') {
    lines.push(`PRIVATE_${dbUrl}`);
  }

  return lines.join('\n') + '\n';
}

/**
 * Generates .env.example content for Spring Boot
 * @param {string} projectName
 * @param {string} database
 * @returns {string}
 */
function generateSpringBootEnv(projectName, database) {
  const lines = ['SPRING_PROFILES_ACTIVE=dev'];

  if (database === 'postgresql') {
    lines.push('spring.datasource.url=jdbc:postgresql://localhost:5432/' + projectName);
    lines.push('spring.datasource.username=dev');
    lines.push('spring.datasource.password=dev');
    lines.push('spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect');
  } else if (database === 'mysql') {
    lines.push('spring.datasource.url=jdbc:mysql://localhost:3306/' + projectName);
    lines.push('spring.datasource.username=root');
    lines.push('spring.datasource.password=');
    lines.push('spring.jpa.database-platform=org.hibernate.dialect.MySQL8Dialect');
  } else if (database === 'mongodb') {
    lines.push('spring.data.mongodb.uri=mongodb://dev:dev@localhost:27017/' + projectName);
  }

  return lines.join('\n') + '\n';
}

/**
 * Factory function to generate .env content for any framework
 * @param {string} frameworkId
 * @param {string} projectName
 * @param {string} database
 * @returns {string}
 */
function generateEnvExampleForFramework(frameworkId, projectName, database = 'none') {
  const generators = {
    express: generateExpressEnv,
    nestjs: generateNestJsEnv,
    django: generateDjangoEnv,
    'fastapi': generateFastApiEnv,
    flask: generateFlaskEnv,
    litestar: generateLitestarEnv,
    symfony: generateSymfonyEnv,
    laravel: generateLaravelEnv,
    'sveltekit': generateSvelteKitEnv,
    'spring-boot': generateSpringBootEnv,
  };

  const generator = generators[frameworkId];
  if (!generator) {
    return '';
  }

  return generator(projectName, database);
}

module.exports = {
  generateExpressEnv,
  generateNestJsEnv,
  generateDjangoEnv,
  generateFastApiEnv,
  generateFlaskEnv,
  generateLitestarEnv,
  generateSymfonyEnv,
  generateLaravelEnv,
  generateSvelteKitEnv,
  generateSpringBootEnv,
  generateEnvExampleForFramework,
};
