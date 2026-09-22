import type { Severity, SeverityCounts, SocView, VulnView } from "@/lib/types";

export function asSeverity(value: unknown): SeverityCounts | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const keys: Severity[] = ["critical", "high", "medium", "low"];
  if (keys.every((key) => record[key] == null)) return null;
  return {
    critical: numberOrZero(record.critical),
    high: numberOrZero(record.high),
    medium: numberOrZero(record.medium),
    low: numberOrZero(record.low),
  };
}

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function severityTotal(counts: SeverityCounts | null) {
  if (!counts) return null;
  return counts.critical + counts.high + counts.medium + counts.low;
}

export function withMonthsOpen(reportsNewestFirst: SocView[]): SocView[] {
  const chronological = [...reportsNewestFirst].reverse();
  return reportsNewestFirst.map((report) => ({
    ...report,
    vulnerabilities: report.vulnerabilities.map((vuln) => ({
      ...vuln,
      monthsOpen: countOpenMonths(vuln.fingerprint, report.id, chronological),
    })),
  }));
}

function countOpenMonths(
  fingerprint: string,
  reportId: string,
  chronological: SocView[],
) {
  const index = chronological.findIndex((report) => report.id === reportId);
  if (index < 0) return 0;
  let count = 0;
  for (let i = index; i >= 0; i -= 1) {
    const match = chronological[i].vulnerabilities.find(
      (vuln) => vuln.fingerprint === fingerprint,
    );
    if (!match || match.status !== "open") break;
    count += 1;
  }
  return count;
}

export function sortVulns(vulns: VulnView[]) {
  const rank = { critical: 0, high: 1, medium: 2, low: 3 };
  return [...vulns].sort((a, b) => {
    const bySeverity = rank[a.severity] - rank[b.severity];
    if (bySeverity !== 0) return bySeverity;
    return b.monthsOpen - a.monthsOpen;
  });
}
