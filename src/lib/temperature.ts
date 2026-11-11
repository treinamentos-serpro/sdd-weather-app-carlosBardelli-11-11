import type { Unit } from '../types/weather';

export function toFahrenheit(celsius: number): number {
  return (celsius * 9) / 5 + 32;
}

export function formatTemperature(value: number | null, unit: Unit): string {
  if (value === null || !Number.isFinite(value)) return 'Indisponível';

  const temperature = unit === 'fahrenheit' ? toFahrenheit(value) : value;
  const roundedTemperature = Math.round(temperature);
  const unitSymbol = unit === 'fahrenheit' ? '°F' : '°C';

  return `${roundedTemperature}${unitSymbol}`;
}
