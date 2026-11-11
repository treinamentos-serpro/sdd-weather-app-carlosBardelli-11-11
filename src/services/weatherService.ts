import { getWeatherCodeInfo } from '../lib/weatherCodes';
import type { City, CurrentWeather, ForecastDay, WeatherData } from '../types/weather';

const GEOCODING_ENDPOINT = 'https://geocoding-api.open-meteo.com/v1/search';
const FORECAST_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';
const REQUEST_TIMEOUT_MS = 10_000;

export class WeatherServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WeatherServiceError';
  }
}

interface FetchOptions extends RequestInit {
  timeoutMs?: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nullableNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function nullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function precipitationValue(record: Record<string, unknown>, key: string): number | null {
  if (!(key in record)) return null;
  if (record[key] === null) return 0;

  return nullableNumber(record[key]);
}

function isAbortError(error: unknown): boolean {
  return isRecord(error) && error.name === 'AbortError';
}

export function fetchWithTimeout(
  input: RequestInfo | URL,
  options?: FetchOptions,
): Promise<Response>;
export function fetchWithTimeout<T>(
  input: RequestInfo | URL,
  options: FetchOptions,
  handleResponse: (response: Response) => Promise<T>,
): Promise<T>;
export async function fetchWithTimeout<T = never>(
  input: RequestInfo | URL,
  { timeoutMs = REQUEST_TIMEOUT_MS, ...init }: FetchOptions = {},
  handleResponse?: (response: Response) => Promise<T>,
): Promise<Response | T> {
  const controller = new AbortController();
  let rejectTimeout: (reason?: unknown) => void = () => undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    rejectTimeout = reject;
  });
  const timeoutId = setTimeout(() => {
    controller.abort();
    rejectTimeout(new WeatherServiceError('A requisição demorou demais.'));
  }, timeoutMs);

  try {
    const request = (async () => {
      const response = await fetch(input, { ...init, signal: controller.signal });
      return handleResponse ? handleResponse(response) : response;
    })();

    return await Promise.race([request, timeoutPromise]);
  } catch (error) {
    if (error instanceof WeatherServiceError) throw error;
    if (isAbortError(error)) {
      throw new WeatherServiceError('A requisição demorou demais.');
    }

    throw new WeatherServiceError('Falha de rede.');
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return (await response.json()) as unknown;
  } catch {
    throw new WeatherServiceError('Resposta inválida da Open-Meteo.');
  }
}

function mapCity(value: unknown): City {
  if (!isRecord(value)) throw new WeatherServiceError('Resultado de cidade inválido.');

  const name = nullableString(value.name);
  const latitude = nullableNumber(value.latitude);
  const longitude = nullableNumber(value.longitude);

  if (name === null || latitude === null || longitude === null) {
    throw new WeatherServiceError('Resultado de cidade incompleto.');
  }

  return {
    id: nullableNumber(value.id),
    name,
    country: nullableString(value.country),
    countryCode: nullableString(value.country_code),
    admin1: nullableString(value.admin1),
    latitude,
    longitude,
    timezone: nullableString(value.timezone),
  };
}

function requireNumberArray(record: Record<string, unknown>, key: string): unknown[] | null {
  const value = record[key];
  return Array.isArray(value) ? value : null;
}

function numberAt(values: unknown[] | null, index: number): number | null {
  return values === null ? null : nullableNumber(values[index]);
}

export async function searchCities(name: string): Promise<City[]> {
  const trimmedName = name.trim();
  if (trimmedName.length === 0) return [];

  const url = `${GEOCODING_ENDPOINT}?name=${encodeURIComponent(trimmedName)}&count=5&language=pt&format=json`;
  return fetchWithTimeout(url, {}, async (response) => {
    if (!response.ok) {
      throw new WeatherServiceError('Não foi possível buscar cidades. Tente novamente.');
    }

    const payload = await readJson(response);
    if (!isRecord(payload)) throw new WeatherServiceError('Resposta de geocoding inválida.');
    if (payload.results === undefined || payload.results === null) return [];
    if (!Array.isArray(payload.results)) {
      throw new WeatherServiceError('Resposta de geocoding inválida.');
    }

    return payload.results.map(mapCity);
  });
}

export async function getWeather(city: City): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: String(city.latitude),
    longitude: String(city.longitude),
    current:
      'temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,surface_pressure',
    daily:
      'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,precipitation_probability_max',
    forecast_days: '5',
    timezone: 'auto',
    temperature_unit: 'celsius',
    wind_speed_unit: 'kmh',
    precipitation_unit: 'mm',
  });
  return fetchWithTimeout(`${FORECAST_ENDPOINT}?${params.toString()}`, {}, async (response) => {
    if (!response.ok) {
      throw new WeatherServiceError('Não foi possível buscar o clima. Tente novamente.');
    }

    const payload = await readJson(response);
    if (!isRecord(payload) || !isRecord(payload.current) || !isRecord(payload.daily)) {
      throw new WeatherServiceError('Resposta incompleta: clima atual ou previsão ausente.');
    }

    const currentTime = nullableString(payload.current.time);
    const currentCode = nullableNumber(payload.current.weather_code);
    const dailyTimes = payload.daily.time;

    if (
      !Array.isArray(dailyTimes) ||
      dailyTimes.length < 5 ||
      !dailyTimes.slice(0, 5).every((date) => typeof date === 'string')
    ) {
      throw new WeatherServiceError('Resposta incompleta: são necessários cinco dias de previsão.');
    }

    const current: CurrentWeather = {
      observedAt: currentTime,
      temperatureC: nullableNumber(payload.current.temperature_2m),
      condition: {
        code: currentCode,
        label: getWeatherCodeInfo(currentCode).label,
      },
      humidityPercent: nullableNumber(payload.current.relative_humidity_2m),
      windSpeedKmh: nullableNumber(payload.current.wind_speed_10m),
      pressureHpa: nullableNumber(payload.current.surface_pressure),
      precipitationMm: precipitationValue(payload.current, 'precipitation'),
    };

    const dailyArrays = {
      min: requireNumberArray(payload.daily, 'temperature_2m_min'),
      max: requireNumberArray(payload.daily, 'temperature_2m_max'),
      code: requireNumberArray(payload.daily, 'weather_code'),
      precipitation: requireNumberArray(payload.daily, 'precipitation_sum'),
      probability: requireNumberArray(payload.daily, 'precipitation_probability_max'),
    };

    const forecast: ForecastDay[] = dailyTimes.slice(0, 5).map((date, index) => {
      const code = numberAt(dailyArrays.code, index);

      return {
        date: date as string,
        minTemperatureC: numberAt(dailyArrays.min, index),
        maxTemperatureC: numberAt(dailyArrays.max, index),
        condition: {
          code,
          label: getWeatherCodeInfo(code).label,
        },
        precipitationMm:
          dailyArrays.precipitation === null || dailyArrays.precipitation[index] === undefined
            ? null
            : dailyArrays.precipitation[index] === null
              ? 0
              : numberAt(dailyArrays.precipitation, index),
        precipitationProbabilityPercent: numberAt(dailyArrays.probability, index),
      };
    });

    return {
      city: {
        ...city,
        timezone: nullableString(payload.timezone) ?? city.timezone,
      },
      current,
      forecast,
      fetchedAt: new Date().toISOString(),
    };
  });
}
