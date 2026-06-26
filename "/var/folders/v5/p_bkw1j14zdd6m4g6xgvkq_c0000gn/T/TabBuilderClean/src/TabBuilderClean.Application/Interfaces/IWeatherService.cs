using TabBuilderClean.Domain.Entities;

namespace TabBuilderClean.Application.Interfaces;

public interface IWeatherService
{
    IEnumerable<WeatherForecast> GetForecast();
}
