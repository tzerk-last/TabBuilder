# Arquitecturas Avanzadas — Guía de Integración

Este módulo (`src/architecture/`) añade soporte para generar estructuras de
**MVC, Clean Architecture, Hexagonal y DDD** sobre los frameworks
**ASP.NET, Spring Boot, Laravel y FastAPI**, sin modificar el código existente
del builder.

## Diseño

Dos ejes ortogonales, unidos por un Factory:

```
                 LanguageEmitters (Strategy)
                 aspnet · spring-boot · laravel · fastapi
                          ▲   traduce "qué" a código idiomático
                          │
ArchitectureBlueprint ────┘
  mvc · clean · hexagonal · ddd   (cada una = un archivo, una clase)
        ▲
        │ register()
ArchitectureRegistry (registro abierto)  ──►  ArchitectureFactory  ──►  writeArchitectureFiles()
```

- **Arquitectura nueva** → crear un blueprint en `blueprints/` y registrarlo. No
  se toca ningún emitter ni el resto.
- **Framework nuevo** → agregar un emitter en `LanguageEmitters.js` y añadir su id
  a `ARCHITECTURE_FRAMEWORKS`. No se toca ninguna arquitectura.

Principios aplicados: **SRP** (cada blueprint/emitter una responsabilidad),
**OCP** (registro abierto, cero modificación para extender), **LSP** (todo
blueprint es sustituible), **DIP** (el factory depende de la abstracción
`ArchitectureBlueprint`, no de clases concretas), y **Factory Method**
(`ArchitectureFactory.create`).

## Uso programático

```js
const { ArchitectureFactory, writeArchitectureFiles } = require('./architecture');

const factory = new ArchitectureFactory();

// Para poblar la UI según el framework elegido:
const opciones = factory.availableForFramework('aspnet');
// -> [{id:'mvc',...},{id:'clean',...},{id:'hexagonal',...},{id:'ddd',...}]

// Generar y escribir:
const plan = factory.create('clean', {
  projectName: 'MiApp',
  framework: 'spring-boot',
  lang: 'java',
});
const { written, skipped } = writeArchitectureFiles(plan, projectPath);
```

El retorno `{ written, skipped }` es idéntico al de
`devopsBuilder.writeDevOpsFiles`, así que se integra igual que DevOps.

## Cómo engancharlo en `extension.js` (cambios aditivos)

1. Importar arriba, junto a los demás require:

   ```js
   const { ArchitectureFactory, writeArchitectureFiles, ARCHITECTURE_FRAMEWORKS } =
     require('./architecture');
   const architectureFactory = new ArchitectureFactory();
   ```

2. Dentro de `_handleCreate`, **después** de `createProjectStructure(...)` y
   antes de ofrecer DevOps, añadir (sólo si el webview envía `msg.architectureId`):

   ```js
   if (msg.architectureId && ARCHITECTURE_FRAMEWORKS.includes(templateId)) {
     try {
       const plan = architectureFactory.create(msg.architectureId, {
         projectName, framework: templateId, lang,
       });
       const { written } = writeArchitectureFiles(plan, projectPath);
       webviewView.webview.postMessage({
         command: 'progress',
         text: `Arquitectura ${msg.architectureId}: ${written.length} archivos generados.`,
       });
     } catch (e) {
       webviewView.webview.postMessage({ command: 'error', text: e.message });
     }
   }
   ```

3. En el webview, añadir un `<select>` de arquitectura (poblado con
   `factory.availableForFramework(templateId)`) y mandar `architectureId` en el
   mensaje `create`. El flujo actual sigue intacto si no se envía ese campo.

## Probado

Las 16 combinaciones (4 arquitecturas × 4 frameworks) generan carpetas,
interfaces, DTOs, repositorios, servicios, casos de uso y configuración inicial.
La extensibilidad Open/Closed se verifica registrando una 5ª arquitectura desde
fuera del módulo, sin modificar archivo alguno.
