export default function LoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-48 items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-6 text-white backdrop-blur-md"
    >
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-white/25 border-t-accent-400"
      />
      <p className="text-sm font-medium sm:text-base">Carregando previsão do tempo...</p>
    </div>
  );
}
