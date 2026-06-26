// @ts-check
'use strict';

/**
 * Plantillas del generador ASP.NET Core **API** (Web API).
 *
 * Mapa { rutaRelativa: contenido }. Equivalente a `dotnet new webapi`
 * (.NET 8, controller-based con Swagger). Proyecto API puro: SIN vistas,
 * SIN wwwroot. Es la única fuente de verdad de la estructura API; no depende
 * de blueprint ni del generador MVC. Placeholder: {PROJECT_NAME}.
 */

/** Carpetas propias del proyecto API. */
const FOLDERS = [
  'Controllers',
  'Models',
  'Properties',
];

/** @type {Record<string, string>} */
const FILES = {
  'Controllers/WeatherForecastController.cs':
`using Microsoft.AspNetCore.Mvc;
using {PROJECT_NAME}.Models;

namespace {PROJECT_NAME}.Controllers;

[ApiController]
[Route("[controller]")]
public class WeatherForecastController : ControllerBase
{
    private static readonly string[] Summaries = new[]
    {
        "Frío", "Templado", "Cálido", "Caluroso", "Sofocante"
    };

    private readonly ILogger<WeatherForecastController> _logger;

    public WeatherForecastController(ILogger<WeatherForecastController> logger)
    {
        _logger = logger;
    }

    [HttpGet(Name = "GetWeatherForecast")]
    public IEnumerable<WeatherForecast> Get()
    {
        return Enumerable.Range(1, 5).Select(index => new WeatherForecast
        {
            Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = Summaries[Random.Shared.Next(Summaries.Length)]
        })
        .ToArray();
    }
}
`,
  'Models/WeatherForecast.cs':
`namespace {PROJECT_NAME}.Models;

public class WeatherForecast
{
    public DateOnly Date { get; set; }

    public int TemperatureC { get; set; }

    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);

    public string? Summary { get; set; }
}
`,
  'Program.cs':
`var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
`,
  'appsettings.json':
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
  'appsettings.Development.json':
`{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
`,
  'Properties/launchSettings.json':
`{
  "$schema": "http://json.schemastore.org/launchsettings.json",
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "launchUrl": "swagger",
      "applicationUrl": "http://localhost:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
`,
  '{PROJECT_NAME}.csproj':
`<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.6.2" />
  </ItemGroup>
</Project>
`,
};

/** README propio del proyecto API. */
const README = (projectName) =>
`# ${projectName}

Proyecto **ASP.NET Core Web API** (.NET 8) generado con TabBuilder.

API REST basada en controladores, con documentación Swagger/OpenAPI. Sin capa de vistas.

## Estructura

\`\`\`
Controllers/      Controladores API ([ApiController])
Models/           Modelos de datos
Properties/       launchSettings.json
\`\`\`

## Ejecutar

\`\`\`bash
dotnet run
\`\`\`

La API arranca en http://localhost:5000. En modo Development, la UI de Swagger
está disponible en http://localhost:5000/swagger.

Endpoint de ejemplo: \`GET /WeatherForecast\`.

## Comandos útiles

\`\`\`bash
dotnet build      # compilar
dotnet test       # ejecutar pruebas (si se añaden)
\`\`\`
`;

module.exports = { FOLDERS, FILES, README };
