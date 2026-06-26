// @ts-check
'use strict';

/** @type {Record<string, import('../types').FrameworkTemplate>} */
const CSHARP_FRAMEWORKS = {
  'aspnet': {
    id: 'aspnet',
    name: 'ASP.NET Core',
    icon: '🔷',
    lang: 'csharp',
    description: 'Framework web moderno de Microsoft con patrón MVC (Model-View-Controller)',
    version: '.NET 8',
    port: 5000,
    enabled: true,
    templates: ['mvc', 'clean', 'api'],
    architectures: ['standard', 'clean', 'api'],
    enabled: true,
    templates: ['mvc'],
    architectures: ['standard', 'clean'],
    folders: [
      'Controllers',
      'Models',
      'Views',
      'Views/Home',
      'Views/Shared',
      'wwwroot',
      'wwwroot/css',
      'wwwroot/js',
      'Properties',
    ],
    files: {
      'Controllers/HomeController.cs':
`using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using {PROJECT_NAME}.Models;

namespace {PROJECT_NAME}.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public IActionResult Index()
    {
        return View();
    }

    public IActionResult Privacy()
    {
        return View();
    }

    [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
    public IActionResult Error()
    {
        return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
    }
}
`,
      'Models/ErrorViewModel.cs':
`namespace {PROJECT_NAME}.Models;

public class ErrorViewModel
{
    public string? RequestId { get; set; }

    public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);
}
`,
      'Program.cs':
`var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
`,
      'Views/Home/Index.cshtml':
`@{
    ViewData["Title"] = "Inicio";
}

<div class="text-center">
    <h1 class="display-4">Bienvenido a {PROJECT_NAME}</h1>
    <p>Para empezar, consulta la <a href="https://learn.microsoft.com/aspnet/core">documentación de ASP.NET Core</a>.</p>
</div>
`,
      'Views/Home/Privacy.cshtml':
`@{
    ViewData["Title"] = "Privacidad";
}
<h1>@ViewData["Title"]</h1>

<p>Usa esta página para detallar la política de privacidad de tu sitio.</p>
`,
      'Views/Shared/Error.cshtml':
`@model ErrorViewModel
@{
    ViewData["Title"] = "Error";
}

<h1 class="text-danger">Error.</h1>
<h2 class="text-danger">Se produjo un error al procesar tu solicitud.</h2>

@if (Model.ShowRequestId)
{
    <p>
        <strong>Request ID:</strong> <code>@Model.RequestId</code>
    </p>
}

<h3>Modo de desarrollo</h3>
<p>
    Al activar el <strong>entorno de desarrollo</strong> se muestra información de depuración detallada del error que se produjo.
</p>
<p>
    <strong>El entorno de desarrollo no debe habilitarse en aplicaciones desplegadas.</strong>
    Puede mostrar información sensible de las excepciones a los usuarios finales.
    Para depurar en local, habilita el entorno <strong>Development</strong> estableciendo la variable de entorno <strong>ASPNETCORE_ENVIRONMENT</strong> en <strong>Development</strong>
    y reinicia la aplicación.
</p>
`,
      'Views/Shared/_Layout.cshtml':
`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>@ViewData["Title"] - {PROJECT_NAME}</title>
    <link rel="stylesheet" href="~/css/site.css" asp-append-version="true" />
</head>
<body>
    <header>
        <nav class="navbar navbar-expand-sm navbar-light bg-white border-bottom box-shadow mb-3">
            <div class="container-fluid">
                <a class="navbar-brand" asp-area="" asp-controller="Home" asp-action="Index">{PROJECT_NAME}</a>
                <div class="navbar-collapse collapse d-sm-inline-flex justify-content-between">
                    <ul class="navbar-nav flex-grow-1">
                        <li class="nav-item">
                            <a class="nav-link text-dark" asp-area="" asp-controller="Home" asp-action="Index">Inicio</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link text-dark" asp-area="" asp-controller="Home" asp-action="Privacy">Privacidad</a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    </header>
    <div class="container">
        <main role="main" class="pb-3">
            @RenderBody()
        </main>
    </div>

    <footer class="border-top footer text-muted">
        <div class="container">
            &copy; @DateTime.Now.Year - {PROJECT_NAME}
        </div>
    </footer>

    <script src="~/js/site.js" asp-append-version="true"></script>
    @await RenderSectionAsync("Scripts", required: false)
</body>
</html>
`,
      'Views/Shared/_ValidationScriptsPartial.cshtml':
`<script src="~/js/jquery.validate.min.js"></script>
<script src="~/js/jquery.validate.unobtrusive.min.js"></script>
`,
      'Views/_ViewImports.cshtml':
`@using {PROJECT_NAME}
@using {PROJECT_NAME}.Models
@addTagHelper *, Microsoft.AspNetCore.Mvc.TagHelpers
`,
      'Views/_ViewStart.cshtml':
`@{
    Layout = "_Layout";
}
`,
      'wwwroot/css/site.css':
`html {
  font-size: 14px;
  position: relative;
  min-height: 100%;
}

@media (min-width: 768px) {
  html {
    font-size: 16px;
  }
}

body {
  margin-bottom: 60px;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.footer {
  position: absolute;
  bottom: 0;
  width: 100%;
  white-space: nowrap;
  line-height: 60px;
}
`,
      'wwwroot/js/site.js':
`// Escribe aquí el JavaScript de tu sitio y referencia las librerías necesarias.
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
</Project>
`,
    },
  },

  'blazor': {
    id: 'blazor',
    name: 'Blazor',
    icon: '🔥',
    lang: 'csharp',
    description: 'Framework SPA con C# en el navegador vía WebAssembly',
    version: '.NET 8',
    port: 5000,
    enabled: false,
    templates: ['standard'],
    architectures: ['standard'],
    enabled: false,
    templates: ['standard'],
    architectures: ['standard'],
    folders: ['Components', 'Components/Pages', 'Components/Layout', 'wwwroot', 'wwwroot/css', 'Properties'],
    files: {
      'Components/App.razor':
`<!DOCTYPE html>
<html lang="es">

<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <base href="/" />
    <link rel="stylesheet" href="app.css" />
    <link rel="stylesheet" href="{PROJECT_NAME}.styles.css" />
    <HeadOutlet />
</head>

<body>
    <Routes />
    <script src="_framework/blazor.web.js"></script>
</body>

</html>
`,
      'Components/Routes.razor':
`<Router AppAssembly="typeof(App).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="routeData" DefaultLayout="typeof(Layout.MainLayout)" />
        <FocusOnNavigate RouteData="routeData" Selector="h1" />
    </Found>
</Router>
`,
      'Components/_Imports.razor':
`@using System.Net.Http
@using System.Net.Http.Json
@using Microsoft.AspNetCore.Components.Forms
@using Microsoft.AspNetCore.Components.Routing
@using Microsoft.AspNetCore.Components.Web
@using static Microsoft.AspNetCore.Components.Web.RenderMode
@using Microsoft.AspNetCore.Components.Web.Virtualization
@using Microsoft.JSInterop
@using {PROJECT_NAME}
@using {PROJECT_NAME}.Components
@using {PROJECT_NAME}.Components.Layout
`,
      'Components/Layout/MainLayout.razor':
`@inherits LayoutComponentBase

<div class="page">
    <main>
        <div class="top-row px-4">
            <a href="https://learn.microsoft.com/aspnet/core/" target="_blank">About</a>
        </div>
        <article class="content px-4">
            @Body
        </article>
    </main>
</div>
`,
      'Components/Pages/Home.razor':
`@page "/"

<PageTitle>{PROJECT_NAME}</PageTitle>

<h1>Bienvenido a {PROJECT_NAME}</h1>

<p>Contador: @count</p>
<button @onclick="Increment">Incrementar</button>

@code {
    private int count = 0;
    private void Increment() => count++;
}
`,
      'wwwroot/app.css':
`html, body {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.page {
    position: relative;
    display: flex;
    flex-direction: column;
}

main { flex: 1; }

.top-row {
    background-color: #f7f7f7;
    border-bottom: 1px solid #d6d5d5;
    height: 3.5rem;
    display: flex;
    align-items: center;
}

.content { padding-top: 1.1rem; }
`,
      'Program.cs':
`var builder = WebApplication.CreateBuilder(args);
builder.Services.AddRazorComponents().AddInteractiveServerComponents();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAntiforgery();
app.MapRazorComponents<{PROJECT_NAME}.Components.App>().AddInteractiveServerRenderMode();
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
      'Properties/launchSettings.json':
`{
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "applicationUrl": "http://localhost:5000",
      "environmentVariables": { "ASPNETCORE_ENVIRONMENT": "Development" }
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
</Project>
`,
    },
  },
};

module.exports = { CSHARP_FRAMEWORKS };
