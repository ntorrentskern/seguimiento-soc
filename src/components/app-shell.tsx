"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/acceso/actions";

const links = [
  { href: "/", label: "Panel" },
  { href: "/soc", label: "SOC" },
  { href: "/vulnerabilidades", label: "Vulnerabilidades" },
  { href: "/riesgos", label: "Riesgos y mejoras" },
  { href: "/vigilancia", label: "Vigilancia digital" },
  { href: "/registrar", label: "Registrar mes" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-sunken lg:min-h-full lg:border-r lg:border-b-0">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="grid h-8 w-8 place-items-center bg-accent font-mono text-sm font-semibold text-[#1c1408]">
            K
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-tight">Seguimiento</span>
            <span className="block text-xs text-faint">Kern Pharma</span>
          </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-3 lg:pb-0">
          {links.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                  active
                    ? "bg-raised text-foreground"
                    : "text-muted hover:bg-raised/70 hover:text-foreground"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 space-y-1 px-3 py-4">
          <ThemeToggle />
          <form action={logout}>
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2 text-left text-sm text-muted hover:bg-raised hover:text-foreground"
          >
            Salir
          </button>
        </form>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function ThemeToggle() {
  const [light, setLight] = useState(false);

  useEffect(() => {
    setLight(document.documentElement.getAttribute("data-theme") === "light");
  }, []);

  function toggle() {
    const next = !light;
    if (next) document.documentElement.setAttribute("data-theme", "light");
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("soc-theme", next ? "light" : "dark");
    setLight(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="w-full rounded-md px-3 py-2 text-left text-sm text-muted hover:bg-raised hover:text-foreground"
    >
      {light ? "Modo oscuro" : "Modo claro"}
    </button>
  );
}
