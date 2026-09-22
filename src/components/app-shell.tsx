"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Panel" },
  { href: "/soc", label: "SOC" },
  { href: "/vulnerabilidades", label: "Vulnerabilidades" },
  { href: "/vigilancia", label: "Vigilancia digital" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-full lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-line bg-sunken lg:min-h-full lg:border-r lg:border-b-0">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="grid h-8 w-8 place-items-center bg-accent font-mono text-sm font-semibold text-sunken">
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
        <p className="hidden px-6 pt-8 text-xs leading-5 text-faint lg:block">
          Cifras, casos y acciones de los informes mensuales. El texto genérico de cada PDF no se guarda.
        </p>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
