import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastList from '../../../src/components/ForecastList';
import { mockWeatherData } from '../../../src/mocks/weather';

describe('ForecastList', () => {
  it('renderiza cinco dias, rótulos, temperaturas convertidas e chance de chuva', () => {
    render(<ForecastList forecast={mockWeatherData.forecast} unit="fahrenheit" />);

    expect(screen.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeInTheDocument();
    const days = within(screen.getByRole('list')).getAllByRole('listitem');
    expect(days).toHaveLength(5);
    expect(within(days[0]).getByText('Hoje')).toBeInTheDocument();
    expect(within(days[1]).getByText('Amanhã')).toBeInTheDocument();
    expect(within(days[0]).getByText('81°F')).toBeInTheDocument();
    expect(within(days[0]).getByText('65°F')).toBeInTheDocument();
    expect(within(days[0]).getByText('10%')).toBeInTheDocument();
  });

  it('não apresenta uma lista menor que cinco dias como completa', () => {
    render(<ForecastList forecast={mockWeatherData.forecast.slice(0, 4)} unit="celsius" />);

    expect(screen.getByRole('heading', { name: 'Previsão incompleta' })).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('mostra campos ausentes como indisponíveis sem expor NaN ou undefined', () => {
    const forecast = mockWeatherData.forecast.map((day, index) =>
      index === 0
        ? {
            ...day,
            condition: { code: null, label: '' },
            minTemperatureC: null,
            maxTemperatureC: null,
            precipitationMm: null,
            precipitationProbabilityPercent: null,
          }
        : day,
    );
    const { container } = render(<ForecastList forecast={forecast} unit="celsius" />);
    const firstDay = within(screen.getByRole('list').firstElementChild as HTMLElement);

    expect(firstDay.getAllByText('Indisponível')).toHaveLength(3);
    expect(container.textContent).not.toMatch(/NaN|undefined/);
    expect(firstDay.getByText('Condição desconhecida')).toBeInTheDocument();
  });
});
