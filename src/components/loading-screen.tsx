type LoadingScreenProps = {
  title?: string;
  description?: string;
};

export function LoadingScreen(_: LoadingScreenProps) {
  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center px-4 py-4"
    >
      <span className="sr-only">Carregando</span>
      <div
        aria-hidden="true"
        className="h-12 w-12 animate-spin rounded-full border-4 border-cobalt/20 border-t-cobalt motion-reduce:animate-none"
      />
    </main>
  );
}
