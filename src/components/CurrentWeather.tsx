import { formatTemperature } from '../lib/temperature';
import { getWeatherCodeInfo } from '../lib/weatherCodes';
import type { City, CurrentWeather as CurrentWeatherData, Unit } from '../types/weather';

interface CurrentWeatherProps {
  city: City;
  current: CurrentWeatherData;
  unit: Unit;
}

function formatMetric(value: number | null, unit: string, separator = ' '): string {
  if (value === null || !Number.isFinite(value)) return 'Indisponível';

  const formattedValue = new Intl.NumberFormat('pt-BR', {
    maximumFractionDigits: 1,
  }).format(value);

  return `${formattedValue}${separator}${unit}`;
}

export default function CurrentWeather({ city, current, unit }: CurrentWeatherProps) {
  const weatherInfo = getWeatherCodeInfo(current.condition.code);
  const locationDetails = [city.admin1, city.country]
    .filter((part): part is string => part !== null)
    .join(', ');

  return (
    <section
      aria-labelledby="current-weather-title"
      className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur-md sm:p-8"
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white/65">Clima atual</p>
          <h2 id="current-weather-title" className="mt-1 text-2xl font-semibold">
            {city.name}
          </h2>
          {locationDetails && <p className="mt-1 text-sm text-white/65">{locationDetails}</p>}
          <p className="mt-4 text-lg text-white/90">
            {current.condition.label || weatherInfo.label}
          </p>
        </div>

        <div className="flex items-center gap-4 sm:gap-5">
          <span aria-hidden="true" className="text-5xl leading-none sm:text-6xl">
            {weatherInfo.icon}
          </span>
          <p className="text-5xl font-semibold tabular-nums sm:text-6xl">
            {formatTemperature(current.temperatureC, unit)}
          </p>
        </div>
      </div>

      <dl className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-5 sm:grid-cols-4">
        <div>
          <dt className="text-sm text-white/65">Umidade</dt>
          <dd className="mt-1 text-lg font-medium">
            {formatMetric(current.humidityPercent, '%', '')}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-white/65">Vento</dt>
          <dd className="mt-1 text-lg font-medium">{formatMetric(current.windSpeedKmh, 'km/h')}</dd>
        </div>
        <div>
          <dt className="text-sm text-white/65">Precipitação</dt>
          <dd className="mt-1 text-lg font-medium">
            {formatMetric(current.precipitationMm, 'mm')}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-white/65">Pressão</dt>
          <dd className="mt-1 text-lg font-medium">{formatMetric(current.pressureHpa, 'hPa')}</dd>
        </div>
      </dl>
    </section>
  );
}
