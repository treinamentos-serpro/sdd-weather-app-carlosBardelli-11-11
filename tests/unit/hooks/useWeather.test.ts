import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useWeather } from '../../../src/hooks/useWeather';
import { WeatherServiceError } from '../../../src/services/weatherService';
import type { City, WeatherData } from '../../../src/types/weather';

const { getWeatherMock, searchCitiesMock } = vi.hoisted(() => ({
  getWeatherMock: vi.fn(),
  searchCitiesMock: vi.fn(),
}));

vi.mock('../../../src/services/weatherService', () => ({
  getWeather: getWeatherMock,
  searchCities: searchCitiesMock,
  WeatherServiceError: class WeatherServiceError extends Error {},
}));

const firstCity: City = {
  id: 1,
  name: 'São Paulo',
  country: 'Brasil',
  countryCode: 'BR',
  admin1: 'São Paulo',
  latitude: -23.55,
  longitude: -46.63,
  timezone: 'America/Sao_Paulo',
};

const secondCity: City = {
  ...firstCity,
  id: 2,
  name: 'São Paulo',
  admin1: 'Santa Catarina',
  latitude: -27.59,
  longitude: -48.55,
};

const weatherData: WeatherData = {
  city: firstCity,
  current: {
    observedAt: '2026-11-11T12:00',
    temperatureC: 24,
    condition: { code: 2, label: 'Parcialmente nublado' },
    humidityPercent: 60,
    windSpeedKmh: 10,
    pressureHpa: 1012,
    precipitationMm: 0,
  },
  forecast: [],
  fetchedAt: '2026-11-11T12:00:00Z',
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('useWeather', () => {
  it('inicia em idle e carrega o clima da primeira cidade encontrada', async () => {
    searchCitiesMock.mockResolvedValue([firstCity, secondCity]);
    getWeatherMock.mockResolvedValue(weatherData);

    const { result } = renderHook(() => useWeather());

    expect(result.current.status).toBe('idle');
    await act(async () => result.current.search(' São Paulo '));

    expect(searchCitiesMock).toHaveBeenCalledWith('São Paulo');
    expect(getWeatherMock).toHaveBeenCalledWith(firstCity);
    expect(result.current.status).toBe('success');
    expect(result.current.cities).toEqual([firstCity, secondCity]);
    expect(result.current.data).toEqual(weatherData);
    expect(result.current.query).toBe('São Paulo');
  });

  it('expõe empty quando a busca não encontra cidades', async () => {
    searchCitiesMock.mockResolvedValue([]);
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search('Atlantis'));

    expect(result.current.status).toBe('empty');
    expect(result.current.data).toBeNull();
    expect(result.current.cities).toEqual([]);
    expect(getWeatherMock).not.toHaveBeenCalled();
  });

  it('ignora respostas de uma busca anterior que chega depois da mais recente', async () => {
    let resolveOldSearch: (cities: City[]) => void = () => undefined;
    const oldSearch = new Promise<City[]>((resolve) => {
      resolveOldSearch = resolve;
    });
    searchCitiesMock.mockImplementation((name: string) =>
      name === 'Antiga' ? oldSearch : Promise.resolve([secondCity]),
    );
    getWeatherMock.mockResolvedValue({ ...weatherData, city: secondCity });

    const { result } = renderHook(() => useWeather());
    let oldSearchPromise: Promise<void> = Promise.resolve();
    await act(async () => {
      oldSearchPromise = result.current.search('Antiga');
      await Promise.resolve();
    });
    await act(async () => result.current.search('Atual'));
    await act(async () => {
      resolveOldSearch([firstCity]);
      await oldSearchPromise;
    });

    expect(getWeatherMock).toHaveBeenCalledTimes(1);
    expect(getWeatherMock).toHaveBeenCalledWith(secondCity);
    expect(result.current.status).toBe('success');
    expect(result.current.data?.city).toEqual(secondCity);
  });

  it('mantém a cidade mais recente quando o forecast anterior termina por último', async () => {
    let resolveOldForecast: (data: WeatherData) => void = () => undefined;
    const oldForecast = new Promise<WeatherData>((resolve) => {
      resolveOldForecast = resolve;
    });
    getWeatherMock.mockImplementation((selectedCity: City) =>
      selectedCity.id === firstCity.id
        ? oldForecast
        : Promise.resolve({ ...weatherData, city: secondCity }),
    );

    const { result } = renderHook(() => useWeather());
    let oldSelection: Promise<void> = Promise.resolve();
    await act(async () => {
      oldSelection = result.current.selectCity(firstCity);
      await Promise.resolve();
    });
    await act(async () => result.current.selectCity(secondCity));
    await act(async () => {
      resolveOldForecast(weatherData);
      await oldSelection;
    });

    expect(result.current.status).toBe('success');
    expect(result.current.data?.city).toEqual(secondCity);
  });

  it('retry repete a busca original quando a consulta do clima falha', async () => {
    searchCitiesMock.mockResolvedValue([firstCity]);
    getWeatherMock.mockRejectedValueOnce(new WeatherServiceError('A requisição demorou demais.'));
    getWeatherMock.mockResolvedValueOnce(weatherData);
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search('São Paulo'));
    expect(result.current.status).toBe('error');

    await act(async () => result.current.retry());

    expect(searchCitiesMock).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('success');
    expect(result.current.data).toEqual(weatherData);
  });

  it('expõe erro de rede ao ficar offline e retry refaz a busca', async () => {
    searchCitiesMock
      .mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'))
      .mockResolvedValueOnce([firstCity]);
    getWeatherMock.mockResolvedValue(weatherData);
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search('São Paulo'));
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Falha de rede.');

    await act(async () => result.current.retry());

    expect(searchCitiesMock).toHaveBeenCalledTimes(2);
    expect(result.current.status).toBe('success');
  });

  it('mantém o erro e retry refaz a última seleção de cidade', async () => {
    getWeatherMock
      .mockRejectedValueOnce(new WeatherServiceError('Falha de rede.'))
      .mockResolvedValue(weatherData);
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.selectCity(secondCity));
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Falha de rede.');

    await act(async () => result.current.retry());

    expect(getWeatherMock).toHaveBeenNthCalledWith(2, secondCity);
    expect(result.current.status).toBe('success');
    await waitFor(() => expect(result.current.data).toEqual(weatherData));
  });

  it('não expõe mensagem técnica de um erro inesperado', async () => {
    searchCitiesMock.mockRejectedValueOnce(new Error('socket ECONNRESET at 10.0.0.1'));
    const { result } = renderHook(() => useWeather());

    await act(async () => result.current.search('São Paulo'));

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Ocorreu um erro inesperado. Tente novamente.');
  });
});
