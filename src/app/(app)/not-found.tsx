import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">No está este informe</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        El mes no existe o todavía no se ha cargado.
      </p>
      <Link href="/soc" className="mt-6 inline-block text-sm text-accent">
        Volver al SOC
      </Link>
    </div>
  );
}
