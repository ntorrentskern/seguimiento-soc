"use server";

import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { currentSession } from "@/app/acceso/actions";
import { getDb } from "@/db/index";
import { portfolioItems, reports, socSnapshots, vulnerabilities } from "@/db/schema";

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

  const titles = formData.getAll("vulnTitle");
  const vulns = titles.flatMap((title, index) => {
    const name = text(title);
    if (!name) return [];
    const fingerprint = text(formData.getAll("vulnFingerprint")[index]) || slug(name);
    const severity = text(formData.getAll("vulnSeverity")[index]);
    const status = text(formData.getAll("vulnStatus")[index]);
    return [
      {
        id: randomUUID(),
        reportId: id,
        fingerprint,
        title: name,
        asset: text(formData.getAll("vulnAsset")[index]),
        severity: SEVERITIES.has(severity) && severity !== "very-high" ? severity : "high",
        status: VULN_STATUS.has(status) ? status : "open",
        action: null,
        cve: null,
        cvss: null,
        ageDays: null,
      },
    ];
  });

  const itemTitles = formData.getAll("itemTitle");
  const items = itemTitles.flatMap((title, index) => {
    const name = text(title);
    if (!name) return [];
    const kind = text(formData.getAll("itemKind")[index]);
    const severity = text(formData.getAll("itemSeverity")[index]);
    const status = text(formData.getAll("itemStatus")[index]);
    return [
      {
        id: randomUUID(),
        reportId: id,
        kind: kind === "improvement" ? "improvement" : "risk",
        title: name,
        severity: SEVERITIES.has(severity) ? severity : "medium",
        status: ITEM_STATUS.has(status) ? status : "open",
        detail: text(formData.getAll("itemDetail")[index]),
      },
    ];
  });

  await db.delete(vulnerabilities).where(eq(vulnerabilities.reportId, id));
  await db.delete(portfolioItems).where(eq(portfolioItems.reportId, id));
  if (vulns.length > 0) await db.insert(vulnerabilities).values(vulns);
  if (items.length > 0) await db.insert(portfolioItems).values(items);

  revalidatePath("/");
  revalidatePath("/soc");
  revalidatePath(`/soc/${id}`);
  revalidatePath("/vulnerabilidades");
  revalidatePath("/riesgos");
  revalidatePath("/registrar");
  redirect("/registrar?ok=1");
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
