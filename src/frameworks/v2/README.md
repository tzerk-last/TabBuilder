# Infraestructura de Generadores v4

> **Estado: Fase 1 (infraestructura).** Este directorio contiene el andamiaje
> del nuevo sistema de generación. **No está conectado al flujo activo.** El
> `projectBuilder` legacy sigue siendo el único camino que se ejecuta hoy.
> Ningún framework ha sido migrado todavía.

## Objetivo

Reemplazar el sistema de *blueprints genéricos compartidos* por **un generador
independiente por cada combinación Framework + Arquitectura**. Cada generador
conoce su propia estructura; no se reparte lógica entre capas genéricas.

## Piezas

| Archivo                | Responsabilidad                                                                 |
|------------------------|---------------------------------------------------------------------------------|
| `GeneratorContext.js`  | Normaliza el `ProjectConfig` de la WebView y centraliza I/O + placeholders.      |
| `BaseGenerator.js`     | Clase base (Template Method). Orquesta `generate()` con pasos sobreescribibles.  |
| `FrameworkFactory.js`  | Resuelve `(framework, arch)` → generador. No contiene lógica por framework.       |
| `registry.js`          | Mapa de combos migrados. **Vacío en Fase 1.**                                     |
| `generators/`          | Aquí vivirá cada generador concreto: `generators/<framework>/<arch>/`.            |
| `index.js`             | Superficie pública de la infra.                                                   |

## Contrato de salida

`BaseGenerator.generate(config)` devuelve un objeto **idéntico** al `BuildResult`
que produce el `projectBuilder` actual:

```
{ success: boolean, projectPath: string, filesWritten: string[], error?: string }
```

Esto permite que, cuando un combo se migre, el `projectBuilder` delegue en el
generador nuevo sin que `extension.js` ni la WebView noten diferencia alguna.

## Pipeline de un generador

`BaseGenerator` define el orden; cada subclase sobreescribe sólo lo que necesita
(todos los pasos son no-op por defecto):

1. `structure(ctx)` — carpetas propias (fatal si falla)
2. `files(ctx)` — archivos propios con placeholders (fatal si falla)
3. `devops(ctx)` — Dockerfile / CI propios (no fatal)
4. `readme(ctx)` — README propio (no fatal)
5. `dependencies(ctx)` — instalación, si aplica (no fatal)

La variación entre combinaciones vive en las **clases**, no en condicionales del
orquestador. No hay `switch` ni `if` gigantes.

## Cómo se migrará un framework (fases futuras)

1. Crear `generators/<framework>/<arch>/generator.js` extendiendo `BaseGenerator`.
2. Registrar una línea en `registry.js`.
3. Hacer que `projectBuilder` consulte `FrameworkFactory.has(...)` y, si es `true`,
   delegue; si es `false`, use el flujo legacy (combos aún no migrados).

Mientras `registry.js` no incluya un combo, ese combo sigue por el camino legacy.
Por eso la migración es incremental y sin regresiones: nada cambia hasta que un
combo concreto se registra y valida.

## Compatibilidad (Fase 1)

- `extension.js`, `webview.js`, `projectBuilder.js`, `architecture/` y los
  `frameworks/*.js` actuales **no se modifican**.
- La factory con registro vacío es inerte: `has()` devuelve `false` para todo.
- No cambia la UI, ni el flujo del usuario, ni la configuración.
