import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-content flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-6xl font-bold text-brand-500">404</p>
      <h1 className="mt-4 font-display text-2xl font-semibold">Página não encontrada</h1>
      <p className="mt-2 text-muted">O link pode estar quebrado ou a página foi movida.</p>
      <Link href="/" className="mt-6">
        <Button>Voltar ao início</Button>
      </Link>
    </main>
  );
}
