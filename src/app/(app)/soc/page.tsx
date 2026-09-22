import type { Metadata } from "next";
import Link from "next/link";
import { AlertChart, RiskChart } from "@/components/charts";
import { MonthLink } from "@/components/records";
import { DataState, PageHeader, Section } from "@/components/ui";
import { loadSoc } from "@/db/queries";
import { formatInt, formatPct } from "@/lib/format";

export const metadata: Metadata = { title: "SOC" };

export default async function SocPage() {
  const soc = await loadSoc();

  return (
    <>
      <PageHeader title="SOC" />
      {soc.status !== "ok" ? (
        <DataState title={soc.status === "empty" ? "Sin informes" : "Sin conexión con la base de datos"} />
      ) : (
        <>
          <Section title="Alertas">
            <AlertChart
              points={[...soc.data].reverse().map((report) => ({
                label: report.label,
                escaladas: report.metrics.alertsEscalated,
                falsosPositivos: report.metrics.falsePositives,
                sinRespuesta: report.metrics.alertsUnanswered,
              }))}
            />
          </Section>
          <Section title="Riesgos y mejoras">
            <RiskChart
              points={[...soc.data].reverse().map((report) => ({
                label: report.label,
                riesgos: report.metrics.risksOpen,
                mejoras: report.metrics.improvementsOpen,
              }))}
            />
          </Section>
          <div className="mt-8 overflow-x-auto rounded-xl border border-line">
            <table className="w-full min-w-[860px] text-left text-sm">
              <caption className="sr-only">Evolución mensual del SOC</caption>
              <thead className="bg-sunken text-xs tracking-wide text-faint uppercase">
                <tr>
                  <th className="px-3 py-3 font-medium">Mes</th>
                  <th className="px-3 py-3 font-medium">Generadas</th>
                  <th className="px-3 py-3 font-medium">Escaladas</th>
                  <th className="px-3 py-3 font-medium">Falsos positivos</th>
                  <th className="px-3 py-3 font-medium">Sin respuesta</th>
                  <th className="px-3 py-3 font-medium">Riesgos</th>
                  <th className="px-3 py-3 font-medium">Mejoras</th>
                </tr>
              </thead>
              <tbody>
                {soc.data.map((report) => {
                  const fp = formatPct(report.metrics.falsePositives, report.metrics.alertsGenerated);
                  return (
                    <tr key={report.id} className="border-t border-line">
                      <td className="px-3 py-3">
                        <MonthLink id={report.id} label={report.label} />
                        <Link href={`/registrar?mes=${report.id}`} className="ml-3 text-accent">
                          Editar
                        </Link>
                      </td>
                      <td className="px-3 py-3 font-mono tabular-nums">{formatInt(report.metrics.alertsGenerated)}</td>
                      <td className="px-3 py-3 font-mono tabular-nums">{formatInt(report.metrics.alertsEscalated)}</td>
                      <td className="px-3 py-3 font-mono tabular-nums">
                        {formatInt(report.metrics.falsePositives)}
                        {fp ? <span className="ml-2 text-xs text-faint">{fp}</span> : null}
                      </td>
                      <td className="px-3 py-3 font-mono tabular-nums">{formatInt(report.metrics.alertsUnanswered)}</td>
                      <td className="px-3 py-3 font-mono tabular-nums">{formatInt(report.metrics.risksOpen)}</td>
                      <td className="px-3 py-3 font-mono tabular-nums">{formatInt(report.metrics.improvementsOpen)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
