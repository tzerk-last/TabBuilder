// @ts-check
'use strict';

/** @type {import('../../types').FrameworkTemplate} */
const BLAZOR = {
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
  };

module.exports = { BLAZOR };
