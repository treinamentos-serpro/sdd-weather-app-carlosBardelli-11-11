import type { ForecastDay, Unit } from '../types/weather';
import ForecastCard from './ForecastCard';
import EmptyState from './states/EmptyState';

interface ForecastListProps {
  forecast: ForecastDay[];
  unit: Unit;
}

export default function ForecastList({ forecast, unit }: ForecastListProps) {
  const hasCompleteForecast = forecast.length === 5;

  return (
    <section aria-labelledby="forecast-title" className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="forecast-title" className="text-xl font-semibold text-white sm:text-2xl">
          Previsão de 5 dias
        </h2>
        {hasCompleteForecast && <p className="text-sm text-white/65">5 dias</p>}
      </div>

      {hasCompleteForecast ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {forecast.map((day, index) => (
            <li key={day.date} className="min-w-0">
              <ForecastCard day={day} dayIndex={index} unit={unit} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Previsão incompleta"
          hint="Os dados disponíveis ainda não cobrem cinco dias. Tente novamente mais tarde."
        />
      )}
    </section>
  );
}
