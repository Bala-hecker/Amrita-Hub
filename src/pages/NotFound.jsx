// src/pages/NotFound.jsx
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

export default function NotFound() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "404 — Page Not Found | Amrita Hub";
  }, []);

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
      fontFamily: "var(--font)",
      textAlign: "center",
      padding: "2rem",
      gap: "1.5rem"
    }}>
      {/* Big 404 */}
      <div style={{
        fontSize: "8rem",
        fontWeight: 900,
        lineHeight: 1,
        background: "linear-gradient(135deg, var(--cr) 0%, #ff6b6b 100%)",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        backgroundClip: "text",
        letterSpacing: "-4px"
      }}>
        404
      </div>

      {/* Logo mark */}
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "-1rem" }}>
        <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--cr)" }}>Amrita</span>
        <span style={{ fontSize: "1.4rem", fontWeight: 900, color: "var(--txt)", opacity: 0.5 }}>Hub</span>
      </div>

      <div style={{ maxWidth: "420px" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--txt)", marginBottom: "0.5rem" }}>
          Page Not Found
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
          The page you're looking for doesn't exist or may have been moved. 
          Head back to find study resources, PYQs and notes.
        </p>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
        <button
          className="btn btn-primary"
          onClick={() => navigate("/")}
          style={{ minWidth: "140px" }}
        >
          🏠 Go Home
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => navigate(-1)}
          style={{ minWidth: "140px" }}
        >
          ← Go Back
        </button>
      </div>

      {/* Quick links */}
      <div style={{ display: "flex", gap: "20px", marginTop: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        {[
          { label: "📚 Resources", path: "/" },
          { label: "🔥 Trending", path: "/trending" },
          { label: "📖 Curriculum", path: "/curriculum" },
          { label: "📋 Requests", path: "/requests" },
        ].map(({ label, path }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              background: "none",
              border: "none",
              color: "var(--cr)",
              fontWeight: 600,
              fontSize: "0.88rem",
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              fontFamily: "var(--font)"
            }}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
