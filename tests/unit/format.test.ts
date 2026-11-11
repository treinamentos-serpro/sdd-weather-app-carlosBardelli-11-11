import { describe, expect, it } from 'vitest';
import { formatDayLabel, getShortDate } from '../../src/lib/format';

describe('formatDayLabel', () => {
  it('usa Hoje e Amanhã para os dois primeiros índices', () => {
    expect(formatDayLabel('2026-11-11', 0)).toBe('Hoje');
    expect(formatDayLabel('2026-11-12', 1)).toBe('Amanhã');
  });

  it('usa o dia da semana para os demais índices', () => {
    expect(formatDayLabel('2026-11-13', 2)).toBe('Sex');
  });

  it('trata data inválida sem lançar exceção', () => {
    expect(formatDayLabel('2026-99-99', 2)).toBe('Data indisponível');
  });
});

describe('getShortDate', () => {
  it('formata dia e mês em português', () => {
    expect(getShortDate('2026-11-11')).toBe('11 de nov.');
  });
});
