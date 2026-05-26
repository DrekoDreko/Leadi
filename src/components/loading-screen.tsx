import { Component as LumaSpin } from "@/components/ui/luma-spin";

type LoadingScreenProps = {
  title?: string;
  description?: string;
};

export function LoadingScreen({
  title = "Carregando",
  description = "Estamos preparando a proxima etapa."
}: LoadingScreenProps) {
  const mainTitle = "Carregando";
  const hasCustomTitle = title && title !== "Carregando";

  return (
    <main
      aria-busy="true"
      aria-live="polite"
      className="flex min-h-screen items-center justify-center px-4 py-4"
    >
      <div className="flex max-w-sm flex-col items-center text-center">
        <span className="sr-only">{mainTitle}</span>
        
        {/* LumaSpin Component integrated using brand colors */}
        <div className="flex items-center justify-center p-4">
          <LumaSpin />
        </div>

        <h1 className="mt-6 text-2xl font-semibold text-ink tracking-tight">
          {mainTitle}
        </h1>
        
        <p className="mt-2 text-sm leading-6 text-ink/60">
          {hasCustomTitle && (
            <span className="block font-medium text-ink/80 mb-0.5">
              {title}
            </span>
          )}
          {description}
        </p>
      </div>
    </main>
  );
}

