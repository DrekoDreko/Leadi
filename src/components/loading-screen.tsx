type LoadingScreenProps = {
  title?: string;
  description?: string;
};

export function LoadingScreen({
  title = "Carregando",
  description = "Estamos preparando a proxima etapa."
}: LoadingScreenProps) {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center px-4 py-4"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <span className="sr-only">{title}</span>
        <div
          aria-hidden="true"
          className="h-12 w-12 animate-spin rounded-full border-4 border-cobalt/20 border-t-cobalt motion-reduce:animate-none"
        />
        <h1 className="mt-6 text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-ink/60">{description}</p>
      </div>
    </main>
  );
}
