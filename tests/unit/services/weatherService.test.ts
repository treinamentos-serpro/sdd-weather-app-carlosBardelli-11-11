import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchWithTimeout,
  getWeather,
  searchCities,
  WeatherServiceError,
} from '../../../src/services/weatherService';
import type { City } from '../../../src/types/weather';

const city: City = {
  id: 1,
  name: 'São Paulo',
  country: 'Brasil',
  countryCode: 'BR',
  admin1: 'São Paulo',
  latitude: -23.55,
  longitude: -46.63,
  timezone: 'America/Sao_Paulo',
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function forecastPayload() {
  return {
    timezone: 'America/Sao_Paulo',
    current: {
      time: '2026-11-11T12:00',
      temperature_2m: 24.3,
      relative_humidity_2m: 61,
      precipitation: 0,
      weather_code: 2,
      wind_speed_10m: 12.4,
      surface_pressure: 1012.8,
    },
    daily: {
      time: ['2026-11-11', '2026-11-12', '2026-11-13', '2026-11-14', '2026-11-15'],
      temperature_2m_min: [18.2, 18, 17.6, 17.1, 18.1],
      temperature_2m_max: [27.1, 26.4, 25.8, 24.9, 26],
      weather_code: [2, 3, 61, 2, 1],
      precipitation_sum: [0, 0, 4.2, 0, 0],
      precipitation_probability_max: [10, 15, 75, 5, 5],
    },
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('searchCities', () => {
  it('retorna lista vazia para entrada em branco sem consultar a rede', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities('  \n')).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('codifica o nome e normaliza os campos do geocoding', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        results: [
          {
            id: 1,
            name: 'São Paulo',
            country: 'Brasil',
            country_code: 'BR',
            admin1: 'São Paulo',
            latitude: -23.55,
            longitude: -46.63,
            timezone: 'America/Sao_Paulo',
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(searchCities(' São Paulo & Rio ')).resolves.toEqual([city]);
    expect(String(fetchMock.mock.calls[0][0])).toContain('name=S%C3%A3o%20Paulo%20%26%20Rio');
    expect(String(fetchMock.mock.calls[0][0])).toContain('count=5&language=pt');
  });

  it('retorna lista vazia quando results está ausente', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({})));

    await expect(searchCities('Cidade inexistente')).resolves.toEqual([]);
  });

  it('converte resposta HTTP não-ok em WeatherServiceError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));

    await expect(searchCities('São Paulo')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Não foi possível buscar cidades. Tente novamente.',
    });
  });

  it('não confunde um payload malformado com uma busca sem resultados', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(null)));

    await expect(searchCities('São Paulo')).rejects.toBeInstanceOf(WeatherServiceError);
  });

  it('converte falha de rede para a mensagem definida pelo serviço', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('network')));

    await expect(searchCities('São Paulo')).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Falha de rede.',
    });
  });
});

describe('fetchWithTimeout', () => {
  it('converte AbortError em timeout e limpa o timer', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_input: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () => {
              reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
            });
          }),
      ),
    );

    const request = fetchWithTimeout('https://example.test');
    const rejection = expect(request).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'A requisição demorou demais.',
    });
    await vi.advanceTimersByTimeAsync(10_000);

    await rejection;
    expect(vi.getTimerCount()).toBe(0);
  });

  it('limpa o timer quando o fetch responde antes do timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ok')));

    await expect(fetchWithTimeout('https://example.test')).resolves.toBeInstanceOf(Response);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('mantém o timeout ativo durante o processamento do body', async () => {
    vi.useFakeTimers();
    const handleResponse = vi.fn(() => new Promise<Response>(() => undefined));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('headers received')));

    const request = fetchWithTimeout('https://example.test', { timeoutMs: 100 }, handleResponse);
    const rejection = expect(request).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'A requisição demorou demais.',
    });
    await Promise.resolve();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(100);

    await rejection;
    expect(handleResponse).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('getWeather', () => {
  it('envia os parâmetros esperados e associa arrays paralelos por índice', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(forecastPayload()));
    vi.stubGlobal('fetch', fetchMock);

    const weather = await getWeather(city);
    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));

    expect(requestUrl.origin + requestUrl.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(requestUrl.searchParams.get('latitude')).toBe('-23.55');
    expect(requestUrl.searchParams.get('forecast_days')).toBe('5');
    expect(requestUrl.searchParams.get('timezone')).toBe('auto');
    expect(requestUrl.searchParams.get('current')).toContain('surface_pressure');
    expect(requestUrl.searchParams.get('daily')).toContain('precipitation_probability_max');
    expect(weather.current.temperatureC).toBe(24.3);
    expect(weather.current.condition.label).toBe('Parcialmente nublado');
    expect(weather.forecast).toHaveLength(5);
    expect(weather.forecast[2]).toMatchObject({
      date: '2026-11-13',
      minTemperatureC: 17.6,
      maxTemperatureC: 25.8,
      precipitationMm: 4.2,
      precipitationProbabilityPercent: 75,
    });
    expect(weather.city.timezone).toBe('America/Sao_Paulo');
  });

  it('rejeita payload sem current ou daily e previsão com menos de cinco dias', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    fetchMock.mockResolvedValueOnce(jsonResponse({ daily: {} }));
    await expect(getWeather(city)).rejects.toThrow('clima atual ou previsão ausente');

    fetchMock.mockResolvedValueOnce(jsonResponse({ current: { time: '2026-11-11T12:00' } }));
    await expect(getWeather(city)).rejects.toThrow('clima atual ou previsão ausente');

    const incompletePayload = forecastPayload();
    incompletePayload.daily.time = incompletePayload.daily.time.slice(0, 4);
    fetchMock.mockResolvedValueOnce(jsonResponse(incompletePayload));
    await expect(getWeather(city)).rejects.toThrow('cinco dias de previsão');
  });

  it('normaliza precipitação explicitamente nula como zero e mantém campos ausentes como null', async () => {
    const completePayload = forecastPayload();
    const payload = {
      ...completePayload,
      current: {
        ...completePayload.current,
        time: undefined,
        precipitation: null,
        relative_humidity_2m: undefined,
      },
      daily: {
        ...completePayload.daily,
        precipitation_sum: [0, 0, null, 0, 0],
        precipitation_probability_max: undefined,
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(payload)));

    const weather = await getWeather(city);

    expect(weather.current.precipitationMm).toBe(0);
    expect(weather.current.observedAt).toBeNull();
    expect(weather.current.humidityPercent).toBeNull();
    expect(weather.forecast[2].precipitationMm).toBe(0);
    expect(weather.forecast[0].precipitationProbabilityPercent).toBeNull();
  });

  it('converte resposta HTTP não-ok do forecast em WeatherServiceError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));

    await expect(getWeather(city)).rejects.toMatchObject({
      name: 'WeatherServiceError',
      message: 'Não foi possível buscar o clima. Tente novamente.',
    });
  });
});
