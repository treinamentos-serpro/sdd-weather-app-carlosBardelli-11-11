import { useEffect, useRef, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { useWeather } from './hooks/useWeather';
import type { Unit } from './types/weather';

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const { status, data, cities, error, query, search, selectCity, retry } = useWeather();
  const mainContentRef = useRef<HTMLElement>(null);
  const previousStatusRef = useRef(status);

  useEffect(() => {
    if (previousStatusRef.current === 'loading' && status !== 'loading') {
      mainContentRef.current?.focus();
    }

    previousStatusRef.current = status;
  }, [status]);

  function isSelectedCity(cityLatitude: number, cityLongitude: number): boolean {
    return data?.city.latitude === cityLatitude && data.city.longitude === cityLongitude;
  }

  return (
    <div className="min-h-screen">
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-accent-500 px-4 py-3 font-semibold text-night-900 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>

      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <header className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-2xl backdrop-blur-md"
              >
                ⛅
              </span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold text-white sm:text-2xl">Tempo</h1>
                <p className="text-xs text-white/65 sm:text-sm">Dados de demonstração</p>
              </div>
            </div>
            <UnitToggle unit={unit} onChange={setUnit} />
          </div>

          <SearchBar onSearch={(name) => void search(name)} disabled={status === 'loading'} />
        </header>

        <main
          id="main-content"
          ref={mainContentRef}
          tabIndex={-1}
          aria-busy={status === 'loading'}
          className="mt-8 space-y-8 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-400 sm:mt-10"
        >
          {cities.length > 0 && (
            <section aria-labelledby="city-results-title" className="space-y-3">
              <h2 id="city-results-title" className="text-sm font-semibold text-white/75">
                Cidades encontradas
              </h2>
              <ul className="flex flex-wrap gap-2">
                {cities.map((city) => {
                  const location = [city.admin1, city.country]
                    .filter((part): part is string => part !== null)
                    .join(', ');

                  return (
                    <li key={`${city.id ?? 'city'}-${city.latitude}-${city.longitude}`}>
                      <button
                        type="button"
                        aria-label={location ? `${city.name}, ${location}` : city.name}
                        aria-pressed={isSelectedCity(city.latitude, city.longitude)}
                        disabled={status === 'loading'}
                        onClick={() => void selectCity(city)}
                        className="min-h-11 max-w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-left text-sm text-white transition-colors hover:bg-white/10 aria-pressed:border-accent-400/60 aria-pressed:bg-accent-500/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="block truncate font-medium">{city.name}</span>
                        {location && (
                          <span className="block truncate text-xs text-white/65">{location}</span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {status === 'success' && data ? (
            <>
              <CurrentWeather city={data.city} current={data.current} unit={unit} />
              <ForecastList forecast={data.forecast} unit={unit} />
            </>
          ) : status === 'loading' ? (
            <LoadingState />
          ) : status === 'error' ? (
            <ErrorState
              message={error ?? 'Falha ao carregar o clima.'}
              onRetry={() => void retry()}
            />
          ) : status === 'empty' ? (
            <EmptyState
              title="Nenhuma cidade encontrada"
              hint={
                query
                  ? `Nenhuma cidade corresponde a “${query}”. Confira o nome e tente novamente.`
                  : 'Informe o nome de uma cidade para iniciar a busca.'
              }
            />
          ) : (
            <EmptyState
              title="Consulte o clima da sua cidade"
              hint="Pesquise uma cidade para ver as condições atuais e a previsão para os próximos cinco dias."
            />
          )}
        </main>
      </div>
    </div>
  );
}
