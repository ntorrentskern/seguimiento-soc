import type { Metadata } from "next";
import { VulnTable } from "@/components/records";
import { DataState, PageHeader, Section } from "@/components/ui";
import { loadSoc } from "@/db/queries";

export const metadata: Metadata = { title: "Vulnerabilidades" };

export default async function VulnerabilitiesPage() {
  const soc = await loadSoc();
  const latest = soc.status === "ok" ? soc.data[0] : null;
  const open = latest?.vulnerabilities.filter((item) => item.status === "open") ?? [];
  const accepted = latest?.vulnerabilities.filter((item) => item.status === "accepted") ?? [];
  const closed = latest?.vulnerabilities.filter((item) => item.status === "mitigated" || item.status === "closed") ?? [];

  return (
    <>
      <PageHeader title="Vulnerabilidades" />
      {latest ? (
        <>
          <p className="mb-6 text-sm text-faint">{latest.label}</p>
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
        <DataState title={soc.status === "empty" ? "Sin vulnerabilidades" : "Sin conexión con la base de datos"} />
      )}
    </>
  );
}
