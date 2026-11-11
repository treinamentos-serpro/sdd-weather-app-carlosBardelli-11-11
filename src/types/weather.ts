export type Unit = 'celsius' | 'fahrenheit';

export interface City {
  id: number | null;
  name: string;
  country: string | null;
  countryCode: string | null;
  admin1: string | null;
  latitude: number;
  longitude: number;
  timezone: string | null;
}

export interface WeatherCondition {
  code: number | null;
  label: string;
}

export interface CurrentWeather {
  observedAt: string;
  temperatureC: number | null;
  condition: WeatherCondition;
  humidityPercent: number | null;
  windSpeedKmh: number | null;
  pressureHpa: number | null;
  precipitationMm: number | null;
}

export interface ForecastDay {
  date: string;
  minTemperatureC: number | null;
  maxTemperatureC: number | null;
  condition: WeatherCondition;
  precipitationMm: number | null;
  precipitationProbabilityPercent: number | null;
}

export interface WeatherData {
  city: City;
  current: CurrentWeather;
  forecast: ForecastDay[];
  fetchedAt: string;
}
