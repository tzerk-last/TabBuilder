# TabBuilderClean

Proyecto **ASP.NET Core — Clean Architecture** (.NET 8) generado con TabBuilder.

Solución multi-proyecto con separación estricta de capas.

## Estructura

```
TabBuilderClean.sln
src/
  TabBuilderClean.Domain/          Entidades y contratos. Sin dependencias.
  TabBuilderClean.Application/      Casos de uso e interfaces. Depende de Domain.
  TabBuilderClean.Infrastructure/   Implementaciones. Depende de Application.
  TabBuilderClean.Web/              Host ASP.NET. Compone e inyecta dependencias.
```

## Regla de dependencias

```
Domain  ←  Application  ←  Infrastructure
                    ↑              ↑
                    └──── Web ─────┘
```

Las dependencias apuntan hacia el centro (Domain). La capa Web es la única que
conoce las implementaciones concretas y las registra en el contenedor.

## Ejecutar

```bash
dotnet run --project src/TabBuilderClean.Web
```

Endpoints de ejemplo: `GET /` y `GET /weather`.

## Comandos útiles

```bash
dotnet build      # compila toda la solución
dotnet test       # ejecuta pruebas (si se añaden)
```
