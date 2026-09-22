"use client";

import { useState } from "react";
import { saveMonth } from "@/app/(app)/registrar/actions";

export type VulnDraft = {
  fingerprint: string;
  title: string;
  asset: string;
  severity: string;
  status: string;
};

export type ItemDraft = {
  kind: "risk" | "improvement";
  title: string;
  severity: string;
  status: string;
  detail: string;
};

export type MonthDraft = {
  key: string;
  label: string;
  year: number;
  month: number;
  alertsGenerated: string;
  alertsEscalated: string;
  falsePositives: string;
  alertsUnanswered: string;
  risksOpen: string;
  risksCritical: string;
  risksVeryHigh: string;
  improvementsOpen: string;
  note: string;
  vulns: VulnDraft[];
  items: ItemDraft[];
};

const fieldClass =
  "mt-1 w-full rounded-md border border-line bg-sunken px-3 py-2 text-sm text-foreground outline-none focus:border-accent";

export function MonthForm({
  drafts,
  next,
  saved,
  error,
}: {
  drafts: MonthDraft[];
  next: MonthDraft;
  saved: boolean;
  error: string | null;
}) {
  const [selected, setSelected] = useState(next.key);
  const current = selected === next.key ? next : (drafts.find((draft) => draft.key === selected) ?? next);

  return (
    <div className="space-y-8">
      <label className="block max-w-sm text-sm">
        Mes
        <select
          value={selected}
          onChange={(event) => setSelected(event.target.value)}
          className={fieldClass}
        >
          <option value={next.key}>{next.label}</option>
          {drafts.map((draft) => (
            <option key={draft.key} value={draft.key}>
              {draft.label}
            </option>
          ))}
        </select>
      </label>
      {saved ? <p className="text-sm text-good">Mes guardado.</p> : null}
      {error ? <p className="text-sm text-bad">{error}</p> : null}
      <Editor key={current.key} draft={current} />
    </div>
  );
}

