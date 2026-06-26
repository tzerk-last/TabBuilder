// @ts-check
'use strict';

const { AspNetOfficialGenerator } = require('../AspNetOfficialGenerator');

const README = (projectName) =>
`# ${projectName}

Proyecto **ASP.NET Core Web API** (.NET 8) generado con TabBuilder.

API REST basada en controladores, con documentación Swagger/OpenAPI. Sin capa de vistas.

## Ejecutar

\`\`\`bash
dotnet run
\`\`\`

La API arranca en http://localhost:5000. En modo Development, la UI de Swagger está disponible en http://localhost:5000/swagger.

## Comandos útiles

\`\`\`bash
dotnet build      # compilar
dotnet test       # ejecutar pruebas (si se añaden)
\`\`\`
`;

class AspNetApiOfficialGenerator extends AspNetOfficialGenerator {
  constructor(runtime) {
    super({ frameworkId: 'aspnet', architectureId: 'api', lang: 'csharp' }, runtime);
    this.dotnetTemplate = 'webapi';
  }

  buildReadme(projectName) {
    return README(projectName);
  }
}

module.exports = { AspNetApiOfficialGenerator };