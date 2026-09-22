"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type AlertPoint = {
  label: string;
  escaladas: number | null;
  falsosPositivos: number | null;
  sinRespuesta: number | null;
};

export type VulnPoint = {
  label: string;
  criticas: number | null;
  altas: number | null;
};

export type RiskPoint = {
  label: string;
  riesgos: number | null;
  mejoras: number | null;
};

function useSurface() {
  const [surface, setSurface] = useState({
    bg: "#171e28",
    line: "#2c3848",
    text: "#93a1b5",
    faint: "#6d7c90",
    fg: "#e7eef6",
  });

  useEffect(() => {
    const read = () => {
      const styles = getComputedStyle(document.documentElement);
      setSurface({
        bg: styles.getPropertyValue("--raised").trim() || "#171e28",
        line: styles.getPropertyValue("--line").trim() || "#2c3848",
        text: styles.getPropertyValue("--muted").trim() || "#93a1b5",
        faint: styles.getPropertyValue("--faint").trim() || "#6d7c90",
        fg: styles.getPropertyValue("--foreground").trim() || "#e7eef6",
      });
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    return () => observer.disconnect();
  }, []);

  return surface;
}

export function AlertChart({ points }: { points: AlertPoint[] }) {
  const surface = useSurface();
  if (points.length === 0) return null;
  return (
    <div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} barGap={2}>
            <CartesianGrid stroke={surface.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: surface.text, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: surface.faint, fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip
              contentStyle={{ background: surface.bg, border: `1px solid ${surface.line}`, borderRadius: 8, fontSize: 12, color: surface.fg }}
              cursor={{ fill: "rgba(127,127,127,0.08)" }}
            />
            <Bar dataKey="escaladas" name="Escaladas" fill="#e07a6a" radius={[3, 3, 0, 0]} />
            <Bar dataKey="falsosPositivos" name="Falsos positivos" fill="#7ea2e0" radius={[3, 3, 0, 0]} />
            <Bar dataKey="sinRespuesta" name="Sin respuesta" fill="#d7a45a" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          ["bg-critical", "Escaladas"],
          ["bg-info", "Falsos positivos"],
          ["bg-accent", "Sin respuesta"],
        ]}
      />
    </div>
  );
}

export function RiskChart({ points }: { points: RiskPoint[] }) {
  const surface = useSurface();
  if (points.length === 0) return null;
  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid stroke={surface.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: surface.text, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: surface.faint, fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip contentStyle={{ background: surface.bg, border: `1px solid ${surface.line}`, borderRadius: 8, fontSize: 12, color: surface.fg }} />
            <Line type="monotone" dataKey="riesgos" name="Riesgos" stroke="#e07a6a" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="mejoras" name="Mejoras" stroke="#7ea2e0" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          ["bg-critical", "Riesgos"],
          ["bg-info", "Mejoras"],
        ]}
      />
    </div>
  );
}

export function VulnChart({ points }: { points: VulnPoint[] }) {
  const surface = useSurface();
  if (points.length === 0) return null;
  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid stroke={surface.line} vertical={false} />
            <XAxis dataKey="label" tick={{ fill: surface.text, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: surface.faint, fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip contentStyle={{ background: surface.bg, border: `1px solid ${surface.line}`, borderRadius: 8, fontSize: 12, color: surface.fg }} />
            <Line type="monotone" dataKey="criticas" name="Críticas" stroke="#e07a6a" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="altas" name="Muy altas" stroke="#e0a45a" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          ["bg-critical", "Críticas"],
          ["bg-high", "Muy altas"],
        ]}
      />
    </div>
  );
}

function Legend({ items }: { items: [string, string][] }) {
  return (
    <ul className="mt-3 flex flex-wrap gap-4 text-xs text-muted">
      {items.map(([color, label]) => (
        <li key={label} className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${color}`} />
          {label}
        </li>
      ))}
    </ul>
  );
}
