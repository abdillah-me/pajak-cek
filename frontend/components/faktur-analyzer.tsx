"use client";

import { useEffect, useRef, useState } from "react";
import { analyzeFaktur } from "@/lib/api";
import type {
  AnalyzeResponse,
  Confidence,
  ExtractedFakturData,
} from "@/lib/types";

type Status = "idle" | "loading" | "done" | "error";

const CONF: Record<Confidence, { label: string; color: string; tint: string; border: string }> = {
  high: {
    label: "Tinggi",
    color: "oklch(0.55 0.13 150)",
    tint: "oklch(0.95 0.035 150)",
    border: "oklch(0.8 0.07 150)",
  },
  medium: {
    label: "Sedang",
    color: "oklch(0.55 0.14 65)",
    tint: "oklch(0.96 0.03 65)",
    border: "oklch(0.8 0.09 65)",
  },
  low: {
    label: "Rendah",
    color: "oklch(0.55 0.19 25)",
    tint: "oklch(0.96 0.03 25)",
    border: "oklch(0.85 0.06 25)",
  },
};

const LABELS: Record<keyof ExtractedFakturData, string> = {
  npwp_penjual: "NPWP Penjual",
  npwp_pembeli: "NPWP Pembeli",
  tanggal_faktur: "Tanggal Faktur",
  nomor_seri_faktur: "Nomor Seri Faktur",
  dpp: "DPP",
  tarif_ppn: "Tarif PPN",
  ppn_terutang: "PPN Terutang",
};

const ORDER: (keyof ExtractedFakturData)[] = [
  "npwp_penjual",
  "npwp_pembeli",
  "tanggal_faktur",
  "nomor_seri_faktur",
  "dpp",
  "tarif_ppn",
  "ppn_terutang",
];

// Backend mengirim `issue.field` sebagai key mentah (mis. "tarif_ppn") — tampilkan
// label manusia kalau key-nya dikenal, kalau tidak pakai apa adanya.
const fieldLabel = (field: string) => LABELS[field as keyof ExtractedFakturData] ?? field;

const currency = (v: number) => "Rp " + v.toLocaleString("id-ID");

const FORMAT: Partial<Record<keyof ExtractedFakturData, (v: number) => string>> = {
  dpp: currency,
  ppn_terutang: currency,
  tarif_ppn: (v) => v + "%",
};

const BAND = {
  compliant: {
    bg: "oklch(0.95 0.035 150)",
    fg: "oklch(0.4 0.13 150)",
    dot: "oklch(0.55 0.13 150)",
    label: "Sesuai",
    desc: "Tidak ditemukan masalah kepatuhan.",
  },
  flagged: {
    bg: "oklch(0.96 0.03 25)",
    fg: "oklch(0.45 0.19 25)",
    dot: "oklch(0.55 0.19 25)",
    label: "Ada Isu",
    desc: "Periksa detail isu di bawah sebelum lanjut.",
  },
  inconclusive: {
    bg: "oklch(0.96 0.03 65)",
    fg: "oklch(0.42 0.1 65)",
    dot: "oklch(0.55 0.14 65)",
    label: "Tidak Yakin",
    desc: "Sistem tidak menemukan referensi regulasi yang cukup.",
  },
} as const;

const SOURCE_DESC: Record<string, string> = {
  "uu-hpp-2021.pdf": "UU No. 7/2021 (UU HPP) — dasar hukum PPN & tarif secara umum.",
  "petunjuk-teknis-faktur-pajak-pmk131.pdf": "PMK No. 131/2024 — dasar kenaikan tarif PPN ke 12%.",
  "sp4-pmk11-2025-dpp-nilai-lain.pdf": "PMK No. 11/2025 — ketentuan DPP Nilai Lain masa transisi.",
};

