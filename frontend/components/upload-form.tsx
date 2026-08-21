"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AnalysisResult } from "@/components/analysis-result";
import { analyzeFaktur } from "@/lib/api";
import type { AnalyzeResponse } from "@/lib/types";

const ACCEPTED_TYPES = ["image/png", "image/jpeg"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(selected: File | null) {
    setResult(null);
    setErrorMessage(null);

    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    if (!ACCEPTED_TYPES.includes(selected.type)) {
      setStatus("error");
      setErrorMessage("Format file harus PNG atau JPEG.");
      return;
    }

    if (selected.size > MAX_SIZE_BYTES) {
      setStatus("error");
      setErrorMessage("Ukuran file maksimal 10MB.");
      return;
    }

    setStatus("idle");
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  async function handleSubmit() {
    if (!file) return;
    setStatus("loading");
    setErrorMessage(null);

    try {
      const response = await analyzeFaktur(file);
      setResult(response);
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "Terjadi kesalahan tidak diketahui.",
      );
    }
  }

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES.join(",")}
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
        />

        <div
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-10 text-center hover:bg-muted/50"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFileChange(e.dataTransfer.files?.[0] ?? null);
          }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Preview faktur"
              className="max-h-64 rounded-md object-contain"
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              Klik atau seret gambar faktur pajak ke sini (PNG/JPEG, maks 10MB)
            </p>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={!file || status === "loading"}>
          {status === "loading" ? "Menganalisis..." : "Analisis Faktur"}
        </Button>
      </div>

      {status === "error" && errorMessage && (
        <Alert variant="destructive">
          <AlertTitle>Gagal</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {result && <AnalysisResult result={result} />}
    </div>
  );
}
