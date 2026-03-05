import { type AnalysisResult, DEFAULT_SETTINGS, type Settings } from "../shared/defaults";
import { analyzeText } from "../shared/detector";
import {
  extractPostText,
  findBadgeAnchor,
  findPrimaryTextRoot,
  getCandidatePostContainers,
  resolvePostRoot,
} from "../shared/linkedin";
import { isPopupToContentMessage } from "../shared/messages";

type PostState = {
  host: HTMLSpanElement;
  result: AnalysisResult;
  settingsKey: string;
  signature: string;
};

const postState = new Map<HTMLElement, PostState>();
let settings: Settings = { ...DEFAULT_SETTINGS };
let lastResult: AnalysisResult | null = null;
let mutationTimer = 0;
let scrollTimer = 0;
let routeScanToken = 0;
let openBadgePanel: HTMLElement | null = null;
let panelDismissReady = false;
let observer: MutationObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;
const bootstrapScanDelays = [0, 450, 1200, 2400];

void initialize();

function isExcludedPage(pathname = window.location.pathname): boolean {
  const lowerPath = pathname.toLowerCase();
  if (/\/notifications\b/.test(lowerPath)) {
    return true;
  }

  return /^\/in\/[^/?#]+(?:\/.*)?$/.test(lowerPath);
}

async function initialize(): Promise<void> {
  settings = await loadSettingsWithMigration();
  setupMessageBridge();
  setupStorageSync();
  setupRealtimeObservers();
  setupRouteWatcher();
  setupPanelDismissListener();

  if (settings.scanMode === "auto") {
    scheduleBootstrapScans();
  }
}

function setupMessageBridge(): void {
  chrome.runtime.onMessage.addListener(
    (
      message: unknown,
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void
    ) => {
      if (!isPopupToContentMessage(message)) {
        return false;
      }

      switch (message.type) {
        case "SCAN_POST":
          sendResponse({ result: scanCurrentPost() });
          return true;
        case "SCAN_SELECTION":
          sendResponse({ result: scanSelection() });
          return true;
        case "CLEAR_HIGHLIGHTS":
          clearAllHighlights();
          sendResponse({
            result: {
              score: "--",
              confidence: "--",
              status: "Cleared",
              summary: "Highlights removed from this page.",
              reasons: [],
              suspiciousSentences: [],
              warning: "Only local text highlights were removed.",
              wordCount: 0,
            } satisfies AnalysisResult,
          });
          return true;
        case "GET_LAST_RESULT":
          sendResponse({ result: lastResult });
          return true;
        case "SETTINGS_UPDATED":
          settings = normalizeSettings(message.settings);
          if (settings.scanMode === "auto") {
            scheduleVisiblePostScan(true);
          } else {
            clearAllHighlights();
            clearAllBadges();
          }
          sendResponse({ ok: true });
          return true;
        default:
          return false;
      }
    }
  );
}

function setupStorageSync(): void {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "sync") {
      return;
    }

    settings = normalizeSettings({
      ...settings,
      threshold: changes.threshold?.newValue ?? settings.threshold,
      highlight: changes.highlight?.newValue ?? settings.highlight,
      scanMode: changes.scanMode?.newValue ?? settings.scanMode,
      customMarkers: changes.customMarkers?.newValue ?? settings.customMarkers,
    });

    if (settings.scanMode === "auto") {
      scheduleVisiblePostScan(true);
      return;
    }

    clearAllHighlights();
    clearAllBadges();
  });
}

function setupRealtimeObservers(): void {
  intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || settings.scanMode !== "auto") {
          continue;
        }

        const container = resolvePostRoot(entry.target as HTMLElement);
        if (container) {
          scanAndRenderPost(container);
        }
      }
    },
    {
      rootMargin: "220px 0px 320px 0px",
      threshold: 0.08,
    }
  );

  observer = new MutationObserver((mutations) => {
    if (settings.scanMode !== "auto") {
      return;
    }

    if (isOnlyOwnMutations(mutations)) {
      return;
    }

    window.clearTimeout(mutationTimer);
    mutationTimer = window.setTimeout(() => {
      scheduleVisiblePostScan();
    }, 200);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  window.addEventListener(
    "scroll",
    () => {
      if (settings.scanMode !== "auto") {
        return;
      }

      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        scanVisiblePosts();
      }, 120);
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    if (settings.scanMode === "auto") {
      scheduleVisiblePostScan();
    }
  });
}

