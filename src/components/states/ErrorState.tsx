interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

export default function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <section
      role="alert"
      aria-labelledby="weather-error-title"
      className="rounded-2xl border border-rose-300/25 bg-rose-950/30 p-6 text-white backdrop-blur-md"
    >
      <h2 id="weather-error-title" className="text-lg font-semibold">
        Não foi possível consultar o clima
      </h2>
      <p className="mt-2 text-sm leading-6 text-white/80">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 min-h-11 rounded-lg border border-white/20 bg-white/10 px-4 font-semibold text-white transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-400"
      >
        Tentar novamente
      </button>
    </section>
  );
}
