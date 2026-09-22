import { asc, eq, inArray } from "drizzle-orm";
import { cache } from "react";
import { connection } from "next/server";
import { getDb } from "@/db/index";
import {
  actions,
  alertCategories,
  cases,
  reports,
  socSnapshots,
  vigilanciaFindings,
  vigilanciaSnapshots,
  vulnerabilities,
  portfolioItems,
} from "@/db/schema";
import { asSeverity, withMonthsOpen } from "@/lib/metrics";
import type {
  ActionPriority,
  ActionStatus,
  ActionView,
  CaseStatus,
  CaseView,
  FindingKind,
  FindingView,
  LoadResult,
  PortfolioItemView,
  Severity,
  SocMetrics,
  SocView,
  VigilanciaMetrics,
  VigilanciaView,
  VulnStatus,
  VulnView,
} from "@/lib/types";

const emptyMetrics = (): SocMetrics => ({
  eventsIngested: null,
  alertsGenerated: null,
  alertsEscalated: null,
  falsePositives: null,
  alertsUnanswered: null,
  escalatedBySeverity: null,
  mttdHours: null,
  mttrHours: null,
  assetsMonitored: null,
  logSources: null,
  slaBreaches: null,
  vulnsOpened: null,
  vulnsClosed: null,
  vulnsOpen: null,
  risksOpen: null,
  risksCritical: null,
  risksVeryHigh: null,
  improvementsOpen: null,
});

const emptyVigilancia = (): VigilanciaMetrics => ({
  domainsMonitored: null,
  impersonationAttempts: null,
  lookalikeDomains: null,
  takedownsRequested: null,
  takedownsCompleted: null,
  credentialLeaks: null,
  reputationMentions: null,
  assetsExposed: null,
});

export const loadSoc = cache(async (): Promise<LoadResult<SocView[]>> => {
  await connection();
  const db = getDb();
  if (!db) return { status: "unconfigured" };

  try {
    const reportRows = await db
      .select()
      .from(reports)
      .where(eq(reports.service, "soc"))
      .orderBy(asc(reports.periodStart));

    if (reportRows.length === 0) return { status: "empty" };

    const ids = reportRows.map((report) => report.id);
    const [snapshotRows, categoryRows, caseRows, vulnRows, actionRows, portfolioRows] =
      await Promise.all([
        db.select().from(socSnapshots).where(inArray(socSnapshots.reportId, ids)),
        db.select().from(alertCategories).where(inArray(alertCategories.reportId, ids)),
        db.select().from(cases).where(inArray(cases.reportId, ids)),
        db.select().from(vulnerabilities).where(inArray(vulnerabilities.reportId, ids)),
        db.select().from(actions).where(inArray(actions.reportId, ids)),
        db.select().from(portfolioItems).where(inArray(portfolioItems.reportId, ids)),
      ]);

    const views: SocView[] = reportRows.map((report) => {
      const snapshot = snapshotRows.find((row) => row.reportId === report.id);
      return {
        id: report.id,
        label: report.label,
        periodStart: report.periodStart,
        periodEnd: report.periodEnd,
        provider: report.provider,
        sourceFile: report.sourceFile,
        headline: report.headline,
        context: report.context,
        metrics: snapshot
          ? {
              eventsIngested: snapshot.eventsIngested,
              alertsGenerated: snapshot.alertsGenerated,
              alertsEscalated: snapshot.alertsEscalated,
              falsePositives: snapshot.falsePositives,
              alertsUnanswered: snapshot.alertsUnanswered,
              escalatedBySeverity: asSeverity(snapshot.escalatedBySeverity),
              mttdHours: snapshot.mttdHours,
              mttrHours: snapshot.mttrHours,
              assetsMonitored: snapshot.assetsMonitored,
              logSources: snapshot.logSources,
              slaBreaches: snapshot.slaBreaches,
              vulnsOpened: snapshot.vulnsOpened,
              vulnsClosed: snapshot.vulnsClosed,
              vulnsOpen: asSeverity(snapshot.vulnsOpen),
              risksOpen: snapshot.risksOpen,
              risksCritical: snapshot.risksCritical,
              risksVeryHigh: snapshot.risksVeryHigh,
              improvementsOpen: snapshot.improvementsOpen,
            }
          : emptyMetrics(),
        categories: categoryRows
          .filter((row) => row.reportId === report.id)
          .map((row) => ({
            name: row.name,
            generated: row.generated,
            escalated: row.escalated,
          })),
        cases: caseRows
          .filter((row) => row.reportId === report.id)
          .map(toCase),
        vulnerabilities: vulnRows
          .filter((row) => row.reportId === report.id)
          .filter((row) => row.fingerprint !== "riesgos-historico-criticos")
          .map(toVuln),
        portfolio: portfolioRows
          .filter((row) => row.reportId === report.id)
          .map(toPortfolio),
        actions: actionRows
          .filter((row) => row.reportId === report.id)
          .map(toAction),
      };
    });

    return { status: "ok", data: withMonthsOpen([...views].reverse()) };
  } catch (error) {
    console.error("No se ha podido leer el SOC", error);
    return { status: "error" };
  }
});

