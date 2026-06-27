// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const NESTJS = {
    id: 'nestjs',
    name: 'NestJS',
    icon: '🐱',
    lang: 'js',
    description: 'Framework Node.js progresivo con arquitectura Angular-style',
    version: '10.x',
    port: 3000,
    enabled: true,
    templates: ['api'],
    architectures: ['standard'],
    folders: ['src', 'src/modules', 'test'],
    files: {
      'src/main.ts':
`import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(\`{PROJECT_NAME} running on http://localhost:\${port}\`);
}
bootstrap();
`,
      'src/app.module.ts':
`import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`,
      'src/app.controller.ts':
`import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
`,
      'src/app.service.ts':
`import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello from {PROJECT_NAME}!';
  }
}
`,
      'package.json': JSON.stringify({
  name: '{PROJECT_NAME}',
  version: '0.0.1',
  private: true,
  scripts: {
    start: 'node dist/main',
    'start:dev': 'nest start --watch',
    build: 'nest build',
    lint: 'eslint "{src,apps,libs,test}/**/*.ts" --fix',
  },
  dependencies: {
    '@nestjs/common': '^10.0.0',
    '@nestjs/core': '^10.0.0',
    '@nestjs/platform-express': '^10.0.0',
    'reflect-metadata': '^0.2.0',
    rxjs: '^7.8.1',
  },
  devDependencies: {
    '@nestjs/cli': '^10.0.0',
    '@nestjs/schematics': '^10.0.0',
    '@types/express': '^5.0.0',
    '@types/node': '^20.0.0',
    typescript: '^5.0.0',
  },
}, null, 2),
      'tsconfig.json':
`{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "noImplicitAny": false,
    "strictBindCallApply": false,
    "forceConsistentCasingInFileNames": false,
    "noFallthroughCasesInSwitch": false
  }
}
`,
      'nest-cli.json':
`{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true
  }
}
`,
      '.env.example': `PORT=3000\nNODE_ENV=development\nDATABASE_URL=postgres://user:password@localhost:5432/{PROJECT_NAME}\n`,
    },
  };

module.exports = { NESTJS };
