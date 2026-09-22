import type { Metadata } from "next";
import { ActionList, FindingList } from "@/components/records";
import { DataState, KpiCard, PageHeader, Section } from "@/components/ui";
import { loadVigilancia } from "@/db/queries";
import { delta, formatDate, formatInt } from "@/lib/format";

export const metadata: Metadata = { title: "Vigilancia digital" };

export default async function VigilanciaPage() {
  const result = await loadVigilancia();
  const reports = result.status === "ok" ? result.data : null;
  const latest = reports?.[0] ?? null;
  const previous = reports?.[1] ?? null;

  return (
    <>
      <PageHeader title="Vigilancia digital" />
      {!latest ? (
        <DataState title={result.status === "empty" ? "Sin informes" : "Sin conexión con la base de datos"} />
      ) : (
        <>
          <p className="mb-2 text-xs text-faint">
            {formatDate(latest.periodStart)} – {formatDate(latest.periodEnd)}
          </p>
          <p className="mb-6 max-w-3xl text-base leading-7">{latest.headline}</p>
          {latest.context ? (
            <p className="mb-6 max-w-3xl text-sm leading-6 text-muted">{latest.context}</p>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Suplantaciones"
              value={formatInt(latest.metrics.impersonationAttempts)}
              delta={delta(latest.metrics.impersonationAttempts, previous?.metrics.impersonationAttempts ?? null)}
            />
            <KpiCard
              label="Dominios parecidos"
              value={formatInt(latest.metrics.lookalikeDomains)}
              delta={delta(latest.metrics.lookalikeDomains, previous?.metrics.lookalikeDomains ?? null)}
            />
            <KpiCard
              label="Takedowns cerrados"
              value={formatInt(latest.metrics.takedownsCompleted)}
              delta={delta(latest.metrics.takedownsCompleted, previous?.metrics.takedownsCompleted ?? null)}
              higherIsBetter
            />
            <KpiCard
              label="Credenciales filtradas"
              value={formatInt(latest.metrics.credentialLeaks)}
              delta={delta(latest.metrics.credentialLeaks, previous?.metrics.credentialLeaks ?? null)}
            />
          </div>
          <Section title="Hallazgos">
            <FindingList items={latest.findings} />
          </Section>
          {latest.actions.length > 0 ? (
            <Section title="Acciones">
              <ActionList items={latest.actions} />
            </Section>
          ) : null}
          {reports && reports.length > 1 ? (
            <Section title="Meses anteriores">
              <ul className="space-y-2 text-sm">
                {reports.slice(1).map((report) => (
                  <li key={report.id} className="text-muted">
                    <span className="text-foreground">{report.label}.</span> {report.headline}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </>
      )}
    </>
  );
}
