"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Hook for Sentry/error_logs reporting.
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-content flex-col items-center justify-center px-4 text-center">
      <h1 className="font-display text-2xl font-semibold">Algo deu errado</h1>
      <p className="mt-2 text-muted">
        Tivemos um problema ao carregar esta página. Nada do que você fez foi perdido.
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Tentar novamente</Button>
      </div>
    </main>
  );
}
