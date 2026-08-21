import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { AnalyzeResponse, Confidence, ExtractedField } from "@/lib/types";

function ConfidenceBadge({ confidence }: { confidence: Confidence }) {
  const variant =
    confidence === "high"
      ? "default"
      : confidence === "medium"
        ? "secondary"
        : "destructive";
  return <Badge variant={variant}>{confidence}</Badge>;
}

function FieldRow({
  label,
  field,
  format,
}: {
  label: string;
  field: ExtractedField<string | number>;
  format?: (value: string | number) => string;
}) {
  const displayValue =
    field.value === null
      ? "—"
      : format
        ? format(field.value)
        : String(field.value);

  return (
    <div className="flex items-center justify-between border-b py-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-medium">{displayValue}</span>
        <ConfidenceBadge confidence={field.confidence} />
      </div>
    </div>
  );
}

const currency = (value: string | number) =>
  `Rp ${Number(value).toLocaleString("id-ID")}`;

const percent = (value: string | number) => `${value}%`;

export function AnalysisResult({ result }: { result: AnalyzeResponse }) {
  const { extraction, compliance } = result;

  if (!extraction.readable || !extraction.data) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Gambar tidak dapat dibaca</AlertTitle>
        <AlertDescription>
          {extraction.warning ??
            "Gambar tidak terbaca sebagai faktur pajak. Coba upload ulang dengan gambar yang lebih jelas."}
        </AlertDescription>
      </Alert>
    );
  }

  const data = extraction.data;

  return (
    <div className="flex w-full flex-col gap-4">
      {extraction.warning && (
        <Alert>
          <AlertTitle>Catatan ekstraksi</AlertTitle>
          <AlertDescription>{extraction.warning}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Data Faktur Terekstrak</CardTitle>
          <CardDescription>
            Nilai dengan confidence rendah berarti model tidak yakin — periksa manual.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldRow label="NPWP Penjual" field={data.npwp_penjual} />
          <FieldRow label="NPWP Pembeli" field={data.npwp_pembeli} />
          <FieldRow label="Tanggal Faktur" field={data.tanggal_faktur} />
          <FieldRow label="Nomor Seri Faktur" field={data.nomor_seri_faktur} />
          <FieldRow label="DPP" field={data.dpp} format={currency} />
          <FieldRow label="Tarif PPN" field={data.tarif_ppn} format={percent} />
          <FieldRow label="PPN Terutang" field={data.ppn_terutang} format={currency} />
        </CardContent>
      </Card>

      {compliance && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Hasil Pemeriksaan Kepatuhan
              <Badge
                variant={
                  compliance.status === "compliant"
                    ? "default"
                    : compliance.status === "flagged"
                      ? "destructive"
                      : "secondary"
                }
              >
                {compliance.status}
              </Badge>
            </CardTitle>
            {compliance.status === "inconclusive" && (
              <CardDescription>
                Sistem tidak menemukan referensi regulasi yang cukup untuk memastikan
                kepatuhan tarif — bukan berarti sudah pasti benar.
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {compliance.issues.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada masalah kepatuhan yang ditemukan.
              </p>
            ) : (
              compliance.issues.map((issue, i) => (
                <Alert key={i} variant="destructive">
                  <AlertTitle>{issue.field}</AlertTitle>
                  <AlertDescription>
                    {issue.message}
                    <div className="mt-1 text-xs opacity-80">
                      Sumber: {issue.regulation_source}
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            )}
            {compliance.sources_used.length > 0 && (
              <div className="text-xs text-muted-foreground">
                Regulasi yang dirujuk: {compliance.sources_used.join(", ")}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
