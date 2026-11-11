import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../../src/components/CurrentWeather';
import UnitToggle from '../../../src/components/UnitToggle';
import { mockWeatherData } from '../../../src/mocks/weather';
import type { Unit } from '../../../src/types/weather';

function TemperatureExample() {
  const [unit, setUnit] = useState<Unit>('celsius');
  const current = { ...mockWeatherData.current, temperatureC: 0 };

  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <CurrentWeather city={mockWeatherData.city} current={current} unit={unit} />
    </>
  );
}

describe('conversão exibida em componentes', () => {
  it('atualiza CurrentWeather para 32°F ao selecionar Fahrenheit', async () => {
    const user = userEvent.setup();
    render(<TemperatureExample />);

    expect(screen.getByText('0°C')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));

    expect(screen.getByText('32°F')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('permite navegação por setas, Home e End', async () => {
    const user = userEvent.setup();
    render(<TemperatureExample />);
    const celsiusButton = screen.getByRole('button', { name: 'Celsius' });
    const fahrenheitButton = screen.getByRole('button', { name: 'Fahrenheit' });

    celsiusButton.focus();
    await user.keyboard('{ArrowRight}');
    expect(fahrenheitButton).toHaveFocus();
    expect(fahrenheitButton).toHaveAttribute('aria-pressed', 'true');

    await user.keyboard('{Home}');
    expect(celsiusButton).toHaveFocus();
    expect(celsiusButton).toHaveAttribute('aria-pressed', 'true');

    await user.keyboard('{End}');
    expect(fahrenheitButton).toHaveFocus();
    expect(fahrenheitButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('renderiza campos meteorológicos ausentes sem NaN ou undefined', () => {
    const partialCurrent = {
      ...mockWeatherData.current,
      temperatureC: null,
      condition: { code: null, label: '' },
      humidityPercent: null,
      windSpeedKmh: null,
      pressureHpa: null,
      precipitationMm: null,
    };

    const { container } = render(
      <CurrentWeather city={mockWeatherData.city} current={partialCurrent} unit="celsius" />,
    );

    expect(screen.getAllByText('Indisponível')).toHaveLength(5);
    expect(container.textContent).not.toMatch(/NaN|undefined/);
    expect(screen.getByText('Condição desconhecida')).toBeInTheDocument();
  });
});
