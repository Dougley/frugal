/**
 * Privacy preferences for telemetry and error tracking
 */

import { z } from "zod";

export interface PrivacyPreferences {
  /** Whether to send error reports to Sentry (default: true) */
  errorReporting: boolean;
  /** Whether to enable performance tracing (default: true) */
  performanceTracing: boolean;
  /** Whether to enable session replay (default: false) */
  sessionReplay: boolean;
}

/**
 * Zod schema for validating privacy preferences from localStorage
 */
const privacyPreferencesSchema = z.object({
  errorReporting: z.boolean(),
  performanceTracing: z.boolean(),
  sessionReplay: z.boolean(),
});

const PRIVACY_STORAGE_KEY = "frugal-privacy-preferences";

/**
 * Default privacy preferences - only error reporting enabled
 */
export const DEFAULT_PRIVACY_PREFERENCES: PrivacyPreferences = {
  errorReporting: true,
  performanceTracing: true,
  sessionReplay: false,
};

/**
 * Get current privacy preferences from localStorage
 * Returns defaults if not set or if localStorage is unavailable
 */
export function getPrivacyPreferences(): PrivacyPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PRIVACY_PREFERENCES;
  }

  try {
    const stored = localStorage.getItem(PRIVACY_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_PRIVACY_PREFERENCES;
    }

    const parsed = privacyPreferencesSchema
      .partial()
      .safeParse(JSON.parse(stored));
    if (!parsed.success) {
      // Invalid stored data, return defaults
      console.warn("[Privacy] Invalid stored preferences, using defaults");
      return DEFAULT_PRIVACY_PREFERENCES;
    }

    // Merge with defaults to ensure all keys exist
    return {
      ...DEFAULT_PRIVACY_PREFERENCES,
      ...parsed.data,
    };
  } catch {
    // If localStorage is unavailable or parsing fails, use defaults
    return DEFAULT_PRIVACY_PREFERENCES;
  }
}

/**
 * Update privacy preferences in localStorage
 */
export function setPrivacyPreferences(preferences: PrivacyPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(PRIVACY_STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Silently fail if localStorage is unavailable
    console.warn("Failed to save privacy preferences to localStorage");
  }
}

/**
 * Update a single privacy preference
 */
export function updatePrivacyPreference<K extends keyof PrivacyPreferences>(
  key: K,
  value: PrivacyPreferences[K]
): void {
  const current = getPrivacyPreferences();
  setPrivacyPreferences({
    ...current,
    [key]: value,
  });
}
