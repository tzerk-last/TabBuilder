# Changelog

All notable changes to Framework Project Builder are documented here.

## [3.2.0] — 2026-06-25

### ♻️ Modelo de datos: "Arquitectura" → "Tipo de proyecto"
- El paso del asistente antes llamado **Arquitectura** ahora es **Tipo de proyecto**. `API` y `Standard` dejan de modelarse como arquitecturas: son tipos de proyecto. MVC y Clean también se unifican como tipos de proyecto.
- Nuevo `PROJECT_TYPE_CATALOG` y `FRAMEWORK_PROJECT_TYPES` como fuente única de verdad. Se conservan alias (`ARCHITECTURE_CATALOG`, `FRAMEWORK_ARCHITECTURES`, `getFrameworkArchitectures`) para no romper imports existentes.

### 🧭 Comportamiento del asistente
- Si un framework tiene **más de un** tipo de proyecto, se muestra el paso "Tipo de proyecto".
- Si tiene **un solo** tipo, el paso se **oculta** y el tipo se selecciona automáticamente (en avance, retroceso y clic en el stepper). El usuario nunca ve una pantalla con una sola opción.

### 🧩 Tipos de proyecto por framework (MVP)
- ASP.NET Core, Spring Boot, Laravel → **MVC, API, Clean**.
- FastAPI, Express, NestJS → **API** (paso oculto).
- React + Vite, Vue + Vite, Angular, Next.js, Django → **Standard** (paso oculto).

### ⚙️ DevOps
- Visibles: Ninguno, Docker, **Docker + Kubernetes**, GitHub Actions. Azure Pipelines oculto (no eliminado).

### 🎨 UI
- Único cambio textual: "Arquitectura" → "Tipo de proyecto" (stepper, título del paso, resumen; abreviatura del sidebar "Arch." → "Tipo"). El bloque `<style>` es **byte-idéntico** al anterior: mismo HTML, CSS, colores, iconos, animaciones y flujo visual.

### ✅ Verificado (jsdom headless + generación real)
- aspnet/spring/laravel muestran MVC/API/Clean y NO saltan el paso.
- fastapi/express/nestjs/react/vue/angular/next/django saltan el paso (autoseleccionan su único tipo).
- Hexagonal, DDD y Azure Pipelines no aparecen.
- ASP.NET MVC/API/Clean generan estructuras distintas y correctas mediante sus generadores independientes.
- FastAPI/Express/NestJS (API) y Django (Standard) generan sin capas de arquitectura espurias.

### ⚠️ Riesgo conocido
- Spring Boot y Laravel ofrecen MVC/API/Clean en la UI, pero aún **no tienen generadores v2 propios**: los tres tipos se generan por el flujo legacy, que produce la misma estructura base. La diferenciación real MVC/API/Clean para Spring y Laravel queda pendiente de crear sus generadores (como ya existe para ASP.NET).


## [3.1.0] — 2026-06-25

### 🐛 Bug Fixes (MVP — causa raíz)
- **Arquitecturas y DevOps ya no usan listas hardcodeadas en el WebView.** Antes el HTML del WebView incluía filas fijas (`data-arch="hexagonal"`, `data-arch="ddd"`, `data-devops="azure-pipelines"`), por lo que las opciones deshabilitadas seguían apareciendo. Ahora el WebView renderiza esas opciones desde metadata y muestra únicamente las habilitadas.
- **`getFrameworkData()` ahora filtra por `enabled`.** Los frameworks con `enabled:false` permanecen en el código pero ya no se serializan hacia el WebView, por lo que dejan de aparecer en la interfaz. Las categorías que quedan vacías no se muestran.

### ✨ Cambios funcionales
- **Nueva arquitectura `API`** para frameworks backend, con generador independiente `aspnet/api` (Web API real, controller-based + Swagger, sin vistas). ASP.NET ahora ofrece MVC, Clean y API, cada uno con su propio generador aislado.
- **Los frameworks frontend (React, Vue, Angular, Next) ya no preguntan arquitectura.** El wizard salta automáticamente el paso de Arquitectura para ellos (en avance, retroceso y clic directo en el stepper).

### 👁️ Visibilidad (MVP)
- Frameworks visibles (11): ASP.NET Core, Spring Boot, Laravel, FastAPI, Django, Express, NestJS, React + Vite, Vue + Vite, Angular, Next.js.
- Frameworks ocultos con `enabled:false` (no eliminados): Quarkus, Micronaut, Flask, Litestar, Blazor, Symfony, SvelteKit, Astro, Nuxt3, Hono.
- Arquitecturas visibles: MVC, Clean, API. Ocultas (sin borrar): DDD, Hexagonal.
- DevOps visibles: Ninguno, Docker, Kubernetes, GitHub Actions. Oculto (sin borrar): Azure Pipelines.

### 🎨 UI
- Sin cambios visuales: el bloque `<style>` es byte-idéntico al anterior. Mismo HTML, CSS, colores, iconos y animaciones. Las filas dinámicas usan exactamente el mismo marcado (`opt-row`/`or-icon`/`or-name`/`or-desc`) que las filas estáticas que reemplazan.

### ✅ Verificado (ejecución headless con jsdom + generación real)
- Arquitectura muestra solo MVC, Clean, API; Hexagonal y DDD ausentes.
- DevOps muestra solo Ninguno, Docker, Kubernetes, GitHub Actions; Azure ausente.
- 11 frameworks visibles (set MVP exacto).
- React y Vue se generan correctamente, sin capas backend inyectadas.
- ASP.NET MVC genera MVC; Clean genera solución por capas; API genera Web API.


## [3.0.0] — 2026-06-24

### 🔥 Breaking Changes
- Removed AI assistant tab and all OpenAI/GPT integration
- Removed duplicate DevOps notification flow — DevOps is now configured **once** in the wizard

### ✨ New Features
- New 5-step unified wizard: Framework → Architecture → Database → DevOps → Summary
- Framework-specific README generation for all 21 frameworks
- Azure Pipelines CI/CD support added
- Sidebar live preview during wizard navigation

### 🧹 Refactored
- Split monolithic files into focused modules under `src/frameworks/`, `src/devops/`, `src/templates/`, `src/runtime/`, `src/services/`, `src/utils/`, `src/commands/`
- Each language family now lives in its own file (`java.js`, `python.js`, `csharp.js`, `php.js`, `js.js`)
- Validation extracted to `src/utils/validation.js`
- Runtime detection extracted to `src/runtime/checker.js`
- DevOps generation unified in `src/devops/generator.js`
- Removed all unused imports, dead code, and legacy files
- Removed `fs-extra` dependency (not needed)

### 🐛 Fixes
- Project creation no longer shows a second DevOps popup after generation
- Folder picker state correctly syncs with wizard navigation
- Name validation now gives clear, specific error messages

## [2.0.0] — Previous release

- Tabbed UI with Builder, DevOps and Assistant tabs
- Basic architecture pattern support
