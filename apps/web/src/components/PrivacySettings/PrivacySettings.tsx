"use client";

import { Alert, Stack, Switch, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getPrivacyPreferences,
  type PrivacyPreferences,
  setPrivacyPreferences,
} from "~/utils/privacy";

export function PrivacySettings() {
  const { t } = useTranslation();
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
        title: t("privacy.updated.title"),
        message: t("privacy.updated.message"),
        color: "blue",
      });
    };

  return (
    <Stack gap="md">
      <Text size="sm" py="xs">
        {t("privacy.description")}
      </Text>

      <Alert title={t("privacy.note")} color="yellow" variant="outline">
        <Text size="sm">{t("privacy.serverSideNote")}</Text>
      </Alert>

      <Switch
        label={t("privacy.errorReporting.label")}
        description={t("privacy.errorReporting.description")}
        checked={preferences.errorReporting}
        onChange={(event) =>
          handleToggle("errorReporting")(event.currentTarget.checked)
        }
      />

      <Switch
        label={t("privacy.performanceTracing.label")}
        description={t("privacy.performanceTracing.description")}
        checked={preferences.errorReporting && preferences.performanceTracing}
        disabled={!preferences.errorReporting}
        onChange={(event) =>
          handleToggle("performanceTracing")(event.currentTarget.checked)
        }
      />

      <Switch
        label={t("privacy.sessionReplay.label")}
        description={t("privacy.sessionReplay.description")}
        checked={preferences.errorReporting && preferences.sessionReplay}
        disabled={!preferences.errorReporting}
        onChange={(event) =>
          handleToggle("sessionReplay")(event.currentTarget.checked)
        }
      />
    </Stack>
  );
}
