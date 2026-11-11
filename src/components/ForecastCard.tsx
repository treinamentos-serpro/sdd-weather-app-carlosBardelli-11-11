import { formatDayLabel } from '../lib/format';
import { formatTemperature } from '../lib/temperature';
import { getWeatherCodeInfo } from '../lib/weatherCodes';
import type { ForecastDay, Unit } from '../types/weather';

interface ForecastCardProps {
  day: ForecastDay;
  dayIndex: number;
  unit: Unit;
}

function formatProbability(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return 'Indisponível';

  return `${new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(value)}%`;
}

export default function ForecastCard({ day, dayIndex, unit }: ForecastCardProps) {
  const weatherInfo = getWeatherCodeInfo(day.condition.code);
  const conditionLabel = day.condition.label || weatherInfo.label;

  return (
    <article className="h-full min-w-0 rounded-xl border border-white/10 bg-white/5 p-3 text-white shadow-glass backdrop-blur-md sm:p-4">
      <header className="flex min-w-0 items-center justify-between gap-2">
        <h3 className="min-w-0 text-sm font-semibold capitalize sm:text-base">
          <time dateTime={day.date}>{formatDayLabel(day.date, dayIndex)}</time>
        </h3>
        <span aria-hidden="true" className="shrink-0 text-2xl leading-none">
          {weatherInfo.icon}
        </span>
      </header>

      <p className="mt-3 min-h-9 text-xs leading-5 text-white/75 sm:text-sm">{conditionLabel}</p>

      <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
        <div className="min-w-0">
          <dt className="text-xs text-white/65">Máx.</dt>
          <dd className="mt-1 break-words text-sm font-semibold tabular-nums sm:text-base">
            {formatTemperature(day.maxTemperatureC, unit)}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-xs text-white/65">Mín.</dt>
          <dd className="mt-1 break-words text-sm font-semibold tabular-nums sm:text-base">
            {formatTemperature(day.minTemperatureC, unit)}
          </dd>
        </div>
      </dl>

      <p className="mt-4 flex min-w-0 flex-col gap-1 border-t border-white/10 pt-3 text-xs sm:text-sm">
        <span className="text-white/65">Chance de chuva</span>
        <span className="font-semibold tabular-nums">
          {formatProbability(day.precipitationProbabilityPercent)}
        </span>
      </p>
    </article>
  );
}
