import Link from "next/link";
import { formatDate, formatInt, severityLabel, severityTone } from "@/lib/format";
import { sortVulns } from "@/lib/metrics";
import type {
  ActionView,
  CaseView,
  CategoryView,
  FindingView,
  VulnView,
} from "@/lib/types";

const caseStatusLabel = {
  open: "Abierto",
  closed: "Cerrado",
  monitoring: "En seguimiento",
} as const;

const vulnStatusLabel = {
  open: "Abierta",
  mitigated: "Mitigada",
  accepted: "Riesgo aceptado",
  closed: "Cerrada",
} as const;

const actionStatusLabel = {
  pending: "Pendiente",
  done: "Hecha",
  carried: "Arrastrada",
} as const;

const priorityLabel = {
  high: "Alta",
  medium: "Media",
  low: "Baja",
} as const;

const kindLabel = {
  impersonation: "Suplantación",
  leak: "Filtración",
  reputation: "Reputación",
  exposure: "Exposición",
  other: "Otro",
} as const;

export function CategoryBars({ items }: { items: CategoryView[] }) {
  const max = Math.max(...items.map((item) => item.generated), 1);
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.name}>
          <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span>{item.name}</span>
            <span className="font-mono text-xs text-muted tabular-nums">
              {formatInt(item.escalated)} escaladas · {formatInt(item.generated)} generadas
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-sunken">
            <div
              className="h-full rounded-full bg-info"
              style={{ width: `${(item.generated / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CaseList({ items }: { items: CaseView[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">Este mes no hay casos escalados que seguir.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-line bg-raised px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2 py-0.5 text-xs ${severityTone(item.severity)}`}>
              {severityLabel[item.severity]}
            </span>
            <span className="text-xs text-faint">{caseStatusLabel[item.status]}</span>
          </div>
          <h3 className="mt-2 text-base font-medium">{item.title}</h3>
          <p className="mt-1 text-xs text-faint">
            {[item.asset, item.category, formatDate(item.openedOn)].filter(Boolean).join(" · ")}
          </p>
          <p className="mt-3 text-sm leading-6 text-muted">{item.summary}</p>
          {item.response ? (
            <p className="mt-2 text-sm leading-6">
              <span className="text-faint">Respuesta. </span>
              {item.response}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function VulnTable({
  items,
  showMonths = false,
}: {
  items: VulnView[];
  showMonths?: boolean;
}) {
  const sorted = sortVulns(items);
  if (sorted.length === 0) {
    return <p className="text-sm text-muted">No hay vulnerabilidades individualizadas en este corte.</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full min-w-[720px] text-left text-sm">
        <caption className="sr-only">Vulnerabilidades de seguimiento</caption>
        <thead className="bg-sunken text-xs tracking-wide text-faint uppercase">
          <tr>
            <th className="px-3 py-3 font-medium">Hallazgo</th>
            <th className="px-3 py-3 font-medium">Activo</th>
            <th className="px-3 py-3 font-medium">Severidad</th>
            <th className="px-3 py-3 font-medium">Estado</th>
            {showMonths ? <th className="px-3 py-3 font-medium">Meses abierta</th> : null}
            <th className="px-3 py-3 font-medium">Acción</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => (
            <tr key={item.id} className="border-t border-line align-top">
              <td className="px-3 py-3">
                <div className="font-medium">{item.title}</div>
                {item.cve ? <div className="mt-1 font-mono text-xs text-faint">{item.cve}</div> : null}
              </td>
              <td className="px-3 py-3 text-muted">{item.asset ?? "—"}</td>
              <td className="px-3 py-3">
                <span className={`rounded-full border px-2 py-0.5 text-xs ${severityTone(item.severity)}`}>
                  {severityLabel[item.severity]}
                </span>
              </td>
              <td className="px-3 py-3 text-muted">{vulnStatusLabel[item.status]}</td>
              {showMonths ? (
                <td className="px-3 py-3 font-mono tabular-nums">
                  {item.status === "open" ? formatInt(item.monthsOpen) : "—"}
                </td>
              ) : null}
              <td className="px-3 py-3 text-muted">{item.action ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ActionList({ items }: { items: ActionView[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-line px-4 py-3">
          <div className="flex flex-wrap items-center gap-2 text-xs text-faint">
            <span>Prioridad {priorityLabel[item.priority].toLowerCase()}</span>
            <span>·</span>
            <span>{actionStatusLabel[item.status]}</span>
          </div>
          <p className="mt-1 text-sm font-medium">{item.title}</p>
          {item.detail ? <p className="mt-1 text-sm leading-6 text-muted">{item.detail}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function FindingList({ items }: { items: FindingView[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">Este mes no hay hallazgos concretos que seguir.</p>;
  }
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="rounded-xl border border-line bg-raised px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs tracking-wide text-faint uppercase">{kindLabel[item.kind]}</span>
            <span className={`rounded-full border px-2 py-0.5 text-xs ${severityTone(item.severity)}`}>
              {severityLabel[item.severity]}
            </span>
            <span className="text-xs text-faint">{item.status}</span>
          </div>
          <h3 className="mt-2 text-base font-medium">{item.title}</h3>
          {item.target ? <p className="mt-1 text-xs text-faint">{item.target}</p> : null}
          <p className="mt-3 text-sm leading-6 text-muted">{item.detail}</p>
        </li>
      ))}
    </ul>
  );
}

export function MonthLink({ id, label }: { id: string; label: string }) {
  return (
    <Link href={`/soc/${id}`} className="font-medium text-foreground underline-offset-4 hover:underline">
      {label}
    </Link>
  );
}
