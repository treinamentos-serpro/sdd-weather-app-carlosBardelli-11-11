import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../../src/App';
import type { UseWeatherResult } from '../../../src/hooks/useWeather';
import { mockWeatherData } from '../../../src/mocks/weather';

const { useWeatherMock } = vi.hoisted(() => ({ useWeatherMock: vi.fn() }));

vi.mock('../../../src/hooks/useWeather', () => ({ useWeather: useWeatherMock }));

const actions = {
  search: vi.fn(async (_name: string) => undefined),
  selectCity: vi.fn(async () => undefined),
  retry: vi.fn(async () => undefined),
};

function weatherState(overrides: Partial<UseWeatherResult> = {}): UseWeatherResult {
  return {
    status: 'idle',
    data: null,
    cities: [],
    error: null,
    query: '',
    ...actions,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  useWeatherMock.mockReturnValue(weatherState());
});

describe('App', () => {
  it('renderiza o estado idle e encaminha a busca', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Consulte o clima da sua cidade' })).toBeVisible();
    await user.type(screen.getByLabelText('Cidade'), 'Lisboa');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(actions.search).toHaveBeenCalledWith('Lisboa');
  });

  it('exibe loading, empty e error com retry acessível', async () => {
    const user = userEvent.setup();

    useWeatherMock.mockReturnValue(weatherState({ status: 'loading' }));
    const { rerender } = render(<App />);
    expect(screen.getByRole('status')).toHaveTextContent('Carregando previsão do tempo');

    useWeatherMock.mockReturnValue(weatherState({ status: 'empty', query: 'Atlantis' }));
    rerender(<App />);
    expect(screen.getByRole('heading', { name: 'Nenhuma cidade encontrada' })).toBeVisible();

    useWeatherMock.mockReturnValue(
      weatherState({ status: 'error', error: 'Falha de rede.', query: 'Lisboa' }),
    );
    rerender(<App />);
    expect(screen.getByRole('alert')).toHaveTextContent('Falha de rede.');
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(actions.retry).toHaveBeenCalledOnce();
  });

  it('move o foco para o conteúdo quando a busca termina', () => {
    const { rerender } = render(<App />);

    useWeatherMock.mockReturnValue(weatherState({ status: 'loading' }));
    rerender(<App />);
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true');

    useWeatherMock.mockReturnValue(weatherState({ status: 'empty', query: 'Cidade desconhecida' }));
    rerender(<App />);

    expect(screen.getByRole('main')).toHaveFocus();
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false');
  });

  it('renderiza o clima e permite escolher outro resultado e trocar unidade', async () => {
    const user = userEvent.setup();
    const otherCity = {
      ...mockWeatherData.city,
      id: 2,
      name: 'São Paulo',
      admin1: 'Santa Catarina',
      latitude: -27.59,
    };
    useWeatherMock.mockReturnValue(
      weatherState({
        status: 'success',
        data: mockWeatherData,
        cities: [mockWeatherData.city, otherCity],
        query: mockWeatherData.city.name,
      }),
    );
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Previsão de 5 dias' })).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'São Paulo, Santa Catarina, Brasil' }));
    expect(actions.selectCity).toHaveBeenCalledWith(otherCity);

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));
    expect(screen.getByText('76°F')).toBeVisible();
  });
});
