// @ts-check
'use strict';

/**
 * Plantillas del generador ASP.NET Core **Clean Architecture**.
 *
 * Produce una solución multi-proyecto con cuatro capas, que es la forma
 * idiomática de Clean Architecture en .NET:
 *
 *   src/
 *     {P}.Domain/          → entidades y contratos (sin dependencias)
 *     {P}.Application/      → casos de uso / interfaces de servicios
 *     {P}.Infrastructure/   → implementaciones (datos, servicios externos)
 *     {P}.Web/              → host ASP.NET (composición + endpoints)
 *   {P}.sln
 *
 * NO contiene Controllers/Views/wwwroot en la raíz: esa es estructura MVC y
 * pertenece a OTRO generador. Aquí la capa Web es una Web API mínima por
 * convención de Clean (un endpoint de ejemplo que consume Application).
 *
 * El placeholder {PROJECT_NAME} lo resuelve el contexto. La regla de
 * dependencias (Domain ← Application ← Infrastructure, Web → todas) se refleja
 * en los ProjectReference de cada .csproj.
 */

/** Carpetas propias de la solución Clean. */
const FOLDERS = [
  'src',
  'src/{PROJECT_NAME}.Domain',
  'src/{PROJECT_NAME}.Domain/Entities',
  'src/{PROJECT_NAME}.Application',
  'src/{PROJECT_NAME}.Application/Interfaces',
  'src/{PROJECT_NAME}.Application/Services',
  'src/{PROJECT_NAME}.Infrastructure',
  'src/{PROJECT_NAME}.Infrastructure/Services',
  'src/{PROJECT_NAME}.Web',
  'src/{PROJECT_NAME}.Web/Properties',
];

