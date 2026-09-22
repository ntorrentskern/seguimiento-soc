import { relations } from "drizzle-orm";
import {
  bigint,
  date,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import type { SeverityCounts } from "@/lib/types";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const reports = pgTable("reports", {
  id: text("id").primaryKey(),
  service: text("service").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  label: text("label").notNull(),
  provider: text("provider"),
  sourceFile: text("source_file"),
  headline: text("headline").notNull(),
  context: text("context"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const socSnapshots = pgTable("soc_snapshots", {
  reportId: text("report_id")
    .primaryKey()
    .references(() => reports.id, { onDelete: "cascade" }),
  eventsIngested: bigint("events_ingested", { mode: "number" }),
  alertsGenerated: integer("alerts_generated"),
  alertsEscalated: integer("alerts_escalated"),
  falsePositives: integer("false_positives"),
  alertsUnanswered: integer("alerts_unanswered"),
  escalatedBySeverity: jsonb("escalated_by_severity").$type<SeverityCounts>(),
  mttdHours: real("mttd_hours"),
  mttrHours: real("mttr_hours"),
  assetsMonitored: integer("assets_monitored"),
  logSources: integer("log_sources"),
  slaBreaches: integer("sla_breaches"),
  vulnsOpened: integer("vulns_opened"),
  vulnsClosed: integer("vulns_closed"),
  vulnsOpen: jsonb("vulns_open").$type<SeverityCounts>(),
});

export const alertCategories = pgTable("alert_categories", {
  id: text("id").primaryKey(),
  reportId: text("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  generated: integer("generated").notNull(),
  escalated: integer("escalated").notNull(),
});

export const cases = pgTable("cases", {
  id: text("id").primaryKey(),
  reportId: text("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  caseKey: text("case_key"),
  title: text("title").notNull(),
  severity: text("severity").notNull(),
  status: text("status").notNull(),
  asset: text("asset"),
  category: text("category"),
  summary: text("summary").notNull(),
  response: text("response"),
  openedOn: date("opened_on"),
  closedOn: date("closed_on"),
});

export const vulnerabilities = pgTable("vulnerabilities", {
  id: text("id").primaryKey(),
  reportId: text("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  fingerprint: text("fingerprint").notNull(),
  title: text("title").notNull(),
  cve: text("cve"),
  asset: text("asset"),
  severity: text("severity").notNull(),
  cvss: real("cvss"),
  status: text("status").notNull(),
  ageDays: integer("age_days"),
  action: text("action"),
});

export const actions = pgTable("actions", {
  id: text("id").primaryKey(),
  reportId: text("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  detail: text("detail"),
  priority: text("priority").notNull(),
  status: text("status").notNull(),
});

export const vigilanciaSnapshots = pgTable("vigilancia_snapshots", {
  reportId: text("report_id")
    .primaryKey()
    .references(() => reports.id, { onDelete: "cascade" }),
  domainsMonitored: integer("domains_monitored"),
  impersonationAttempts: integer("impersonation_attempts"),
  lookalikeDomains: integer("lookalike_domains"),
  takedownsRequested: integer("takedowns_requested"),
  takedownsCompleted: integer("takedowns_completed"),
  credentialLeaks: integer("credential_leaks"),
  reputationMentions: integer("reputation_mentions"),
  assetsExposed: integer("assets_exposed"),
});

export const vigilanciaFindings = pgTable("vigilancia_findings", {
  id: text("id").primaryKey(),
  reportId: text("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  target: text("target"),
  severity: text("severity").notNull(),
  status: text("status").notNull(),
  detail: text("detail").notNull(),
});

export const reportsRelations = relations(reports, ({ one, many }) => ({
  soc: one(socSnapshots, {
    fields: [reports.id],
    references: [socSnapshots.reportId],
  }),
  vigilancia: one(vigilanciaSnapshots, {
    fields: [reports.id],
    references: [vigilanciaSnapshots.reportId],
  }),
  categories: many(alertCategories),
  cases: many(cases),
  vulnerabilities: many(vulnerabilities),
  actions: many(actions),
  findings: many(vigilanciaFindings),
}));