export function FakturAnalyzer() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [sourcesExpanded, setSourcesExpanded] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(f: File | null | undefined) {
    if (!f) return;
    if (!["image/png", "image/jpeg"].includes(f.type)) {
      setUploadError("Format file harus PNG atau JPEG.");
      setFile(null);
      setPreviewUrl(null);
      setStatus("idle");
      setResult(null);
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setUploadError("Ukuran file maksimal 10MB.");
      setFile(null);
      setPreviewUrl(null);
      setStatus("idle");
      setResult(null);
      return;
    }
    setUploadError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setStatus("idle");
    setResult(null);
    setApiError(null);
  }

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setUploadError(null);
    setStatus("idle");
    setLoadingStep(0);
    setResult(null);
    setApiError(null);
    setSourcesExpanded(false);
  }

  async function handleAnalyzeClick() {
    if (!file || status === "loading") return;
    setStatus("loading");
    setLoadingStep(1);
    setApiError(null);
    const stepTimer = setTimeout(() => setLoadingStep(2), 900);
    try {
      const res = await analyzeFaktur(file);
      setResult(res);
      setStatus("done");
    } catch (err) {
      setApiError(err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui");
      setStatus("error");
    } finally {
      clearTimeout(stepTimer);
    }
  }

  const hasImage = !!previewUrl;
  const analyzeDisabled = !file || status === "loading";

  const unreadable = status === "done" && result ? !result.extraction.readable : false;
  const showSuccess = status === "done" && result && !unreadable;

  const fieldRows =
    showSuccess && result?.extraction.data
      ? ORDER.map((key) => {
          const f = result.extraction.data![key];
          const c = CONF[f.confidence];
          const flagged = f.confidence !== "high";
          const format = FORMAT[key];
          const value =
            f.value === null ? "—" : format ? format(f.value as number) : String(f.value);
          return { key, label: LABELS[key], value, conf: c, flagged };
        })
      : [];

  const compliance = showSuccess ? result?.compliance ?? null : null;
  const band = compliance ? BAND[compliance.status] : null;
  const sourcesList = compliance
    ? compliance.sources_used.map((name) => ({
        name,
        desc: SOURCE_DESC[name] ?? "Dokumen regulasi rujukan.",
      }))
    : [];

  return (
    <div style={{ display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
      {/* Left: upload/preview panel */}
      <div style={{ flex: "1 1 340px", minWidth: 280, position: "sticky", top: 90 }}>
        {hasImage ? (
          <div
            style={{
              border: "1px solid oklch(0.85 0.045 210)",
              borderRadius: 14,
              overflow: "hidden",
              background: "white",
              boxShadow: "0 8px 24px -12px oklch(0.5 0.18 210 / 0.2)",
            }}
          >
            <div style={{ position: "relative", overflow: "hidden" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl!}
                alt="Preview faktur"
                style={{ width: "100%", display: "block", objectFit: "cover", maxHeight: 420 }}
              />
              {status === "loading" && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    height: 2,
                    background: "oklch(0.5 0.18 210)",
                    boxShadow: "0 0 12px 2px oklch(0.5 0.18 210 / 0.7)",
                    animation: "pcScan 1.8s linear infinite",
                  }}
                />
              )}
            </div>
            <div
              style={{
                padding: "12px 16px",
                borderTop: "1px solid oklch(0.89 0.006 250)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: "12.5px",
                  fontFamily: "'IBM Plex Mono', monospace",
                  color: "oklch(0.48 0.006 250)",
                }}
              >
                {file?.name ?? ""}
              </span>
              <button
                type="button"
                onClick={reset}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "oklch(0.45 0.18 210)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                Ganti gambar
              </button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={(e) => {
              e.preventDefault();
              handleFile(e.dataTransfer.files?.[0]);
            }}
            onDragOver={(e) => e.preventDefault()}
            style={{
              position: "relative",
              border: "1.5px dashed oklch(0.85 0.006 250)",
              borderRadius: 14,
              padding: "52px 24px",
              textAlign: "center",
              cursor: "pointer",
              background: "white",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                width: 16,
                height: 16,
                borderTop: "2px solid oklch(0.5 0.18 210)",
                borderLeft: "2px solid oklch(0.5 0.18 210)",
                borderRadius: "3px 0 0 0",
              }}
            />
            <span
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                width: 16,
                height: 16,
                borderTop: "2px solid oklch(0.5 0.18 210)",
                borderRight: "2px solid oklch(0.5 0.18 210)",
                borderRadius: "0 3px 0 0",
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: 10,
                left: 10,
                width: 16,
                height: 16,
                borderBottom: "2px solid oklch(0.5 0.18 210)",
                borderLeft: "2px solid oklch(0.5 0.18 210)",
                borderRadius: "0 0 0 3px",
              }}
            />
            <span
              style={{
                position: "absolute",
                bottom: 10,
                right: 10,
                width: 16,
                height: 16,
                borderBottom: "2px solid oklch(0.5 0.18 210)",
                borderRight: "2px solid oklch(0.5 0.18 210)",
                borderRadius: "0 0 3px 0",
              }}
            />
            <p style={{ fontSize: "14.5px", color: "oklch(0.48 0.006 250)", margin: 0 }}>
              Klik atau seret gambar faktur pajak ke sini (PNG/JPEG, maks 10MB)
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => handleFile(e.target.files?.[0])}
          style={{ display: "none" }}
        />

        {uploadError && (
          <div
            style={{
              marginTop: 12,
              padding: "12px 16px",
              borderRadius: 10,
              background: "oklch(0.96 0.03 25)",
              border: "1px solid oklch(0.85 0.06 25)",
              color: "oklch(0.5 0.19 25)",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {uploadError}
          </div>
        )}

        {apiError && (
          <div
            style={{
              marginTop: 12,
              padding: "12px 16px",
              borderRadius: 10,
              background: "oklch(0.96 0.03 25)",
              border: "1px solid oklch(0.85 0.06 25)",
              color: "oklch(0.5 0.19 25)",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {apiError}
          </div>
        )}

        <button
          type="button"
          onClick={handleAnalyzeClick}
          disabled={analyzeDisabled}
          style={{
            marginTop: 16,
            width: "100%",
            background: "oklch(0.5 0.18 210)",
            color: "white",
            padding: "14px 22px",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: 15,
            border: "none",
            boxShadow: "0 8px 20px -6px oklch(0.5 0.18 210 / 0.5)",
            cursor: analyzeDisabled ? "not-allowed" : "pointer",
            opacity: analyzeDisabled ? 0.55 : 1,
          }}
        >
          {status === "loading" ? "Menganalisis..." : "Analisis Faktur"}
        </button>
      </div>

      {/* Right: results panel */}
      <div style={{ flex: "2 1 480px", minWidth: 320 }}>
        {status === "loading" && (
          <div
            style={{
              border: "1px solid oklch(0.85 0.045 210)",
              borderRadius: 14,
              padding: 24,
              background: "white",
              boxShadow: "0 8px 24px -12px oklch(0.5 0.18 210 / 0.18)",
            }}
          >
            <p style={{ fontWeight: 700, fontSize: 15, margin: "0 0 16px" }}>
              Menganalisis faktur...
            </p>
            <div
              style={{
                height: 4,
                borderRadius: 99,
                background: "oklch(0.92 0.006 250)",
                overflow: "hidden",
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 99,
                  background: "linear-gradient(90deg, oklch(0.5 0.18 210), oklch(0.68 0.16 150))",
                  transition: "width 0.6s ease",
                  width: loadingStep >= 2 ? "100%" : "45%",
                }}
              />
            </div>
            <div
              style={{
                background: "oklch(0.14 0.01 250)",
                borderRadius: 10,
                padding: "16px 18px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 13,
                lineHeight: 2,
                color: "oklch(0.6 0.18 210)",
              }}
            >
              <div>
                &gt; membaca gambar faktur... <span style={{ color: "oklch(0.68 0.16 150)" }}>[OK]</span>
              </div>
              <div style={{ opacity: loadingStep >= 1 ? 1 : 0.35 }}>
                &gt; mengekstrak 7 field data...
                {loadingStep >= 2 && (
                  <span style={{ color: "oklch(0.68 0.16 150)" }}> [OK]</span>
                )}
              </div>
              <div style={{ opacity: loadingStep >= 2 ? 1 : 0.35 }}>
                &gt; mencocokkan ke basis regulasi PPN...
                <span style={{ animation: "pcBlink 1s step-end infinite" }}>_</span>
              </div>
            </div>
          </div>
        )}

        {status === "idle" && (
          <div
            style={{
              border: "1.5px dashed oklch(0.89 0.006 250)",
              borderRadius: 14,
              padding: 40,
              textAlign: "center",
            }}
          >
            <p
              style={{
                color: "oklch(0.62 0.006 250)",
                fontSize: 14,
                fontFamily: "'IBM Plex Mono', monospace",
                margin: 0,
              }}
            >
              {"// hasil akan tampil di sini setelah analisis selesai"}
            </p>
          </div>
        )}

        {status === "error" && (
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              background: "oklch(0.96 0.03 25)",
              border: "1px solid oklch(0.85 0.06 25)",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "oklch(0.5 0.19 25)",
                marginBottom: 6,
              }}
            >
              Analisis gagal
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "oklch(0.4 0.15 25)", lineHeight: 1.5 }}>
              {apiError}
            </p>
          </div>
        )}

        {status === "done" && unreadable && result && (
          <div
            style={{
              padding: 20,
              borderRadius: 12,
              background: "oklch(0.96 0.03 25)",
              border: "1px solid oklch(0.85 0.06 25)",
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: "oklch(0.5 0.19 25)",
                marginBottom: 6,
              }}
            >
              Gambar tidak dapat dibaca
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "oklch(0.4 0.15 25)", lineHeight: 1.5 }}>
              {result.extraction.warning}
            </p>
          </div>
        )}

        {showSuccess && result && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {result.extraction.warning && (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: 10,
                  background: "oklch(0.96 0.03 65)",
                  border: "1px solid oklch(0.83 0.07 65)",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: "13.5px",
                    color: "oklch(0.45 0.14 65)",
                    marginBottom: 4,
                  }}
                >
                  Catatan ekstraksi
                </div>
                <p style={{ margin: 0, fontSize: "13.5px", color: "oklch(0.4 0.1 65)" }}>
                  {result.extraction.warning}
                </p>
              </div>
            )}

            <div
              style={{
                border: "1px solid oklch(0.89 0.006 250)",
                borderRadius: 14,
                background: "white",
                padding: 24,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 4,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Data Faktur Terekstrak</h3>
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "10.5px",
                    color: "oklch(0.62 0.006 250)",
                    letterSpacing: "0.04em",
                  }}
                >
                  7 FIELD
                </span>
              </div>
              <p style={{ margin: "0 0 16px", fontSize: "13.5px", color: "oklch(0.48 0.006 250)" }}>
                Nilai dengan confidence rendah berarti model tidak yakin — periksa manual.
              </p>
              {fieldRows.map((row) => (
                <div
                  key={row.key}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                    padding: row.flagged ? "10px 12px" : "10px 2px",
                    borderLeft: `3px solid ${row.flagged ? row.conf.color : "transparent"}`,
                    background: row.flagged ? row.conf.tint : "transparent",
                    borderRadius: row.flagged ? 6 : 0,
                    borderBottom: "1px solid oklch(0.92 0.006 250)",
                  }}
                >
                  <span style={{ fontSize: 14, color: "oklch(0.48 0.006 250)" }}>{row.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "14.5px",
                        fontFamily: "'IBM Plex Mono', monospace",
                      }}
                    >
                      {row.value}
                    </span>
                    <span
                      style={{
                        fontSize: "10.5px",
                        fontWeight: 600,
                        padding: "3px 9px",
                        borderRadius: 999,
                        whiteSpace: "nowrap",
                        fontFamily: "'IBM Plex Mono', monospace",
                        background: row.conf.tint,
                        color: row.conf.color,
                        border: `1px solid ${row.conf.border}`,
                      }}
                    >
                      {row.conf.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {compliance && band && (
              <div
                style={{
                  border: "1px solid oklch(0.89 0.006 250)",
                  borderRadius: 14,
                  background: "white",
                  overflow: "hidden",
                }}
              >
                <div style={{ padding: "20px 24px", background: band.bg }}>
                  <p
                    style={{
                      margin: "0 0 4px",
                      fontSize: "11.5px",
                      fontWeight: 700,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: band.fg,
                      opacity: 0.85,
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    Hasil Pemeriksaan Kepatuhan
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: "50%",
                        background: band.dot,
                      }}
                    />
                    <span style={{ fontWeight: 800, fontSize: 21, color: band.fg }}>
                      {band.label}
                    </span>
                  </div>
                  <p style={{ margin: "6px 0 0", fontSize: "13.5px", color: band.fg, opacity: 0.9 }}>
                    {band.desc}
                  </p>
                </div>
                <div style={{ padding: 24 }}>
                  {compliance.status === "inconclusive" && (
                    <p
                      style={{
                        fontStyle: "italic",
                        fontSize: "13.5px",
                        color: "oklch(0.48 0.006 250)",
                        margin: "0 0 16px",
                        lineHeight: 1.5,
                      }}
                    >
                      Sistem tidak menemukan referensi regulasi yang cukup untuk memastikan
                      kepatuhan tarif — bukan berarti sudah pasti benar.
                    </p>
                  )}
                  {compliance.issues.length === 0 && compliance.status !== "inconclusive" && (
                    <p style={{ margin: 0, fontSize: 14, color: "oklch(0.48 0.006 250)" }}>
                      Tidak ada masalah kepatuhan yang ditemukan.
                    </p>
                  )}
                  {compliance.issues.map((issue, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 12,
                        padding: "14px 16px",
                        borderRadius: 10,
                        background: "oklch(0.96 0.03 25)",
                        border: "1px solid oklch(0.85 0.06 25)",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 14,
                          color: "oklch(0.5 0.19 25)",
                          marginBottom: 4,
                        }}
                      >
                        {fieldLabel(issue.field)}
                      </div>
                      <p
                        style={{
                          margin: "0 0 6px",
                          fontSize: "13.5px",
                          color: "oklch(0.35 0.15 25)",
                          lineHeight: 1.5,
                        }}
                      >
                        {issue.message}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          color: "oklch(0.45 0.12 25)",
                          opacity: 0.8,
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        Sumber: {issue.regulation_source}
                      </p>
                    </div>
                  ))}
                  {sourcesList.length > 0 && (
                    <div
                      style={{
                        marginTop: 16,
                        paddingTop: 16,
                        borderTop: "1px solid oklch(0.89 0.006 250)",
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSourcesExpanded((v) => !v)}
                        style={{
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          color: "oklch(0.48 0.006 250)",
                          fontFamily: "'IBM Plex Mono', monospace",
                        }}
                      >
                        REGULASI DIRUJUK ({sourcesList.length}) {sourcesExpanded ? "▲" : "▼"}
                      </button>
                      {sourcesExpanded && (
                        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                          {sourcesList.map((src) => (
                            <div
                              key={src.name}
                              style={{
                                padding: "10px 12px",
                                borderRadius: 8,
                                background: "oklch(0.97 0.004 250)",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "12.5px",
                                  fontWeight: 600,
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  color: "oklch(0.45 0.18 210)",
                                }}
                              >
                                {src.name}
                              </div>
                              <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "oklch(0.48 0.006 250)" }}>
                                {src.desc}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
