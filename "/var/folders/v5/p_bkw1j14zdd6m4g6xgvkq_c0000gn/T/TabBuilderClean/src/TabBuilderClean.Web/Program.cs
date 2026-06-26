using TabBuilderClean.Application.Interfaces;
using TabBuilderClean.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddScoped<IWeatherService, WeatherService>();

var app = builder.Build();

app.MapGet("/", () => "TabBuilderClean — Clean Architecture (ASP.NET Core)");
app.MapGet("/weather", (IWeatherService service) => service.GetForecast());

app.Run();
