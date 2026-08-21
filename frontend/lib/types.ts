export type Confidence = "high" | "medium" | "low";

export interface ExtractedField<T> {
  value: T | null;
  confidence: Confidence;
}

export interface ExtractedFakturData {
  npwp_penjual: ExtractedField<string>;
  npwp_pembeli: ExtractedField<string>;
  tanggal_faktur: ExtractedField<string>;
  nomor_seri_faktur: ExtractedField<string>;
  dpp: ExtractedField<number>;
  tarif_ppn: ExtractedField<number>;
  ppn_terutang: ExtractedField<number>;
}

export interface ExtractionResult {
  readable: boolean;
  warning: string | null;
  data: ExtractedFakturData | null;
}

export interface ComplianceIssue {
  field: string;
  message: string;
  regulation_source: string;
}

export interface ComplianceReport {
  status: "compliant" | "flagged" | "inconclusive";
  issues: ComplianceIssue[];
  sources_used: string[];
}

export interface AnalyzeResponse {
  extraction: ExtractionResult;
  compliance: ComplianceReport | null;
}
