import { MAX_SCAN_CHARS } from "./defaults";

const PRIMARY_CONTAINER_SELECTORS = [
  "div.feed-shared-update-v2",
  "[data-id^='urn:li:activity:']",
  ".msg-s-message-list__event",
];

const FALLBACK_CONTAINER_SELECTORS = ["article", "[role='article']"];

const PRIMARY_ROOT_SELECTOR = [
  "div.feed-shared-update-v2",
  "[data-id^='urn:li:activity:']",
  ".msg-s-message-list__event",
].join(", ");

const ROOT_SELECTOR = [
  "div.feed-shared-update-v2",
  "[data-id^='urn:li:activity:']",
  ".msg-s-message-list__event",
  "article",
  "[role='article']",
].join(", ");

const TEXT_ROOT_SELECTORS = [
  ".update-components-update-v2__commentary",
  ".feed-shared-update-v2__description",
  ".feed-shared-inline-show-more-text",
  ".update-components-text",
  ".msg-s-event-listitem__body",
];

const HEADER_SELECTORS = [
  ".feed-shared-update-v2__control-menu-container",
  ".update-components-actor--with-control-menu",
  ".update-components-actor__container",
];

const IGNORE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "button",
  "svg",
  "code",
  "pre",
  "nav",
  "header",
  "footer",
  "aside",
  "a[role='button']",
  "[aria-hidden='true']",
  ".visually-hidden",
  ".feed-shared-social-action-bar",
  ".social-details-social-counts",
  ".comments-comment-social-bar",
  ".artdeco-dropdown",
].join(", ");

export type PostTextExtraction = {
  text: string;
  root: HTMLElement | null;
};

export function getCandidatePostContainers(): HTMLElement[] {
  const unique = new Set<HTMLElement>();

  for (const selector of PRIMARY_CONTAINER_SELECTORS) {
    for (const node of document.querySelectorAll<HTMLElement>(selector)) {
      const container = resolvePostRoot(node);
      if (container && isElementVisible(container)) {
        unique.add(container);
      }
    }
  }

  for (const selector of FALLBACK_CONTAINER_SELECTORS) {
    for (const node of document.querySelectorAll<HTMLElement>(selector)) {
      if (node.closest(PRIMARY_ROOT_SELECTOR)) {
        continue;
      }

      const container = resolvePostRoot(node);
      if (container && isElementVisible(container)) {
        unique.add(container);
      }
    }
  }

  const candidates = Array.from(unique);
  const deduped = candidates.filter(
    (container) => !candidates.some((other) => other !== container && other.contains(container))
  );

  return deduped.filter((container) => {
    const extracted = extractPostText(container);
    return extracted.text.length >= 60;
  });
}

export function resolvePostRoot(element: HTMLElement | null): HTMLElement | null {
  if (!element) {
    return null;
  }

  const preferred = element.closest<HTMLElement>(PRIMARY_ROOT_SELECTOR);
  if (preferred) {
    return preferred;
  }

  return element.closest<HTMLElement>(ROOT_SELECTOR) ?? element;
}

export function extractPostText(container: HTMLElement): PostTextExtraction {
  const textRoot = findPrimaryTextRoot(container) ?? container;
  const walker = document.createTreeWalker(textRoot, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      return isUsefulTextNode(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    },
  });

  let combined = "";
  let current = walker.nextNode();

  while (current && combined.length < MAX_SCAN_CHARS) {
    const value = normalizeText(current.textContent ?? "");
    if (value) {
      combined += `${value}\n`;
    }
    current = walker.nextNode();
  }

  return {
    text: combined.trim(),
    root: textRoot,
  };
}

export function findPrimaryTextRoot(container: HTMLElement): HTMLElement | null {
  for (const selector of TEXT_ROOT_SELECTORS) {
    const found = container.querySelector<HTMLElement>(selector);
    if (found && isElementVisible(found)) {
      return found;
    }
  }
  return null;
}

export function findBadgeAnchor(container: HTMLElement): HTMLElement {
  const badgeRoot = getBadgeRoot(container);

  for (const selector of HEADER_SELECTORS) {
    const found = badgeRoot.querySelector<HTMLElement>(selector);
    if (found && isElementVisible(found)) {
      return found;
    }
  }

  return badgeRoot.firstElementChild instanceof HTMLElement
    ? badgeRoot.firstElementChild
    : badgeRoot;
}

function getBadgeRoot(container: HTMLElement): HTMLElement {
  if (container.matches("div.feed-shared-update-v2") && isElementVisible(container)) {
    return container;
  }

  const feedCard = container.querySelector<HTMLElement>(
    "div.feed-shared-update-v2[role='article'], div.feed-shared-update-v2"
  );
  if (feedCard && isElementVisible(feedCard)) {
    return feedCard;
  }

  return container;
}

export function isElementVisible(element: Element | null): element is HTMLElement {
  if (!(element instanceof HTMLElement)) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function isUsefulTextNode(node: Node): boolean {
  const parent = node.parentElement;
  if (!parent || !isElementVisible(parent)) {
    return false;
  }

  if (parent.closest(".ltl-badge-host")) {
    return false;
  }

  if (parent.closest(IGNORE_SELECTORS)) {
    return false;
  }

  const text = normalizeText(node.textContent ?? "");
  if (!text || text.length < 2) {
    return false;
  }

  return !/^(like|comment|share|send|follow|connect|repost|more)$/i.test(text);
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}
