"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "sans-serif", background: "#10151c", color: "#e7eef6", padding: 32 }}>
        <h1>No se ha podido cargar la aplicación</h1>
        <button type="button" onClick={() => reset()}>
          Reintentar
        </button>
      </body>
    </html>
  );
}
