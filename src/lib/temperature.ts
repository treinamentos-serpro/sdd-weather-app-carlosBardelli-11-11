import type { Unit } from '../types/weather';

export function toFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function convertTemperature(value: number | null, unit: Unit): number | null {
  if (value === null || !Number.isFinite(value)) return null;

  return unit === 'fahrenheit' ? toFahrenheit(value) : value;
}

export function unitLabel(unit: Unit): string {
  return unit === 'fahrenheit' ? '°F' : '°C';
}

export function formatTemperature(value: number | null, unit: Unit): string {
  const temperature = convertTemperature(value, unit);
  if (temperature === null) return 'Indisponível';

  return `${Math.round(temperature)}${unitLabel(unit)}`;
}
