// @ts-check
'use strict';

const TEMPLATE_CATALOG = {
  mvc: {
    id: 'mvc',
    name: 'MVC',
    icon: '🗂',
    description: 'Model-View-Controller. Aplicación web tradicional con vistas.'
  },
  clean: {
    id: 'clean',
    name: 'Clean',
    icon: '🧅',
    description: 'Clean Architecture. Código organizado en capas.'
  },
  api: {
    id: 'api',
    name: 'API',
    icon: '🔌',
    description: 'API REST sin vistas. Solo lógica y controladores.'
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    icon: '📦',
    description: 'Estructura estándar del framework.'
  }
};

const ARCHITECTURE_CATALOG = [
  {
    id: 'standard',
    name: 'Standard',
    icon: '📁',
    description: 'Estructura plana por defecto.',
    enabled: true
  },
  {
    id: 'clean',
    name: 'Clean Architecture',
    icon: '🧅',
    description: 'Capas concéntricas con inversión de dependencias.',
    enabled: true
  },
  {
    id: 'api',
    name: 'API',
    icon: '🔌',
    description: 'API REST sin vistas.',
    enabled: true
  },
  {
    id: 'hexagonal',
    name: 'Hexagonal',
    icon: '⬡',
    description: 'Ports & Adapters.',
    enabled: false
  },
  {
    id: 'ddd',
    name: 'Domain-Driven Design',
    icon: '🏛',
    description: 'Modelado del dominio del negocio.',
    enabled: false
  }
];

const DEVOPS_CATALOG = [
  {
    id: 'none',
    name: 'Ninguno',
    icon: '⬜',
    description: 'Sin archivos de infraestructura.',
    enabled: true
  },
  {
    id: 'docker',
    name: 'Docker',
    icon: '🐳',
    description: 'Dockerfile y docker-compose.yml',
    enabled: true
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    icon: '☸️',
    description: 'Manifiestos K8s.',
    enabled: true
  },
  {
    id: 'github-actions',
    name: 'GitHub Actions',
    icon: '🐙',
    description: 'CI/CD pipeline en .github/workflows/',
    enabled: true
  },
  {
    id: 'azure-pipelines',
    name: 'Azure Pipelines',
    icon: '☁️',
    description: 'azure-pipelines.yml',
    enabled: false
  }
];

module.exports = { TEMPLATE_CATALOG, ARCHITECTURE_CATALOG, DEVOPS_CATALOG };