function Editor({ draft }: { draft: MonthDraft }) {
  const [vulns, setVulns] = useState(draft.vulns);
  const [items, setItems] = useState(draft.items);

  return (
    <form action={saveMonth} className="space-y-10">
      <input type="hidden" name="year" value={draft.year} />
      <input type="hidden" name="month" value={draft.month} />

      <section>
        <h2 className="text-base font-semibold">Cifras</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <NumberField label="Alertas generadas" name="alertsGenerated" defaultValue={draft.alertsGenerated} />
          <NumberField label="Alertas escaladas" name="alertsEscalated" defaultValue={draft.alertsEscalated} />
          <NumberField label="Falsos positivos" name="falsePositives" defaultValue={draft.falsePositives} />
          <NumberField label="Sin respuesta" name="alertsUnanswered" defaultValue={draft.alertsUnanswered} />
          <NumberField label="Riesgos abiertos" name="risksOpen" defaultValue={draft.risksOpen} />
          <NumberField label="Riesgos críticos" name="risksCritical" defaultValue={draft.risksCritical} />
          <NumberField label="Riesgos muy altos" name="risksVeryHigh" defaultValue={draft.risksVeryHigh} />
          <NumberField label="Mejoras abiertas" name="improvementsOpen" defaultValue={draft.improvementsOpen} />
        </div>
        <label className="mt-4 block text-sm">
          Nota del mes
          <input name="note" defaultValue={draft.note} className={fieldClass} />
        </label>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Vulnerabilidades</h2>
          <button
            type="button"
            className="rounded-md border border-line px-3 py-1.5 text-sm"
            onClick={() =>
              setVulns((rows) => [
                ...rows,
                { fingerprint: "", title: "", asset: "", severity: "high", status: "open" },
              ])
            }
          >
            Añadir
          </button>
        </div>
        <div className="mt-4 space-y-3">
          {vulns.map((row, index) => (
            <div key={`${row.fingerprint}-${index}`} className="grid gap-2 rounded-xl border border-line p-3 md:grid-cols-[1.4fr_0.8fr_0.7fr_0.7fr_auto]">
              <input type="hidden" name="vulnFingerprint" value={row.fingerprint} />
              <input
                name="vulnTitle"
                value={row.title}
                aria-label="Vulnerabilidad"
                placeholder="Vulnerabilidad"
                onChange={(event) => updateVuln(setVulns, index, { title: event.target.value })}
                className="rounded-md border border-line bg-sunken px-3 py-2 text-sm"
              />
              <input
                name="vulnAsset"
                value={row.asset}
                aria-label="Activo"
                placeholder="Activo"
                onChange={(event) => updateVuln(setVulns, index, { asset: event.target.value })}
                className="rounded-md border border-line bg-sunken px-3 py-2 text-sm"
              />
              <SeveritySelect
                name="vulnSeverity"
                value={row.severity}
                allowVeryHigh={false}
                onChange={(severity) => updateVuln(setVulns, index, { severity })}
              />
              <select
                name="vulnStatus"
                value={row.status}
                aria-label="Estado"
                onChange={(event) => updateVuln(setVulns, index, { status: event.target.value })}
                className="rounded-md border border-line bg-sunken px-3 py-2 text-sm"
              >
                <option value="open">Abierta</option>
                <option value="mitigated">Mitigada</option>
                <option value="closed">Cerrada</option>
                <option value="accepted">Aceptada</option>
              </select>
              <button
                type="button"
                className="px-2 text-sm text-muted"
                onClick={() => setVulns((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-semibold">Riesgos y mejoras</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-line px-3 py-1.5 text-sm"
              onClick={() =>
                setItems((rows) => [
                  ...rows,
                  { kind: "risk", title: "", severity: "high", status: "open", detail: "" },
                ])
              }
            >
              Añadir riesgo
            </button>
            <button
              type="button"
              className="rounded-md border border-line px-3 py-1.5 text-sm"
              onClick={() =>
                setItems((rows) => [
                  ...rows,
                  { kind: "improvement", title: "", severity: "medium", status: "open", detail: "" },
                ])
              }
            >
              Añadir mejora
            </button>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          {items.map((row, index) => (
            <div key={`${row.kind}-${index}`} className="grid gap-2 rounded-xl border border-line p-3 md:grid-cols-[0.7fr_1.4fr_0.7fr_0.7fr_1fr_auto]">
              <input type="hidden" name="itemKind" value={row.kind} />
              <p className="self-center text-sm text-muted">{row.kind === "risk" ? "Riesgo" : "Mejora"}</p>
              <input
                name="itemTitle"
                value={row.title}
                aria-label="Título"
                placeholder="Título"
                onChange={(event) => updateItem(setItems, index, { title: event.target.value })}
                className="rounded-md border border-line bg-sunken px-3 py-2 text-sm"
              />
              <SeveritySelect
                name="itemSeverity"
                value={row.severity}
                allowVeryHigh
                onChange={(severity) => updateItem(setItems, index, { severity })}
              />
              <select
                name="itemStatus"
                value={row.status}
                aria-label="Estado"
                onChange={(event) => updateItem(setItems, index, { status: event.target.value })}
                className="rounded-md border border-line bg-sunken px-3 py-2 text-sm"
              >
                <option value="open">Abierto</option>
                <option value="resolved">Resuelto</option>
              </select>
              <input
                name="itemDetail"
                value={row.detail}
                aria-label="Detalle"
                placeholder="Detalle"
                onChange={(event) => updateItem(setItems, index, { detail: event.target.value })}
                className="rounded-md border border-line bg-sunken px-3 py-2 text-sm"
              />
              <button
                type="button"
                className="px-2 text-sm text-muted"
                onClick={() => setItems((rows) => rows.filter((_, rowIndex) => rowIndex !== index))}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      </section>

      <button type="submit" className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-[#1c1408]">
        Guardar mes
      </button>
    </form>
  );
}

function NumberField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <label className="block text-sm">
      {label}
      <input name={name} type="number" min={0} defaultValue={defaultValue} className={fieldClass} />
    </label>
  );
}

function SeveritySelect({
  name,
  value,
  allowVeryHigh,
  onChange,
}: {
  name: string;
  value: string;
  allowVeryHigh: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <select
      name={name}
      value={value}
      aria-label="Severidad"
      onChange={(event) => onChange(event.target.value)}
      className="rounded-md border border-line bg-sunken px-3 py-2 text-sm"
    >
      <option value="critical">Crítica</option>
      {allowVeryHigh ? <option value="very-high">Muy alta</option> : null}
      <option value="high">Alta</option>
      <option value="medium">Media</option>
      <option value="low">Baja</option>
    </select>
  );
}

function updateVuln(
  setVulns: React.Dispatch<React.SetStateAction<VulnDraft[]>>,
  index: number,
  patch: Partial<VulnDraft>,
) {
  setVulns((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
}

function updateItem(
  setItems: React.Dispatch<React.SetStateAction<ItemDraft[]>>,
  index: number,
  patch: Partial<ItemDraft>,
) {
  setItems((rows) => rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
}
