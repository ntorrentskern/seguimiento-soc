import type { Metadata } from "next";
import { AlertChart, VulnChart } from "@/components/charts";
import { MonthLink } from "@/components/records";
import { DataState, PageHeader, Section } from "@/components/ui";
import { loadSoc } from "@/db/queries";
import { formatInt, formatPct } from "@/lib/format";

export const metadata: Metadata = { title: "SOC" };

export default async function SocPage() {
  const soc = await loadSoc();

  return (
    <>
      <PageHeader
        eyebrow="SOC"
        title="Evolución mensual"
        description="Cada fila es un informe. Entra en el mes para ver los casos, las vulnerabilidades y las acciones de ese corte."
      />
      {soc.status !== "ok" ? (
        <DataState title="Sin serie mensual todavía">
          {soc.status === "unconfigured"
            ? "Conecta Neon para guardar los meses del SOC."
            : soc.status === "error"
              ? "No se ha podido leer la base de datos."
              : "Cuando se carguen los informes, esta tabla comparará alertas, falsos positivos, respuestas pendientes y vulnerabilidades críticas."}
        </DataState>
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
          <Section title="Vulnerabilidades abiertas">
            <VulnChart
              points={[...soc.data].reverse().map((report) => ({
                label: report.label,
                criticas: report.metrics.vulnsOpen?.critical ?? null,
                altas: report.metrics.vulnsOpen?.high ?? null,
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
                  <th className="px-3 py-3 font-medium">Críticas abiertas</th>
                </tr>
              </thead>
              <tbody>
                {soc.data.map((report) => {
                  const fp = formatPct(report.metrics.falsePositives, report.metrics.alertsGenerated);
                  return (
                    <tr key={report.id} className="border-t border-line">
                      <td className="px-3 py-3">
                        <MonthLink id={report.id} label={report.label} />
                      </td>
                      <td className="px-3 py-3 font-mono tabular-nums">{formatInt(report.metrics.alertsGenerated)}</td>
                      <td className="px-3 py-3 font-mono tabular-nums">{formatInt(report.metrics.alertsEscalated)}</td>
                      <td className="px-3 py-3 font-mono tabular-nums">
                        {formatInt(report.metrics.falsePositives)}
                        {fp ? <span className="ml-2 text-xs text-faint">{fp}</span> : null}
                      </td>
                      <td className="px-3 py-3 font-mono tabular-nums">{formatInt(report.metrics.alertsUnanswered)}</td>
                      <td className="px-3 py-3 font-mono tabular-nums">
                        {formatInt(report.metrics.vulnsOpen?.critical ?? null)}
                      </td>
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
