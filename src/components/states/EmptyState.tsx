interface EmptyStateProps {
  title: string;
  hint: string;
}

export default function EmptyState({ title, hint }: EmptyStateProps) {
  return (
    <section
      role="status"
      aria-live="polite"
      aria-labelledby="weather-empty-title"
      className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur-md sm:p-8"
    >
      <h2 id="weather-empty-title" className="text-lg font-semibold sm:text-xl">
        {title}
      </h2>
      <p className="mt-2 max-w-prose text-sm leading-6 text-white/75">{hint}</p>
    </section>
  );
}
