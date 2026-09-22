"use server";

import { randomUUID } from "node:crypto";
import { and, asc, eq, gt } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentSession } from "@/app/acceso/actions";
import { getDb } from "@/db/index";
import { alertCategories, portfolioItems, reports, socSnapshots, vulnerabilities } from "@/db/schema";

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

const SEVERITIES = new Set(["critical", "very-high", "high", "medium", "low"]);
const VULN_STATUS = new Set(["open", "mitigated", "accepted", "closed"]);
const ITEM_STATUS = new Set(["open", "resolved"]);

export async function saveMonth(formData: FormData) {
  const session = await currentSession();
  if (!session) redirect("/acceso");

  const db = getDb();
  if (!db) redirect("/registrar?error=config");

  const year = Number(formData.get("year"));
  const month = Number(formData.get("month"));
  if (!Number.isInteger(year) || year < 2020 || year > 2100 || !Number.isInteger(month) || month < 1 || month > 12) {
    redirect("/registrar?error=1");
  }

  const id = `soc-${year}-${String(month).padStart(2, "0")}`;
  const periodStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const periodEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
  const label = `${MONTHS[month - 1]} ${year}`;
  const note = text(formData.get("note"));

  const metrics = {
    alertsGenerated: integer(formData.get("alertsGenerated")),
    alertsEscalated: integer(formData.get("alertsEscalated")),
    falsePositives: integer(formData.get("falsePositives")),
    alertsUnanswered: integer(formData.get("alertsUnanswered")),
    risksOpen: integer(formData.get("risksOpen")),
    risksCritical: integer(formData.get("risksCritical")),
    risksVeryHigh: integer(formData.get("risksVeryHigh")),
    improvementsOpen: integer(formData.get("improvementsOpen")),
  };

  const existing = await db.select({ id: reports.id }).from(reports).where(eq(reports.id, id));
  if (existing.length > 0) {
    await db
      .update(reports)
      .set({
        label,
        periodStart,
        periodEnd,
        ...(note ? { headline: note } : {}),
      })
      .where(eq(reports.id, id));
    await db.update(socSnapshots).set(metrics).where(eq(socSnapshots.reportId, id));
  } else {
    await db.insert(reports).values({
      id,
      service: "soc",
      periodStart,
      periodEnd,
      label,
      provider: "SGEST Indukern",
      headline: note || label,
    });
    await db.insert(socSnapshots).values({ reportId: id, ...metrics });
  }

  const categoryNames = formData.getAll("categoryName");
  const categories = categoryNames.flatMap((entry, index) => {
    const name = text(entry);
    const count = integer(formData.getAll("categoryCount")[index] ?? null);
    if (!name || count == null) return [];
    return [{ name, count }];
  });

  const titles = formData.getAll("vulnTitle");
  const vulns = titles.flatMap((title, index) => {
    const name = text(title);
    if (!name) return [];
    const fingerprint = text(formData.getAll("vulnFingerprint")[index]) || slug(name);
    const severity = text(formData.getAll("vulnSeverity")[index]);
    const status = text(formData.getAll("vulnStatus")[index]);
    return [
      {
        fingerprint,
        title: name,
        asset: text(formData.getAll("vulnAsset")[index]),
        severity: severity && severity !== "very-high" && SEVERITIES.has(severity) ? severity : "high",
        status: status && VULN_STATUS.has(status) ? status : "open",
      },
    ];
  });

  const itemTitles = formData.getAll("itemTitle");
  const items = itemTitles.flatMap((title, index) => {
    const name = text(title);
    if (!name) return [];
    const kind = text(formData.getAll("itemKind")[index]) === "improvement" ? "improvement" : "risk";
    const severity = text(formData.getAll("itemSeverity")[index]);
    const status = text(formData.getAll("itemStatus")[index]);
    return [
      {
        kind,
        fingerprint: text(formData.getAll("itemFingerprint")[index]) || `${kind}:${slug(name)}`,
        title: name,
        severity: severity && SEVERITIES.has(severity) ? severity : "",
        status: status && ITEM_STATUS.has(status) ? status : "open",
        detail: text(formData.getAll("itemDetail")[index]),
      },
    ];
  });

  const [previousVulns, previousItems] = await Promise.all([
    db.select({ fingerprint: vulnerabilities.fingerprint }).from(vulnerabilities).where(eq(vulnerabilities.reportId, id)),
    db.select({ kind: portfolioItems.kind, title: portfolioItems.title }).from(portfolioItems).where(eq(portfolioItems.reportId, id)),
  ]);

  const later = await db
    .select({ id: reports.id })
    .from(reports)
    .where(and(eq(reports.service, "soc"), gt(reports.periodStart, periodStart)))
    .orderBy(asc(reports.periodStart));

  const knownVulns = new Set<string>();
  const knownItems = new Set<string>();
  const laterVulnStatus = new Map<string, { status: string; title: string }>();
  const laterItemStatus = new Map<string, { status: string; title: string }>();
  for (const report of later) {
    const [vulnRows, itemRows] = await Promise.all([
      db
        .select({ fingerprint: vulnerabilities.fingerprint, status: vulnerabilities.status, title: vulnerabilities.title })
        .from(vulnerabilities)
        .where(eq(vulnerabilities.reportId, report.id)),
      db
        .select({ kind: portfolioItems.kind, title: portfolioItems.title, status: portfolioItems.status })
        .from(portfolioItems)
        .where(eq(portfolioItems.reportId, report.id)),
    ]);
    for (const row of vulnRows) {
      knownVulns.add(row.fingerprint);
      if (!laterVulnStatus.has(row.fingerprint)) laterVulnStatus.set(row.fingerprint, { status: row.status, title: row.title });
    }
    for (const row of itemRows) {
      const key = `${row.kind}:${slug(row.title)}`;
      knownItems.add(key);
      if (!laterItemStatus.has(key)) laterItemStatus.set(key, { status: row.status, title: row.title });
    }
  }

  const ownVulns = new Set(previousVulns.map((item) => item.fingerprint));
  const ownItems = new Set(previousItems.map((item) => `${item.kind}:${slug(item.title)}`));
  const vulnsToStore = vulns.filter((item) => changedFromLater(item.fingerprint, item.status, item.title, ownVulns, knownVulns, laterVulnStatus));
  const itemsToStore = items.filter((item) => changedFromLater(item.fingerprint, item.status, item.title, ownItems, knownItems, laterItemStatus));
  const removedVulns = new Set([...ownVulns].filter((fingerprint) => !vulns.some((item) => item.fingerprint === fingerprint)));
  const removedItems = new Set([...ownItems].filter((fingerprint) => !items.some((item) => item.fingerprint === fingerprint)));

  await db.delete(alertCategories).where(eq(alertCategories.reportId, id));
  await db.delete(vulnerabilities).where(eq(vulnerabilities.reportId, id));
  await db.delete(portfolioItems).where(eq(portfolioItems.reportId, id));
  if (categories.length > 0) {
    await db.insert(alertCategories).values(
      categories.map((category, index) => ({
        id: `${id}-cat-${index + 1}`,
        reportId: id,
        name: category.name,
        generated: category.count,
        escalated: category.count,
      })),
    );
  }
  if (vulnsToStore.length > 0) {
    await db.insert(vulnerabilities).values(
      vulnsToStore.map((item) => ({
        id: randomUUID(),
        reportId: id,
        fingerprint: item.fingerprint,
        title: item.title,
        asset: item.asset,
        severity: item.severity,
        status: item.status,
        action: null,
        cve: null,
        cvss: null,
        ageDays: null,
      })),
    );
  }
  if (itemsToStore.length > 0) {
    await db.insert(portfolioItems).values(
      itemsToStore.map((item) => ({
        id: randomUUID(),
        reportId: id,
        kind: item.kind,
        title: item.title,
        severity: item.severity,
        status: item.status,
        detail: item.detail,
      })),
    );
  }

  for (const report of later) {
    await applyVulnsForward(db, report.id, vulns, removedVulns, knownVulns);
    await applyItemsForward(db, report.id, items, removedItems, knownItems);
    revalidatePath(`/soc/${report.id}`);
  }

  revalidatePath("/");
  revalidatePath("/soc");
  revalidatePath(`/soc/${id}`);
  revalidatePath("/vulnerabilidades");
  revalidatePath("/riesgos");
  revalidatePath("/registrar");
  redirect(`/registrar?ok=1&mes=${id}`);
}

