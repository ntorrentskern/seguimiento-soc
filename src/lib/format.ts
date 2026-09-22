import type { Severity } from "@/lib/types";

export function formatInt(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("es-ES").format(value);
}

export function formatPct(part: number | null, total: number | null) {
  if (part == null || total == null || total <= 0) return null;
  return new Intl.NumberFormat("es-ES", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(part / total);
}

export function formatHours(hours: number | null) {
  if (hours == null || Number.isNaN(hours)) return "—";
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  return `${new Intl.NumberFormat("es-ES", { maximumFractionDigits: 1 }).format(hours)} h`;
}

export function formatDate(iso: string | null) {
  if (!iso) return null;
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function formatDelta(delta: number | null) {
  if (delta == null) return null;
  if (delta === 0) return "Igual que el mes anterior";
  const sign = delta > 0 ? "+" : "−";
  return `${sign}${formatInt(Math.abs(delta))} vs mes anterior`;
}

export function delta(current: number | null, previous: number | null) {
  if (current == null || previous == null) return null;
  return current - previous;
}

export const severityLabel: Record<Severity, string> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export function severityTone(severity: Severity) {
  if (severity === "critical") return "text-critical border-critical/40 bg-critical/10";
  if (severity === "high") return "text-high border-high/40 bg-high/10";
  if (severity === "medium") return "text-medium border-medium/40 bg-medium/10";
  return "text-low border-low/40 bg-low/10";
}
