import type { Metadata } from "next";
import { VulnTable } from "@/components/records";
import { DataState, PageHeader, Section } from "@/components/ui";
import { loadSoc } from "@/db/queries";
import { formatInt } from "@/lib/format";

export const metadata: Metadata = { title: "Vulnerabilidades" };

export default async function VulnerabilitiesPage() {
  const soc = await loadSoc();
  const latest = soc.status === "ok" ? soc.data[0] : null;
  const open = latest?.vulnerabilities.filter((item) => item.status === "open") ?? [];
  const accepted = latest?.vulnerabilities.filter((item) => item.status === "accepted") ?? [];
  const closed = latest?.vulnerabilities.filter((item) => item.status === "mitigated" || item.status === "closed") ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Vulnerabilidades"
        title="Lo que sigue abierto"
        description="El listado es el del último informe, cruzado con los meses anteriores para ver cuánto lleva cada hallazgo sin cerrar. El volumen por severidad sale del agregado del informe; aquí solo entran las que merecen seguimiento."
      />
      {latest ? (
        <>
          <p className="mb-6 text-sm text-muted">
            Corte de {latest.label}. Críticas abiertas: {formatInt(latest.metrics.vulnsOpen?.critical ?? null)}. Altas abiertas: {formatInt(latest.metrics.vulnsOpen?.high ?? null)}.
          </p>
          <Section title="Abiertas">
            <VulnTable items={open} showMonths />
          </Section>
          {accepted.length > 0 ? (
            <Section title="Riesgo aceptado">
              <VulnTable items={accepted} />
            </Section>
          ) : null}
          {closed.length > 0 ? (
            <Section title="Cerradas o mitigadas en este corte">
              <VulnTable items={closed} />
            </Section>
          ) : null}
        </>
      ) : (
        <DataState title="Sin inventario todavía">
          {soc.status === "unconfigured"
            ? "Conecta Neon para guardar el inventario."
            : soc.status === "error"
              ? "No se ha podido leer la base de datos."
              : "Cuando haya un informe cargado, verás qué vulnerabilidades siguen abiertas y desde qué mes."}
        </DataState>
      )}
    </>
  );
}
