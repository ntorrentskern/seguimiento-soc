import { formatDelta } from "@/lib/format";

export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-8">
      {eyebrow ? (
        <p className="mb-2 text-xs font-medium tracking-[0.16em] text-accent uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-semibold tracking-tight text-balance">{title}</h1>
      {description ? (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p>
      ) : null}
    </header>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  delta,
  higherIsBetter = false,
}: {
  label: string;
  value: string;
  hint?: string | null;
  delta?: number | null;
  higherIsBetter?: boolean;
}) {
  const deltaText = formatDelta(delta ?? null);
  const tone =
    delta == null || delta === 0
      ? "text-faint"
      : delta > 0 === higherIsBetter
        ? "text-good"
        : "text-bad";

  return (
    <article className="rounded-xl border border-line bg-raised px-4 py-4">
      <p className="text-xs tracking-wide text-faint uppercase">{label}</p>
      <p className="mt-2 font-mono text-3xl font-medium tracking-tight tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      {deltaText ? <p className={`mt-2 text-xs ${tone}`}>{deltaText}</p> : null}
    </article>
  );
}

export function DataState({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-dashed border-line bg-raised/50 px-5 py-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {children ? <div className="mt-2 max-w-3xl text-sm leading-6 text-muted">{children}</div> : null}
    </section>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-sm font-medium tracking-[0.14em] text-faint uppercase">{title}</h2>
      {children}
    </section>
  );
}
