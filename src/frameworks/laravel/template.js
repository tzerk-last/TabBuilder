// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const LARAVEL = {
    id: 'laravel',
    name: 'Laravel',
    icon: '🔺',
    lang: 'php',
    description: 'El framework PHP más popular con Eloquent ORM',
    version: '12.x',
    port: 8000,
    enabled: true,
    templates: ['mvc'],
    architectures: ['standard'],
    folders: ['app/Http/Controllers', 'app/Models', 'routes', 'resources/views', 'database/migrations', 'tests/Feature'],
    files: {
      'app/Http/Controllers/HomeController.php':
`<?php

namespace App\\Http\\Controllers;

use Illuminate\\Http\\JsonResponse;

class HomeController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(['message' => 'Hello from {PROJECT_NAME}!']);
    }

    public function health(): JsonResponse
    {
        return response()->json(['status' => 'ok']);
    }
}
`,
      'routes/web.php':
`<?php

use Illuminate\\Support\\Facades\\Route;
use App\\Http\\Controllers\\HomeController;

Route::get('/', [HomeController::class, 'index']);
Route::get('/health', [HomeController::class, 'health']);
`,
      'app/Models/User.php':
`<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Model;

class User extends Model
{
    protected $fillable = ['name', 'email'];
}
`,
      'composer.json':
`{
  "name": "example/{PROJECT_NAME}",
  "type": "project",
  "description": "A Laravel application",
  "require": {
    "php": "^8.2",
    "laravel/framework": "^12.0",
    "laravel/tinker": "^2.9"
  },
  "require-dev": {
    "fakerphp/faker": "^1.23",
    "laravel/pint": "^1.13",
    "pestphp/pest": "^3.0"
  },
  "autoload": {
    "psr-4": { "App\\\\": "app/" },
    "files": []
  },
  "autoload-dev": {
    "psr-4": { "Tests\\\\": "tests/" }
  },
  "scripts": {
    "post-autoload-dump": [
      "Illuminate\\Foundation\\ComposerScripts::postAutoloadDump",
      "@php artisan package:discover --ansi"
    ],
    "post-update-cmd": [
      "@php artisan vendor:publish --tag=laravel-assets --ansi --force"
    ],
    "post-root-package-install": [
      "@php -r \\"file_exists('.env') || copy('.env.example', '.env');\\""
    ],
    "post-create-project-cmd": [
      "@php artisan key:generate --ansi"
    ]
  },
  "config": {
    "optimize-autoloader": true,
    "preferred-install": "dist",
    "sort-packages": true,
    "allow-plugins": {
      "pestphp/pest-plugin": true,
      "php-http/discovery": true
    }
  },
  "minimum-stability": "stable",
  "prefer-stable": true
}
`,
      '.env.example':
`APP_NAME={PROJECT_NAME}
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE={PROJECT_NAME}
DB_USERNAME=root
DB_PASSWORD=
`,
    },
  };

module.exports = { LARAVEL };
