import { DEFAULT_SETTINGS } from "./shared/defaults";

void migrateLegacyDefaults();

chrome.runtime.onInstalled.addListener(() => {
  void migrateLegacyDefaults();
});

async function migrateLegacyDefaults(): Promise<void> {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const customMarkers = Array.isArray(stored.customMarkers) ? stored.customMarkers : [];
  const isLegacyDefaultProfile =
    stored.scanMode === "onClick" &&
    stored.threshold === 65 &&
    stored.highlight === true &&
    customMarkers.length === 0;

  await chrome.storage.sync.set({
    threshold: typeof stored.threshold === "number" ? stored.threshold : DEFAULT_SETTINGS.threshold,
    highlight:
      typeof stored.highlight === "boolean" ? stored.highlight : DEFAULT_SETTINGS.highlight,
    scanMode: isLegacyDefaultProfile ? "auto" : stored.scanMode === "onClick" ? "onClick" : "auto",
    customMarkers,
  });
}
