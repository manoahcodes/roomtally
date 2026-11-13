/**
 * Event tracking (PRD §7). track() does nothing unless the analytics flag and the
 * visitor's analytics consent are both on (NV2). Events carry only the properties
 * listed in PRD §7, with plain values, so a room name or a measurement can never
 * be sent (NV1).
 *
 * Events are delivered to a sink. Cloudflare Web Analytics has no custom events and
 * the site has no backend, so by default an event is only announced on `window` as a
 * `roomtally:track` CustomEvent. A sink can be registered with setTrackSink().
 */
import { FEATURES } from '../../config/features';
import { getConsent, onConsentChange } from './consent';

export const EVENT_PROPS = {
  first_room_entered: ['region', 'unit_system'],
  shopping_list_viewed: ['materials', 'room_count'],
  room_added: ['room_count'],
  list_printed: ['room_count'],
  affiliate_click: ['partner_id', 'category'],
  unit_changed: ['from', 'to'],
  consent_updated: ['analytics', 'advertising'],
  data_cleared: [],
} as const satisfies Record<string, readonly string[]>;

export type EventName = keyof typeof EVENT_PROPS;
export type EventValue = string | number | boolean;
export type EventProps = Readonly<Record<string, EventValue | null | undefined>>;
export type TrackSink = (name: EventName, props: Record<string, EventValue>) => void;

const MAX_STRING = 100;
const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';
const BEACON_ATTR = 'data-roomtally-beacon';

interface AnalyticsOptions {
  enabled: boolean;
  /** Cloudflare Web Analytics token. */
  beaconToken: string | undefined;
}

const env = (import.meta.env ?? {}) as unknown as Record<string, string | undefined>;
let options: AnalyticsOptions = {
  enabled: FEATURES.analytics,
  beaconToken: env.PUBLIC_CF_BEACON_TOKEN,
};
let sink: TrackSink | null = null;

/** Override the flag or token. Used by tests. */
export function configureAnalytics(next: Partial<AnalyticsOptions>): void {
  options = { ...options, ...next };
}

export function setTrackSink(next: TrackSink | null): void {
  sink = next;
}

export function isAnalyticsAllowed(): boolean {
  return options.enabled && getConsent().analytics;
}

/** Keep only the properties listed for the event, and only plain short values. */
function cleanProps(name: EventName, props: EventProps): Record<string, EventValue> {
  const allowed: readonly string[] = EVENT_PROPS[name];
  const out: Record<string, EventValue> = {};
  for (const key of allowed) {
    const value = props[key];
    if (typeof value === 'string') out[key] = value.slice(0, MAX_STRING);
    else if (typeof value === 'boolean') out[key] = value;
    else if (typeof value === 'number' && Number.isFinite(value)) out[key] = value;
  }
  return out;
}

/** Record an event. A no-op unless the flag and analytics consent are on. */
export function track(name: EventName, props: EventProps = {}): void {
  if (!isAnalyticsAllowed()) return;
  if (!Object.prototype.hasOwnProperty.call(EVENT_PROPS, name)) return;
  const clean = cleanProps(name, props);
  try {
    sink?.(name, clean);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('roomtally:track', { detail: { name, props: clean } }));
    }
  } catch {
    // Analytics must never break the calculator (TDD §G.47).
  }
}

/** Add the Cloudflare Web Analytics beacon, only when allowed and configured. */
export function loadBeacon(doc: Document = document): boolean {
  if (!isAnalyticsAllowed()) return false;
  const token = options.beaconToken;
  if (!token || !/^[A-Za-z0-9]{16,64}$/.test(token)) return false;
  if (doc.querySelector(`script[${BEACON_ATTR}]`)) return true;
  const script = doc.createElement('script');
  script.defer = true;
  script.src = BEACON_SRC;
  script.setAttribute('data-cf-beacon', JSON.stringify({ token }));
  script.setAttribute(BEACON_ATTR, '');
  // A blocked or failed beacon is silent (TDD §G.47): remove it and carry on.
  script.addEventListener('error', () => script.remove());
  doc.head.append(script);
  return true;
}

export function removeBeacon(doc: Document = document): void {
  doc.querySelector(`script[${BEACON_ATTR}]`)?.remove();
}

/**
 * Start analytics: add the beacon when consent is given and remove it when consent is
 * withdrawn, and report consent changes as `consent_updated`. Returns a stop function.
 */
export function initAnalytics(doc: Document = document): () => void {
  const apply = (): void => {
    if (isAnalyticsAllowed()) loadBeacon(doc);
    else removeBeacon(doc);
  };
  apply();
  return onConsentChange((state, saved) => {
    apply();
    // Only a choice the visitor just saved counts, not consent restored on page load.
    if (saved) track('consent_updated', { analytics: state.analytics, advertising: state.advertising });
  });
}
