import Link from "next/link";
import type { Metadata } from "next";
import { FakturAnalyzer } from "@/components/faktur-analyzer";

export const metadata: Metadata = {
  title: "Analisis Faktur Pajak · Pajak-Cek",
  description:
    "Upload gambar faktur — sistem membaca datanya, lalu mengecek kepatuhannya terhadap regulasi PPN.",
};

export default function AnalisisPage() {
  return (
    <div
      style={{
        fontFamily: "'Manrope', system-ui, sans-serif",
        background: "oklch(0.99 0.003 250)",
        color: "oklch(0.17 0.006 250)",
        minHeight: "100vh",
        backgroundImage:
          "linear-gradient(oklch(0.93 0.006 250) 1px, transparent 1px), linear-gradient(90deg, oklch(0.93 0.006 250) 1px, transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    >
      <nav
        style={{
          borderBottom: "1px solid oklch(0.89 0.006 250)",
          background: "oklch(0.99 0.003 250 / 0.9)",
          backdropFilter: "blur(6px)",
          position: "sticky",
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding: "14px clamp(20px,5vw,48px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <Link href="/" style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.48 0.006 250)" }}>
              ← Beranda
            </Link>
            <div style={{ width: 1, height: 18, background: "oklch(0.89 0.006 250)" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  background: "oklch(0.5 0.18 210)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 12,
                }}
              >
                PC
              </div>
              <span style={{ fontWeight: 700, fontSize: 15 }}>Pajak-Cek</span>
            </div>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "11.5px",
              color: "oklch(0.45 0.18 210)",
              letterSpacing: "0.04em",
              background: "oklch(0.95 0.03 210)",
              padding: "6px 12px",
              borderRadius: 999,
              border: "1px solid oklch(0.85 0.045 210)",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "oklch(0.5 0.18 210)",
                animation: "pcPulseDot 1.6s ease-in-out infinite",
              }}
            />
            VISION + RAG AKTIF
          </div>
        </div>
      </nav>

      <header style={{ maxWidth: 1180, margin: "0 auto", padding: "clamp(40px,6vw,64px) clamp(20px,5vw,48px) 32px" }}>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 20,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          {["COMPUTER VISION", "RAG · REGULASI PPN", "CONFIDENCE PER-FIELD"].map((badge) => (
            <span
              key={badge}
              style={{
                fontSize: 11,
                padding: "5px 10px",
                borderRadius: 6,
                border: "1px solid oklch(0.89 0.006 250)",
                color: "oklch(0.48 0.006 250)",
                letterSpacing: "0.03em",
              }}
            >
              {badge}
            </span>
          ))}
        </div>
        <h1
          style={{
            fontSize: "clamp(30px,4vw,44px)",
            fontWeight: 800,
            letterSpacing: "-0.01em",
            margin: "0 0 12px",
          }}
        >
          Analisis Faktur Pajak
        </h1>
        <p style={{ color: "oklch(0.48 0.006 250)", fontSize: "15.5px", maxWidth: 600, margin: 0 }}>
          Upload gambar faktur — sistem membaca datanya, lalu mengecek kepatuhannya terhadap
          regulasi PPN. Setiap hasil menyertakan tingkat keyakinan dan sumber rujukannya.
        </p>
      </header>

      <main style={{ maxWidth: 1180, margin: "0 auto", padding: "0 clamp(20px,5vw,48px) 100px" }}>
        <FakturAnalyzer />
      </main>
    </div>
  );
}
