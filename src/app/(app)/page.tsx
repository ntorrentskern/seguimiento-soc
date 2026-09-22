import type { Metadata } from "next";
import Link from "next/link";
import { AlertChart, VulnChart } from "@/components/charts";
import { ActionList, CaseList, MonthLink, VulnTable } from "@/components/records";
import { DataState, KpiCard, PageHeader, Section } from "@/components/ui";
import { loadSoc, loadVigilancia } from "@/db/queries";
import { delta, formatInt, formatPct } from "@/lib/format";
import type { SocView } from "@/lib/types";

export const metadata: Metadata = { title: "Panel" };

export default async function PanelPage() {
  const [soc, vigilancia] = await Promise.all([loadSoc(), loadVigilancia()]);

  return (
    <>
      <PageHeader
        eyebrow="Kern Pharma"
        title="Cómo va la seguridad este mes"
        description="Comparación de los informes mensuales: alertas que de verdad se escalan, ruido, lo que queda sin respuesta y vulnerabilidades que siguen abiertas."
      />
      {soc.status === "unconfigured" ? (
        <DataState title="Falta conectar la base de datos">
          La aplicación ya puede guardar y comparar los meses. En cuanto Neon esté enlazado al proyecto de Vercel, este panel mostrará la evolución.
        </DataState>
      ) : null}
      {soc.status === "error" ? (
        <DataState title="No se ha podido leer la base de datos">
          La conexión no ha respondido o el esquema todavía no está creado. Cuando la base esté lista, recarga esta página.
        </DataState>
      ) : null}
      {soc.status === "empty" ? <EmptySoc /> : null}
      {soc.status === "ok" ? <SocBriefing reports={soc.data} /> : null}

      <Section title="Vigilancia digital">
        {vigilancia.status === "ok" ? (
          <article className="rounded-xl border border-line bg-raised px-4 py-4">
            <p className="text-xs text-faint">{vigilancia.data[0].label}</p>
            <p className="mt-2 text-sm leading-6">{vigilancia.data[0].headline}</p>
            <Link href="/vigilancia" className="mt-3 inline-block text-sm text-accent">
              Ver vigilancia digital
            </Link>
          </article>
        ) : (
          <DataState title="Aún sin informes de vigilancia">
            Este apartado queda listo para suplantación de webs, dominios parecidos, takedowns, credenciales filtradas y reputación. Se cargará cuando lleguen esos informes, solo con los hallazgos que haya que seguir.
          </DataState>
        )}
      </Section>
    </>
  );
}

function EmptySoc() {
  return (
    <DataState title="Aún no hay informes del SOC">
      Cuando estén los PDF de los últimos meses, aquí verás la evolución real: alertas generadas, escaladas, falsos positivos, alertas sin respuesta, casos concretos y vulnerabilidades abiertas. No se copia la introducción, la metodología ni las recomendaciones que se repiten en todos los informes.
    </DataState>
  );
}

function SocBriefing({ reports }: { reports: SocView[] }) {
  const latest = reports[0];
  const previous = reports[1] ?? null;
  const chronological = [...reports].reverse();
  const openCases = latest.cases.filter((item) => item.status !== "closed");
  const openVulns = latest.vulnerabilities.filter((item) => item.status === "open");
  const pending = latest.actions.filter((item) => item.status !== "done");
  const fpShare = formatPct(latest.metrics.falsePositives, latest.metrics.alertsGenerated);
  const escalatedShare = formatPct(latest.metrics.alertsEscalated, latest.metrics.alertsGenerated);

  return (
    <>
      <p className="mb-6 max-w-3xl text-base leading-7">
        <span className="text-faint">{latest.label}. </span>
        {latest.headline}
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Alertas escaladas"
          value={formatInt(latest.metrics.alertsEscalated)}
          hint={escalatedShare ? `${escalatedShare} de las generadas` : null}
          delta={delta(latest.metrics.alertsEscalated, previous?.metrics.alertsEscalated ?? null)}
        />
        <KpiCard
          label="Falsos positivos"
          value={formatInt(latest.metrics.falsePositives)}
          hint={fpShare ? `${fpShare} de las generadas` : null}
          delta={delta(latest.metrics.falsePositives, previous?.metrics.falsePositives ?? null)}
        />
        <KpiCard
          label="Sin respuesta"
          value={formatInt(latest.metrics.alertsUnanswered)}
          delta={delta(latest.metrics.alertsUnanswered, previous?.metrics.alertsUnanswered ?? null)}
        />
        <KpiCard
          label="Críticas abiertas"
          value={formatInt(latest.metrics.vulnsOpen?.critical ?? null)}
          delta={delta(
            latest.metrics.vulnsOpen?.critical ?? null,
            previous?.metrics.vulnsOpen?.critical ?? null,
          )}
        />
      </div>

      <Section title="Evolución de alertas">
        <AlertChart
          points={chronological.map((report) => ({
            label: report.label,
            escaladas: report.metrics.alertsEscalated,
            falsosPositivos: report.metrics.falsePositives,
            sinRespuesta: report.metrics.alertsUnanswered,
          }))}
        />
      </Section>

      <Section title="Vulnerabilidades abiertas">
        <VulnChart
          points={chronological.map((report) => ({
            label: report.label,
            criticas: report.metrics.vulnsOpen?.critical ?? null,
            altas: report.metrics.vulnsOpen?.high ?? null,
          }))}
        />
      </Section>

      {openCases.length > 0 ? (
        <Section title="Casos que siguen abiertos">
          <CaseList items={openCases} />
        </Section>
      ) : null}

      {openVulns.length > 0 ? (
        <Section title="Vulnerabilidades a seguir">
          <VulnTable items={openVulns} showMonths />
        </Section>
      ) : null}

      {pending.length > 0 ? (
        <Section title="Acciones pendientes">
          <ActionList items={pending} />
        </Section>
      ) : null}

      <Section title="Meses cargados">
        <ul className="flex flex-wrap gap-3 text-sm">
          {reports.map((report) => (
            <li key={report.id}>
              <MonthLink id={report.id} label={report.label} />
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