/** @type {Record<string, string>} */
const FILES = {
  // ── Solution ──────────────────────────────────────────────────────────────
  '{PROJECT_NAME}.sln':
`Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "{PROJECT_NAME}.Domain", "src\\{PROJECT_NAME}.Domain\\{PROJECT_NAME}.Domain.csproj", "{11111111-1111-1111-1111-111111111111}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "{PROJECT_NAME}.Application", "src\\{PROJECT_NAME}.Application\\{PROJECT_NAME}.Application.csproj", "{22222222-2222-2222-2222-222222222222}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "{PROJECT_NAME}.Infrastructure", "src\\{PROJECT_NAME}.Infrastructure\\{PROJECT_NAME}.Infrastructure.csproj", "{33333333-3333-3333-3333-333333333333}"
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "{PROJECT_NAME}.Web", "src\\{PROJECT_NAME}.Web\\{PROJECT_NAME}.Web.csproj", "{44444444-4444-4444-4444-444444444444}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{11111111-1111-1111-1111-111111111111}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{11111111-1111-1111-1111-111111111111}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{11111111-1111-1111-1111-111111111111}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{11111111-1111-1111-1111-111111111111}.Release|Any CPU.Build.0 = Release|Any CPU
		{22222222-2222-2222-2222-222222222222}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{22222222-2222-2222-2222-222222222222}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{22222222-2222-2222-2222-222222222222}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{22222222-2222-2222-2222-222222222222}.Release|Any CPU.Build.0 = Release|Any CPU
		{33333333-3333-3333-3333-333333333333}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{33333333-3333-3333-3333-333333333333}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{33333333-3333-3333-3333-333333333333}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{33333333-3333-3333-3333-333333333333}.Release|Any CPU.Build.0 = Release|Any CPU
		{44444444-4444-4444-4444-444444444444}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{44444444-4444-4444-4444-444444444444}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{44444444-4444-4444-4444-444444444444}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{44444444-4444-4444-4444-444444444444}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
EndGlobal
`,

  // ── Domain (sin dependencias) ─────────────────────────────────────────────
  'src/{PROJECT_NAME}.Domain/{PROJECT_NAME}.Domain.csproj':
`<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>
`,
  'src/{PROJECT_NAME}.Domain/Entities/WeatherForecast.cs':
`namespace {PROJECT_NAME}.Domain.Entities;

public class WeatherForecast
{
    public DateOnly Date { get; set; }
    public int TemperatureC { get; set; }
    public string? Summary { get; set; }

    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
`,

  // ── Application (depende solo de Domain) ──────────────────────────────────
  'src/{PROJECT_NAME}.Application/{PROJECT_NAME}.Application.csproj':
`<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\\{PROJECT_NAME}.Domain\\{PROJECT_NAME}.Domain.csproj" />
  </ItemGroup>
</Project>
`,
  'src/{PROJECT_NAME}.Application/Interfaces/IWeatherService.cs':
`using {PROJECT_NAME}.Domain.Entities;

namespace {PROJECT_NAME}.Application.Interfaces;

public interface IWeatherService
{
    IEnumerable<WeatherForecast> GetForecast();
}
`,

  // ── Infrastructure (depende de Application + Domain) ──────────────────────
  'src/{PROJECT_NAME}.Infrastructure/{PROJECT_NAME}.Infrastructure.csproj':
`<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\\{PROJECT_NAME}.Application\\{PROJECT_NAME}.Application.csproj" />
  </ItemGroup>
</Project>
`,
  'src/{PROJECT_NAME}.Infrastructure/Services/WeatherService.cs':
`using {PROJECT_NAME}.Application.Interfaces;
using {PROJECT_NAME}.Domain.Entities;

namespace {PROJECT_NAME}.Infrastructure.Services;

public class WeatherService : IWeatherService
{
    private static readonly string[] Summaries =
        { "Frío", "Templado", "Cálido", "Caluroso", "Sofocante" };

    public IEnumerable<WeatherForecast> GetForecast()
    {
        return Enumerable.Range(1, 5).Select(index => new WeatherForecast
        {
            Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = Summaries[Random.Shared.Next(Summaries.Length)],
        });
    }
}
`,

  // ── Web (host: depende de Application + Infrastructure) ───────────────────
  'src/{PROJECT_NAME}.Web/{PROJECT_NAME}.Web.csproj':
`<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <ProjectReference Include="..\\{PROJECT_NAME}.Application\\{PROJECT_NAME}.Application.csproj" />
    <ProjectReference Include="..\\{PROJECT_NAME}.Infrastructure\\{PROJECT_NAME}.Infrastructure.csproj" />
  </ItemGroup>
</Project>
`,
  'src/{PROJECT_NAME}.Web/Program.cs':
`using {PROJECT_NAME}.Application.Interfaces;
using {PROJECT_NAME}.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// Composición de dependencias (Clean Architecture):
// la capa Web conoce las implementaciones de Infrastructure y las inyecta
// detrás de las interfaces declaradas en Application.
builder.Services.AddScoped<IWeatherService, WeatherService>();

var app = builder.Build();

app.MapGet("/", () => "{PROJECT_NAME} — Clean Architecture (ASP.NET Core)");

app.MapGet("/weather", (IWeatherService service) => service.GetForecast());

app.Run();
`,
  'src/{PROJECT_NAME}.Web/appsettings.json':
`{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*"
}
`,
  'src/{PROJECT_NAME}.Web/appsettings.Development.json':
`{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
`,
  'src/{PROJECT_NAME}.Web/Properties/launchSettings.json':
`{
  "$schema": "http://json.schemastore.org/launchsettings.json",
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "applicationUrl": "http://localhost:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
`,
};

/** README propio del proyecto Clean. */
const README = (projectName) =>
`# ${projectName}

Proyecto **ASP.NET Core — Clean Architecture** (.NET 8) generado con TabBuilder.

Solución multi-proyecto con separación estricta de capas.

## Estructura

\`\`\`
${projectName}.sln
src/
  ${projectName}.Domain/          Entidades y contratos. Sin dependencias.
  ${projectName}.Application/      Casos de uso e interfaces. Depende de Domain.
  ${projectName}.Infrastructure/   Implementaciones. Depende de Application.
  ${projectName}.Web/              Host ASP.NET. Compone e inyecta dependencias.
\`\`\`

## Regla de dependencias

\`\`\`
Domain  ←  Application  ←  Infrastructure
                    ↑              ↑
                    └──── Web ─────┘
\`\`\`

Las dependencias apuntan hacia el centro (Domain). La capa Web es la única que
conoce las implementaciones concretas y las registra en el contenedor.

## Ejecutar

\`\`\`bash
dotnet run --project src/${projectName}.Web
\`\`\`

Endpoints de ejemplo: \`GET /\` y \`GET /weather\`.

## Comandos útiles

\`\`\`bash
dotnet build      # compila toda la solución
dotnet test       # ejecuta pruebas (si se añaden)
\`\`\`
`;

module.exports = { FOLDERS, FILES, README };
