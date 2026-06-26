using TabBuilderClean.Application.Interfaces;
using TabBuilderClean.Domain.Entities;

namespace TabBuilderClean.Infrastructure.Services;

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