export const loadVigilancia = cache(
  async (): Promise<LoadResult<VigilanciaView[]>> => {
    await connection();
    const db = getDb();
    if (!db) return { status: "unconfigured" };

    try {
      const reportRows = await db
        .select()
        .from(reports)
        .where(eq(reports.service, "vigilancia"))
        .orderBy(asc(reports.periodStart));

      if (reportRows.length === 0) return { status: "empty" };

      const ids = reportRows.map((report) => report.id);
      const [snapshotRows, findingRows, actionRows] = await Promise.all([
        db
          .select()
          .from(vigilanciaSnapshots)
          .where(inArray(vigilanciaSnapshots.reportId, ids)),
        db
          .select()
          .from(vigilanciaFindings)
          .where(inArray(vigilanciaFindings.reportId, ids)),
        db.select().from(actions).where(inArray(actions.reportId, ids)),
      ]);

      const newestFirst = [...reportRows].reverse().map((report) => {
        const snapshot = snapshotRows.find((row) => row.reportId === report.id);
        return {
          id: report.id,
          label: report.label,
          periodStart: report.periodStart,
          periodEnd: report.periodEnd,
          provider: report.provider,
          headline: report.headline,
          context: report.context,
          metrics: snapshot
            ? {
                domainsMonitored: snapshot.domainsMonitored,
                impersonationAttempts: snapshot.impersonationAttempts,
                lookalikeDomains: snapshot.lookalikeDomains,
                takedownsRequested: snapshot.takedownsRequested,
                takedownsCompleted: snapshot.takedownsCompleted,
                credentialLeaks: snapshot.credentialLeaks,
                reputationMentions: snapshot.reputationMentions,
                assetsExposed: snapshot.assetsExposed,
              }
            : emptyVigilancia(),
          findings: findingRows
            .filter((row) => row.reportId === report.id)
            .map(toFinding),
          actions: actionRows
            .filter((row) => row.reportId === report.id)
            .map(toAction),
        } satisfies VigilanciaView;
      });

      return { status: "ok", data: newestFirst };
    } catch (error) {
      console.error("No se ha podido leer vigilancia digital", error);
      return { status: "error" };
    }
  },
);

function toCase(row: typeof cases.$inferSelect): CaseView {
  return {
    id: row.id,
    caseKey: row.caseKey,
    title: row.title,
    severity: asSeverityLevel(row.severity),
    status: asCaseStatus(row.status),
    asset: row.asset,
    category: row.category,
    summary: row.summary,
    response: row.response,
    openedOn: row.openedOn,
    closedOn: row.closedOn,
  };
}

function toVuln(row: typeof vulnerabilities.$inferSelect): VulnView {
  return {
    id: row.id,
    fingerprint: row.fingerprint,
    title: row.title,
    cve: row.cve,
    asset: row.asset,
    severity: asSeverityLevel(row.severity),
    cvss: row.cvss,
    status: asVulnStatus(row.status),
    ageDays: row.ageDays,
    action: row.action,
    monthsOpen: 0,
  };
}

function toPortfolio(row: typeof portfolioItems.$inferSelect): PortfolioItemView {
  return {
    id: row.id,
    kind: row.kind === "improvement" ? "improvement" : "risk",
    title: row.title,
    severity: row.severity,
    status: row.status === "resolved" ? "resolved" : "open",
    detail: row.detail,
  };
}

function toAction(row: typeof actions.$inferSelect): ActionView {
  return {
    id: row.id,
    title: row.title,
    detail: row.detail,
    priority: asPriority(row.priority),
    status: asActionStatus(row.status),
  };
}

function toFinding(row: typeof vigilanciaFindings.$inferSelect): FindingView {
  return {
    id: row.id,
    kind: asKind(row.kind),
    title: row.title,
    target: row.target,
    severity: asSeverityLevel(row.severity),
    status: row.status,
    detail: row.detail,
  };
}

function asSeverityLevel(value: string): Severity {
  if (value === "critical" || value === "high" || value === "medium" || value === "low") {
    return value;
  }
  return "medium";
}

function asCaseStatus(value: string): CaseStatus {
  if (value === "open" || value === "closed" || value === "monitoring") return value;
  return "open";
}

function asVulnStatus(value: string): VulnStatus {
  if (
    value === "open" ||
    value === "mitigated" ||
    value === "accepted" ||
    value === "closed"
  ) {
    return value;
  }
  return "open";
}

function asPriority(value: string): ActionPriority {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
}

function asActionStatus(value: string): ActionStatus {
  if (value === "pending" || value === "done" || value === "carried") return value;
  return "pending";
}

function asKind(value: string): FindingKind {
  if (
    value === "impersonation" ||
    value === "leak" ||
    value === "reputation" ||
    value === "exposure" ||
    value === "other"
  ) {
    return value;
  }
  return "other";
}
