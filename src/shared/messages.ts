import type { AnalysisResult, Settings } from "./defaults";

export type PopupToContentMessage =
  | { type: "SCAN_POST" }
  | { type: "SCAN_SELECTION" }
  | { type: "CLEAR_HIGHLIGHTS" }
  | { type: "GET_LAST_RESULT" }
  | { type: "SETTINGS_UPDATED"; settings: Settings };

export type ContentToPopupResponse =
  | {
      result: AnalysisResult;
    }
  | {
      result: AnalysisResult | null;
    }
  | {
      ok: true;
    };

export function isPopupToContentMessage(value: unknown): value is PopupToContentMessage {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybe = value as { type?: string; settings?: unknown };
  if (!maybe.type) {
    return false;
  }

  if (maybe.type === "SETTINGS_UPDATED") {
    return typeof maybe.settings === "object" && maybe.settings !== null;
  }

  return (
    maybe.type === "SCAN_POST" ||
    maybe.type === "SCAN_SELECTION" ||
    maybe.type === "CLEAR_HIGHLIGHTS" ||
    maybe.type === "GET_LAST_RESULT"
  );
}
