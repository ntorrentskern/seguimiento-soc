"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-xl font-semibold">No se ha podido mostrar esta página</h1>
      <p className="mt-2 text-sm text-muted">Vuelve a intentarlo. Si acaba de cambiar la base de datos, recarga dentro de unos segundos.</p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-md bg-accent px-4 py-2 text-sm font-medium text-sunken"
      >
        Reintentar
      </button>
    </div>
  );
}
