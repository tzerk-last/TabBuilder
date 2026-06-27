// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const SYMFONY = {
    id: 'symfony',
    name: 'Symfony',
    icon: '⚙️',
    lang: 'php',
    description: 'Framework PHP empresarial con componentes reutilizables',
    version: '7.x',
    port: 8000,
    enabled: false,
    templates: ['mvc'],
    architectures: ['standard'],
    folders: ['src/Controller', 'src/Entity', 'templates', 'config', 'tests'],
    files: {
      'src/Controller/HomeController.php':
`<?php

namespace App\\Controller;

use Symfony\\Bundle\\FrameworkBundle\\Controller\\AbstractController;
use Symfony\\Component\\HttpFoundation\\JsonResponse;
use Symfony\\Component\\Routing\\Annotation\\Route;

class HomeController extends AbstractController
{
    #[Route('/', name: 'home')]
    public function index(): JsonResponse
    {
        return $this->json(['message' => 'Hello from {PROJECT_NAME}!']);
    }

    #[Route('/health', name: 'health')]
    public function health(): JsonResponse
    {
        return $this->json(['status' => 'ok']);
    }
}
`,
      'composer.json':
`{
  "name": "example/{PROJECT_NAME}",
  "require": {
    "php": "^8.2",
    "symfony/framework-bundle": "^7.0"
  },
  "autoload": {
    "psr-4": { "App\\\\": "src/" }
  }
}
`,
      '.env.example':
`APP_ENV=dev
APP_SECRET=change-me-in-production
DATABASE_URL=sqlite:///%kernel.project_dir%/var/data.db
`,
    },
  };

module.exports = { SYMFONY };
