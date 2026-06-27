// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const ANGULAR = {
    id: 'angular',
    name: 'Angular',
    icon: '🔴',
    lang: 'js',
    description: 'Framework SPA completo con TypeScript y DI',
    version: '19.x',
    port: 4200,
    enabled: true,
    templates: ['standard'],
    architectures: ['standard'],
    folders: ['src/app', 'src/app/components', 'src/environments', 'public'],
    files: {
      'src/main.ts':
`import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig).catch((e) => console.error(e));
`,
      'src/app/app.component.ts':
`import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = '{PROJECT_NAME}';
}
`,
      'src/app/app.component.html':
`<main>
  <header>
    <h1>Welcome to {{ title }}</h1>
  </header>
  <router-outlet />
</main>
`,
      'src/app/app.component.css':
`main {
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

header {
  border-bottom: 2px solid #1976d2;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
}

h1 {
  color: #1976d2;
  margin: 0;
}
`,
      'src/app/app.config.ts':
`import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
  ],
};
`,
      'src/app/app.routes.ts':
`import { Routes } from '@angular/router';

export const routes: Routes = [];
`,
      'src/index.html':
`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <title>{PROJECT_NAME}</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
`,
      'src/styles.css':
`/* Global styles */
* {
  box-sizing: border-box;
}

body {
  margin: 0;
}
`,
      'angular.json':
`{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  "version": 1,
  "newProjectRoot": "projects",
  "projects": {
    "{PROJECT_NAME}": {
      "projectType": "application",
      "schematics": {},
      "root": "",
      "sourceRoot": "src",
      "prefix": "app",
      "architect": {
        "build": {
          "builder": "@angular-devkit/build-angular:application",
          "options": {
            "outputPath": "dist/{PROJECT_NAME}",
            "index": "src/index.html",
            "browser": "src/main.ts",
            "polyfills": ["zone.js"],
            "tsConfig": "tsconfig.app.json",
            "inlineStyleLanguage": "css",
            "assets": [{ "glob": "**/*", "input": "public" }],
            "styles": ["src/styles.css"],
            "scripts": []
          }
        },
        "serve": {
          "builder": "@angular-devkit/build-angular:dev-server",
          "configurations": {
            "production": { "buildTarget": "{PROJECT_NAME}:build:production" },
            "development": { "buildTarget": "{PROJECT_NAME}:build:development" }
          },
          "defaultConfiguration": "development"
        }
      }
    }
  }
}
`,
      'tsconfig.json':
`{
  "compileOnSave": false,
  "compilerOptions": {
    "outDir": "./dist/out-tsc",
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "sourceMap": true,
    "declaration": false,
    "experimentalDecorators": true,
    "moduleResolution": "bundler",
    "importHelpers": true,
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "dom"]
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
`,
      'tsconfig.app.json':
`{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "outDir": "./out-tsc/app",
    "types": []
  },
  "files": ["src/main.ts"],
  "include": ["src/**/*.d.ts"]
}
`,
      'package.json':
`{
  "name": "{PROJECT_NAME}",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "ng": "ng",
    "start": "ng serve",
    "build": "ng build",
    "watch": "ng build --watch --configuration development"
  },
  "dependencies": {
    "@angular/animations": "^19.0.0",
    "@angular/common": "^19.0.0",
    "@angular/compiler": "^19.0.0",
    "@angular/core": "^19.0.0",
    "@angular/forms": "^19.0.0",
    "@angular/platform-browser": "^19.0.0",
    "@angular/router": "^19.0.0",
    "rxjs": "~7.8.0",
    "tslib": "^2.3.0",
    "zone.js": "~0.15.0"
  },
  "devDependencies": {
    "@angular-devkit/build-angular": "^19.0.0",
    "@angular/cli": "^19.0.0",
    "@angular/compiler-cli": "^19.0.0",
    "typescript": "~5.6.0"
  }
}
`,
    },
  };

module.exports = { ANGULAR };
