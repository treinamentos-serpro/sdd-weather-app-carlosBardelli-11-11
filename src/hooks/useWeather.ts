import { useRef, useState } from 'react';
import { getWeather, searchCities, WeatherServiceError } from '../services/weatherService';
import type { City, WeatherData } from '../types/weather';

export type WeatherStatus = 'idle' | 'loading' | 'success' | 'error' | 'empty';

interface WeatherSnapshot {
  status: WeatherStatus;
  data: WeatherData | null;
  cities: City[];
  error: string | null;
  query: string;
}

type LastOperation = { type: 'search'; name: string } | { type: 'selectCity'; city: City };

export interface UseWeatherResult extends WeatherSnapshot {
  search: (name: string) => Promise<void>;
  selectCity: (city: City) => Promise<void>;
  retry: () => Promise<void>;
}

const initialSnapshot: WeatherSnapshot = {
  status: 'idle',
  data: null,
  cities: [],
  error: null,
  query: '',
};

function errorMessage(error: unknown): string {
  if (error instanceof WeatherServiceError) return error.message;
  return 'Ocorreu um erro inesperado. Tente novamente.';
}

export function useWeather(): UseWeatherResult {
  const [snapshot, setSnapshot] = useState<WeatherSnapshot>(initialSnapshot);
  const requestIdRef = useRef(0);
  const lastOperationRef = useRef<LastOperation | null>(null);

  async function search(name: string): Promise<void> {
    const trimmedName = name.trim();
    lastOperationRef.current = { type: 'search', name: trimmedName };
    const requestId = ++requestIdRef.current;

    setSnapshot({
      status: 'loading',
      data: null,
      cities: [],
      error: null,
      query: trimmedName,
    });

    try {
      const cities = await searchCities(trimmedName);
      if (requestId !== requestIdRef.current) return;

      if (cities.length === 0) {
        setSnapshot({ status: 'empty', data: null, cities: [], error: null, query: trimmedName });
        return;
      }

      setSnapshot((current) => ({ ...current, cities }));
      const data = await getWeather(cities[0]);
      if (requestId !== requestIdRef.current) return;

      setSnapshot({ status: 'success', data, cities, error: null, query: trimmedName });
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      setSnapshot((current) => ({
        ...current,
        status: 'error',
        data: null,
        error: errorMessage(error),
        query: trimmedName,
      }));
    }
  }

  async function selectCity(city: City): Promise<void> {
    lastOperationRef.current = { type: 'selectCity', city };
    const requestId = ++requestIdRef.current;

    setSnapshot((current) => ({
      ...current,
      status: 'loading',
      data: null,
      error: null,
      query: city.name,
    }));

    try {
      const data = await getWeather(city);
      if (requestId !== requestIdRef.current) return;

      setSnapshot((current) => ({
        ...current,
        status: 'success',
        data,
        error: null,
        query: city.name,
      }));
    } catch (error) {
      if (requestId !== requestIdRef.current) return;

      setSnapshot((current) => ({
        ...current,
        status: 'error',
        data: null,
        error: errorMessage(error),
        query: city.name,
      }));
    }
  }

  async function retry(): Promise<void> {
    const lastOperation = lastOperationRef.current;
    if (lastOperation === null) return;

    if (lastOperation.type === 'search') {
      await search(lastOperation.name);
    } else {
      await selectCity(lastOperation.city);
    }
  }

  return { ...snapshot, search, selectCity, retry };
}
