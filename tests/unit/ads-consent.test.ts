// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ADSENSE_SRC,
  MAX_ADS_PER_PAGE,
  adsAllowed,
  configureAds,
  initAds,
  isRealClientId,
  loadAds,
} from '../../src/lib/ui/ads';
import {
  EVENT_PROPS,
  configureAnalytics,
  initAnalytics,
  isAnalyticsAllowed,
  loadBeacon,
  setTrackSink,
  track,
} from '../../src/lib/ui/analytics';
import {
  getConsent,
  initConsent,
  onConsentChange,
  openPreferences,
  resetConsentForTests,
} from '../../src/lib/ui/consent';
import type { ConsentLibrary } from '../../src/lib/ui/consent';

const CLIENT = 'ca-pub-1234567890123456';
const SLOTS = { inarticle: '1234567890', bottom: '0987654321' };
const BEACON_TOKEN = 'abcdef0123456789abcdef0123456789';

/** A stand-in for vanilla-cookieconsent that the test controls. */
function fakeLibrary() {
  const accepted = { analytics: false, advertisement: false };
  let config: Record<string, (() => void) | unknown> = {};
  const lib: ConsentLibrary = {
    run: (c) => {
      config = c;
    },
    acceptedCategory: (name) => accepted[name as 'analytics' | 'advertisement'] ?? false,
    showPreferences: vi.fn(),
  };
  return {
    lib,
    accepted,
    /** The visitor saves a choice for the first time. */
    firstConsent: () => (config.onFirstConsent as () => void)(),
    /** The visitor changes a saved choice. */
    change: () => (config.onChange as () => void)(),
    /** Saved consent is restored on a later page load. */
    restore: () => (config.onConsent as () => void)(),
  };
}

async function startConsent() {
  const fake = fakeLibrary();
  await initConsent({ loadLibrary: async () => fake.lib });
  return fake;
}

function adScripts(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll<HTMLScriptElement>('script[data-roomtally-ads]'));
}
function beaconScripts(): HTMLScriptElement[] {
  return Array.from(document.querySelectorAll<HTMLScriptElement>('script[data-roomtally-beacon]'));
}
function addSlot(name: string, parent: Element = document.body): HTMLElement {
  const div = document.createElement('div');
  div.setAttribute('data-ad-slot', name);
  parent.append(div);
  return div;
}
function dataLayerEntries(): unknown[][] {
  return (window.dataLayer ?? []).map((entry) => Array.from(entry as ArrayLike<unknown>));
}

beforeEach(() => {
  resetConsentForTests();
  document.head.replaceChildren();
  document.body.replaceChildren();
  document.body.removeAttribute('data-no-ads');
  window.dataLayer = [];
  window.adsbygoogle = [];
  configureAds({ enabled: true, client: CLIENT, slots: SLOTS });
  configureAnalytics({ enabled: true, beaconToken: BEACON_TOKEN });
  setTrackSink(null);
});
afterEach(() => {
  vi.restoreAllMocks();
});

describe('consent defaults', () => {
  it('denies every signal before the library has loaded', async () => {
    let release: (lib: ConsentLibrary) => void = () => undefined;
    const pending = new Promise<ConsentLibrary>((resolve) => (release = resolve));
    const started = initConsent({ loadLibrary: () => pending });
    const first = dataLayerEntries()[0]!;
    expect(first[0]).toBe('consent');
    expect(first[1]).toBe('default');
    const signals = first[2] as Record<string, string>;
    expect(Object.keys(signals).sort()).toEqual([
      'ad_personalization',
      'ad_storage',
      'ad_user_data',
      'analytics_storage',
      'functionality_storage',
      'personalization_storage',
      'security_storage',
    ]);
    expect(Object.values(signals).every((v) => v === 'denied')).toBe(true);
    release(fakeLibrary().lib);
    await started;
  });

  it('starts with advertising and analytics both off', async () => {
    await startConsent();
    expect(getConsent()).toEqual({ analytics: false, advertising: false });
  });

  it('configures three categories: necessary, analytics and advertising', async () => {
    let config: Record<string, unknown> = {};
    await initConsent({
      loadLibrary: async () => ({
        run: (c) => void (config = c),
        acceptedCategory: () => false,
        showPreferences: () => undefined,
      }),
    });
    expect(Object.keys(config.categories as object)).toEqual(['necessary', 'analytics', 'advertisement']);
  });

  it('logs CNS_001 and keeps everything off when the library fails to load', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const ok = await initConsent({
      loadLibrary: async () => {
        throw new Error('network');
      },
    });
    expect(ok).toBe(false);
    expect(warn).toHaveBeenCalledWith('CNS_001: consent library failed');
    expect(getConsent()).toEqual({ analytics: false, advertising: false });
    expect(loadAds()).toBe(false);
    expect(adScripts()).toHaveLength(0);
  });

  it('opens the preference centre, and ignores the call when the library is missing', async () => {
    const fake = await startConsent();
    openPreferences();
    expect(fake.lib.showPreferences).toHaveBeenCalledTimes(1);
    resetConsentForTests();
    expect(() => openPreferences()).not.toThrow();
  });
});

