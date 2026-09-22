import { readFile } from "node:fs/promises";
import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import { getDb } from "@/db/index";
import {
  actions,
  alertCategories,
  cases,
  reports,
  socSnapshots,
  vulnerabilities,
} from "@/db/schema";
import type { SeverityCounts } from "@/lib/types";

loadEnvConfig(process.cwd());

type ActionImport = {
  id?: string;
  title: string;
  detail?: string | null;
  priority: "high" | "medium" | "low";
  status: "pending" | "done" | "carried";
};

type SocImport = {
  id: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  provider?: string | null;
  sourceFile?: string | null;
  headline: string;
  context?: string | null;
  metrics?: {
    eventsIngested?: number | null;
    alertsGenerated?: number | null;
    alertsEscalated?: number | null;
    falsePositives?: number | null;
    alertsUnanswered?: number | null;
    escalatedBySeverity?: SeverityCounts | null;
    mttdHours?: number | null;
    mttrHours?: number | null;
    assetsMonitored?: number | null;
    logSources?: number | null;
    slaBreaches?: number | null;
    vulnsOpened?: number | null;
    vulnsClosed?: number | null;
    vulnsOpen?: SeverityCounts | null;
  };
  categories?: { name: string; generated: number; escalated: number }[];
  cases?: {
    id?: string;
    caseKey?: string | null;
    title: string;
    severity: string;
    status: string;
    asset?: string | null;
    category?: string | null;
    summary: string;
    response?: string | null;
    openedOn?: string | null;
    closedOn?: string | null;
  }[];
  vulnerabilities?: {
    id?: string;
    fingerprint: string;
    title: string;
    cve?: string | null;
    asset?: string | null;
    severity: string;
    cvss?: number | null;
    status: string;
    ageDays?: number | null;
    action?: string | null;
  }[];
  actions?: ActionImport[];
};

async function main() {
  const db = getDb();
  if (!db) {
    throw new Error("Falta DATABASE_URL o POSTGRES_URL.");
  }

  const soc = await readJson<SocImport[]>("data/soc.json");
  if (!soc) {
    console.log("No hay data/soc.json. Nada que cargar.");
    return;
  }

  for (const [index, report] of soc.entries()) {
    requireFields(report, index);
    await db
      .insert(reports)
      .values({
        id: report.id,
        service: "soc",
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        label: report.label,
        provider: report.provider ?? null,
        sourceFile: report.sourceFile ?? null,
        headline: report.headline,
        context: report.context ?? null,
      })
      .onConflictDoUpdate({
        target: reports.id,
        set: {
          service: "soc",
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
          label: report.label,
          provider: report.provider ?? null,
          sourceFile: report.sourceFile ?? null,
          headline: report.headline,
          context: report.context ?? null,
        },
      });

    await db.delete(alertCategories).where(eq(alertCategories.reportId, report.id));
    await db.delete(cases).where(eq(cases.reportId, report.id));
    await db.delete(vulnerabilities).where(eq(vulnerabilities.reportId, report.id));
    await db.delete(actions).where(eq(actions.reportId, report.id));
    await db.delete(socSnapshots).where(eq(socSnapshots.reportId, report.id));

    const metrics = report.metrics ?? {};
    await db.insert(socSnapshots).values({
      reportId: report.id,
      eventsIngested: metrics.eventsIngested ?? null,
      alertsGenerated: metrics.alertsGenerated ?? null,
      alertsEscalated: metrics.alertsEscalated ?? null,
      falsePositives: metrics.falsePositives ?? null,
      alertsUnanswered: metrics.alertsUnanswered ?? null,
      escalatedBySeverity: metrics.escalatedBySeverity ?? null,
      mttdHours: metrics.mttdHours ?? null,
      mttrHours: metrics.mttrHours ?? null,
      assetsMonitored: metrics.assetsMonitored ?? null,
      logSources: metrics.logSources ?? null,
      slaBreaches: metrics.slaBreaches ?? null,
      vulnsOpened: metrics.vulnsOpened ?? null,
      vulnsClosed: metrics.vulnsClosed ?? null,
      vulnsOpen: metrics.vulnsOpen ?? null,
    });

    if (report.categories?.length) {
      await db.insert(alertCategories).values(
        report.categories.map((category, categoryIndex) => ({
          id: `${report.id}-cat-${categoryIndex + 1}`,
          reportId: report.id,
          name: category.name,
          generated: category.generated,
          escalated: category.escalated,
        })),
      );
    }

    if (report.cases?.length) {
      await db.insert(cases).values(
        report.cases.map((item, itemIndex) => ({
          id: item.id ?? `${report.id}-case-${itemIndex + 1}`,
          reportId: report.id,
          caseKey: item.caseKey ?? null,
          title: item.title,
          severity: item.severity,
          status: item.status,
          asset: item.asset ?? null,
          category: item.category ?? null,
          summary: item.summary,
          response: item.response ?? null,
          openedOn: item.openedOn ?? null,
          closedOn: item.closedOn ?? null,
        })),
      );
    }

    if (report.vulnerabilities?.length) {
      await db.insert(vulnerabilities).values(
        report.vulnerabilities.map((item, itemIndex) => ({
          id: item.id ?? `${report.id}-vuln-${itemIndex + 1}`,
          reportId: report.id,
          fingerprint: item.fingerprint,
          title: item.title,
          cve: item.cve ?? null,
          asset: item.asset ?? null,
          severity: item.severity,
          cvss: item.cvss ?? null,
          status: item.status,
          ageDays: item.ageDays ?? null,
          action: item.action ?? null,
        })),
      );
    }

    if (report.actions?.length) {
      await db.insert(actions).values(
        report.actions.map((item, itemIndex) => ({
          id: item.id ?? `${report.id}-action-${itemIndex + 1}`,
          reportId: report.id,
          title: item.title,
          detail: item.detail ?? null,
          priority: item.priority,
          status: item.status,
        })),
      );
    }

    console.log(`Cargado ${report.label}`);
  }
}

function requireFields(report: SocImport, index: number) {
  const missing = ["id", "label", "periodStart", "periodEnd", "headline"].filter(
    (key) => !report[key as keyof SocImport],
  );
  if (missing.length > 0) {
    throw new Error(
      `El informe ${index + 1} no tiene: ${missing.join(", ")}.`,
    );
  }
}

async function readJson<T>(path: string): Promise<T | null> {
  try {
    const raw = await readFile(path, "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    if (isMissing(error)) return null;
    throw error;
  }
}

function isMissing(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
