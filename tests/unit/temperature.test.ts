import { describe, expect, it } from 'vitest';
import {
  convertTemperature,
  formatTemperature,
  toFahrenheit,
  unitLabel,
} from '../../src/lib/temperature';

describe('toFahrenheit', () => {
  it.each([
    [0, 32],
    [100, 212],
    [-40, -40],
  ])('converte %s°C para %s°F', (celsius, fahrenheit) => {
    expect(toFahrenheit(celsius)).toBe(fahrenheit);
  });
});

describe('convertTemperature', () => {
  it('mantém Celsius e converte Fahrenheit conforme a unidade', () => {
    expect(convertTemperature(25, 'celsius')).toBe(25);
    expect(convertTemperature(25, 'fahrenheit')).toBe(77);
  });

  it('preserva valores indisponíveis', () => {
    expect(convertTemperature(null, 'fahrenheit')).toBeNull();
  });
});

describe('formatTemperature', () => {
  it('arredonda e inclui o símbolo da unidade selecionada', () => {
    expect(formatTemperature(21.6, 'celsius')).toBe('22°C');
    expect(formatTemperature(0, 'fahrenheit')).toBe('32°F');
    expect(formatTemperature(null, 'celsius')).toBe('Indisponível');
  });
});

describe('unitLabel', () => {
  it('retorna o símbolo correto para cada unidade', () => {
    expect(unitLabel('celsius')).toBe('°C');
    expect(unitLabel('fahrenheit')).toBe('°F');
  });
});
