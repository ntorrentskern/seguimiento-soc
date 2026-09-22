"use client";

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

const tooltipStyle = {
  background: "#171e28",
  border: "1px solid #2c3848",
  borderRadius: 8,
  fontSize: 12,
};

export function AlertChart({ points }: { points: AlertPoint[] }) {
  if (points.length === 0) return null;
  return (
    <div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} barGap={2}>
            <CartesianGrid stroke="#2c3848" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#93a1b5", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "#6d7c90", fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
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

export function VulnChart({ points }: { points: VulnPoint[] }) {
  if (points.length === 0) return null;
  return (
    <div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <CartesianGrid stroke="#2c3848" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "#93a1b5", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fill: "#6d7c90", fontSize: 12 }} axisLine={false} tickLine={false} width={32} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="criticas" name="Críticas abiertas" stroke="#e07a6a" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="altas" name="Altas abiertas" stroke="#e0a45a" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <Legend
        items={[
          ["bg-critical", "Críticas abiertas"],
          ["bg-high", "Altas abiertas"],
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