function scheduleVisiblePostScan(force = false): void {
  if (isExcludedPage()) {
    clearAllHighlights();
    clearAllBadges();
    return;
  }
  purgeDetachedPosts();

  const posts = getCandidatePostContainers();
  for (const post of posts) {
    intersectionObserver?.observe(post);
  }

  scanVisiblePosts(force);
}

function scanVisiblePosts(force = false): void {
  if (isExcludedPage()) {
    clearAllHighlights();
    clearAllBadges();
    return;
  }
  purgeDetachedPosts();

  const posts = getCandidatePostContainers().filter(isNearViewport).slice(0, 8);
  for (const post of posts) {
    scanAndRenderPost(post, force);
  }
}

function scanAndRenderPost(container: HTMLElement, force = false): AnalysisResult | null {
  if (isExcludedPage()) {
    return null;
  }

  const extracted = extractPostText(container);
  if (!extracted.text) {
    return null;
  }

  const signature = `${extracted.text.length}:${extracted.text.slice(0, 800)}`;
  const settingsKey = buildSettingsKey(settings);
  const existing = postState.get(container);

  if (
    !force &&
    existing &&
    existing.host.isConnected &&
    existing.signature === signature &&
    existing.settingsKey === settingsKey
  ) {
    return existing.result;
  }

  const result = analyzeText(extracted.text, settings);
  mountBadge(container, result, signature, settingsKey);

  if (
    settings.highlight &&
    typeof result.score === "number" &&
    result.score >= settings.threshold
  ) {
    applyHighlights(container, result.suspiciousSentences);
  } else {
    clearHighlights(container);
  }

  if (isNearViewportCenter(container)) {
    lastResult = result;
  }

  return result;
}

function mountBadge(
  container: HTMLElement,
  result: AnalysisResult,
  signature: string,
  settingsKey: string
): void {
  let state = postState.get(container);
  const anchor = findBadgeAnchor(container);
  const anchorParent = anchor.parentElement;
  const insertionParent =
    anchor !== container && anchorParent instanceof HTMLElement ? anchorParent : container;

  if (!state || !state.host.isConnected) {
    const host = findReusableHost(container, anchor) ?? document.createElement("span");
    host.className = "ltl-badge-host";
    host.dataset.ltlBadgeHost = "true";

    removeStaleHosts(container, host);

    state = { host, result, settingsKey, signature };
    postState.set(container, state);
  } else {
    state.result = result;
    state.settingsKey = settingsKey;
    state.signature = signature;
  }

  const host = state.host;
  removeStaleHosts(container, host);
  const shouldSitBeforeAnchor = anchor !== container;
  const isInCorrectSpot =
    host.parentElement === insertionParent &&
    (shouldSitBeforeAnchor
      ? host.nextElementSibling === anchor
      : insertionParent.firstElementChild === host);

  if (!isInCorrectSpot) {
    if (host.isConnected) {
      host.remove();
    }

    if (shouldSitBeforeAnchor && anchor.parentElement === insertionParent) {
      insertionParent.insertBefore(host, anchor);
    } else if (insertionParent.firstElementChild) {
      insertionParent.insertBefore(host, insertionParent.firstElementChild);
    } else {
      insertionParent.prepend(host);
    }
  }

  renderBadge(state.host, result, settings.threshold);
}