describe('consent changes', () => {
  it('reads the accepted categories and updates the Consent Mode signals', async () => {
    const fake = await startConsent();
    fake.accepted.advertisement = true;
    fake.firstConsent();
    expect(getConsent()).toEqual({ analytics: false, advertising: true });
    const update = dataLayerEntries().filter((e) => e[1] === 'update').at(-1)!;
    expect(update[2]).toEqual({
      analytics_storage: 'denied',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
    });
  });

  it('accepting advertising does not turn on analytics, and the reverse', async () => {
    const fake = await startConsent();
    fake.accepted.analytics = true;
    fake.firstConsent();
    expect(getConsent()).toEqual({ analytics: true, advertising: false });
  });

  it('tells listeners whether the choice was just saved or restored', async () => {
    const fake = await startConsent();
    const seen: boolean[] = [];
    onConsentChange((_state, saved) => seen.push(saved));
    fake.restore();
    fake.accepted.analytics = true;
    fake.change();
    expect(seen).toEqual([false, true]);
  });

  it('getConsent returns a copy that cannot change the real state', async () => {
    await startConsent();
    const copy = getConsent();
    copy.advertising = true;
    expect(getConsent().advertising).toBe(false);
  });

  it('keeps going when one listener throws', async () => {
    const fake = await startConsent();
    const good = vi.fn();
    onConsentChange(() => {
      throw new Error('bad listener');
    });
    onConsentChange(good);
    fake.firstConsent();
    expect(good).toHaveBeenCalledTimes(1);
  });
});

describe('ads: nothing is injected before consent', () => {
  it('adds no script and no ad unit on load, even with the flag on and slots present', async () => {
    addSlot('inarticle');
    await startConsent();
    initAds();
    expect(adScripts()).toHaveLength(0);
    expect(document.querySelectorAll('ins.adsbygoogle')).toHaveLength(0);
    expect(document.querySelectorAll('script[src*="googlesyndication"]')).toHaveLength(0);
  });

  it('loadAds refuses without consent', () => {
    expect(adsAllowed()).toBe(false);
    expect(loadAds()).toBe(false);
    expect(adScripts()).toHaveLength(0);
  });

  it('does nothing when the visitor accepted analytics only', async () => {
    const fake = await startConsent();
    initAds();
    fake.accepted.analytics = true;
    fake.firstConsent();
    expect(adScripts()).toHaveLength(0);
  });

  it('has no ad script in the page markup', () => {
    expect(document.querySelectorAll('script').length).toBe(0);
  });
});

describe('ads: after consent', () => {
  it('injects the AdSense script once and fills the slots', async () => {
    const a = addSlot('inarticle');
    const b = addSlot('bottom');
    const fake = await startConsent();
    initAds();
    fake.accepted.advertisement = true;
    fake.firstConsent();
    const scripts = adScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0]!.src.startsWith(ADSENSE_SRC)).toBe(true);
    expect(scripts[0]!.src).toContain(`client=${CLIENT}`);
    expect(scripts[0]!.async).toBe(true);
    expect(a.querySelectorAll('ins.adsbygoogle')).toHaveLength(1);
    expect(b.querySelector('ins')!.getAttribute('data-ad-slot')).toBe(SLOTS.bottom);
    fake.change();
    expect(adScripts()).toHaveLength(1);
    expect(document.querySelectorAll('ins.adsbygoogle')).toHaveLength(2);
  });

  it('does nothing when the flag is off', async () => {
    configureAds({ enabled: false });
    addSlot('inarticle');
    const fake = await startConsent();
    initAds();
    fake.accepted.advertisement = true;
    fake.firstConsent();
    expect(adScripts()).toHaveLength(0);
  });

  it('does nothing for the placeholder or a malformed publisher ID', async () => {
    const fake = await startConsent();
    fake.accepted.advertisement = true;
    fake.firstConsent();
    for (const client of ['ca-pub-0000000000000000', 'ca-pub-12', 'pub-1234567890', undefined]) {
      configureAds({ client });
      expect(loadAds()).toBe(false);
    }
    expect(adScripts()).toHaveLength(0);
    expect(isRealClientId(CLIENT)).toBe(true);
  });

  it('does nothing on a page marked data-no-ads, such as a legal page', async () => {
    document.body.setAttribute('data-no-ads', '');
    addSlot('inarticle');
    const fake = await startConsent();
    fake.accepted.advertisement = true;
    fake.firstConsent();
    expect(loadAds()).toBe(false);
    expect(adScripts()).toHaveLength(0);
  });

  it(`fills at most ${MAX_ADS_PER_PAGE} slots`, async () => {
    for (let i = 0; i < 5; i += 1) addSlot('inarticle');
    const fake = await startConsent();
    fake.accepted.advertisement = true;
    fake.firstConsent();
    initAds();
    expect(document.querySelectorAll('ins.adsbygoogle')).toHaveLength(MAX_ADS_PER_PAGE);
  });

  it('never fills a slot inside the form or the results', async () => {
    const form = document.createElement('form');
    const results = document.createElement('div');
    results.setAttribute('data-results', '');
    document.body.append(form, results);
    addSlot('inarticle', form);
    addSlot('inarticle', results);
    const ok = addSlot('bottom');
    const fake = await startConsent();
    fake.accepted.advertisement = true;
    fake.firstConsent();
    initAds();
    expect(document.querySelectorAll('ins.adsbygoogle')).toHaveLength(1);
    expect(ok.querySelectorAll('ins')).toHaveLength(1);
  });

  it('skips a slot with no valid ad unit ID', async () => {
    configureAds({ slots: { inarticle: 'not-a-number' } });
    const slot = addSlot('inarticle');
    const fake = await startConsent();
    fake.accepted.advertisement = true;
    fake.firstConsent();
    initAds();
    expect(slot.children).toHaveLength(0);
  });

  it('starts ads on a later page load when advertising was already accepted', async () => {
    addSlot('inarticle');
    const fake = await startConsent();
    fake.accepted.advertisement = true;
    fake.restore();
    initAds();
    expect(adScripts()).toHaveLength(1);
  });
});