async function applyVulnsForward(
  db: NonNullable<ReturnType<typeof getDb>>,
  reportId: string,
  vulns: { fingerprint: string; title: string; asset: string | null; severity: string; status: string }[],
  removed: Set<string>,
  knownLater: Set<string>,
) {
  const current = await db.select().from(vulnerabilities).where(eq(vulnerabilities.reportId, reportId));
  for (const vuln of vulns) {
    const match = current.find((item) => item.fingerprint === vuln.fingerprint);
    if (match) {
      await db.update(vulnerabilities).set({
        title: vuln.title,
        asset: vuln.asset,
        severity: vuln.severity,
        status: vuln.status,
      }).where(eq(vulnerabilities.id, match.id));
    } else if (!knownLater.has(vuln.fingerprint)) {
      await db.insert(vulnerabilities).values({
        id: randomUUID(),
        reportId,
        fingerprint: vuln.fingerprint,
        title: vuln.title,
        asset: vuln.asset,
        severity: vuln.severity,
        status: vuln.status,
        action: null,
        cve: null,
        cvss: null,
        ageDays: null,
      });
    }
  }
  for (const fingerprint of removed) {
    await db.delete(vulnerabilities).where(and(eq(vulnerabilities.reportId, reportId), eq(vulnerabilities.fingerprint, fingerprint)));
  }
}