function renderBadge(host: HTMLElement, result: AnalysisResult, threshold: number): void {
  const score = typeof result.score === "number" ? result.score : null;
  const label = score !== null ? String(score) : "--";
  const variant = getVariant(result.score, threshold);

  const wrapper = document.createElement("div");
  wrapper.className = "ltl-badge";

  const button = document.createElement("button");
  button.className = "ltl-badge__button";
  button.dataset.variant = variant;
  button.type = "button";

  const dot = document.createElement("span");
  dot.className = "ltl-badge__dot";

  const scoreEl = document.createElement("span");
  scoreEl.className = "ltl-badge__score";
  scoreEl.textContent = label;

  const labelEl = document.createElement("span");
  labelEl.className = "ltl-badge__label";
  labelEl.textContent = "AI";

  button.append(dot, scoreEl, labelEl);

  const panel = document.createElement("div");
  panel.className = "ltl-badge__panel";
  panel.hidden = true;

  const header = document.createElement("div");
  header.className = "ltl-badge__header";

  const scoreDisplay = document.createElement("div");
  scoreDisplay.className = "ltl-badge__score-display";
  scoreDisplay.dataset.variant = variant;

  const scoreLarge = document.createElement("span");
  scoreLarge.className = "ltl-badge__score-large";
  scoreLarge.textContent = label;

  const scoreMax = document.createElement("span");
  scoreMax.className = "ltl-badge__score-max";
  scoreMax.textContent = "/100";

  scoreDisplay.append(scoreLarge, scoreMax);

  const statusRow = document.createElement("div");
  statusRow.className = "ltl-badge__status";

  const confLabel = document.createElement("span");
  confLabel.textContent = `${result.confidence}% confidence`;

  const statusLabel = document.createElement("span");
  statusLabel.className = "ltl-badge__status-tag";
  statusLabel.dataset.variant = variant;
  statusLabel.textContent = result.status;

  statusRow.append(confLabel, statusLabel);
  header.append(scoreDisplay, statusRow);

  if (score !== null) {
    const bar = document.createElement("div");
    bar.className = "ltl-badge__bar";
    const fill = document.createElement("div");
    fill.className = "ltl-badge__bar-fill";
    fill.dataset.variant = variant;
    fill.style.width = `${score}%`;
    bar.append(fill);
    header.append(bar);
  }

  const body = document.createElement("div");
  body.className = "ltl-badge__body";

  if (result.reasons.length > 0) {
    const reasonsLabel = document.createElement("div");
    reasonsLabel.className = "ltl-badge__section-label";
    reasonsLabel.textContent = "Key signals";
    body.append(reasonsLabel);

    for (const reason of result.reasons.slice(0, 3)) {
      const row = document.createElement("div");
      row.className = "ltl-badge__reason";
      row.textContent = reason;
      body.append(row);
    }
  }

  const footer = document.createElement("div");
  footer.className = "ltl-badge__footer";
  footer.textContent = result.warning;

  panel.append(header, body, footer);

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (panel.hidden) {
      closeOpenBadgePanel();
      panel.hidden = false;
      openBadgePanel = panel;
      return;
    }

    panel.hidden = true;
    if (openBadgePanel === panel) {
      openBadgePanel = null;
    }
  });

  wrapper.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  wrapper.append(button, panel);
  host.replaceChildren(wrapper);
}

function removeStaleHosts(container: HTMLElement, keep: HTMLElement): void {
  for (const el of container.querySelectorAll<HTMLElement>(".ltl-badge-host")) {
    if (el !== keep) el.remove();
  }
}

function clearAllBadges(): void {
  closeOpenBadgePanel();
  for (const [container, state] of postState.entries()) {
    if (state.host.isConnected) {
      state.host.remove();
    }
    postState.delete(container);
  }
}

function purgeDetachedPosts(): void {
  for (const [container, state] of postState.entries()) {
    if (!container.isConnected || !state.host.isConnected) {
      postState.delete(container);
    }
  }
}

function findReusableHost(_container: HTMLElement, anchor: HTMLElement): HTMLSpanElement | null {
  const immediatePrevious = anchor.previousElementSibling;
  if (
    immediatePrevious instanceof HTMLSpanElement &&
    immediatePrevious.classList.contains("ltl-badge-host")
  ) {
    return immediatePrevious;
  }

  for (const child of anchor.parentElement?.children ?? []) {
    if (child instanceof HTMLSpanElement && child.classList.contains("ltl-badge-host")) {
      return child;
    }
  }

  return null;
}

