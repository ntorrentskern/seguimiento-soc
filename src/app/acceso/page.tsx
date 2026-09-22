import { login } from "@/app/acceso/actions";

export const metadata = { title: "Acceso" };

export default async function AccesoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; from?: string }>;
}) {
  const params = await searchParams;
  const error =
    params.error === "1"
      ? "Usuario o contraseña incorrectos."
      : params.error === "config"
        ? "El acceso no está configurado en el servidor."
        : null;

  return (
    <main className="grid min-h-full place-items-center px-5 py-16">
      <form action={login} className="w-full max-w-sm rounded-xl border border-line bg-raised px-6 py-7">
        <p className="text-xs font-medium tracking-[0.16em] text-accent uppercase">Kern Pharma</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Acceso del equipo</h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          El seguimiento del SOC solo se abre con un usuario del equipo.
        </p>
        <input type="hidden" name="from" value={params.from ?? "/"} />
        <label className="mt-6 block text-sm" htmlFor="username">
          Usuario
          <input
            id="username"
            name="username"
            autoComplete="username"
            required
            className="mt-1 w-full rounded-md border border-line bg-sunken px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </label>
        <label className="mt-4 block text-sm" htmlFor="password">
          Contraseña
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-1 w-full rounded-md border border-line bg-sunken px-3 py-2 text-foreground outline-none focus:border-accent"
          />
        </label>
        {error ? <p className="mt-4 text-sm text-bad">{error}</p> : null}
        <button
          type="submit"
          className="mt-6 w-full rounded-md bg-accent px-4 py-2 text-sm font-medium text-sunken"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
