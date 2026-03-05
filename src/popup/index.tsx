import type { JSX } from "react";
import { useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { type AnalysisResult, DEFAULT_SETTINGS, type Settings } from "../shared/defaults";

function PopupApp(): JSX.Element {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [saving, setSaving] = useState(false);

  const initialize = useCallback(async () => {
    const nextSettings = await loadSettingsWithMigration();
    setSettings(nextSettings);

    const tab = await getActiveTab();
    if (tab?.id) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: "GET_LAST_RESULT" });
        if (response?.result) {
          setResult(response.result);
        } else {
          const scanResponse = await chrome.tabs.sendMessage(tab.id, { type: "SCAN_POST" });
          setResult(scanResponse?.result ?? null);
        }
      } catch {
        setResult(null);
      }
    }
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  async function runAction(type: string): Promise<void> {
    const tab = await getActiveTab();
    if (!tab?.id) {
      return;
    }

    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type });
      setResult(response?.result ?? null);
    } catch {
      setResult({
        score: "--",
        confidence: "--",
        status: "Unavailable",
        summary: "Open a LinkedIn page and try again.",
        reasons: [],
        suspiciousSentences: [],
        warning: "The content script is only loaded on linkedin.com.",
        wordCount: 0,
      });
    }
  }

  async function updateSettings(next: Settings): Promise<void> {
    setSaving(true);
    setSettings(next);
    await chrome.storage.sync.set(next);

    const tab = await getActiveTab();
    if (tab?.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, { type: "SETTINGS_UPDATED", settings: next });
      } catch {
        // No-op: the active tab may not be LinkedIn.
      }
    }

    setSaving(false);
  }

  const scoreLabel = result?.score ?? "--";

  return (
    <main className="popup-app">
      <p className="popup-eyebrow">Local Text Lens</p>
      <h1 className="popup-title">AI-likely text scan</h1>
      <p className="popup-subtitle">React popup, local heuristics only, and no network calls.</p>

      <div className="popup-grid">
        <section className="popup-card">
          <div className="popup-actions">
            <button
              className="popup-button"
              onClick={() => void runAction("SCAN_POST")}
              type="button"
            >
              Scan This Post
            </button>
            <button
              className="popup-button secondary"
              onClick={() => void runAction("SCAN_SELECTION")}
              type="button"
            >
              Scan Selection
            </button>
            <button
              className="popup-button ghost"
              onClick={() => void runAction("CLEAR_HIGHLIGHTS")}
              type="button"
            >
              Clear Highlights
            </button>
          </div>
        </section>

        <section className="popup-card">
          <div className="popup-inline">
            <span className="popup-label">Last score</span>
            <span className="popup-status">
              {saving ? "Saving" : (result?.status ?? "Waiting")}
            </span>
          </div>
          <div className="popup-score-line">
            <span className="popup-score">{scoreLabel}</span>
            <span className="popup-summary">/ 100</span>
          </div>
          <p className="popup-summary">
            {result?.summary ?? "Use a scan action on a LinkedIn post or selected text."}
          </p>
          <ul className="popup-reasons">
            {(result?.reasons ?? []).slice(0, 3).map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>

        <section className="popup-card">
          <div className="popup-section-title">Settings</div>

          <label className="popup-toggle">
            <span>Highlight suspicious segments</span>
            <input
              checked={settings.highlight}
              onChange={(event) =>
                void updateSettings({
                  ...settings,
                  highlight: event.currentTarget.checked,
                })
              }
              type="checkbox"
            />
          </label>

          <label className="popup-toggle">
            <span>Only scan when clicked</span>
            <input
              checked={settings.scanMode === "onClick"}
              onChange={(event) =>
                void updateSettings({
                  ...settings,
                  scanMode: event.currentTarget.checked ? "onClick" : "auto",
                })
              }
              type="checkbox"
            />
          </label>

          <div className="popup-inline">
            <span className="popup-label">Threshold</span>
            <span className="popup-status">{settings.threshold}</span>
          </div>
          <input
            className="popup-range"
            max={90}
            min={35}
            onChange={(event) =>
              void updateSettings({
                ...settings,
                threshold: Number(event.currentTarget.value),
              })
            }
            step={1}
            type="range"
            value={settings.threshold}
          />

          <div className="popup-label">Custom template markers</div>
          <textarea
            className="popup-textarea"
            onChange={(event) =>
              setSettings({
                ...settings,
                customMarkers: parseMarkers(event.currentTarget.value),
              })
            }
            onBlur={() => void updateSettings(settings)}
            placeholder="One phrase per line"
            value={settings.customMarkers.join("\n")}
          />
        </section>
      </div>

      <p className="popup-footnote">
        Automatic feed badges are on by default. Enable “Only scan when clicked” if you want to stop
        live feed scoring.
      </p>
    </main>
  );
}

function parseMarkers(input: string): string[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 100);
}

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0] ?? null;
}

async function loadSettingsWithMigration(): Promise<Settings> {
  const stored = await chrome.storage.sync.get(DEFAULT_SETTINGS);
  const customMarkers = Array.isArray(stored.customMarkers)
    ? stored.customMarkers.slice(0, 100)
    : [];
  const isLegacyDefaultProfile =
    stored.scanMode === "onClick" &&
    stored.threshold === 65 &&
    stored.highlight === true &&
    customMarkers.length === 0;

  const nextSettings: Settings = {
    threshold: typeof stored.threshold === "number" ? stored.threshold : DEFAULT_SETTINGS.threshold,
    highlight:
      typeof stored.highlight === "boolean" ? stored.highlight : DEFAULT_SETTINGS.highlight,
    scanMode: isLegacyDefaultProfile
      ? "auto"
      : stored.scanMode === "onClick"
        ? "onClick"
        : DEFAULT_SETTINGS.scanMode,
    customMarkers,
  };

  if (isLegacyDefaultProfile) {
    await chrome.storage.sync.set(nextSettings);
  }

  return nextSettings;
}

const rootNode = document.getElementById("root");
if (rootNode) {
  createRoot(rootNode).render(<PopupApp />);
}