function isOnlyOwnMutations(mutations: MutationRecord[]): boolean {
  let sawManagedNode = false;

  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) {
        return false;
      }

      if (
        node.classList.contains("ltl-badge-host") ||
        node.classList.contains("ltl-inline-chunk") ||
        node.closest(".ltl-badge-host, .ltl-inline-chunk")
      ) {
        sawManagedNode = true;
        continue;
      }

      return false;
    }
  }

  return sawManagedNode;
}

function scanCurrentPost(): AnalysisResult {
  if (isExcludedPage()) {
    const result: AnalysisResult = {
      score: "--",
      confidence: "--",
      status: "Unavailable",
      summary: "Automatic post badges are disabled on this LinkedIn page.",
      reasons: [],
      suspiciousSentences: [],
      warning: "Profile and notifications pages are intentionally excluded.",
      wordCount: 0,
    };
    lastResult = result;
    return result;
  }

  const active = findNearestPost();
  if (!active) {
    const result: AnalysisResult = {
      score: "--",
      confidence: "--",
      status: "No post",
      summary: "No LinkedIn post-like container was found near your selection or viewport.",
      reasons: [],
      suspiciousSentences: [],
      warning: "Try clicking inside a post before scanning.",
      wordCount: 0,
    };
    lastResult = result;
    return result;
  }

  const result =
    scanAndRenderPost(active, true) ??
    ({
      score: "--",
      confidence: "--",
      status: "No text",
      summary: "No visible text was available in that post.",
      reasons: [],
      suspiciousSentences: [],
      warning: "The post may be collapsed or media-only.",
      wordCount: 0,
    } satisfies AnalysisResult);

  lastResult = result;
  return result;
}

function setupRouteWatcher(): void {
  let lastHref = window.location.href;

  window.setInterval(() => {
    const nextHref = window.location.href;
    if (nextHref === lastHref) {
      return;
    }

    lastHref = nextHref;
    handleRouteChange();
  }, 500);
}

function setupPanelDismissListener(): void {
  if (panelDismissReady) {
    return;
  }
  panelDismissReady = true;

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (target instanceof Element && target.closest(".ltl-badge")) {
      return;
    }
    closeOpenBadgePanel();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeOpenBadgePanel();
    }
  });
}

function closeOpenBadgePanel(): void {
  if (!openBadgePanel) {
    return;
  }

  openBadgePanel.hidden = true;
  openBadgePanel = null;
}

function handleRouteChange(): void {
  clearAllHighlights();
  clearAllBadges();
  lastResult = null;

  if (settings.scanMode === "auto" && !isExcludedPage()) {
    scheduleBootstrapScans(true);
  }
}

function scheduleBootstrapScans(force = false): void {
  const token = ++routeScanToken;

  for (const delay of bootstrapScanDelays) {
    window.setTimeout(() => {
      if (token !== routeScanToken || settings.scanMode !== "auto" || isExcludedPage()) {
        return;
      }
      scheduleVisiblePostScan(force);
    }, delay);
  }
}

function scanSelection(): AnalysisResult {
  const selection = window.getSelection()?.toString().trim() ?? "";
  if (!selection) {
    const result: AnalysisResult = {
      score: "--",
      confidence: "--",
      status: "No selection",
      summary: "Select text in a LinkedIn post, article, or message before running this scan.",
      reasons: [],
      suspiciousSentences: [],
      warning: "Short selections are often inconclusive.",
      wordCount: 0,
    };
    lastResult = result;
    return result;
  }

  const result = analyzeText(selection, settings);
  lastResult = result;
  return result;
}

function findNearestPost(): HTMLElement | null {
  const selection = window.getSelection();
  const anchorNode = selection?.anchorNode;
  const fromSelection =
    anchorNode instanceof Element
      ? resolvePostRoot(anchorNode as HTMLElement)
      : resolvePostRoot(anchorNode?.parentElement ?? null);
  if (fromSelection) {
    return fromSelection;
  }

  const visiblePosts = getCandidatePostContainers();
  const center = window.innerHeight / 2;
  let best: HTMLElement | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const post of visiblePosts) {
    const rect = post.getBoundingClientRect();
    const distance = Math.abs(rect.top - center);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = post;
    }
  }

  return best;
}

