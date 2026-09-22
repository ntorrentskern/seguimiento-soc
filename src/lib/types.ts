export const SEVERITIES = ["critical", "high", "medium", "low"] as const;
export type Severity = (typeof SEVERITIES)[number];

export type SeverityCounts = Record<Severity, number>;

export type CaseStatus = "open" | "closed" | "monitoring";
export type VulnStatus = "open" | "mitigated" | "accepted" | "closed";
export type ActionStatus = "pending" | "done" | "carried";
export type ActionPriority = "high" | "medium" | "low";
export type FindingKind =
  | "impersonation"
  | "leak"
  | "reputation"
  | "exposure"
  | "other";

export type SocMetrics = {
  eventsIngested: number | null;
  alertsGenerated: number | null;
  alertsEscalated: number | null;
  falsePositives: number | null;
  alertsUnanswered: number | null;
  escalatedBySeverity: SeverityCounts | null;
  mttdHours: number | null;
  mttrHours: number | null;
  assetsMonitored: number | null;
  logSources: number | null;
  slaBreaches: number | null;
  vulnsOpened: number | null;
  vulnsClosed: number | null;
  vulnsOpen: SeverityCounts | null;
  risksOpen: number | null;
  risksCritical: number | null;
  risksVeryHigh: number | null;
  improvementsOpen: number | null;
};

export type CategoryView = {
  name: string;
  generated: number;
  escalated: number;
};

export type CaseView = {
  id: string;
  caseKey: string | null;
  title: string;
  severity: Severity;
  status: CaseStatus;
  asset: string | null;
  category: string | null;
  summary: string;
  response: string | null;
  openedOn: string | null;
  closedOn: string | null;
};

export type VulnView = {
  id: string;
  fingerprint: string;
  title: string;
  cve: string | null;
  asset: string | null;
  severity: Severity;
  cvss: number | null;
  status: VulnStatus;
  ageDays: number | null;
  action: string | null;
  monthsOpen: number;
};

export type PortfolioKind = "risk" | "improvement";
export type PortfolioStatus = "open" | "resolved";

export type PortfolioItemView = {
  id: string;
  kind: PortfolioKind;
  title: string;
  severity: string;
  status: PortfolioStatus;
  detail: string | null;
};

export type ActionView = {
  id: string;
  title: string;
  detail: string | null;
  priority: ActionPriority;
  status: ActionStatus;
};

export type SocView = {
  id: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  provider: string | null;
  sourceFile: string | null;
  headline: string;
  context: string | null;
  metrics: SocMetrics;
  categories: CategoryView[];
  cases: CaseView[];
  vulnerabilities: VulnView[];
  portfolio: PortfolioItemView[];
  actions: ActionView[];
};

export type FindingView = {
  id: string;
  kind: FindingKind;
  title: string;
  target: string | null;
  severity: Severity;
  status: string;
  detail: string;
};

export type VigilanciaMetrics = {
  domainsMonitored: number | null;
  impersonationAttempts: number | null;
  lookalikeDomains: number | null;
  takedownsRequested: number | null;
  takedownsCompleted: number | null;
  credentialLeaks: number | null;
  reputationMentions: number | null;
  assetsExposed: number | null;
};

export type VigilanciaView = {
  id: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  provider: string | null;
  headline: string;
  context: string | null;
  metrics: VigilanciaMetrics;
  findings: FindingView[];
  actions: ActionView[];
};

export type LoadResult<T> =
  | { status: "unconfigured" }
  | { status: "error" }
  | { status: "empty" }
  | { status: "ok"; data: T };
