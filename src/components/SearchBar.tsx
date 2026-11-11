import { type FormEvent, useId, useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const [city, setCity] = useState('');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const inputId = useId();
  const validationId = useId();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedCity = city.trim();
    if (disabled) return;
    if (trimmedCity.length === 0) {
      setValidationMessage('Informe o nome de uma cidade para buscar.');
      return;
    }

    setValidationMessage(null);
    onSearch(trimmedCity);
  }

  return (
    <form
      role="search"
      aria-label="Buscar cidade"
      aria-busy={disabled}
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md sm:flex-row sm:items-end"
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <label htmlFor={inputId} className="text-sm font-medium text-white">
          Cidade
        </label>
        <input
          id={inputId}
          type="search"
          value={city}
          aria-invalid={validationMessage !== null}
          aria-describedby={validationMessage ? validationId : undefined}
          onChange={(event) => {
            setCity(event.target.value);
            if (event.target.value.trim().length > 0) setValidationMessage(null);
          }}
          placeholder="Digite o nome da cidade"
          disabled={disabled}
          className="min-h-11 w-full rounded-lg border border-white/10 bg-night-900/70 px-3 text-white outline-none placeholder:text-white/70 focus:border-accent-400 focus:ring-2 focus:ring-accent-400/40 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {validationMessage && (
          <p id={validationId} role="status" className="text-sm text-white">
            {validationMessage}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="min-h-11 rounded-lg bg-accent-500 px-5 font-semibold text-night-900 transition-colors hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Buscar
      </button>
    </form>
  );
}
