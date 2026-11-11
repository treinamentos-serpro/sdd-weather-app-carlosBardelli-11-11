import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../../src/components/SearchBar';

describe('SearchBar', () => {
  it('não chama onSearch quando o input está vazio', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).not.toHaveBeenCalled();
  });

  it('orienta quando o campo contém apenas espaços', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByLabelText('Cidade'), '   ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Informe o nome de uma cidade');
    expect(screen.getByLabelText('Cidade')).toHaveAttribute('aria-invalid', 'true');
  });

  it('envia o termo aparado ao submeter a busca', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByLabelText('Cidade'), '  São Paulo  ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledWith('São Paulo');
  });
});
