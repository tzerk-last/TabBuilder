// @ts-check
'use strict';

const fs = require('fs');
const path = require('path');
const { AspNetOfficialGenerator } = require('../generator');
const { README } = require('./templates');
const { ASPNET_DOTNET_FRAMEWORK } = require('../../shared/versions');

class AspNetCleanOfficialGenerator extends AspNetOfficialGenerator {
  constructor(runtime) {
    super({ frameworkId: 'aspnet', architectureId: 'clean', lang: 'csharp' }, runtime);
  }

  buildReadme(projectName) {
    return README(projectName);
  }

  /** Clean Architecture: solution + Domain/Application/Infrastructure/Web projects with references. */
  async scaffold(runtime, projectPath, projectName) {
    await this.runDotnet(runtime, ['new', 'sln', '--name', projectName], projectPath);

    const projects = [
      { template: 'classlib', name: `${projectName}.Domain`, output: `src/${projectName}.Domain` },
      { template: 'classlib', name: `${projectName}.Application`, output: `src/${projectName}.Application` },
      { template: 'classlib', name: `${projectName}.Infrastructure`, output: `src/${projectName}.Infrastructure` },
      { template: 'webapi', name: `${projectName}.Web`, output: `src/${projectName}.Web`, options: ['--no-https'] },
    ];

    for (const project of projects) {
      const args = [
        'new',
        project.template,
        '--framework',
        ASPNET_DOTNET_FRAMEWORK,
        '--name',
        project.name,
        '--output',
        project.output,
        '--no-restore',
        ...(project.options || []),
      ];
      await this.runDotnet(runtime, args, projectPath);
    }

    const projectPaths = projects.map((project) => `src/${project.name}/${project.name}.csproj`);
    for (const relCsproj of projectPaths) {
      await this.runDotnet(runtime, ['sln', 'add', relCsproj], projectPath);
    }

    await this.runDotnet(runtime, ['add', `src/${projectName}.Application/${projectName}.Application.csproj`, 'reference', `src/${projectName}.Domain/${projectName}.Domain.csproj`], projectPath);
    await this.runDotnet(runtime, ['add', `src/${projectName}.Infrastructure/${projectName}.Infrastructure.csproj`, 'reference', `src/${projectName}.Application/${projectName}.Application.csproj`, `src/${projectName}.Domain/${projectName}.Domain.csproj`], projectPath);
    await this.runDotnet(runtime, ['add', `src/${projectName}.Web/${projectName}.Web.csproj`, 'reference', `src/${projectName}.Application/${projectName}.Application.csproj`, `src/${projectName}.Infrastructure/${projectName}.Infrastructure.csproj`], projectPath);

    this.deleteIfExists(path.join(projectPath, 'src', `${projectName}.Domain`, 'Class1.cs'));
    this.deleteIfExists(path.join(projectPath, 'src', `${projectName}.Application`, 'Class1.cs'));
    this.deleteIfExists(path.join(projectPath, 'src', `${projectName}.Infrastructure`, 'Class1.cs'));
    this.deleteIfExists(path.join(projectPath, 'src', `${projectName}.Web`, 'WeatherForecast.cs'));
    this.deleteIfExists(path.join(projectPath, 'src', `${projectName}.Web`, 'Controllers', 'WeatherForecastController.cs'));

    this.writeFile(projectPath, `src/${projectName}.Domain/Entities/WeatherForecast.cs`, this.domainWeatherForecast(projectName));
    this.writeFile(projectPath, `src/${projectName}.Application/Interfaces/IWeatherService.cs`, this.applicationWeatherService(projectName));
    this.writeFile(projectPath, `src/${projectName}.Infrastructure/Services/WeatherService.cs`, this.infrastructureWeatherService(projectName));
    this.writeFile(projectPath, `src/${projectName}.Web/Program.cs`, this.webProgram(projectName));
  }

  deleteIfExists(absPath) {
    if (fs.existsSync(absPath)) {
      fs.rmSync(absPath, { recursive: true, force: true });
    }
  }

  writeFile(projectPath, relPath, content) {
    const absPath = path.join(projectPath, relPath);
    const dir = path.dirname(absPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(absPath, content, 'utf8');
  }

  domainWeatherForecast(projectName) {
    return `namespace ${projectName}.Domain.Entities;

public class WeatherForecast
{
    public DateOnly Date { get; set; }
    public int TemperatureC { get; set; }
    public string? Summary { get; set; }

    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
}
`;
  }

  applicationWeatherService(projectName) {
    return `using ${projectName}.Domain.Entities;

namespace ${projectName}.Application.Interfaces;

public interface IWeatherService
{
    IEnumerable<WeatherForecast> GetForecast();
}
`;
  }

  infrastructureWeatherService(projectName) {
    return `using ${projectName}.Application.Interfaces;
using ${projectName}.Domain.Entities;

namespace ${projectName}.Infrastructure.Services;

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
`;
  }

  webProgram(projectName) {
    return `using ${projectName}.Application.Interfaces;
using ${projectName}.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IWeatherService, WeatherService>();

var app = builder.Build();

app.MapGet("/", () => "${projectName} — Clean Architecture (ASP.NET Core)");
app.MapGet("/weather", (IWeatherService service) => service.GetForecast());

app.Run();
`;
  }
}

module.exports = { AspNetCleanOfficialGenerator };
