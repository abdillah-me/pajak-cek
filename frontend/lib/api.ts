import type { AnalyzeResponse } from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export async function analyzeFaktur(file: File): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/api/analyze-faktur`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ detail: "Terjadi kesalahan tidak diketahui" }));
    throw new Error(body.detail ?? `Request gagal dengan status ${response.status}`);
  }

  return response.json();
}