function applyHighlights(container: HTMLElement, suspiciousSentences: string[]): void {
  clearHighlights(container);

  if (!suspiciousSentences.length) {
    return;
  }

  const textRoot = findPrimaryTextRoot(container);
  if (!textRoot) {
    return;
  }

  const normalized = new Set(suspiciousSentences.map(normalizeSentence));
  const walker = document.createTreeWalker(textRoot, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || parent.closest(".ltl-inline-chunk, .ltl-badge-host")) {
        return NodeFilter.FILTER_REJECT;
      }
      const value = normalizeText(node.textContent ?? "");
      return value ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }

  for (const textNode of nodes) {
    const original = textNode.nodeValue ?? "";
    const pieces = splitText(original);
    const hasMatch = pieces.some((piece) => normalized.has(normalizeSentence(piece)));
    if (!hasMatch) {
      continue;
    }

    const wrapper = document.createElement("span");
    wrapper.className = "ltl-inline-chunk";

    for (const piece of pieces) {
      if (!piece) {
        continue;
      }
      if (normalized.has(normalizeSentence(piece))) {
        const span = document.createElement("span");
        span.className = "ltl-highlight";
        span.textContent = piece;
        wrapper.append(span);
      } else {
        wrapper.append(document.createTextNode(piece));
      }
    }

    textNode.replaceWith(wrapper);
  }
}

function clearHighlights(scope: ParentNode = document): void {
  for (const element of scope.querySelectorAll(".ltl-inline-chunk")) {
    element.replaceWith(document.createTextNode(element.textContent ?? ""));
  }
}

function clearAllHighlights(): void {
  clearHighlights(document);
}

function normalizeSettings(value: Partial<Settings> | undefined): Settings {
  return {
    threshold: typeof value?.threshold === "number" ? value.threshold : DEFAULT_SETTINGS.threshold,
    highlight: typeof value?.highlight === "boolean" ? value.highlight : DEFAULT_SETTINGS.highlight,
    scanMode: value?.scanMode === "onClick" ? "onClick" : DEFAULT_SETTINGS.scanMode,
    customMarkers: Array.isArray(value?.customMarkers) ? value.customMarkers.slice(0, 100) : [],
  };
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

  const nextSettings = normalizeSettings({
    threshold: typeof stored.threshold === "number" ? stored.threshold : DEFAULT_SETTINGS.threshold,
    highlight:
      typeof stored.highlight === "boolean" ? stored.highlight : DEFAULT_SETTINGS.highlight,
    scanMode: isLegacyDefaultProfile ? "auto" : stored.scanMode === "onClick" ? "onClick" : "auto",
    customMarkers,
  });

  if (isLegacyDefaultProfile) {
    await chrome.storage.sync.set(nextSettings);
  }

  return nextSettings;
}

function buildSettingsKey(currentSettings: Settings): string {
  return [
    currentSettings.threshold,
    currentSettings.highlight ? "1" : "0",
    currentSettings.customMarkers.join("\u0001"),
  ].join("|");
}

function normalizeSentence(value: string): string {
  return normalizeText(value)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s']/gu, "")
    .trim();
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function splitText(value: string): string[] {
  return value.match(/[^.!?\n]+[.!?\n]*/g) ?? [value];
}

function isNearViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.bottom >= -120 && rect.top <= window.innerHeight + 280;
}

function isNearViewportCenter(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const center = window.innerHeight / 2;
  const midpoint = rect.top + rect.height / 2;
  return Math.abs(midpoint - center) <= Math.max(120, rect.height / 2);
}

function getVariant(score: number | "--", threshold: number): "high" | "medium" | "low" {
  if (typeof score !== "number") {
    return "medium";
  }
  if (score >= threshold) {
    return "high";
  }
  if (score >= Math.max(40, threshold - 15)) {
    return "medium";
  }
  return "low";
}
