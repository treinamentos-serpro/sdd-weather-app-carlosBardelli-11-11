import { type KeyboardEvent, useRef } from 'react';
import type { Unit } from '../types/weather';

interface UnitToggleProps {
  unit: Unit;
  onChange: (unit: Unit) => void;
}

export default function UnitToggle({ unit, onChange }: UnitToggleProps) {
  const celsiusButtonRef = useRef<HTMLButtonElement>(null);
  const fahrenheitButtonRef = useRef<HTMLButtonElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let nextUnit: Unit;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowRight':
        nextUnit = event.currentTarget === celsiusButtonRef.current ? 'fahrenheit' : 'celsius';
        break;
      case 'Home':
        nextUnit = 'celsius';
        break;
      case 'End':
        nextUnit = 'fahrenheit';
        break;
      default:
        return;
    }

    event.preventDefault();
    onChange(nextUnit);

    const nextButton =
      nextUnit === 'celsius' ? celsiusButtonRef.current : fahrenheitButtonRef.current;
    nextButton?.focus();
  }

  return (
    <div
      role="group"
      aria-label="Unidade de temperatura"
      className="inline-flex rounded-lg border border-white/10 bg-white/5 p-1 backdrop-blur-md"
    >
      <button
        ref={celsiusButtonRef}
        type="button"
        aria-label="Celsius"
        aria-pressed={unit === 'celsius'}
        onClick={() => onChange('celsius')}
        onKeyDown={handleKeyDown}
        className="min-h-10 min-w-12 rounded-md px-3 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white aria-pressed:bg-accent-500 aria-pressed:text-night-900 aria-pressed:hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        °C
      </button>
      <button
        ref={fahrenheitButtonRef}
        type="button"
        aria-label="Fahrenheit"
        aria-pressed={unit === 'fahrenheit'}
        onClick={() => onChange('fahrenheit')}
        onKeyDown={handleKeyDown}
        className="min-h-10 min-w-12 rounded-md px-3 text-sm font-semibold text-white/75 transition-colors hover:bg-white/10 hover:text-white aria-pressed:bg-accent-500 aria-pressed:text-night-900 aria-pressed:hover:bg-accent-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        °F
      </button>
    </div>
  );
}
