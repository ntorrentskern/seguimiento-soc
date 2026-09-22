import type { Metadata } from "next";
import { RiskChart } from "@/components/charts";
import { PortfolioTable } from "@/components/records";
import { DataState, KpiCard, PageHeader, Section } from "@/components/ui";
import { loadSoc } from "@/db/queries";
import { formatInt } from "@/lib/format";

export const metadata: Metadata = { title: "Riesgos y mejoras" };

export default async function RiesgosPage() {
  const soc = await loadSoc();
  const reports = soc.status === "ok" ? soc.data : null;
  const latest = reports?.[0] ?? null;
  const risks = latest?.portfolio.filter((item) => item.kind === "risk") ?? [];
  const improvements = latest?.portfolio.filter((item) => item.kind === "improvement") ?? [];

  return (
    <>
      <PageHeader title="Riesgos y mejoras" />
      {!latest || !reports ? (
        <DataState title={soc.status === "empty" ? "Sin informes" : "Sin conexión con la base de datos"} />
      ) : (
        <>
          <p className="mb-6 text-sm text-faint">{latest.label}</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Riesgos abiertos" value={formatInt(latest.metrics.risksOpen)} />
            <KpiCard label="Críticos" value={formatInt(latest.metrics.risksCritical)} />
            <KpiCard label="Muy altos" value={formatInt(latest.metrics.risksVeryHigh)} />
            <KpiCard label="Mejoras abiertas" value={formatInt(latest.metrics.improvementsOpen)} />
          </div>

          <Section title="Evolución">
            <RiskChart
              points={[...reports].reverse().map((report) => ({
                label: report.label,
                riesgos: report.metrics.risksOpen,
                mejoras: report.metrics.improvementsOpen,
              }))}
            />
          </Section>

          <div className="mt-8 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Riesgos y mejoras por mes</caption>
              <thead className="bg-sunken text-xs tracking-wide text-faint uppercase">
                <tr>
                  <th className="px-3 py-3 font-medium">Mes</th>
                  <th className="px-3 py-3 font-medium">Riesgos</th>
                  <th className="px-3 py-3 font-medium">Críticos</th>
                  <th className="px-3 py-3 font-medium">Muy altos</th>
                  <th className="px-3 py-3 font-medium">Mejoras</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} className="border-t border-line">
                    <td className="px-3 py-3">{report.label}</td>
                    <td className="px-3 py-3 font-mono tabular-nums">{formatInt(report.metrics.risksOpen)}</td>
                    <td className="px-3 py-3 font-mono tabular-nums">{formatInt(report.metrics.risksCritical)}</td>
                    <td className="px-3 py-3 font-mono tabular-nums">{formatInt(report.metrics.risksVeryHigh)}</td>
                    <td className="px-3 py-3 font-mono tabular-nums">{formatInt(report.metrics.improvementsOpen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {risks.length > 0 ? (
            <Section title="Riesgos">
              <PortfolioTable items={risks} />
            </Section>
          ) : null}
          {improvements.length > 0 ? (
            <Section title="Mejoras">
              <PortfolioTable items={improvements} />
            </Section>
          ) : null}
        </>
      )}
    </>
  );
}
