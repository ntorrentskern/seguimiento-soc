import type { Metadata } from "next";
import Link from "next/link";
import { AlertChart, RiskChart } from "@/components/charts";
import { ActionList, CaseList, MonthLink, PortfolioTable, VulnTable } from "@/components/records";
import { DataState, KpiCard, PageHeader, Section } from "@/components/ui";
import { loadSoc, loadVigilancia } from "@/db/queries";
import { delta, formatInt, formatPct } from "@/lib/format";
import type { SocView } from "@/lib/types";

export const metadata: Metadata = { title: "Panel" };

export default async function PanelPage() {
  const [soc, vigilancia] = await Promise.all([loadSoc(), loadVigilancia()]);

  return (
    <>
      <PageHeader title="Panel" />
      {soc.status === "unconfigured" || soc.status === "error" ? (
        <DataState title="Sin conexión con la base de datos" />
      ) : null}
      {soc.status === "empty" ? (
        <DataState title="Sin informes">
          <Link href="/registrar" className="text-accent">
            Registrar mes
          </Link>
        </DataState>
      ) : null}
      {soc.status === "ok" ? <SocBriefing reports={soc.data} /> : null}

      {vigilancia.status === "ok" ? (
        <Section title="Vigilancia digital">
          <article className="rounded-xl border border-line bg-raised px-4 py-4">
            <p className="text-xs text-faint">{vigilancia.data[0].label}</p>
            <p className="mt-2 text-sm leading-6">{vigilancia.data[0].headline}</p>
            <Link href="/vigilancia" className="mt-3 inline-block text-sm text-accent">
              Ver vigilancia digital
            </Link>
          </article>
        </Section>
      ) : null}
    </>
  );
}

function SocBriefing({ reports }: { reports: SocView[] }) {
  const latest = reports[0];
  const previous = reports[1] ?? null;
  const chronological = [...reports].reverse();
  const openCases = latest.cases.filter((item) => item.status !== "closed");
  const openVulns = latest.vulnerabilities.filter((item) => item.status === "open");
  const openRisks = latest.portfolio.filter((item) => item.kind === "risk" && item.status === "open");
  const openImprovements = latest.portfolio.filter(
    (item) => item.kind === "improvement" && item.status === "open",
  );
  const pending = latest.actions.filter((item) => item.status !== "done");
  const escalatedShare = formatPct(latest.metrics.alertsEscalated, latest.metrics.alertsGenerated);

  return (
    <>
      <p className="mb-6 text-sm text-faint">{latest.label}</p>
      {latest.headline && latest.headline !== latest.label ? (
        <p className="mb-6 max-w-3xl text-base leading-7">{latest.headline}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Alertas escaladas"
          value={formatInt(latest.metrics.alertsEscalated)}
          hint={escalatedShare ? `${escalatedShare} de las generadas` : null}
          delta={delta(latest.metrics.alertsEscalated, previous?.metrics.alertsEscalated ?? null)}
        />
        <KpiCard
          label="Sin respuesta"
          value={formatInt(latest.metrics.alertsUnanswered)}
          delta={delta(latest.metrics.alertsUnanswered, previous?.metrics.alertsUnanswered ?? null)}
        />
        <KpiCard
          label="Riesgos abiertos"
          value={formatInt(latest.metrics.risksOpen)}
          hint={
            latest.metrics.risksCritical != null
              ? `${formatInt(latest.metrics.risksCritical)} críticos · ${formatInt(latest.metrics.risksVeryHigh)} muy altos`
              : null
          }
          delta={delta(latest.metrics.risksOpen, previous?.metrics.risksOpen ?? null)}
        />
        <KpiCard
          label="Mejoras abiertas"
          value={formatInt(latest.metrics.improvementsOpen)}
          delta={delta(latest.metrics.improvementsOpen, previous?.metrics.improvementsOpen ?? null)}
        />
      </div>

      <Section title="Alertas">
        <AlertChart
          points={chronological.map((report) => ({
            label: report.label,
            escaladas: report.metrics.alertsEscalated,
            falsosPositivos: report.metrics.falsePositives,
            sinRespuesta: report.metrics.alertsUnanswered,
          }))}
        />
      </Section>

      <Section title="Riesgos y mejoras">
        <RiskChart
          points={chronological.map((report) => ({
            label: report.label,
            riesgos: report.metrics.risksOpen,
            mejoras: report.metrics.improvementsOpen,
          }))}
        />
        <p className="mt-4 text-sm">
          <Link href="/riesgos" className="text-accent">
            Ver riesgos y mejoras
          </Link>
        </p>
      </Section>

      {openVulns.length > 0 ? (
        <Section title="Vulnerabilidades">
          <VulnTable items={openVulns} showMonths />
        </Section>
      ) : null}

      {openRisks.length > 0 ? (
        <Section title="Riesgos abiertos">
          <PortfolioTable items={openRisks} />
        </Section>
      ) : null}

      {openImprovements.length > 0 ? (
        <Section title="Mejoras abiertas">
          <PortfolioTable items={openImprovements} />
        </Section>
      ) : null}

      {openCases.length > 0 ? (
        <Section title="Casos abiertos">
          <CaseList items={openCases} />
        </Section>
      ) : null}

      {pending.length > 0 ? (
        <Section title="Acciones pendientes">
          <ActionList items={pending} />
        </Section>
      ) : null}

      <Section title="Meses">
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
