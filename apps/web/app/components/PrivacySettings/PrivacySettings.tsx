"use client";

import { Alert, Stack, Switch, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import {
  getPrivacyPreferences,
  type PrivacyPreferences,
  setPrivacyPreferences,
} from "~/utils/privacy";

export function PrivacySettings() {
  const [mounted, setMounted] = useState(false);
  const [preferences, setPreferencesState] = useState<PrivacyPreferences>(() =>
    getPrivacyPreferences()
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null on first render to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  const handleToggle =
    (key: keyof PrivacyPreferences) => (checked: boolean) => {
      const newPreferences = {
        ...preferences,
        [key]: checked,
      };
      setPreferencesState(newPreferences);
      setPrivacyPreferences(newPreferences);

      notifications.show({
        title: "Privacy settings updated",
        message:
          "Your preferences have been saved. Refresh the page for changes to take effect.",
        color: "blue",
      });
    };

  return (
    <Stack gap="md">
      <Text size="sm" py="xs">
        We use Sentry as our telemetry service to collect error reports and
        performance data. You can customize your preferences below.
      </Text>

      <Alert title="Note" color="yellow" variant="outline">
        <Text size="sm">
          Server-side errors (e.g., API errors) are always reported to Sentry.
          The settings below only affect client-side telemetry.
        </Text>
      </Alert>

      <Switch
        label="Error Reporting"
        description="Send error reports to help us fix bugs. No personal data is collected."
        checked={preferences.errorReporting}
        onChange={(event) =>
          handleToggle("errorReporting")(event.currentTarget.checked)
        }
      />

      <Switch
        label="Performance Tracing"
        description="Track page loads and navigation to help us improve performance. This may include some anonymized user interaction data."
        checked={preferences.errorReporting && preferences.performanceTracing}
        disabled={!preferences.errorReporting}
        onChange={(event) =>
          handleToggle("performanceTracing")(event.currentTarget.checked)
        }
      />

      <Switch
        label="Session Replay"
        description="Record anonymized session replays to help diagnose issues. Replays will never reveal exact user data, but may include masked inputs."
        checked={preferences.errorReporting && preferences.sessionReplay}
        disabled={!preferences.errorReporting}
        onChange={(event) =>
          handleToggle("sessionReplay")(event.currentTarget.checked)
        }
      />
    </Stack>
  );
}
