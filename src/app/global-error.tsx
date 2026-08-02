"use client";

// Root error boundary. Renders only when the root layout itself throws, so it
// must supply its own <html>/<body>. Kept dependency-free and inline-styled
// because globals.css may be exactly what failed to load.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#f8fafc",
          color: "#0f172a",
        }}
      >
        <div style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>
            Something went wrong on our side
          </h1>
          <p style={{ marginTop: 8, fontSize: 14, color: "#475569" }}>
            The page failed to load. Nothing you entered was sent anywhere. You
            can try again, and if it keeps happening, reload the browser.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: 20,
              height: 44,
              padding: "0 20px",
              borderRadius: 12,
              border: "none",
              background: "#1e3a8a",
              color: "#fff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
