import { describe, expect, it } from 'vitest';
import { getWeatherCodeInfo, unknownWeatherCode } from '../../src/lib/weatherCodes';

describe('getWeatherCodeInfo', () => {
  it('retorna informação legível para código conhecido', () => {
    expect(getWeatherCodeInfo(0)).toEqual({ label: 'Céu limpo', icon: '☀️' });
  });

  it('usa fallback para código desconhecido ou ausente', () => {
    expect(getWeatherCodeInfo(999)).toEqual(unknownWeatherCode);
    expect(getWeatherCodeInfo(null)).toEqual(unknownWeatherCode);
  });
});
