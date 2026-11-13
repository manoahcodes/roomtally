export interface Features {
  ads: boolean;
  affiliates: boolean;
  analytics: boolean;
}

/** Only the exact text "true" turns a flag on. Everything else is off. */
export function parseFlag(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

export function readFeatures(env: Record<string, string | undefined>): Features {
  return {
    ads: parseFlag(env.PUBLIC_ADS_ENABLED),
    affiliates: parseFlag(env.PUBLIC_AFFILIATES_ENABLED),
    analytics: parseFlag(env.PUBLIC_ANALYTICS_ENABLED),
  };
}

export const FEATURES: Features = readFeatures(
  (import.meta.env ?? {}) as unknown as Record<string, string | undefined>,
);
