/**
 * Consent manager (PRD Rules 13-14, TDD §D).
 *
 * Adapted from the Google Consent Mode guide in the vanilla-cookieconsent docs:
 * https://cookieconsent.orestbida.com/advanced/google-consent-mode.html
 * Copyright (c) 2020-present Orest Bida. MIT licence.
 *
 * Order matters: Consent Mode defaults are set to "denied" first, before the library
 * loads and before anything else can read them. If the library fails to load, CNS_001
 * is logged and everything non-essential stays off.
 *
 * Other modules learn about consent through getConsent() and onConsentChange(), so
 * ads.ts and analytics.ts depend on this file and not the other way round.
 */
import { describeForLog } from '../calc/errors';

export interface ConsentState {
  analytics: boolean;
  advertising: boolean;
}

/** The small part of the vanilla-cookieconsent API this file uses. */
export interface ConsentLibrary {
  run(config: Record<string, unknown>): Promise<void> | void;
  acceptedCategory(name: string): boolean;
  showPreferences(): void;
}

export type ConsentListener = (state: ConsentState, saved: boolean) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const CAT_NECESSARY = 'necessary';
const CAT_ANALYTICS = 'analytics';
const CAT_ADVERTISEMENT = 'advertisement';

const DENIED_DEFAULTS = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'denied',
} as const;

let state: ConsentState = { analytics: false, advertising: false };
let library: ConsentLibrary | null = null;
const listeners = new Set<ConsentListener>();

/** A copy of the current choices. Both are false until the visitor accepts. */
export function getConsent(): ConsentState {
  return { ...state };
}

/** Call back when choices change. Returns a function that stops the calls. */
export function onConsentChange(listener: ConsentListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function gtag(..._args: unknown[]): void {
  const layer = (window.dataLayer ??= []);
  // gtag.js reads Arguments objects, not arrays.
  // eslint-disable-next-line prefer-rest-params
  layer.push(arguments);
}

/** Consent Mode defaults, all denied. Safe to call more than once. */
export function setConsentDefaults(): void {
  gtag('consent', 'default', { ...DENIED_DEFAULTS });
}

function setState(next: ConsentState, saved: boolean): void {
  state = next;
  gtag('consent', 'update', {
    analytics_storage: next.analytics ? 'granted' : 'denied',
    ad_storage: next.advertising ? 'granted' : 'denied',
    ad_user_data: next.advertising ? 'granted' : 'denied',
    ad_personalization: next.advertising ? 'granted' : 'denied',
  });
  for (const listener of [...listeners]) {
    try {
      listener(getConsent(), saved);
    } catch {
      // One broken listener must not stop the others.
    }
  }
}

function syncFromLibrary(saved: boolean): void {
  if (!library) return;
  setState(
    {
      analytics: library.acceptedCategory(CAT_ANALYTICS),
      advertising: library.acceptedCategory(CAT_ADVERTISEMENT),
    },
    saved,
  );
}

/** Banner text and categories. Static strings only. */
export function buildConsentConfig(onSync: (saved: boolean) => void): Record<string, unknown> {
  return {
    cookie: { name: 'roomtally_consent' },
    guiOptions: {
      consentModal: { layout: 'box', position: 'bottom right', equalWeightButtons: true },
      preferencesModal: { layout: 'box' },
    },
    onFirstConsent: () => onSync(true),
    onConsent: () => onSync(false),
    onChange: () => onSync(true),
    categories: {
      [CAT_NECESSARY]: { enabled: true, readOnly: true },
      [CAT_ANALYTICS]: {},
      [CAT_ADVERTISEMENT]: {
        autoClear: {
          cookies: [{ name: /^__gads/ }, { name: /^__gpi/ }, { name: /^_gcl_/ }],
        },
      },
    },
    language: {
      default: 'en',
      translations: {
        en: {
          consentModal: {
            title: 'Your privacy choices',
            description:
              'Roomtally works without cookies. With your permission we use anonymous analytics to improve the site, and ads to keep it free. Your rooms never leave your browser.',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            showPreferencesBtn: 'Choose',
          },
          preferencesModal: {
            title: 'Privacy choices',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject all',
            savePreferencesBtn: 'Save my choices',
            closeIconLabel: 'Close',
            sections: [
              {
                title: 'Necessary',
                description:
                  'Remembers your choice here. Your rooms are saved in your browser only and are never sent to us.',
                linkedCategory: CAT_NECESSARY,
              },
              {
                title: 'Analytics',
                description:
                  'Anonymous counts of visits and speed, so we can see what to improve. Off unless you accept.',
                linkedCategory: CAT_ANALYTICS,
              },
              {
                title: 'Advertising',
                description:
                  'Lets Google show ads that keep Roomtally free. Off unless you accept. Ads never appear in the form or your results.',
                linkedCategory: CAT_ADVERTISEMENT,
              },
              {
                title: 'More information',
                description:
                  'Read the <a href="/privacy/">privacy notice</a> and the <a href="/cookies/">cookie notice</a>. You can change your choices at any time from the footer.',
              },
            ],
          },
        },
      },
    },
  };
}

async function defaultLoader(): Promise<ConsentLibrary> {
  await import('vanilla-cookieconsent/dist/cookieconsent.css');
  const mod = await import('vanilla-cookieconsent');
  return mod as unknown as ConsentLibrary;
}

export interface InitConsentOptions {
  /** Replace the library loader. Used by tests. */
  loadLibrary?: () => Promise<ConsentLibrary>;
}

/**
 * Deny everything, then load the banner. Resolves true when the banner is running and
 * false when the library could not be loaded (CNS_001, silent to the visitor).
 */
export async function initConsent(initOptions: InitConsentOptions = {}): Promise<boolean> {
  setConsentDefaults();
  try {
    library = await (initOptions.loadLibrary ?? defaultLoader)();
    await library.run(buildConsentConfig(syncFromLibrary));
    return true;
  } catch {
    library = null;
    console.warn(describeForLog('CNS_001'));
    return false;
  }
}

/** Open the preference centre, for the footer button. Does nothing if the library is not running. */
export function openPreferences(): void {
  try {
    library?.showPreferences();
  } catch {
    console.warn(describeForLog('CNS_001'));
  }
}

/** Forget everything. Used by tests. */
export function resetConsentForTests(): void {
  state = { analytics: false, advertising: false };
  library = null;
  listeners.clear();
}