describe('ads: nothing after revoke', () => {
  it('removes the script and empties the slots, leaving the reserved space', async () => {
    const slot = addSlot('inarticle');
    const fake = await startConsent();
    initAds();
    fake.accepted.advertisement = true;
    fake.firstConsent();
    expect(adScripts()).toHaveLength(1);
    fake.accepted.advertisement = false;
    fake.change();
    expect(adScripts()).toHaveLength(0);
    expect(slot.children).toHaveLength(0);
    expect(document.body.contains(slot)).toBe(true);
    expect(slot.hasAttribute('data-ad-filled')).toBe(false);
  });

  it('refuses to load again after revoke', async () => {
    addSlot('inarticle');
    const fake = await startConsent();
    initAds();
    fake.accepted.advertisement = true;
    fake.firstConsent();
    fake.accepted.advertisement = false;
    fake.change();
    expect(loadAds()).toBe(false);
    expect(adScripts()).toHaveLength(0);
  });

  it('stops reacting once the stop function is called', async () => {
    const fake = await startConsent();
    const stop = initAds();
    stop();
    fake.accepted.advertisement = true;
    fake.firstConsent();
    expect(adScripts()).toHaveLength(0);
  });
});

describe('ads: failure is silent', () => {
  it('logs ADS_001, removes the script and keeps the space empty when the script fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const slot = addSlot('inarticle');
    const fake = await startConsent();
    initAds();
    fake.accepted.advertisement = true;
    fake.firstConsent();
    adScripts()[0]!.dispatchEvent(new Event('error'));
    expect(warn).toHaveBeenCalledWith('ADS_001: ad script failed or blocked');
    expect(adScripts()).toHaveLength(0);
    expect(slot.children).toHaveLength(0);
  });
});

describe('analytics: silent without consent', () => {
  it('track does nothing before consent', async () => {
    const sink = vi.fn();
    const heard = vi.fn();
    setTrackSink(sink);
    window.addEventListener('roomtally:track', heard);
    await startConsent();
    track('room_added', { room_count: 2 });
    expect(isAnalyticsAllowed()).toBe(false);
    expect(sink).not.toHaveBeenCalled();
    expect(heard).not.toHaveBeenCalled();
    window.removeEventListener('roomtally:track', heard);
  });

  it('track does nothing when only advertising was accepted', async () => {
    const sink = vi.fn();
    setTrackSink(sink);
    const fake = await startConsent();
    fake.accepted.advertisement = true;
    fake.firstConsent();
    track('room_added', { room_count: 2 });
    expect(sink).not.toHaveBeenCalled();
  });

  it('track does nothing when the flag is off, even with consent', async () => {
    configureAnalytics({ enabled: false });
    const sink = vi.fn();
    setTrackSink(sink);
    const fake = await startConsent();
    fake.accepted.analytics = true;
    fake.firstConsent();
    track('room_added', { room_count: 2 });
    expect(sink).not.toHaveBeenCalled();
  });

  it('track does nothing after consent is withdrawn', async () => {
    const sink = vi.fn();
    setTrackSink(sink);
    const fake = await startConsent();
    fake.accepted.analytics = true;
    fake.firstConsent();
    track('room_added', { room_count: 2 });
    fake.accepted.analytics = false;
    fake.change();
    track('room_added', { room_count: 3 });
    expect(sink).toHaveBeenCalledTimes(1);
  });

  it('adds no analytics script before consent', async () => {
    await startConsent();
    initAnalytics();
    expect(loadBeacon()).toBe(false);
    expect(beaconScripts()).toHaveLength(0);
    expect(document.querySelectorAll('script[src*="cloudflareinsights"]')).toHaveLength(0);
  });
});

