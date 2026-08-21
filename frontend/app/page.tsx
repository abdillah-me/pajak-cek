import Link from "next/link";

const steps = [
  {
    n: "01",
    title: "Upload gambar faktur",
    desc: "PNG atau JPEG, maksimal 10MB — foto kamera atau hasil scan sama-sama bisa.",
  },
  {
    n: "02",
    title: "Sistem membaca & mengekstrak data",
    desc: "Model vision membaca 7 field kunci dari faktur, masing-masing dengan tingkat keyakinannya sendiri.",
  },
  {
    n: "03",
    title: "Kepatuhan PPN dicek otomatis",
    desc: "Data dicocokkan ke dokumen regulasi PPN terbaru lewat pencarian dokumen — bukan hafalan model.",
  },
];

const features = [
  {
    n: "01",
    title: "Ekstraksi 7 field kunci",
    desc: "NPWP penjual & pembeli, tanggal, nomor seri, DPP, tarif, dan PPN terutang — langsung terbaca dari gambar.",
  },
  {
    n: "02",
    title: "Confidence di tiap field",
    desc: "Bukan cuma status akhir — tiap nilai punya tingkat keyakinan sendiri, supaya jelas mana yang perlu dicek manual.",
  },
  {
    n: "03",
    title: "Kepatuhan yang bisa ditelusuri",
    desc: "Setiap hasil kepatuhan menyertakan nama dokumen regulasi yang jadi rujukan.",
  },
  {
    n: "04",
    title: "Tanpa akun, tanpa instalasi",
    desc: "Buka di browser, upload gambar, langsung dapat hasilnya.",
  },
];

const confidenceLegend = [
  {
    label: "Tinggi",
    color: "oklch(0.55 0.13 150)",
    desc: "Model yakin dengan nilainya — bisa langsung dipakai.",
  },
  {
    label: "Sedang",
    color: "oklch(0.55 0.14 65)",
    desc: "Cukup yakin, tapi ada baiknya dilihat sekilas.",
  },
  {
    label: "Rendah",
    color: "oklch(0.55 0.19 25)",
    desc: "Model tidak yakin — wajib dicek manual sebelum dipakai.",
  },
];

const previewRows = [
  { label: "NPWP Penjual", dot: "oklch(0.55 0.13 150)" },
  { label: "Tanggal Faktur", dot: "oklch(0.55 0.13 150)" },
  { label: "Tarif PPN", dot: "oklch(0.55 0.14 65)" },
  { label: "PPN Terutang", dot: "oklch(0.55 0.19 25)" },
];

