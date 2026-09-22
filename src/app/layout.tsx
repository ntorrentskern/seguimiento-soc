import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Seguimiento",
    template: "%s · Seguimiento Kern",
  },
  description: "Seguimiento mensual del SOC y de la vigilancia digital de Kern Pharma.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-background text-foreground">
        <Script id="theme" strategy="beforeInteractive">
          {`try{if(localStorage.getItem("soc-theme")==="light")document.documentElement.setAttribute("data-theme","light")}catch(e){}`}
        </Script>
        {children}
      </body>
    </html>
  );
}