describe('analytics: after consent', () => {
  async function allowed() {
    const fake = await startConsent();
    fake.accepted.analytics = true;
    fake.firstConsent();
    return fake;
  }

  it('sends the event with only the properties PRD §7 lists', async () => {
    const sink = vi.fn();
    setTrackSink(sink);
    await allowed();
    track('first_room_entered', {
      region: 'UK',
      unit_system: 'metric',
      room_name: 'Kitchen',
      lengthM: 4,
    });
    expect(sink).toHaveBeenCalledWith('first_room_entered', { region: 'UK', unit_system: 'metric' });
  });

  it('announces the event on window', async () => {
    const heard = vi.fn();
    window.addEventListener('roomtally:track', heard);
    await allowed();
    track('data_cleared');
    expect(heard).toHaveBeenCalledTimes(1);
    expect((heard.mock.calls[0]![0] as CustomEvent).detail).toEqual({ name: 'data_cleared', props: {} });
    window.removeEventListener('roomtally:track', heard);
  });

  it('drops values that are not plain strings, numbers or booleans', async () => {
    const sink = vi.fn();
    setTrackSink(sink);
    await allowed();
    track('affiliate_click', {
      partner_id: { toString: () => 'x' } as unknown as string,
      category: 'paint',
    });
    track('room_added', { room_count: Number.NaN });
    expect(sink).toHaveBeenNthCalledWith(1, 'affiliate_click', { category: 'paint' });
    expect(sink).toHaveBeenNthCalledWith(2, 'room_added', {});
  });

  it('shortens long strings and ignores unknown event names', async () => {
    const sink = vi.fn();
    setTrackSink(sink);
    await allowed();
    track('unit_changed', { from: 'x'.repeat(500), to: 'UK/metric' });
    track('signup' as 'room_added');
    expect(sink).toHaveBeenCalledTimes(1);
    expect((sink.mock.calls[0]![1] as Record<string, string>).from).toHaveLength(100);
  });

  it('has exactly the events in PRD §7 and no signup or upgrade events', () => {
    expect(Object.keys(EVENT_PROPS).sort()).toEqual([
      'affiliate_click',
      'consent_updated',
      'data_cleared',
      'first_room_entered',
      'list_printed',
      'room_added',
      'shopping_list_viewed',
      'unit_changed',
    ]);
  });

  it('survives a sink that throws', async () => {
    setTrackSink(() => {
      throw new Error('sink broke');
    });
    await allowed();
    expect(() => track('data_cleared')).not.toThrow();
  });

  it('adds the beacon after analytics consent and removes it on revoke', async () => {
    const fake = await startConsent();
    initAnalytics();
    expect(beaconScripts()).toHaveLength(0);
    fake.accepted.analytics = true;
    fake.firstConsent();
    const scripts = beaconScripts();
    expect(scripts).toHaveLength(1);
    expect(scripts[0]!.src).toBe('https://static.cloudflareinsights.com/beacon.min.js');
    expect(JSON.parse(scripts[0]!.getAttribute('data-cf-beacon')!)).toEqual({ token: BEACON_TOKEN });
    fake.accepted.analytics = false;
    fake.change();
    expect(beaconScripts()).toHaveLength(0);
  });

  it('adds no beacon without a valid token', async () => {
    configureAnalytics({ beaconToken: undefined });
    const fake = await startConsent();
    initAnalytics();
    fake.accepted.analytics = true;
    fake.firstConsent();
    expect(beaconScripts()).toHaveLength(0);
    configureAnalytics({ beaconToken: '"><script>' });
    expect(loadBeacon()).toBe(false);
  });

  it('reports consent_updated for a saved choice but not for restored consent', async () => {
    const sink = vi.fn();
    setTrackSink(sink);
    const fake = await startConsent();
    initAnalytics();
    fake.accepted.analytics = true;
    fake.restore();
    expect(sink).not.toHaveBeenCalled();
    fake.accepted.advertisement = true;
    fake.change();
    expect(sink).toHaveBeenCalledWith('consent_updated', { analytics: true, advertising: true });
  });
});
