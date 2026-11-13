/**
 * Ad loader (PRD Rules 12-13, NV2, NV6, TDD §E "Consent bypass").
 * No ad script exists in any page markup. loadAds() is the only code that adds the
 * AdSense script, and only when the flag is on, the publisher ID is real, and the
 * visitor has accepted advertising. If the script fails or is blocked, ADS_001 is
 * logged and the reserved space stays empty.
 *
 * Page contract (AdSlot.astro, batch 48):
 *   <div data-ad-slot="inarticle|bottom" class="ad-slot"> with a fixed reserved height
 *   and an "Advertisement" label outside the container. Add data-no-ads on <body> to
 *   switch ads off for a page, as legal pages do.
 */
import { FEATURES } from '../../config/features';
import { describeForLog } from '../calc/errors';
import { getConsent, onConsentChange } from './consent';

export const ADSENSE_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
export const MAX_ADS_PER_PAGE = 3;
const SCRIPT_ATTR = 'data-roomtally-ads';
const SLOT_SELECTOR = '[data-ad-slot]';
const FILLED_ATTR = 'data-ad-filled';

export interface AdsOptions {
  enabled: boolean;
  /** Publisher ID such as ca-pub-1234567890123456. */
  client: string | undefined;
  /** Ad unit ID per slot name. */
  slots: Readonly<Record<string, string | undefined>>;
}

const env = (import.meta.env ?? {}) as unknown as Record<string, string | undefined>;
let options: AdsOptions = {
  enabled: FEATURES.ads,
  client: env.PUBLIC_ADSENSE_CLIENT,
  slots: {
    inarticle: env.PUBLIC_ADSENSE_SLOT_INARTICLE,
    bottom: env.PUBLIC_ADSENSE_SLOT_BOTTOM,
  },
};

/** Override the flag, publisher ID or slot IDs. Used by tests. */
export function configureAds(next: Partial<AdsOptions>): void {
  options = { ...options, ...next };
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/** A real publisher ID. The all-zero placeholder from .env.example is not real. */
export function isRealClientId(id: string | undefined): id is string {
  return id !== undefined && /^ca-pub-\d{10,20}$/.test(id) && !/^ca-pub-0+$/.test(id);
}

/** True when ads may load right now. */
export function adsAllowed(doc: Document = document): boolean {
  return (
    options.enabled &&
    isRealClientId(options.client) &&
    getConsent().advertising &&
    !doc.body?.hasAttribute('data-no-ads')
  );
}

function eligibleSlots(doc: Document): HTMLElement[] {
  return Array.from(doc.querySelectorAll<HTMLElement>(SLOT_SELECTOR))
    // Never inside the form or the results (PRD Rule 12).
    .filter((slot) => !slot.closest('form, [data-results]'))
    .slice(0, MAX_ADS_PER_PAGE);
}

function fillSlots(doc: Document, win: Window): void {
  const client = options.client;
  if (!isRealClientId(client)) return;
  for (const container of eligibleSlots(doc)) {
    if (container.hasAttribute(FILLED_ATTR)) continue;
    const slotId = options.slots[container.dataset.adSlot ?? ''];
    if (!slotId || !/^\d{6,20}$/.test(slotId)) continue;
    const ins = doc.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', client);
    ins.setAttribute('data-ad-slot', slotId);
    ins.setAttribute('data-ad-format', 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    container.append(ins);
    container.setAttribute(FILLED_ATTR, '');
    try {
      (win.adsbygoogle ??= []).push({});
    } catch {
      console.warn(describeForLog('ADS_001'));
    }
  }
}

/**
 * Add the AdSense script and fill the ad containers. Returns true when ads were
 * started and false when anything required is missing. Safe to call repeatedly.
 */
export function loadAds(doc: Document = document, win: Window = window): boolean {
  if (!adsAllowed(doc)) return false;
  if (!doc.querySelector(`script[${SCRIPT_ATTR}]`)) {
    const script = doc.createElement('script');
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `${ADSENSE_SRC}?client=${encodeURIComponent(options.client as string)}`;
    script.setAttribute(SCRIPT_ATTR, '');
    script.addEventListener('error', () => {
      console.warn(describeForLog('ADS_001'));
      removeAds(doc);
    });
    doc.head.append(script);
  }
  fillSlots(doc, win);
  return true;
}

/** Take ads out of the page and leave the reserved space empty. */
export function removeAds(doc: Document = document): void {
  doc.querySelector(`script[${SCRIPT_ATTR}]`)?.remove();
  for (const container of doc.querySelectorAll<HTMLElement>(`[${FILLED_ATTR}]`)) {
    container.replaceChildren();
    container.removeAttribute(FILLED_ATTR);
  }
}

/**
 * Start ads: load them when advertising is accepted, remove them when it is withdrawn.
 * A page reload finishes the job for scripts that are already running.
 * Returns a stop function.
 */
export function initAds(doc: Document = document, win: Window = window): () => void {
  const apply = (): void => {
    if (adsAllowed(doc)) loadAds(doc, win);
    else removeAds(doc);
  };
  apply();
  return onConsentChange(apply);
}