async function applyItemsForward(
  db: NonNullable<ReturnType<typeof getDb>>,
  reportId: string,
  items: { kind: string; fingerprint: string; title: string; severity: string; status: string; detail: string | null }[],
  removed: Set<string>,
  knownLater: Set<string>,
) {
  const current = await db.select().from(portfolioItems).where(eq(portfolioItems.reportId, reportId));
  for (const item of items) {
    const match = current.find((row) => `${row.kind}:${slug(row.title)}` === item.fingerprint);
    if (match) {
      await db.update(portfolioItems).set({
        kind: item.kind,
        title: item.title,
        severity: item.severity,
        status: item.status,
        detail: item.detail,
      }).where(eq(portfolioItems.id, match.id));
    } else if (!knownLater.has(item.fingerprint)) {
      await db.insert(portfolioItems).values({
        id: randomUUID(),
        reportId,
        kind: item.kind,
        title: item.title,
        severity: item.severity,
        status: item.status,
        detail: item.detail,
      });
    }
  }
  for (const fingerprint of removed) {
    const match = current.find((row) => `${row.kind}:${slug(row.title)}` === fingerprint);
    if (match) await db.delete(portfolioItems).where(eq(portfolioItems.id, match.id));
  }
  const fresh = await db.select().from(portfolioItems).where(eq(portfolioItems.reportId, reportId));
  if (fresh.length === 0) return;
  await db.update(socSnapshots).set({
    risksOpen: fresh.filter((item) => item.kind === "risk" && item.status === "open").length,
    improvementsOpen: fresh.filter((item) => item.kind === "improvement" && item.status === "open").length,
  }).where(eq(socSnapshots.reportId, reportId));
}

function changedFromLater(
  fingerprint: string,
  status: string,
  title: string,
  own: Set<string>,
  knownLater: Set<string>,
  laterStatus: Map<string, { status: string; title: string }>,
) {
  if (own.has(fingerprint) || !knownLater.has(fingerprint)) return true;
  const laterItem = laterStatus.get(fingerprint);
  return !laterItem || laterItem.status !== status || laterItem.title !== title;
}

function text(value: FormDataEntryValue | undefined | null) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, 500) : null;
}

function integer(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(1_000_000, Math.round(parsed)));
}

function slug(value: string) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return normalized || randomUUID();
}
