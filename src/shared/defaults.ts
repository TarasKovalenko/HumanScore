export type ScanMode = "onClick" | "auto";

export type Settings = {
  threshold: number;
  highlight: boolean;
  scanMode: ScanMode;
  customMarkers: string[];
};

export type AnalysisResult = {
  score: number | "--";
  confidence: number | "--";
  status: string;
  summary: string;
  reasons: string[];
  suspiciousSentences: string[];
  warning: string;
  wordCount: number;
};

export const DEFAULT_SETTINGS: Settings = {
  threshold: 65,
  highlight: true,
  scanMode: "auto",
  customMarkers: [],
};

export const MAX_SCAN_CHARS = 4000;