export default function Home() {
  return (
    <div
      style={{
        fontFamily: "'Manrope', system-ui, sans-serif",
        background: "oklch(0.99 0.003 250)",
        color: "oklch(0.17 0.006 250)",
        minHeight: "100vh",
      }}
    >
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "oklch(0.99 0.003 250 / 0.92)",
          backdropFilter: "blur(6px)",
          borderBottom: "1px solid oklch(0.89 0.006 250)",
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
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "oklch(0.5 0.1 220)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              PC
            </div>
            <span style={{ fontWeight: 700, fontSize: 17 }}>Pajak-Cek</span>
          </div>
          <div className="pc-nav-links">
            <a
              href="#cara-kerja"
              className="pc-nav-section-link"
              style={{ fontSize: 14, fontWeight: 600, color: "oklch(0.48 0.006 250)" }}
            >
              Cara Kerja
            </a>
            <a
              href="#fitur"
              className="pc-nav-section-link"
              style={{ fontSize: 14, fontWeight: 600, color: "oklch(0.48 0.006 250)" }}
            >
              Fitur
            </a>
            <a
              href="#trust"
              className="pc-nav-section-link"
              style={{ fontSize: 14, fontWeight: 600, color: "oklch(0.48 0.006 250)" }}
            >
              Transparansi
            </a>
            <Link
              href="/analisis"
              style={{
                background: "oklch(0.17 0.006 250)",
                color: "white",
                padding: "9px 18px",
                borderRadius: 999,
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              Coba Sekarang
            </Link>
          </div>
        </div>
      </nav>

      <section
        style={{
          maxWidth: 1180,
          margin: "0 auto",
          padding: "clamp(64px,10vw,120px) clamp(20px,5vw,48px) clamp(56px,8vw,96px)",
        }}
      >
        <div style={{ maxWidth: 720 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "oklch(0.5 0.1 220)",
              }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "oklch(0.5 0.1 220)",
              }}
            >
              Untuk staff &amp; konsultan pajak
            </span>
          </div>
          <h1
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 400,
              fontSize: "clamp(32px,5.5vw,64px)",
              lineHeight: 1.08,
              letterSpacing: "-0.01em",
              margin: "0 0 20px",
            }}
          >
            Upload faktur pajak. Dapatkan data terekstrak dan status kepatuhan PPN dalam satu
            langkah.
          </h1>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.6,
              color: "oklch(0.48 0.006 250)",
              maxWidth: 560,
              margin: "0 0 32px",
            }}
          >
            Upload faktur pajak untuk ekstraksi data otomatis dan pemeriksaan kepatuhan terhadap
            regulasi PPN terbaru.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <Link
              href="/analisis"
              style={{
                background: "oklch(0.17 0.006 250)",
                color: "white",
                padding: "15px 28px",
                borderRadius: 10,
                fontWeight: 700,
                fontSize: "15.5px",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              Coba Sekarang <span>→</span>
            </Link>
            <span style={{ fontSize: 14, color: "oklch(0.62 0.006 250)" }}>
              Tanpa akun. Tanpa instalasi.
            </span>
          </div>
        </div>
      </section>

      <section
        id="cara-kerja"
        style={{
          background: "oklch(0.965 0.005 250)",
          padding: "clamp(56px,8vw,96px) clamp(20px,5vw,48px)",
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "oklch(0.5 0.1 220)",
            }}
          >
            Cara Kerja
          </span>
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 400,
              fontSize: "clamp(28px,3.5vw,38px)",
              margin: "10px 0 40px",
              maxWidth: 640,
            }}
          >
            Tiga langkah, tanpa proses manual.
          </h2>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {steps.map((step) => (
              <div key={step.n} style={{ flex: "1 1 260px" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    border: "1.5px solid oklch(0.8 0.006 250)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "Georgia, serif",
                    fontSize: 15,
                    color: "oklch(0.5 0.1 220)",
                    marginBottom: 16,
                  }}
                >
                  {step.n}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{step.title}</h3>
                <p
                  style={{
                    fontSize: 15,
                    lineHeight: 1.6,
                    color: "oklch(0.48 0.006 250)",
                    margin: 0,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="fitur" style={{ padding: "clamp(56px,8vw,96px) clamp(20px,5vw,48px)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "oklch(0.5 0.1 220)",
            }}
          >
            Keunggulan
          </span>
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 400,
              fontSize: "clamp(28px,3.5vw,38px)",
              margin: "10px 0 40px",
              maxWidth: 640,
            }}
          >
            Empat hal yang paling penting.
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 28,
            }}
          >
            {features.map((f) => (
              <div
                key={f.n}
                style={{
                  padding: 28,
                  border: "1px solid oklch(0.89 0.006 250)",
                  borderRadius: 14,
                  background: "white",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "oklch(0.95 0.025 220)",
                    color: "oklch(0.5 0.1 220)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 13,
                    marginBottom: 14,
                  }}
                >
                  {f.n}
                </div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px" }}>{f.title}</h3>
                <p
                  style={{
                    fontSize: "14.5px",
                    lineHeight: 1.6,
                    color: "oklch(0.48 0.006 250)",
                    margin: 0,
                  }}
                >
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="trust"
        style={{
          background: "oklch(0.17 0.006 250)",
          color: "white",
          padding: "clamp(56px,8vw,96px) clamp(20px,5vw,48px)",
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "oklch(0.72 0.09 220)",
            }}
          >
            Transparansi
          </span>
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 400,
              fontSize: "clamp(28px,3.5vw,38px)",
              margin: "10px 0 20px",
              maxWidth: 680,
            }}
          >
            Sistem ini bilang kalau dia nggak yakin.
          </h2>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.7,
              color: "oklch(0.82 0.006 250)",
              maxWidth: 620,
              margin: "0 0 48px",
            }}
          >
            Tiap field datang dengan tingkat keyakinannya sendiri — bukan cuma status akhir yang
            dipoles supaya terlihat pasti. Kalau confidence-nya rendah, itu sinyal untuk dicek
            manual.
          </p>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            {confidenceLegend.map((item) => (
              <div
                key={item.label}
                style={{
                  flex: "1 1 220px",
                  padding: 20,
                  borderRadius: 12,
                  background: "oklch(0.22 0.006 250)",
                  border: "1px solid oklch(0.3 0.006 250)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: item.color,
                    }}
                  />
                  <span style={{ fontWeight: 700, fontSize: 15, color: "white" }}>
                    {item.label}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 14,
                    lineHeight: 1.5,
                    color: "oklch(0.75 0.006 250)",
                    margin: 0,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 40,
              padding: "20px 24px",
              borderRadius: 12,
              background: "oklch(0.22 0.006 250)",
              borderLeft: "3px solid oklch(0.72 0.09 220)",
              maxWidth: 720,
            }}
          >
            <p style={{ margin: 0, fontSize: "14.5px", lineHeight: 1.6, color: "oklch(0.85 0.006 250)" }}>
              Setiap hasil kepatuhan menyertakan nama dokumen regulasi yang jadi rujukan — supaya
              bisa ditelusuri, bukan diterima begitu saja.
            </p>
          </div>
        </div>
      </section>

      <section
        style={{
          background: "oklch(0.965 0.005 250)",
          padding: "clamp(56px,8vw,96px) clamp(20px,5vw,48px)",
        }}
      >
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              color: "oklch(0.5 0.1 220)",
            }}
          >
            Preview
          </span>
          <h2
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontWeight: 400,
              fontSize: "clamp(28px,3.5vw,38px)",
              margin: "10px 0 8px",
            }}
          >
            Begini tampilan hasilnya.
          </h2>
          <p style={{ fontSize: 13, color: "oklch(0.62 0.006 250)", margin: "0 0 32px" }}>
            Ilustrasi tampilan aplikasi — bukan data sungguhan.
          </p>
          <div
            style={{
              maxWidth: 520,
              background: "white",
              border: "1px solid oklch(0.89 0.006 250)",
              borderRadius: 16,
              boxShadow: "0 20px 40px -20px oklch(0.17 0.006 250 / 0.15)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "16px 20px", borderBottom: "1px solid oklch(0.89 0.006 250)" }}>
              <span style={{ fontWeight: 700, fontSize: 14 }}>Data Faktur Terekstrak</span>
            </div>
            {previewRows.map((row) => (
              <div
                key={row.label}
                style={{
                  padding: "12px 20px",
                  borderBottom: "1px solid oklch(0.89 0.006 250)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 14, color: "oklch(0.48 0.006 250)" }}>{row.label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: "ui-monospace, monospace",
                      letterSpacing: 2,
                      color: "oklch(0.62 0.006 250)",
                      fontSize: 13,
                    }}
                  >
                    ••••••
                  </span>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: row.dot,
                    }}
                  />
                </div>
              </div>
            ))}
            <div style={{ padding: "14px 20px", background: "oklch(0.95 0.035 150)" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "oklch(0.4 0.13 150)" }}>
                Hasil Pemeriksaan Kepatuhan · Sesuai
              </span>
            </div>
          </div>
        </div>
      </section>

      <section
        style={{
          background: "oklch(0.17 0.006 250)",
          color: "white",
          padding: "clamp(48px,7vw,80px) clamp(20px,5vw,48px)",
          textAlign: "center",
        }}
      >
        <h2
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 400,
            fontSize: "clamp(26px,3vw,34px)",
            margin: "0 0 16px",
          }}
        >
          Siap coba sendiri?
        </h2>
        <p style={{ fontSize: 16, color: "oklch(0.82 0.006 250)", margin: "0 0 28px" }}>
          Upload satu gambar faktur dan lihat hasilnya langsung.
        </p>
        <Link
          href="/analisis"
          style={{
            background: "oklch(0.5 0.1 220)",
            color: "white",
            padding: "15px 30px",
            borderRadius: 10,
            fontWeight: 700,
            fontSize: "15.5px",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Mulai Analisis <span>→</span>
        </Link>
      </section>

      <footer
        style={{
          borderTop: "1px solid oklch(0.89 0.006 250)",
          padding: "32px clamp(20px,5vw,48px)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          color: "oklch(0.62 0.006 250)",
          fontSize: 13,
        }}
      >
        <span>© 2026 Pajak-Cek</span>
        <span>Dibuat untuk staff &amp; konsultan pajak.</span>
      </footer>
    </div>
  );
}
