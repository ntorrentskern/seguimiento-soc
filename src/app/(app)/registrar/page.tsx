import type { Metadata } from "next";
import { MonthForm, type CategoryDraft, type ItemDraft, type MonthDraft, type VulnDraft } from "@/components/month-form";
import { PageHeader } from "@/components/ui";
import { loadSoc } from "@/db/queries";
import type { SocView } from "@/lib/types";

export const metadata: Metadata = { title: "Registrar mes" };

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default async function RegistrarPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string; mes?: string }>;
}) {
  const params = await searchParams;
  const soc = await loadSoc();
  const reports = soc.status === "ok" ? soc.data : [];
  const drafts = reports.map((report) => toDraft(report, reports));
  const next = nextDraft(reports[0] ?? null);
  const initialKey = params.mes && drafts.some((draft) => draft.key === params.mes) ? params.mes : next.key;

  return (
    <>
      <PageHeader title="Registrar mes" />
      <MonthForm
        drafts={drafts}
        next={next}
        initialKey={initialKey}
        saved={params.ok === "1"}
        error={params.error === "config" ? "Sin conexión con la base de datos." : params.error ? "Revisa el mes." : null}
      />
    </>
  );
}

function toDraft(report: SocView, reports: SocView[]): MonthDraft {
  const [year, month] = report.periodStart.split("-").map(Number);
  const carried = carryFromLater(report, reports);
  return {
    key: report.id,
    label: report.label,
    year,
    month,
    alertsGenerated: field(report.metrics.alertsGenerated),
    alertsEscalated: field(report.metrics.alertsEscalated),
    falsePositives: field(report.metrics.falsePositives),
    alertsUnanswered: field(report.metrics.alertsUnanswered),
    risksOpen: field(report.metrics.risksOpen),
    risksCritical: field(report.metrics.risksCritical),
    risksVeryHigh: field(report.metrics.risksVeryHigh),
    improvementsOpen: field(report.metrics.improvementsOpen),
    note: report.headline === report.label ? "" : report.headline,
    categories: report.categories.map((item) => ({ name: item.name, count: String(item.generated) })),
    vulns: mergeVulns(report.vulnerabilities.map(toVuln), carried.vulns),
    items: mergeItems(report.portfolio.map(toItem), carried.items),
  };
}

function nextDraft(latest: SocView | null): MonthDraft {
  const today = new Date();
  const base = latest
    ? shift(Number(latest.periodStart.slice(0, 4)), Number(latest.periodStart.slice(5, 7)))
    : { year: today.getFullYear(), month: today.getMonth() + 1 };
  const carried = latest
    ? {
        alertsGenerated: field(latest.metrics.alertsGenerated),
        alertsEscalated: field(latest.metrics.alertsEscalated),
        falsePositives: field(latest.metrics.falsePositives),
        alertsUnanswered: field(latest.metrics.alertsUnanswered),
        risksOpen: field(latest.metrics.risksOpen),
        risksCritical: field(latest.metrics.risksCritical),
        risksVeryHigh: field(latest.metrics.risksVeryHigh),
        improvementsOpen: field(latest.metrics.improvementsOpen),
        categories: (latest.categories ?? []).map((item) => ({ name: item.name, count: String(item.generated) })),
        vulns: latest.vulnerabilities.filter((item) => item.status === "open").map(toVuln),
        items: latest.portfolio.filter((item) => item.status === "open").map(toItem),
      }
    : emptyCarry();

  return {
    key: "next",
    label: `${MONTHS[base.month - 1]} ${base.year}`,
    year: base.year,
    month: base.month,
    note: "",
    ...carried,
  };
}

function toVuln(item: SocView["vulnerabilities"][number]): VulnDraft {
  return {
    fingerprint: item.fingerprint,
    title: item.title,
    asset: item.asset ?? "",
    severity: item.severity,
    status: item.status,
  };
}

function toItem(item: SocView["portfolio"][number]): ItemDraft {
  return {
    kind: item.kind,
    fingerprint: item.fingerprint || `${item.kind}:${slug(item.title)}`,
    title: item.title,
    severity: item.severity,
    status: item.status,
    detail: item.detail ?? "",
  };
}

function carryFromLater(report: SocView, reports: SocView[]) {
  const index = reports.findIndex((item) => item.id === report.id);
  const newer = index > 0 ? [...reports.slice(0, index)].reverse() : [];
  const source = newer.find((item) => item.vulnerabilities.length > 0 || item.portfolio.length > 0);
  return {
    vulns: source?.vulnerabilities.map(toVuln) ?? [],
    items: source?.portfolio.map(toItem) ?? [],
  };
}

function mergeVulns(own: VulnDraft[], later: VulnDraft[]) {
  const seen = new Set(own.map((item) => item.fingerprint));
  return [...own, ...later.filter((item) => !seen.has(item.fingerprint))];
}

function mergeItems(own: ItemDraft[], later: ItemDraft[]) {
  const seen = new Set(own.map((item) => item.fingerprint));
  return [...own, ...later.filter((item) => !seen.has(item.fingerprint))];
}

function slug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function emptyCarry() {
  return {
    alertsGenerated: "",
    alertsEscalated: "",
    falsePositives: "",
    alertsUnanswered: "",
    risksOpen: "",
    risksCritical: "",
    risksVeryHigh: "",
    improvementsOpen: "",
    categories: [] as CategoryDraft[],
    vulns: [] as VulnDraft[],
    items: [] as ItemDraft[],
  };
}

function shift(year: number, month: number) {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

function field(value: number | null) {
  return value == null ? "" : String(value);
}
