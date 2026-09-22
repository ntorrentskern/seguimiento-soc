import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionList, CaseList, CategoryBars, VulnTable } from "@/components/records";
import { KpiCard, PageHeader, Section } from "@/components/ui";
import { loadSoc } from "@/db/queries";
import { delta, formatDate, formatHours, formatInt, formatPct, severityLabel } from "@/lib/format";
import type { Severity, SocView } from "@/lib/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const soc = await loadSoc();
  const report = soc.status === "ok" ? soc.data.find((item) => item.id === id) : null;
  return { title: report?.label ?? "Informe no encontrado" };
}

export default async function SocMonthPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const soc = await loadSoc();
  if (soc.status !== "ok") notFound();
  const index = soc.data.findIndex((item) => item.id === id);
  if (index < 0) notFound();
  const report = soc.data[index];
  const previous = soc.data[index + 1] ?? null;

  return (
    <>
      <p className="mb-4 text-sm">
        <Link href="/soc" className="text-muted hover:text-foreground">
          SOC
        </Link>
      </p>
      <PageHeader
        eyebrow={`${formatDate(report.periodStart)} – ${formatDate(report.periodEnd)}`}
        title={report.label}
        description={report.headline}
      />
      {report.provider ? <p className="mb-6 text-xs text-faint">Informe de {report.provider}</p> : null}
      {report.context ? (
        <p className="mb-6 max-w-3xl rounded-xl border border-line bg-raised px-4 py-3 text-sm leading-6">
          <span className="text-faint">Contexto del mes. </span>
          {report.context}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Generadas"
          value={formatInt(report.metrics.alertsGenerated)}
          delta={delta(report.metrics.alertsGenerated, previous?.metrics.alertsGenerated ?? null)}
        />
        <KpiCard
          label="Escaladas"
          value={formatInt(report.metrics.alertsEscalated)}
          hint={share(report.metrics.alertsEscalated, report.metrics.alertsGenerated, "de las generadas")}
          delta={delta(report.metrics.alertsEscalated, previous?.metrics.alertsEscalated ?? null)}
        />
        <KpiCard
          label="Falsos positivos"
          value={formatInt(report.metrics.falsePositives)}
          hint={share(report.metrics.falsePositives, report.metrics.alertsGenerated, "de las generadas")}
          delta={delta(report.metrics.falsePositives, previous?.metrics.falsePositives ?? null)}
        />
        <KpiCard
          label="Sin respuesta"
          value={formatInt(report.metrics.alertsUnanswered)}
          delta={delta(report.metrics.alertsUnanswered, previous?.metrics.alertsUnanswered ?? null)}
        />
      </div>

      <Meta report={report} />
      <SeverityMix report={report} />

      {report.categories.length > 0 ? (
        <Section title="Por tipo de alerta">
          <CategoryBars items={report.categories} />
        </Section>
      ) : null}

      <Section title="Casos">
        <CaseList items={report.cases} />
      </Section>

      <Section title="Vulnerabilidades del mes">
        <p className="mb-4 text-sm text-muted">
          Abiertas nuevas: {formatInt(report.metrics.vulnsOpened)}. Cerradas: {formatInt(report.metrics.vulnsClosed)}.
          Críticas que siguen abiertas: {formatInt(report.metrics.vulnsOpen?.critical ?? null)}.
        </p>
        <VulnTable items={report.vulnerabilities} showMonths />
      </Section>

      {report.actions.length > 0 ? (
        <Section title="Acciones">
          <ActionList items={report.actions} />
        </Section>
      ) : null}
    </>
  );
}

function share(part: number | null, total: number | null, suffix: string) {
  const pct = formatPct(part, total);
  return pct ? `${pct} ${suffix}` : null;
}

function Meta({ report }: { report: SocView }) {
  const items = [
    ["Eventos ingestados", report.metrics.eventsIngested == null ? null : formatInt(report.metrics.eventsIngested)],
    ["MTTD", report.metrics.mttdHours == null ? null : formatHours(report.metrics.mttdHours)],
    ["MTTR", report.metrics.mttrHours == null ? null : formatHours(report.metrics.mttrHours)],
    ["Activos monitorizados", report.metrics.assetsMonitored == null ? null : formatInt(report.metrics.assetsMonitored)],
    ["Fuentes de log", report.metrics.logSources == null ? null : formatInt(report.metrics.logSources)],
    ["Incumplimientos de SLA", report.metrics.slaBreaches == null ? null : formatInt(report.metrics.slaBreaches)],
  ].filter((item): item is [string, string] => item[1] != null);

  if (items.length === 0) return null;
  return (
    <dl className="mt-6 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(([label, value]) => (
        <div key={label} className="border-t border-line py-3">
          <dt className="text-xs text-faint">{label}</dt>
          <dd className="mt-1 font-mono text-sm tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function SeverityMix({ report }: { report: SocView }) {
  const mix = report.metrics.escalatedBySeverity;
  if (!mix) return null;
  const order: Severity[] = ["critical", "high", "medium", "low"];
  return (
    <Section title="Severidad de lo escalado">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {order.map((severity) => (
          <li key={severity} className="rounded-xl border border-line px-3 py-3">
            <p className="text-xs text-faint">{severityLabel[severity]}</p>
            <p className="mt-1 font-mono text-xl tabular-nums">{formatInt(mix[severity])}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
