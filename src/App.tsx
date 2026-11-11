import { useEffect, useState } from 'react';
import CurrentWeather from './components/CurrentWeather';
import ForecastList from './components/ForecastList';
import SearchBar from './components/SearchBar';
import EmptyState from './components/states/EmptyState';
import ErrorState from './components/states/ErrorState';
import LoadingState from './components/states/LoadingState';
import UnitToggle from './components/UnitToggle';
import { mockWeatherData } from './mocks/weather';
import type { Unit, WeatherData } from './types/weather';

type WeatherState =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'success'; data: WeatherData }
  | { status: 'empty'; query: string }
  | { status: 'error'; query: string; message: string };

function normalizeCityName(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

export default function App() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const [weatherState, setWeatherState] = useState<WeatherState>({
    status: 'success',
    data: mockWeatherData,
  });

  useEffect(() => {
    if (weatherState.status !== 'loading') return;

    const { query } = weatherState;
    const timeoutId = window.setTimeout(() => {
      try {
        const isMockCity =
          normalizeCityName(query) === normalizeCityName(mockWeatherData.city.name);
        setWeatherState(
          isMockCity ? { status: 'success', data: mockWeatherData } : { status: 'empty', query },
        );
      } catch {
        setWeatherState({
          status: 'error',
          query,
          message: 'Ocorreu um erro inesperado. Tente novamente.',
        });
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [weatherState]);

  function handleSearch(query: string) {
    setWeatherState({ status: 'loading', query });
  }

  function handleRetry() {
    if (weatherState.status === 'error') handleSearch(weatherState.query);
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

          <SearchBar onSearch={handleSearch} disabled={weatherState.status === 'loading'} />
        </header>

        <main id="main-content" tabIndex={-1} className="mt-8 space-y-8 outline-none sm:mt-10">
          {weatherState.status === 'success' ? (
            <>
              <CurrentWeather
                city={weatherState.data.city}
                current={weatherState.data.current}
                unit={unit}
              />
              <ForecastList
                forecast={weatherState.data.forecast}
                unit={unit}
                timeZone={weatherState.data.city.timezone}
              />
            </>
          ) : weatherState.status === 'loading' ? (
            <LoadingState />
          ) : weatherState.status === 'error' ? (
            <ErrorState message={weatherState.message} onRetry={handleRetry} />
          ) : weatherState.status === 'empty' ? (
            <EmptyState
              title="Cidade não encontrada"
              hint={`Não há dados de demonstração para “${weatherState.query}”. Tente São Paulo.`}
            />
          ) : (
            <EmptyState
              title="Nenhuma cidade selecionada"
              hint="Informe uma cidade para consultar as condições do tempo."
            />
          )}
        </main>
      </div>
    </div>
  );
}
