// @ts-check
'use strict';

const { AspNetOfficialGenerator } = require('../AspNetOfficialGenerator');

const README = (projectName) =>
`# ${projectName}

Proyecto **ASP.NET Core MVC** (.NET 8) generado con TabBuilder.

Patrón Model-View-Controller con vistas Razor.

## Ejecutar

\`\`\`bash
dotnet run
\`\`\`

La aplicación arranca en http://localhost:5000 y sirve la vista \`Home/Index\`.

## Comandos útiles

\`\`\`bash
dotnet build      # compilar
dotnet test       # ejecutar pruebas (si se añaden)
\`\`\`
`;

class AspNetMvcOfficialGenerator extends AspNetOfficialGenerator {
  constructor(runtime) {
    super({ frameworkId: 'aspnet', architectureId: 'mvc', lang: 'csharp' }, runtime);
    this.dotnetTemplate = 'mvc';
  }

  buildReadme(projectName) {
    return README(projectName);
  }
}

module.exports = { AspNetMvcOfficialGenerator };